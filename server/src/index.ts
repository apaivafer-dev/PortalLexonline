import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { onRequest } from 'firebase-functions/v2/https';
import { defineJsonSecret } from 'firebase-functions/params';
import { initializeDatabase } from './database/db';
import authRoutes from './routes/auth';
import leadsRoutes from './routes/leads';
import pipelinesRoutes from './routes/pipelines';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import calculatorRoutes from './routes/calculator';
import crmRoutes from './routes/crm';
import bannersRoutes from './routes/banners';
import cardsRoutes from './routes/cards';
import publishRoutes from './routes/publish';
import seoRoutes from './routes/seoView';
import { errorHandler, requestLogger, notFound } from './middleware/errorHandler';
import { seedAdminUser } from './database/seed';

// Define the secret that holds our config
const configSecret = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT');

const app = express();

// --- Security & Middleware ---
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP to allow frontend to fetch our API
    crossOriginResourcePolicy: false, // Allow loading external assets
    crossOriginOpenerPolicy: false // Prevent breaking external integrations
}));
app.use(cookieParser());

// --- Secret Injection Context ---
// We use a dedicated middleware to ensure secrets are in process.env before anything else.
// In local dev, configSecret.value() throws because Firebase Functions don't run locally.
// In that case, we fall back to environment variables from .env file.
app.use((req, res, next) => {
    try {
        const config = configSecret.value() as any;
        if (config?.lexonline) {
            process.env.DATABASE_URL = config.lexonline.db_url;
            process.env.JWT_SECRET = config.lexonline.jwt_secret;
            process.env.RESEND_API_KEY = config.lexonline.resend_api_key;
            process.env.FRONTEND_URL = config.lexonline.frontend_url;
        }
    } catch (_) {
        // Local dev: secrets not available from Firebase Functions — using .env values
    }
    next();
});

// CORS origin check
app.use(cors({
    origin: (origin, callback) => {
        const allowed = process.env.FRONTEND_URL || '*';

        // Browsers send Origin header. If it matches ours (ignoring slash/case), allow it.
        if (!origin || origin.replace(/\/$/, '') === allowed.replace(/\/$/, '')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Request from ${origin} rejected. Allowed: ${allowed}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200 // Legacy browser support
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// --- Lazy Init for Serverless Environments ---
let isDbInitialized = false;
app.use(async (req, res, next) => {
    if (!isDbInitialized) {
        try {
            await initializeDatabase();
            await seedAdminUser();
            isDbInitialized = true;
        } catch (error) {
            console.error('❌ Falha ao inicializar o banco de dados:', error);
        }
    }
    next();
});

// --- Routes ---
app.use('/c', seoRoutes); // SSR SEO route
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/pipelines', pipelinesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/publish', publishRoutes);

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'LexOnline API is running',
        timestamp: new Date().toISOString(),
        frontend: process.env.FRONTEND_URL || 'unknown'
    });
});

// --- Error Handling ---
app.use(notFound);
app.use(errorHandler);

// --- Start Server (Local Only) ---
if (require.main === module) {
    const PORT = process.env.EXPRESS_PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 LexOnline API rodando locamente em: http://localhost:${PORT}`);
    });
}

// --- Firebase Cloud Functions Export ---
export const api = onRequest({
    region: 'us-central1',
    secrets: [configSecret],
    cors: false // Let our Express "cors" middleware do the work
}, app);

