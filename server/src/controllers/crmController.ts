import { Response } from 'express';
import { getDatabase } from '../database/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

// ═══════════════════════════════════════════════════════════════════════
// CRM CONTACTS
// All queries enforce company_id isolation (OWASP: Multitenant Shield)
// All inputs are parameterized (OWASP: SQL Injection Prevention)
// ═══════════════════════════════════════════════════════════════════════

export async function getContacts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const contacts = await db.all(
            'SELECT * FROM crm_contacts WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar contatos' });
    }
}

export async function createContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { firstName, lastName, cpf, emails, phones, type, crmCompanyId, customValues, tags } = req.body;

    if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Nome é obrigatório' });
        return;
    }

    try {
        const db = await getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO crm_contacts (id, user_id, company_id, first_name, last_name, cpf, emails, phones, type, crm_company_id, custom_values, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, firstName.trim(), (lastName || '').trim(), cpf || null,
                JSON.stringify(emails || []), JSON.stringify(phones || []), type || 'Lead', crmCompanyId || null,
                JSON.stringify(customValues || {}), tags || [], now, now]
        );

        const contact = await db.get('SELECT * FROM crm_contacts WHERE id = ?', id);
        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar contato' });
    }
}

export async function updateContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { firstName, lastName, cpf, emails, phones, type, crmCompanyId, customValues, tags } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM crm_contacts WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Contato não encontrado' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            `UPDATE crm_contacts SET first_name = ?, last_name = ?, cpf = ?, emails = ?, phones = ?, type = ?, crm_company_id = ?, custom_values = ?, tags = ?, updated_at = ?
             WHERE id = ? AND company_id = ?`,
            [firstName?.trim(), (lastName || '').trim(), cpf || null,
            JSON.stringify(emails || []), JSON.stringify(phones || []), type || 'Lead', crmCompanyId || null,
            JSON.stringify(customValues || {}), tags || [], now, id, req.user!.companyId]
        );

        const updated = await db.get('SELECT * FROM crm_contacts WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar contato' });
    }
}

export async function deleteContact(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM crm_contacts WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Contato não encontrado' });
            return;
        }
        await db.run('DELETE FROM crm_contacts WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        res.json({ success: true, message: 'Contato excluído' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir contato' });
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CRM COMPANIES
// ═══════════════════════════════════════════════════════════════════════

export async function getCompanies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const companies = await db.all(
            'SELECT * FROM crm_companies WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: companies });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar empresas' });
    }
}

export async function createCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, tradeName, emails, phones, types, customValues, tags } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Razão social é obrigatória' });
        return;
    }

    try {
        const db = await getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO crm_companies (id, user_id, company_id, name, trade_name, emails, phones, types, custom_values, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, name.trim(), (tradeName || '').trim(),
                JSON.stringify(emails || []), JSON.stringify(phones || []), types || [], JSON.stringify(customValues || {}), tags || [], now, now]
        );

        const company = await db.get('SELECT * FROM crm_companies WHERE id = ?', id);
        res.status(201).json({ success: true, data: company });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar empresa' });
    }
}

export async function updateCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, tradeName, emails, phones, types, customValues, tags } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM crm_companies WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Empresa não encontrada' });
            return;
        }

        const now = new Date().toISOString();
        await db.run(
            `UPDATE crm_companies SET name = ?, trade_name = ?, emails = ?, phones = ?, types = ?, custom_values = ?, tags = ?, updated_at = ?
             WHERE id = ? AND company_id = ?`,
            [name?.trim(), (tradeName || '').trim(), JSON.stringify(emails || []), JSON.stringify(phones || []),
            types || [], JSON.stringify(customValues || {}), tags || [], now, id, req.user!.companyId]
        );

        const updated = await db.get('SELECT * FROM crm_companies WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar empresa' });
    }
}

export async function deleteCompany(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM crm_companies WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Empresa não encontrada' });
            return;
        }
        await db.run('DELETE FROM crm_companies WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        res.json({ success: true, message: 'Empresa excluída' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir empresa' });
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CRM TAGS
// ═══════════════════════════════════════════════════════════════════════

export async function getTags(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const tags = await db.all(
            'SELECT * FROM crm_tags WHERE company_id = ? ORDER BY created_at DESC',
            req.user!.companyId
        );
        res.json({ success: true, data: tags });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar tags' });
    }
}

export async function createTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, color, entityType } = req.body;

    if (!name || !entityType) {
        res.status(400).json({ success: false, error: 'Nome e tipo são obrigatórios' });
        return;
    }

    // OWASP: Input validation — entityType must be one of allowed values
    if (!['lead', 'contact', 'company'].includes(entityType)) {
        res.status(400).json({ success: false, error: 'Tipo de entidade inválido' });
        return;
    }

    try {
        const db = await getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            'INSERT INTO crm_tags (id, user_id, company_id, name, color, entity_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, req.user!.userId, req.user!.companyId, name.trim(), color || '#3B82F6', entityType, now]
        );

        const tag = await db.get('SELECT * FROM crm_tags WHERE id = ?', id);
        res.status(201).json({ success: true, data: tag });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar tag' });
    }
}

export async function deleteTag(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM crm_tags WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Tag não encontrada' });
            return;
        }
        await db.run('DELETE FROM crm_tags WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        res.json({ success: true, message: 'Tag excluída' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir tag' });
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM FIELDS
// ═══════════════════════════════════════════════════════════════════════

export async function getCustomFields(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        const db = await getDatabase();
        const fields = await db.all(
            'SELECT * FROM custom_fields WHERE company_id = ? ORDER BY created_at ASC',
            req.user!.companyId
        );
        res.json({ success: true, data: fields });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao buscar campos personalizados' });
    }
}

export async function createCustomField(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { key, label, type, entityType, fieldGroup, required, placeholder, defaultValue, options, buttonConfig, pipelineIds } = req.body;

    if (!key || !label || !entityType) {
        res.status(400).json({ success: false, error: 'Key, label e tipo de entidade são obrigatórios' });
        return;
    }

    if (!['lead', 'contact', 'company'].includes(entityType)) {
        res.status(400).json({ success: false, error: 'Tipo de entidade inválido' });
        return;
    }

    try {
        const db = await getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO custom_fields (id, user_id, company_id, key, label, type, entity_type, field_group, required, placeholder, default_value, options, button_config, pipeline_ids, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.user!.userId, req.user!.companyId, key.trim(), label.trim(), type || 'text', entityType,
                fieldGroup || 'Geral', required || false, placeholder || null, defaultValue || null,
                JSON.stringify(options || []), buttonConfig ? JSON.stringify(buttonConfig) : null, pipelineIds || [], now]
        );

        const field = await db.get('SELECT * FROM custom_fields WHERE id = ?', id);
        res.status(201).json({ success: true, data: field });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao criar campo personalizado' });
    }
}

export async function updateCustomField(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { label, type, fieldGroup, required, placeholder, defaultValue, options, buttonConfig, pipelineIds } = req.body;

    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM custom_fields WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Campo não encontrado' });
            return;
        }

        await db.run(
            `UPDATE custom_fields SET label = ?, type = ?, field_group = ?, required = ?, placeholder = ?, default_value = ?, options = ?, button_config = ?, pipeline_ids = ?
             WHERE id = ? AND company_id = ?`,
            [label, type, fieldGroup, required, placeholder || null, defaultValue || null,
                JSON.stringify(options || []), buttonConfig ? JSON.stringify(buttonConfig) : null, pipelineIds || [],
                id, req.user!.companyId]
        );

        const updated = await db.get('SELECT * FROM custom_fields WHERE id = ?', id);
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao atualizar campo personalizado' });
    }
}

export async function deleteCustomField(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const db = await getDatabase();
        const existing = await db.get('SELECT id FROM custom_fields WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        if (!existing) {
            res.status(404).json({ success: false, error: 'Campo não encontrado' });
            return;
        }
        await db.run('DELETE FROM custom_fields WHERE id = ? AND company_id = ?', [id, req.user!.companyId]);
        res.json({ success: true, message: 'Campo excluído' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao excluir campo personalizado' });
    }
}
