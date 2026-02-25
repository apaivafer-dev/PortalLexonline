export interface User {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    company_id: string;
    phone?: string;
    firm_name?: string;
    role: 'Owner' | 'User';
    slug?: string;
    plan: 'Pro' | 'Premium' | 'Trial';
    subscription_status: 'Active' | 'Disabled';
    is_admin: boolean;
    leads_count: number;
    banners_count: number;
    cards_count: number;
    trial_ends_at?: string;
    paid_start_date?: string;
    courtesy_start_date?: string;
    email_confirmed: boolean;
    confirmation_token?: string;
    reset_token?: string;
    token_expires_at?: string;
    created_at: string;
    updated_at: string;
}

export interface UserPublic extends Omit<User, 'password_hash'> { }

export interface CompanyProfile {
    id: string;
    user_id: string;
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    created_at: string;
    updated_at: string;
}

export interface Pipeline {
    id: string;
    user_id: string;
    name: string;
    is_system: boolean;
    show_value: boolean;
    show_total: boolean;
    sort_order: number;
    stages: PipelineStage[];
    created_at: string;
    updated_at: string;
}

export interface PipelineStage {
    id: string;
    pipeline_id: string;
    name: string;
    stage_order: number;
    type: 'active' | 'won' | 'lost';
    color: string;
}

export interface Lead {
    id: string;
    user_id: string;
    pipeline_id: string;
    stage_id: string;
    name: string;
    email?: string;
    phone?: string;
    estimated_value: number;
    notes?: string;
    custom_values?: Record<string, any>;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface AuthTokenPayload {
    userId: string;
    companyId: string;
    email: string;
    isAdmin: boolean;
    role: 'Owner' | 'User';
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// ── CRM Types ──────────────────────────────────────────────────────────

export interface CRMContact {
    id: string;
    user_id: string;
    company_id: string;
    first_name: string;
    last_name: string;
    cpf?: string;
    emails: string[];
    phones: { number: string; type: string }[];
    type: 'Lead' | 'Cliente';
    crm_company_id?: string;
    custom_values?: Record<string, any>;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface CRMCompany {
    id: string;
    user_id: string;
    company_id: string;
    name: string;
    trade_name: string;
    emails: string[];
    phones: { number: string; type: string }[];
    types: string[];
    custom_values?: Record<string, any>;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface CRMTag {
    id: string;
    user_id: string;
    company_id: string;
    name: string;
    color: string;
    entity_type: 'lead' | 'contact' | 'company';
    created_at: string;
}

export interface CustomField {
    id: string;
    user_id: string;
    company_id: string;
    key: string;
    label: string;
    type: string;
    entity_type: 'lead' | 'contact' | 'company';
    field_group: string;
    required: boolean;
    placeholder?: string;
    default_value?: string;
    options?: any[];
    button_config?: any;
    pipeline_ids?: string[];
    created_at: string;
}

// ── Banner & Card Types ────────────────────────────────────────────────

export interface Banner {
    id: string;
    user_id: string;
    company_id: string;
    company_name: string;
    review_link: string;
    banner_title: string;
    banner_description: string;
    qr_instruction: string;
    instructions: string;
    banner_color: string;
    font_color: string;
    frame_type: string;
    created_at: string;
    updated_at: string;
}

export interface Card {
    id: string;
    user_id: string;
    company_id: string;
    card_name: string;
    config: Record<string, any>;
    created_at: string;
    updated_at: string;
}

// ── Published Calculator ───────────────────────────────────────────────

export interface PublishedCalculator {
    id: string;
    user_id: string;
    slug: string;
    company_name: string;
    primary_color: string;
    whatsapp_number: string;
    whatsapp_message: string;
    show_lead_form: boolean;
    custom_css: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ── Calculator Types ───────────────────────────────────────────────────

export enum TerminationType {
    SEM_JUSTA_CAUSA = 'Sem Justa Causa',
    PEDIDO_DEMISSAO = 'Pedido de Demissão',
    JUSTA_CAUSA = 'Justa Causa',
    CULPA_RECIPROCA = 'Culpa Recíproca',
    ACORDO_COMUM = 'Acordo Comum (Art. 484-A)'
}

export type NoticeType = 'Indenizado' | 'Trabalhado' | 'Dispensado/Não Cumprido';

export interface CalculatorInput {
    employeeName: string;
    salary: number;
    startDate: string;
    endDate: string;
    terminationType: TerminationType;
    noticeType: NoticeType;
    noticeStartDate?: string;
    noticeEndDate?: string;
    vacationOverdue: number;
    dependents: number;
    additionalHours: number;
    additionalDanger: boolean;
    additionalNight: boolean;
    fgtsBalance: number;
    applyFine467: boolean;
    applyFine477: boolean;
}

export interface CalculationResultItem {
    description: string;
    reference: string;
    value: number;
    calculationBasis?: number;
    type: 'earning' | 'deduction';
    group: 'Rescisórias' | 'Férias' | '13º Salário' | 'FGTS' | 'Multas' | 'Outros';
}

export interface CalculationResult {
    items: CalculationResultItem[];
    totalEarnings: number;
    totalDeductions: number;
    netTotal: number;
    projectedEndDate: string;
    noticeDays: number;
}
