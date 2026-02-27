import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db';
import { generateToken } from '../utils/jwt';
import { User } from '../types';
import { sendConfirmationEmail, sendPasswordResetEmail, sendWelcomeInviteEmail } from '../utils/email';
import crypto from 'crypto';

export async function login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
        return;
    }

    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE email = ?', email.toLowerCase().trim());

        if (!user) {
            res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            return;
        }

        if (user.subscription_status === 'Disabled') {
            res.status(403).json({ success: false, error: 'Conta desativada. Entre em contato com o suporte.' });
            return;
        }

        if (!user.email_confirmed) {
            res.status(403).json({ success: false, error: 'Por favor, confirme seu email antes de fazer login.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, error: 'Credenciais inválidas' });
            return;
        }

        const token = generateToken({
            userId: user.id,
            companyId: user.company_id,
            email: user.email,
            isAdmin: Boolean(user.is_admin),
            role: (user.role as 'Owner' | 'User') || 'User',
        });

        const isProduction = process.env.NODE_ENV === 'production' || !req.hostname.includes('localhost');

        res.cookie('lexonline_session', token, {
            httpOnly: true,
            secure: true, // Mandatory for SameSite: None
            sameSite: 'none', // Required for cross-domain cookies
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        const { password_hash: _, ...userPublic } = user;

        res.json({
            success: true,
            data: {
                user: { ...userPublic, is_admin: Boolean(user.is_admin) },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    const { name, email, password, phone, firmName } = req.body;

    if (!name || !email || !password) {
        res.status(400).json({ success: false, error: 'Nome, email e senha são obrigatórios' });
        return;
    }

    const emailLower = email.toLowerCase().trim();
    if (emailLower.endsWith('@gmail.com')) {
        const username = emailLower.split('@')[0];
        if (username.includes('+') || username.includes('.')) {
            res.status(400).json({
                success: false,
                error: 'Aliases de Gmail (com "+" ou ".") não são permitidos para novos cadastros.'
            });
            return;
        }
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
        res.status(400).json({
            success: false,
            error: 'Senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula e uma minúscula'
        });
        return;
    }

    try {
        const db = await getDatabase();

        const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase().trim());
        if (existing) {
            res.status(409).json({ success: false, error: 'Este email já está cadastrado' });
            return;
        }

        // OWASP: Do not log email/PII in production
        if (process.env.NODE_ENV !== 'production') console.log(`[AUTH] Registering user`);
        const passwordHash = await bcrypt.hash(password, 12); // OWASP: BCrypt factor 12
        const userId = uuidv4();
        const companyId = uuidv4();
        const now = new Date().toISOString();
        const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Generate slug from email prefix
        const emailPrefix = email.toLowerCase().trim().split('@')[0].replace(/[^a-z0-9._-]/g, '');
        let slug = emailPrefix;
        const slugExists = await db.get('SELECT id FROM users WHERE slug = ?', slug);
        if (slugExists) slug = `${emailPrefix}-${Date.now().toString(36)}`;

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

        await db.run(
            `INSERT INTO users (id, name, email, password_hash, company_id, phone, firm_name, role, slug, plan, subscription_status, is_admin, 
        leads_count, banners_count, cards_count, trial_ends_at, courtesy_start_date, email_confirmed, confirmation_token, token_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'User', ?, 'Trial', 'Active', 0, 0, 0, 0, ?, ?, false, ?, ?, ?, ?)`,
            [userId, name.trim(), emailLower, passwordHash, companyId, phone || null, firmName || null, slug, trialEndsAt, now, confirmationToken, tokenExpires, now, now]
        );

        // Send confirmation email
        await sendConfirmationEmail(emailLower, name, confirmationToken);

        console.log(`[AUTH] Creating company profile...`);
        // Create default company profile
        await db.run(
            `INSERT INTO company_profiles (id, user_id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
            [companyId, userId, firmName || name, email.toLowerCase().trim(), now, now]
        );

        // Create default pipelines
        const calcPipelineId = uuidv4();
        const commPipelineId = uuidv4();

        await db.run(
            `INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, 1, 0, ?, ?)`,
            [calcPipelineId, userId, companyId, 'Calculadora Rescisão', now, now]
        );
        await db.run(
            `INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 1, 1, 1, ?, ?)`,
            [commPipelineId, userId, companyId, 'Comercial', now, now]
        );

        const calcStages = [
            { id: uuidv4(), name: 'Novo', order: 0, type: 'active', color: 'blue' },
            { id: uuidv4(), name: 'Contatado', order: 1, type: 'active', color: 'orange' },
            { id: uuidv4(), name: 'Convertido', order: 2, type: 'won', color: 'green' },
            { id: uuidv4(), name: 'Perdido', order: 3, type: 'lost', color: 'slate' },
        ];

        const commStages = [
            { id: uuidv4(), name: 'Prospecção', order: 0, type: 'active', color: 'indigo' },
            { id: uuidv4(), name: 'Qualificação', order: 1, type: 'active', color: 'violet' },
            { id: uuidv4(), name: 'Proposta', order: 2, type: 'active', color: 'amber' },
            { id: uuidv4(), name: 'Negociação', order: 3, type: 'active', color: 'orange' },
            { id: uuidv4(), name: 'Fechado Ganho', order: 4, type: 'won', color: 'emerald' },
            { id: uuidv4(), name: 'Perdido', order: 5, type: 'lost', color: 'slate' },
        ];

        for (const stage of calcStages) {
            await db.run(
                `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)`,
                [stage.id, calcPipelineId, stage.name, stage.order, stage.type, stage.color]
            );
        }
        for (const stage of commStages) {
            await db.run(
                `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)`,
                [stage.id, commPipelineId, stage.name, stage.order, stage.type, stage.color]
            );
        }

        // Since email is not confirmed, we don't set cookie yet. 
        // Or we could let them in limited mode. User said "não permitir que ele faça operações até ele confirmar o email".
        // Blocking login is the simplest way.

        res.status(201).json({
            success: true,
            data: { message: 'Conta criada com sucesso! Verifique seu email para confirmar o cadastro.' },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar conta' });
    }
}

export async function getMe(req: Request & { user?: any }, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', req.user?.userId);

        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        const { password_hash: _, confirmation_token: __, reset_token: ___, ...userPublic } = user;
        res.json({ success: true, data: { ...userPublic, is_admin: Boolean(user.is_admin) } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar usuário' });
    }
}

export async function confirmEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
        res.status(400).json({ success: false, error: 'Token de confirmação é obrigatório' });
        return;
    }

    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE confirmation_token = ?', token);

        if (!user) {
            res.status(400).json({ success: false, error: 'Link de confirmação inválido' });
            return;
        }

        const now = new Date();
        const expires = new Date(user.token_expires_at || '');

        if (now > expires) {
            res.status(400).json({ success: false, error: 'Link de confirmação expirado. Por favor, solicite um novo.' });
            return;
        }

        await db.run(
            'UPDATE users SET email_confirmed = true, confirmation_token = NULL, token_expires_at = NULL, updated_at = ? WHERE id = ?',
            [now.toISOString(), user.id]
        );

        res.json({ success: true, message: 'Email confirmado com sucesso! Agora você pode fazer login.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao confirmar email' });
    }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ success: false, error: 'Email é obrigatório' });
        return;
    }

    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE email = ?', email.toLowerCase().trim());

        if (user) {
            const resetToken = crypto.randomBytes(32).toString('hex');
            const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

            await db.run(
                'UPDATE users SET reset_token = ?, token_expires_at = ?, updated_at = ? WHERE id = ?',
                [resetToken, tokenExpires, new Date().toISOString(), user.id]
            );

            await sendPasswordResetEmail(user.email, user.name, resetToken);
        }

        // Always return success to avoid user enumeration
        res.json({ success: true, message: 'Se o email estiver cadastrado, um link de redefinição será enviado.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao processar solicitação' });
    }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    if (!token || !password) {
        res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios' });
        return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(password)) {
        res.status(400).json({
            success: false,
            error: 'Senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula e uma minúscula'
        });
        return;
    }

    try {
        const db = await getDatabase();
        // Check both reset_token and confirmation_token (for first time setup)
        let user = await db.get<User>('SELECT * FROM users WHERE reset_token = ?', token);
        let isSetup = false;

        if (!user) {
            user = await db.get<User>('SELECT * FROM users WHERE confirmation_token = ?', token);
            isSetup = true;
        }

        if (!user) {
            res.status(400).json({ success: false, error: 'Token de redefinição inválido' });
            return;
        }

        const now = new Date();
        const expires = new Date(user.token_expires_at || '');

        if (now > expires) {
            res.status(400).json({ success: false, error: 'Token de redefinição expirado' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        if (isSetup) {
            await db.run(
                'UPDATE users SET password_hash = ?, email_confirmed = true, confirmation_token = NULL, token_expires_at = NULL, updated_at = ? WHERE id = ?',
                [passwordHash, now.toISOString(), user.id]
            );
        } else {
            await db.run(
                'UPDATE users SET password_hash = ?, reset_token = NULL, token_expires_at = NULL, updated_at = ? WHERE id = ?',
                [passwordHash, now.toISOString(), user.id]
            );
        }

        res.json({ success: true, message: isSetup ? 'Cadastro concluído com sucesso!' : 'Senha redefinida com sucesso! Você já pode fazer login.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao redefinir senha' });
    }
}

export async function logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('lexonline_session');
    res.json({ success: true, message: 'Logout realizado com sucesso' });
}

