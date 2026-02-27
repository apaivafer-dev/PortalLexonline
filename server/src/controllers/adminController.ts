import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';
import { sendWelcomeInviteEmail } from '../utils/email';
import crypto from 'crypto';

/**
 * List all users (Owner only)
 */
export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const users = await db.all<User[]>('SELECT * FROM users ORDER BY created_at DESC');
        // OWASP: Never expose password_hash
        const usersPublic = users.map(({ password_hash: _, ...u }) => ({
            ...u,
            is_admin: Boolean(u.is_admin),
        }));
        res.json({ success: true, data: usersPublic });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar usuários' });
    }
}

/**
 * Create a new user (Owner only)
 * New users start with plan "Pro" (Cortesia) and role "User"
 */
export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, email, password, phone, firmName } = req.body;

    if (!name || !email) {
        res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        return;
    }

    // OWASP: Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ success: false, error: 'Email inválido' });
        return;
    }

    // OWASP: Password strength validation (only if provided)
    if (password && password.length < 6) {
        res.status(400).json({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' });
        return;
    }

    try {
        const db = await getDatabase();

        const existing = await db.get('SELECT id FROM users WHERE email = ?', email.toLowerCase().trim());
        if (existing) {
            res.status(409).json({ success: false, error: 'Este email já está cadastrado' });
            return;
        }

        // OWASP: BCrypt with cost factor 12
        // If no password provided, use a random one as placeholder (user will set via invite)
        const passwordHash = await bcrypt.hash(password || crypto.randomBytes(32).toString('hex'), 12);
        const userId = uuidv4();
        const companyId = uuidv4();
        const now = new Date().toISOString();
        const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Back to 30 days default for new? Admin said Pro cortesia below.

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h

        // Generate slug from email prefix
        const emailPrefix = email.toLowerCase().trim().split('@')[0].replace(/[^a-z0-9._-]/g, '');
        let slug = emailPrefix;
        const slugExists = await db.get('SELECT id FROM users WHERE slug = ?', slug);
        if (slugExists) slug = `${emailPrefix}-${Date.now().toString(36)}`;

        await db.run(
            `INSERT INTO users (id, name, email, password_hash, company_id, phone, firm_name, role, slug, plan, subscription_status, is_admin,
            leads_count, banners_count, cards_count, trial_ends_at, courtesy_start_date, email_confirmed, confirmation_token, token_expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'User', ?, 'Pro', 'Active', 0, 0, 0, 0, ?, ?, false, ?, ?, ?, ?)`,
            [userId, name.trim(), email.toLowerCase().trim(), passwordHash, companyId, phone || null, firmName || null, slug, trialEndsAt, now, confirmationToken, tokenExpires, now, now]
        );

        // Send Welcome/Invite email
        await sendWelcomeInviteEmail(email.toLowerCase().trim(), name, confirmationToken);

        // Create default company profile
        await db.run(
            'INSERT INTO company_profiles (id, user_id, name, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [companyId, userId, firmName || name, email.toLowerCase().trim(), now, now]
        );

        // Create default pipelines
        const calcPipelineId = uuidv4();
        const commPipelineId = uuidv4();

        await db.run(
            'INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, 1, 0, ?, ?)',
            [calcPipelineId, userId, companyId, 'Calculadora Rescisão', now, now]
        );
        await db.run(
            'INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 1, 1, 1, ?, ?)',
            [commPipelineId, userId, companyId, 'Comercial', now, now]
        );

        const defaultStages = [
            {
                pId: calcPipelineId, stages: [
                    { name: 'Novo', order: 0, type: 'active', color: 'blue' },
                    { name: 'Contatado', order: 1, type: 'active', color: 'orange' },
                    { name: 'Convertido', order: 2, type: 'won', color: 'green' },
                    { name: 'Perdido', order: 3, type: 'lost', color: 'slate' },
                ]
            },
            {
                pId: commPipelineId, stages: [
                    { name: 'Prospecção', order: 0, type: 'active', color: 'indigo' },
                    { name: 'Qualificação', order: 1, type: 'active', color: 'violet' },
                    { name: 'Proposta', order: 2, type: 'active', color: 'amber' },
                    { name: 'Negociação', order: 3, type: 'active', color: 'orange' },
                    { name: 'Fechado Ganho', order: 4, type: 'won', color: 'emerald' },
                    { name: 'Perdido', order: 5, type: 'lost', color: 'slate' },
                ]
            },
        ];

        for (const group of defaultStages) {
            for (const stage of group.stages) {
                await db.run(
                    'INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuidv4(), group.pId, stage.name, stage.order, stage.type, stage.color]
                );
            }
        }

        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', userId);
        const { password_hash: _, ...userPublic } = user!;
        res.status(201).json({ success: true, data: userPublic });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, error: 'Erro ao criar usuário' });
    }
}

