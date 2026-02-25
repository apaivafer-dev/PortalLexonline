import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { Lead } from '../types';
import { v4 as uuidv4 } from 'uuid';

export async function getLeads(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const leads = await db.all<Lead[]>(
            'SELECT * FROM leads WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: leads });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar leads' });
    }
}

export async function createLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, email, phone, pipelineId, stageId, estimatedValue, notes } = req.body;

    if (!name || !pipelineId || !stageId) {
        res.status(400).json({ success: false, error: 'Nome, pipeline e estágio são obrigatórios' });
        return;
    }

    try {
        const db = await getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO leads (id, user_id, company_id, pipeline_id, stage_id, name, email, phone, estimated_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, pipelineId, stageId, name.trim(), email || null, phone || null, estimatedValue || 0, notes || null, now, now]
        );

        await db.run('UPDATE users SET leads_count = leads_count + 1, updated_at = ? WHERE id = ?', [now, req.user!.userId]);

        const lead = await db.get<Lead>('SELECT * FROM leads WHERE id = ?', id);
        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar lead' });
    }
}

export async function updateLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, email, phone, pipelineId, stageId, estimatedValue, notes } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get<Lead>('SELECT * FROM leads WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);

        if (!existing) {
            res.status(404).json({ success: false, error: 'Lead não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            `UPDATE leads SET name = ?, email = ?, phone = ?, pipeline_id = ?, stage_id = ?, estimated_value = ?, notes = ?, updated_at = ?
       WHERE id = ? AND company_id = ?`,
            [
                name ?? existing.name,
                email ?? existing.email,
                phone ?? existing.phone,
                pipelineId ?? existing.pipeline_id,
                stageId ?? existing.stage_id,
                estimatedValue ?? existing.estimated_value,
                notes ?? existing.notes,
                now,
                id,
                req.user!.companyId,
            ]
        );

        const updated = await db.get<Lead>('SELECT * FROM leads WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar lead' });
    }
}

export async function deleteLead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM leads WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);

        if (!existing) {
            res.status(404).json({ success: false, error: 'Lead não encontrado' });
            return;
        }

        await db.run('DELETE FROM leads WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        const now = new Date().toISOString();
        await db.run('UPDATE users SET leads_count = GREATEST(0, leads_count - 1), updated_at = ? WHERE id = ?', [now, req.user!.userId]);

        res.json({ success: true, message: 'Lead excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir lead' });
    }
}
