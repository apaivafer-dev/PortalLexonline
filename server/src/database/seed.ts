import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db';

export async function seedAdminUser(): Promise<void> {
    const db = await getDatabase();

    const adminEmail = 'apaivafer@gmail.com';
    const existing = await db.get('SELECT id FROM users WHERE email = ?', adminEmail);

    if (existing) {
        // Ensure role and slug are set for existing admin
        await db.run(
            "UPDATE users SET role = 'Owner', slug = 'apaivafer', is_admin = 1 WHERE email = ? AND (role IS NULL OR role != 'Owner')",
            adminEmail
        );
        console.log('ℹ️  Admin user already exists, ensured Owner role.');
        return;
    }

    // OWASP: BCrypt with cost factor 12
    const passwordHash = await bcrypt.hash('admin123', 12);
    const adminId = uuidv4();
    const companyId = uuidv4();
    const now = new Date().toISOString();
    const trialEndsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await db.run(
        `INSERT INTO users (id, name, email, password_hash, company_id, phone, firm_name, role, slug, plan, subscription_status, is_admin,
      leads_count, banners_count, cards_count, trial_ends_at, courtesy_start_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Owner', 'apaivafer', 'Pro', 'Active', 1, 0, 0, 0, ?, ?, ?, ?)`,
        [adminId, 'Alexandre Paiva', adminEmail, passwordHash, companyId, '11999999999', 'Paiva & Associados', trialEndsAt, now, now, now]
    );

    await db.run(
        `INSERT INTO company_profiles (id, user_id, name, phone, email, website, cep, street, number, complement, neighborhood, city, state, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), adminId, 'Paiva & Associados Advocacia', '(11) 99999-9999', adminEmail,
        process.env.FRONTEND_URL || 'http://localhost:5173', '01310-100', 'Av. Paulista', '1000', 'Conj 101', 'Bela Vista', 'São Paulo', 'SP', now, now]
    );

    // Calculator Pipeline
    const calcPipelineId = uuidv4();
    await db.run(
        `INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 1, 1, 0, ?, ?)`,
        [calcPipelineId, adminId, companyId, 'Calculadora Rescisão', now, now]
    );

    const calcStageIds = { new: uuidv4(), contacted: uuidv4(), converted: uuidv4(), lost: uuidv4() };
    const calcStages = [
        { id: calcStageIds.new, name: 'Novo', order: 0, type: 'active', color: 'blue' },
        { id: calcStageIds.contacted, name: 'Contatado', order: 1, type: 'active', color: 'orange' },
        { id: calcStageIds.converted, name: 'Convertido', order: 2, type: 'won', color: 'green' },
        { id: calcStageIds.lost, name: 'Perdido', order: 3, type: 'lost', color: 'slate' },
    ];

    for (const s of calcStages) {
        await db.run('INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)',
            [s.id, calcPipelineId, s.name, s.order, s.type, s.color]);
    }

    // Commercial Pipeline
    const commPipelineId = uuidv4();
    await db.run(
        `INSERT INTO pipelines (id, user_id, company_id, name, is_system, show_value, show_total, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 1, 1, 1, ?, ?)`,
        [commPipelineId, adminId, companyId, 'Comercial', now, now]
    );

    const commStages = [
        { id: uuidv4(), name: 'Prospecção', order: 0, type: 'active', color: 'indigo' },
        { id: uuidv4(), name: 'Qualificação', order: 1, type: 'active', color: 'violet' },
        { id: uuidv4(), name: 'Proposta', order: 2, type: 'active', color: 'amber' },
        { id: uuidv4(), name: 'Negociação', order: 3, type: 'active', color: 'orange' },
        { id: uuidv4(), name: 'Fechado Ganho', order: 4, type: 'won', color: 'emerald' },
        { id: uuidv4(), name: 'Perdido', order: 5, type: 'lost', color: 'slate' },
    ];

    for (const s of commStages) {
        await db.run('INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, type, color) VALUES (?, ?, ?, ?, ?, ?)',
            [s.id, commPipelineId, s.name, s.order, s.type, s.color]);
    }

    console.log('✅ Owner user seeded: apaivafer@gmail.com / senha: admin123');
}
