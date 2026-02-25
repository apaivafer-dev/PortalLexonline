import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../types';

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', req.user!.userId);
        if (!user) {
            res.status(404).json({ success: false, error: 'Usuário não encontrado' });
            return;
        }
        const { password_hash: _, ...userPublic } = user;
        res.json({ success: true, data: { ...userPublic, is_admin: Boolean(user.is_admin) } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar perfil' });
    }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, phone, firmName } = req.body;

    try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.run(
            'UPDATE users SET name = ?, phone = ?, firm_name = ?, updated_at = ? WHERE id = ?',
            [name, phone || null, firmName || null, now, req.user!.userId]
        );
        const user = await db.get<User>('SELECT * FROM users WHERE id = ?', req.user!.userId);
        const { password_hash: _, ...userPublic } = user!;
        res.json({ success: true, data: { ...userPublic, is_admin: Boolean(user!.is_admin) } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar perfil' });
    }
}

export async function getCompanyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const company = await db.get('SELECT * FROM company_profiles WHERE user_id = ?', req.user!.userId);
        res.json({ success: true, data: company || null });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar perfil da empresa' });
    }
}

export async function updateCompanyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, phone, email, website, cep, street, number, complement, neighborhood, city, state } = req.body;

    try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        const existing = await db.get('SELECT id FROM company_profiles WHERE user_id = ?', req.user!.userId);

        if (existing) {
            await db.run(
                `UPDATE company_profiles SET name = ?, phone = ?, email = ?, website = ?, cep = ?, street = ?, number = ?, 
         complement = ?, neighborhood = ?, city = ?, state = ?, updated_at = ? WHERE user_id = ?`,
                [name, phone || null, email || null, website || null, cep || null, street || null, number || null,
                    complement || null, neighborhood || null, city || null, state || null, now, req.user!.userId]
            );
        } else {
            const { v4: uuidv4 } = await import('uuid');
            await db.run(
                `INSERT INTO company_profiles (id, user_id, name, phone, email, website, cep, street, number, complement, neighborhood, city, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [uuidv4(), req.user!.userId, name, phone || null, email || null, website || null, cep || null, street || null,
                number || null, complement || null, neighborhood || null, city || null, state || null, now, now]
            );
        }

        const company = await db.get('SELECT * FROM company_profiles WHERE user_id = ?', req.user!.userId);
        res.json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar perfil da empresa' });
    }
}
