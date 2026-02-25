import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// OWASP: All queries enforce company_id isolation (Multitenant Shield)
// OWASP: All inputs are parameterized (SQL Injection Prevention)

export async function getBanners(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const banners = await db.all(
            'SELECT * FROM banners WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: banners });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar banners' });
    }
}

export async function createBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { companyName, reviewLink, bannerTitle, bannerDescription, qrInstruction, instructions, bannerColor, fontColor, frameType } = req.body;

    try {
        const db = await getDatabase();

        // Trial user limit check
        const user = await db.get('SELECT plan, banners_count FROM users WHERE id = ?', req.user!.userId);
        if (user.plan === 'Trial' && user.banners_count >= 1) {
            res.status(403).json({ success: false, error: 'Usuários Trial podem criar apenas 1 banner. Faça o upgrade para ilimitados.' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO banners (id, user_id, company_id, company_name, review_link, banner_title, banner_description, qr_instruction, instructions, banner_color, font_color, frame_type, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, companyName || '', reviewLink || '', bannerTitle || '', bannerDescription || '',
                qrInstruction || '', instructions || '', bannerColor || '#e74c3c', fontColor || '#ffffff', frameType || 'google', now, now]
        );

        // Update banners_count
        await db.run('UPDATE users SET banners_count = banners_count + 1, updated_at = ? WHERE id = ?', [now, req.user!.userId]);

        const banner = await db.get('SELECT * FROM banners WHERE id = ?', id);
        res.status(201).json({ success: true, data: banner });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar banner' });
    }
}

export async function updateBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { companyName, reviewLink, bannerTitle, bannerDescription, qrInstruction, instructions, bannerColor, fontColor, frameType } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM banners WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Banner não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            `UPDATE banners SET company_name = ?, review_link = ?, banner_title = ?, banner_description = ?, qr_instruction = ?, instructions = ?, banner_color = ?, font_color = ?, frame_type = ?, updated_at = ?
             WHERE id = ? AND company_id = ?`,
            [companyName, reviewLink, bannerTitle, bannerDescription, qrInstruction, instructions, bannerColor, fontColor, frameType, now, id, req.user!.companyId]
        );

        const updated = await db.get('SELECT * FROM banners WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar banner' });
    }
}

export async function deleteBanner(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM banners WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Banner não encontrado' });
            return;
        }
        await db.run('DELETE FROM banners WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        const now = new Date().toISOString();
        await db.run('UPDATE users SET banners_count = GREATEST(0, banners_count - 1), updated_at = ? WHERE id = ?', [now, req.user!.userId]);
        res.json({ success: true, message: 'Banner excluído' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir banner' });
    }
}
