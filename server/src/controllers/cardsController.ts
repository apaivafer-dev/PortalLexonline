import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// OWASP: All queries enforce company_id isolation (Multitenant Shield)

export async function getCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const cards = await db.all(
            'SELECT * FROM cards WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar cartões' });
    }
}

export async function createCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { cardName, config } = req.body;

    if (!config || typeof config !== 'object') {
        res.status(400).json({ success: false, error: 'Configuração do cartão é obrigatória' });
        return;
    }

    try {
        const db = await getDatabase();

        // Trial user limit check
        const user = await db.get('SELECT plan, cards_count FROM users WHERE id = ?', req.user!.userId);
        if (user.plan === 'Trial' && user.cards_count >= 1) {
            res.status(403).json({ success: false, error: 'Usuários Trial podem criar apenas 1 cartão. Faça o upgrade para ilimitados.' });
            return;
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO cards (id, user_id, company_id, card_name, config, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, cardName || 'Meu Cartão', JSON.stringify(config), now, now]
        );

        await db.run('UPDATE users SET cards_count = cards_count + 1, updated_at = ? WHERE id = ?', [now, req.user!.userId]);

        const card = await db.get('SELECT * FROM cards WHERE id = ?', id);
        res.status(201).json({ success: true, data: card });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar cartão' });
    }
}

export async function updateCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { cardName, config } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM cards WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Cartão não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            'UPDATE cards SET card_name = ?, config = ?, updated_at = ? WHERE id = ? AND company_id = ?',
            [cardName || 'Meu Cartão', JSON.stringify(config), now, id, req.user!.companyId]
        );

        const updated = await db.get('SELECT * FROM cards WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar cartão' });
    }
}

export async function deleteCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM cards WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Cartão não encontrado' });
            return;
        }
        await db.run('DELETE FROM cards WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        const now = new Date().toISOString();
        await db.run('UPDATE users SET cards_count = GREATEST(0, cards_count - 1), updated_at = ? WHERE id = ?', [now, req.user!.userId]);
        res.json({ success: true, message: 'Cartão excluído' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir cartão' });
    }
}
