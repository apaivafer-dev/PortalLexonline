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
        const result = await db.run('DELETE FROM published_calculators WHERE user_id = ?', req.user!.userId);
        res.json({ success: true, message: 'Calculadora despublicada' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao despublicar calculadora' });
    }
}

export async function submitPublicLead(req: Request, res: Response): Promise<void> {
    const slug = req.params.slug as string;
    const { name, email, phone, estimatedValue, notes } = req.body;

    if (!slug || !/^[a-z0-9._-]+$/i.test(slug)) {
        res.status(400).json({ success: false, error: 'Slug inválido' });
        return;
    }

    if (!name || !email) {
        res.status(400).json({ success: false, error: 'Nome e email são obrigatórios' });
        return;
    }

    try {
        const db = await getDatabase();

        // Find user by slug
        const user = await db.get('SELECT id, company_id FROM users WHERE slug = ?', slug);
        if (!user) {
            res.status(404).json({ success: false, error: 'Conta não encontrada' });
            return;
        }

        const userId = user.id;
        const companyId = user.company_id;

        // Try to find "Calculadora Rescisão" pipeline
        let pipeline = await db.get('SELECT id FROM pipelines WHERE user_id = ? AND name = ?', [userId, 'Calculadora Rescisão']);

        if (!pipeline) {
            // Fallback to first pipeline
            pipeline = await db.get('SELECT id FROM pipelines WHERE user_id = ? ORDER BY sort_order ASC LIMIT 1', userId);
        }

        if (!pipeline) {
            res.status(500).json({ success: false, error: 'Pipeline não configurado para este usuário' });
            return;
        }

        // Try to find "Novo" stage or first stage
        let stage = await db.get('SELECT id FROM pipeline_stages WHERE pipeline_id = ? AND name = ?', [pipeline.id, 'Novo']);
        if (!stage) {
            stage = await db.get('SELECT id FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC LIMIT 1', pipeline.id);
        }

        if (!stage) {
            res.status(500).json({ success: false, error: 'Estágio não configurado' });
            return;
        }

        const leadId = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO leads (id, user_id, company_id, name, email, phone, pipeline_id, stage_id, estimated_value, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [leadId, userId, companyId, name, email, phone || '', pipeline.id, stage.id, estimatedValue || 0, notes || '', now, now]
        );

        res.json({ success: true, message: 'Lead capturado com sucesso' });

    } catch (error) {
        console.error('Submit public lead error:', error);
        res.status(500).json({ success: false, error: 'Erro interno ao salvar lead' });
    }
}
