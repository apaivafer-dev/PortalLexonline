import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { Pipeline, PipelineStage } from '../types';
import { v4 as uuidv4 } from 'uuid';

async function getPipelinesWithStages(db: any, companyId: string): Promise<Pipeline[]> {
    const pipelines = await db.all(
        'SELECT * FROM pipelines WHERE company_id = ? ORDER BY sort_order ASC',
        companyId
    );

    const result: Pipeline[] = [];
    for (const p of pipelines) {
        const stages = await db.all(
            'SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC',
            p.id
        );
        result.push({
            ...p,
            is_system: Boolean(p.is_system),
            show_value: Boolean(p.show_value),
            show_total: Boolean(p.show_total),
            stages,
        });
    }
    return result;
}

export async function getPipelines(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const pipelines = await getPipelinesWithStages(db, req.user!.companyId);
        res.json({ success: true, data: pipelines });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar pipelines' });
    }
}

export async function createPipeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, showValue, showTotal, stages } = req.body;

    if (!name || !stages || !Array.isArray(stages) || stages.length === 0) {
        res.status(400).json({ success: false, error: 'Nome e estágios são obrigatórios' });
        return;
    }

    try {
        const db = await getDatabase();
        const pipelineId = uuidv4();
        const now = new Date().toISOString();

        const maxOrder = await db.get('SELECT MAX(sort_order) as maxOrder FROM pipelines WHERE company_id = ?', req.user!.companyId);
        const sortOrder = (maxOrder?.maxOrder ?? -1) + 1;

        await db.run(
            `INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
            [pipelineId, req.user!.userId, req.user!.companyId, name.trim(), showValue ? 1 : 0, showTotal ? 1 : 0, sortOrder, now, now]
        );

        for (let i = 0; i < stages.length; i++) {
            const stage = stages[i];
            await db.run(
                `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)`,
                [uuidv4(), pipelineId, stage.name, i, stage.type || 'active', stage.color || 'blue']
            );
        }

        const pipelines = await getPipelinesWithStages(db, req.user!.companyId);
        const created = pipelines.find(p => p.id === pipelineId);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar pipeline' });
    }
}

export async function updatePipeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, showValue, showTotal } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT * FROM pipelines WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Pipeline não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            'UPDATE pipelines SET name = ?, show_value = ?, show_total = ?, updated_at = ? WHERE id = ? AND company_id = ?',
            [name ?? existing.name, showValue !== undefined ? (showValue ? 1 : 0) : existing.show_value, showTotal !== undefined ? (showTotal ? 1 : 0) : existing.show_total, now, id, req.user!.companyId]
        );

        const pipelines = await getPipelinesWithStages(db, req.user!.companyId);
        const updated = pipelines.find(p => p.id === id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar pipeline' });
    }
}

export async function deletePipeline(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT * FROM pipelines WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);

        if (!existing) {
            res.status(404).json({ success: false, error: 'Pipeline não encontrado' });
            return;
        }

        if (existing.is_system) {
            res.status(400).json({ success: false, error: 'Não é possível excluir pipelines do sistema' });
            return;
        }

        await db.run('DELETE FROM pipelines WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        res.json({ success: true, message: 'Pipeline excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir pipeline' });
    }
}