export async function toggleUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const db = await getDatabase();

        if (id === req.user!.userId) {
            res.status(400).json({ success: false, error: 'Não é possível desativar sua própria conta' });
            return;
        }

        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        // OWASP: Cannot disable another Owner
        if (user.role === 'Owner') {
            res.status(403).json({ success: false, error: 'Não é possível desativar um Owner' });
            return;
        }

        const newStatus = user.subscription_status === 'Active' ? 'Disabled' : 'Active';
        const now = new Date().toISOString();
        await db.run('UPDATE users SET subscription_status = ?, updated_at = ? WHERE id = ?', [newStatus, now, id]);

        res.json({ success: true, data: { id, subscription_status: newStatus } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao alterar status do usuário' });
    }
}

export async function updateUserPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { plan } = req.body;

    // Allow Pro (Cortesia), Premium (Pago), and Trial
    if (!['Pro', 'Premium', 'Trial'].includes(plan)) {
        res.status(400).json({ success: false, error: 'Plano inválido. Use: Pro, Premium ou Trial' });
        return;
    }

    try {
        const db = await getDatabase();
        const user = await db.get('SELECT id, role FROM users WHERE id = ?', id);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        // Cannot change Owner's plan
        if (user.role === 'Owner') {
            res.status(403).json({ success: false, error: 'Não é possível alterar o plano de um Owner' });
            return;
        }

        const now = new Date().toISOString();
        const dateUpdates: any = {};
        if (plan === 'Pro') dateUpdates.courtesy_start_date = now;
        if (plan === 'Premium') dateUpdates.paid_start_date = now;

        await db.run(
            `UPDATE users SET plan = ?, courtesy_start_date = COALESCE(?, courtesy_start_date), paid_start_date = COALESCE(?, paid_start_date), updated_at = ? WHERE id = ?`,
            [plan, dateUpdates.courtesy_start_date || null, dateUpdates.paid_start_date || null, now, id]
        );
        res.json({ success: true, data: { id, plan } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar plano do usuário' });
    }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, email, phone, firmName } = req.body;

    if (!name || !email) {
        res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        return;
    }

    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            'UPDATE users SET name = ?, email = ?, phone = ?, firm_name = ?, updated_at = ? WHERE id = ?',
            [name.trim(), email.toLowerCase().trim(), phone || null, firmName || null, now, id]
        );

        const updated = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
        const { password_hash: _, ...userPublic } = updated!;
        res.json({ success: true, data: userPublic });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar usuário' });
    }
}

export async function resendInvite(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', id);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }

        const confirmationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h
        const now = new Date().toISOString();

        await db.run(
            'UPDATE users SET confirmation_token = ?, token_expires_at = ?, updated_at = ? WHERE id = ?',
            [confirmationToken, tokenExpires, now, id]
        );

        await sendWelcomeInviteEmail(user.email, user.name, confirmationToken);

        res.json({ success: true, message: 'Convite reenviado com sucesso!' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao reenviar convite' });
    }
}

export async function getAdminStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
        const activeUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE subscription_status = 'Active'");
        const totalLeads = await db.get('SELECT COUNT(*) as total FROM leads');
        const trialUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE plan = 'Trial'");
        const premiumUsers = await db.get("SELECT COUNT(*) as count FROM users WHERE plan = 'Premium'");

        res.json({
            success: true,
            data: {
                totalUsers: totalUsers?.count || 0,
                activeUsers: activeUsers?.count || 0,
                totalLeads: totalLeads?.total || 0,
                trialUsers: trialUsers?.count || 0,
                premiumUsers: premiumUsers?.count || 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas' });
    }
}
