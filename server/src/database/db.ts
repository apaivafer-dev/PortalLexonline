import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool: Pool | null = null;

// Function to translate SQLite "?" placeholders into Postgres "$1, $2, ..."
function translateSql(sql: string): string {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

// Wrapper to make 'pg' act like the 'sqlite' library interface
export interface DatabaseWrapper {
  get<T = any>(sql: string, params?: any | any[]): Promise<T | undefined>;
  all<T = any[]>(sql: string, params?: any | any[]): Promise<T>;
  run(sql: string, params?: any | any[]): Promise<any>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
}

const normalizeParams = (p?: any | any[]): any[] => p === undefined ? [] : (Array.isArray(p) ? p : [p]);

export const getDatabase = async (): Promise<DatabaseWrapper> => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set in .env');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: { rejectUnauthorized: false } // uncomment if needed for strict environments without valid certs
    });
  }

  return {
    get: async (sql: string, params?: any | any[]) => {
      const { rows } = await pool!.query(translateSql(sql), normalizeParams(params));
      return rows[0];
    },
    all: async (sql: string, params?: any | any[]) => {
      const { rows } = await pool!.query(translateSql(sql), normalizeParams(params));
      return rows as any;
    },
    run: async (sql: string, params?: any | any[]) => {
      const result = await pool!.query(translateSql(sql), normalizeParams(params));
      return result; // returning the raw query result since we don't rely on lastID
    },
    exec: async (sql: string) => {
      if (sql.includes('PRAGMA')) return; // Ignore sqlite-specific pragmas

      // Replace SQLite specific functions with Postgres equivalents
      const pgSql = sql.replace(/datetime\('now'\)/g, "CURRENT_TIMESTAMP");
      await pool!.query(pgSql);
    },
    close: async () => {
      return pool!.end();
    }
  };
};

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // ── Core Tables ──────────────────────────────────────────────────────
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      company_id TEXT NOT NULL,
      phone TEXT,
      firm_name TEXT,
      role TEXT NOT NULL DEFAULT 'User',
      slug TEXT UNIQUE,
      plan TEXT NOT NULL DEFAULT 'Trial',
      subscription_status TEXT NOT NULL DEFAULT 'Active',
      is_admin INTEGER NOT NULL DEFAULT 0,
      leads_count INTEGER NOT NULL DEFAULT 0,
      banners_count INTEGER NOT NULL DEFAULT 0,
      cards_count INTEGER NOT NULL DEFAULT 0,
      trial_ends_at TEXT,
      paid_start_date TEXT,
      courtesy_start_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      website TEXT,
      cep TEXT,
      street TEXT,
      number TEXT,
      complement TEXT,
      neighborhood TEXT,
      city TEXT,
      state TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pipelines (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      is_system INTEGER NOT NULL DEFAULT 0,
      show_value INTEGER NOT NULL DEFAULT 1,
      show_total INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES company_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id TEXT PRIMARY KEY,
      pipeline_id TEXT NOT NULL,
      name TEXT NOT NULL,
      stage_order INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'active',
      color TEXT NOT NULL DEFAULT 'blue',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      pipeline_id TEXT NOT NULL,
      stage_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      estimated_value REAL DEFAULT 0,
      notes TEXT,
      custom_values JSONB DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES company_profiles(id),
      FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
      FOREIGN KEY (stage_id) REFERENCES pipeline_stages(id)
    );
  `);

  // ── CRM Tables ───────────────────────────────────────────────────────
  await database.exec(`
    CREATE TABLE IF NOT EXISTS crm_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL DEFAULT '',
      cpf TEXT,
      emails JSONB NOT NULL DEFAULT '[]',
      phones JSONB NOT NULL DEFAULT '[]',
      type TEXT NOT NULL DEFAULT 'Lead',
      crm_company_id TEXT,
      custom_values JSONB DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crm_companies (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      trade_name TEXT NOT NULL,
      emails JSONB NOT NULL DEFAULT '[]',
      phones JSONB NOT NULL DEFAULT '[]',
      types TEXT[] DEFAULT '{}',
      custom_values JSONB DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crm_tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3B82F6',
      entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_fields (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      key TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','textarea','number','date','select','multiselect','checkbox','button','file')),
      entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'contact', 'company')),
      field_group TEXT DEFAULT 'Geral',
      required BOOLEAN NOT NULL DEFAULT false,
      placeholder TEXT,
      default_value TEXT,
      options JSONB DEFAULT '[]',
      button_config JSONB,
      pipeline_ids TEXT[] DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // ── Banners & Cards ──────────────────────────────────────────────────
  await database.exec(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      company_name TEXT NOT NULL DEFAULT '',
      review_link TEXT DEFAULT '',
      banner_title TEXT DEFAULT '',
      banner_description TEXT DEFAULT '',
      qr_instruction TEXT DEFAULT '',
      instructions TEXT DEFAULT '',
      banner_color TEXT DEFAULT '#e74c3c',
      font_color TEXT DEFAULT '#ffffff',
      frame_type TEXT DEFAULT 'google',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      company_id TEXT NOT NULL,
      card_name TEXT NOT NULL DEFAULT 'Meu Cartão',
      config JSONB NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // ── Published Calculator ─────────────────────────────────────────────
  await database.exec(`
    CREATE TABLE IF NOT EXISTS published_calculators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      slug TEXT UNIQUE NOT NULL,
      company_name TEXT DEFAULT '',
      primary_color TEXT DEFAULT '#2563eb',
      whatsapp_number TEXT DEFAULT '',
      whatsapp_message TEXT DEFAULT '',
      show_lead_form BOOLEAN DEFAULT true,
      custom_css TEXT DEFAULT '',
      is_active BOOLEAN DEFAULT true,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // ── Migration: Add new columns to existing tables if missing ─────────
  // These are safe to run multiple times (IF NOT EXISTS pattern via DO blocks)
  await database.exec(`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN email_confirmed BOOLEAN DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN confirmation_token TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN reset_token TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN token_expires_at TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'User';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN slug TEXT UNIQUE;
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE leads ADD COLUMN custom_values JSONB DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE leads ADD COLUMN tags TEXT[] DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE published_calculators ADD COLUMN header_bg_color TEXT DEFAULT '#0f172a';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE published_calculators ADD COLUMN header_font_color TEXT DEFAULT '#ffffff';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;

    DO $$ BEGIN
      ALTER TABLE published_calculators ADD COLUMN config JSONB DEFAULT '{}';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `);

  console.log('✅ Database PostgreSQL initialized successfully');
}
