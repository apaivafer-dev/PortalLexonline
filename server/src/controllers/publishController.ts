import { Request, Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════════════════
// PUBLISH CALCULATOR
// Allows users to publish their calculator at a public URL using their slug
// OWASP: Slug is sanitized, public route has no auth but read-only access
// ═══════════════════════════════════════════════════════════════════════

export async function publishCalculator(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { companyName, primaryColor, whatsappNumber, whatsappMessage, showLeadForm, customCss } = req.body;

    try {
        const db = await getDatabase();

        // Get user's slug
        const user = await db.get('SELECT slug FROM users WHERE id = ?', req.user!.userId);
        if (!user || !user.slug) {
            res.status(400).json({ success: false, error: 'Slug do usuário não configurado' });
            return;
        }

        const slug = user.slug;
        const now = new Date().toISOString();

        // Check if already published (upsert)
        const existing = await db.get('SELECT id FROM published_calculators WHERE user_id = ?', req.user!.userId);

        if (existing) {
            await db.run(
                `UPDATE published_calculators SET slug = ?, company_name = ?, primary_color = ?, whatsapp_number = ?, whatsapp_message = ?, show_lead_form = ?, custom_css = ?, is_active = true, updated_at = ?
                 WHERE user_id = ?`,
                [slug, companyName || '', primaryColor || '#2563eb', whatsappNumber || '', whatsappMessage || '', showLeadForm !== false, customCss || '', now, req.user!.userId]
            );
        } else {
            await db.run(
                `INSERT INTO published_calculators (id, user_id, slug, company_name, primary_color, whatsapp_number, whatsapp_message, show_lead_form, custom_css, is_active, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?)`,
                [uuidv4(), req.user!.userId, slug, companyName || '', primaryColor || '#2563eb', whatsappNumber || '', whatsappMessage || '', showLeadForm !== false, customCss || '', now, now]
            );
        }

        const published = await db.get('SELECT * FROM published_calculators WHERE user_id = ?', req.user!.userId);
        res.json({ success: true, data: published });
    } catch (error) {
        console.error('Publish calculator error:', error);
        res.status(500).json({ success: false, error: 'Erro ao publicar calculadora' });
    }
}

export async function getPublishedCalculator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const published = await db.get('SELECT * FROM published_calculators WHERE user_id = ?', req.user!.userId);
        res.json({ success: true, data: published || null });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar calculadora publicada' });
    }
}

/**
 * Public route — NO AUTH required
 * Returns calculator config for a given slug
 * OWASP: Read-only, no sensitive data exposed, slug validated
 */
export async function getPublicCalculator(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;

    // OWASP: Input validation — slug must be alphanumeric with dots/dashes
    if (!slug || !/^[a-z0-9._-]+$/i.test(slug)) {
        res.status(400).json({ success: false, error: 'Slug inválido' });
        return;
    }

    try {
        const db = await getDatabase();
        const published = await db.get(
            'SELECT pc.*, u.firm_name FROM published_calculators pc JOIN users u ON pc.user_id = u.id WHERE pc.slug = ? AND pc.is_active = true',
            slug
        );

        if (!published) {
            res.status(404).json({ success: false, error: 'Calculadora não encontrada' });
            return;
        }

        // Only return public-safe fields
        res.json({
            success: true,
            data: {
                slug: published.slug,
                companyName: published.company_name || published.firm_name || '',
                primaryColor: published.primary_color,
                whatsappNumber: published.whatsapp_number,
                whatsappMessage: published.whatsapp_message,
                showLeadForm: published.show_lead_form,
                customCss: published.custom_css,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar calculadora' });
    }
}

export async function unpublishCalculator(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const now = new Date().toISOString();
        await db.run('UPDATE published_calculators SET is_active = false, updated_at = ? WHERE user_id = ?', [now, req.user!.userId]);
        res.json({ success: true, message: 'Calculadora despublicada' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao despublicar calculadora' });
    }
}
