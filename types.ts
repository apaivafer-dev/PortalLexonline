
export enum TerminationType {
  SEM_JUSTA_CAUSA = 'Sem Justa Causa',
  PEDIDO_DEMISSAO = 'Pedido de Demissão',
  JUSTA_CAUSA = 'Justa Causa',
  CULPA_RECIPROCA = 'Culpa Recíproca',
  ACORDO_COMUM = 'Acordo Comum (Art. 484-A)'
}

export type NoticeType = 'Indenizado' | 'Trabalhado' | 'Dispensado/Não Cumprido';

export interface CalculatorInput {
  employeeName: string; // Optional for calculation, needed for PDF
  salary: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  terminationType: TerminationType;

  // Notice specific
  noticeType: NoticeType;
  noticeStartDate?: string; // YYYY-MM-DD (Only if Worked)
  noticeEndDate?: string;   // YYYY-MM-DD (Only if Worked)

  vacationOverdue: number; // Quantos períodos vencidos
  dependents: number;
  additionalHours: number; // Horas extras (valor monetário ou calc simples)
  additionalDanger: boolean; // Periculosidade 30%
  additionalNight: boolean; // Noturno
  fgtsBalance: number; // Saldo para fins de multa
  applyFine467: boolean;
  applyFine477: boolean;
}

export interface CalculationResultItem {
  description: string;
  reference: string; // e.g., "30 dias", "3/12 avos"
  value: number;
  calculationBasis?: number; // Base value used for calculation
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

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  type: 'active' | 'won' | 'lost';
  color?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  isSystem: boolean; // Se true, não pode ser excluído nem renomeado (ex: Calculadora)
  showValue: boolean; // Exibir campo valor nos cards
  showTotal: boolean; // Exibir totalizador na coluna
  stages: PipelineStage[];
  order: number;
  // Campos associados a este pipeline
  associatedFieldIds?: string[];
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  estimatedValue: number;
  notes?: string;
  // Novos campos para suporte a multiplos pipelines
  pipelineId: string;
  stageId: string;
  // Mantendo status legado opcional para compatibilidade durante migração se necessário
  status?: 'New' | 'Contacted' | 'Converted' | 'Lost';
  // Valores dos campos personalizados
  customValues?: Record<string, any>;
  // Etiquetas
  tags?: string[];
}

// --- NOVOS TIPOS CRM ---

export interface CRMTag {
  id: string;
  name: string;
  color: string;
  entityType: 'lead' | 'contact' | 'company';
}

export interface CRMPhone {
  number: string;
  type: 'Móvel' | 'Fixo' | 'Trabalho';
}

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  emails: string[]; // Lista de emails
  phones: CRMPhone[]; // Lista de telefones
  type: 'Lead' | 'Cliente';
  companyId?: string; // Relacionamento 1 empresa
  createdAt: string;
  // Valores dos campos personalizados
  customValues?: Record<string, any>;
  // Etiquetas
  tags?: string[];
}

export type CompanyType = 'Cliente' | 'Fornecedor' | 'Concorrente' | 'Parceiro';

export interface CRMCompany {
  id: string;
  name: string; // Razão Social
  tradeName: string; // Nome Fantasia
  emails: string[];
  phones: CRMPhone[];
  types: CompanyType[]; // Pode ter mais de um tipo
  contactIds: string[]; // Relacionamento N contatos
  createdAt: string;
  // Valores dos campos personalizados
  customValues?: Record<string, any>;
  // Etiquetas
  tags?: string[];
}

// --- CAMPOS PERSONALIZADOS ---

export type CustomFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'button' | 'file';

export interface CustomFieldOption {
  id: string;
  label: string;
  value: string;
  color?: string; // Para tags/labels coloridos
}

export interface CustomButtonConfig {
  icon?: string; // Nome do ícone Lucide
  color?: string; // Hex color
  label?: string; // Texto do botão
  urlTemplate?: string; // URL com variáveis ex: https://wa.me/{phone}?text={msg}
}

export interface CustomField {
  id: string;
  key: string; // Chave exclusiva para uso em variáveis (ex: contact.cpf)
  label: string; // Nome de exibição
  type: CustomFieldType;
  entityType: 'contact' | 'company' | 'lead'; // A qual entidade pertence
  group: string; // Agrupamento (ex: "Dados Gerais", "Financeiro", "Botões de Ação")
  required: boolean;
  placeholder?: string;
  defaultValue?: any;

  // Configurações específicas
  options?: CustomFieldOption[]; // Para select/multiselect
  buttonConfig?: CustomButtonConfig; // Para botões de ação
  multiple?: boolean;
  pipelineIds?: string[];
}

export interface UserStats {
  leadsCount: number;
  bannersCount: number;
  cardsCount: number;
}

export interface UserProfile {
  id?: string;
  name: string;
  firmName: string; // Displayed on Calculator Header
  email: string;
  phone: string;
  role: 'Owner' | 'User';
  slug: string;
  plan: 'Trial' | 'Pro' | 'Premium'; // Pro = Cortesia, Premium = Pago
  trialEndsAt: string; // ISO Date
  subscriptionStatus: 'Active' | 'Past_Due' | 'Canceled' | 'Disabled' | string;
  isAdmin?: boolean;
  stats?: UserStats;

  // New Date Fields for Admin Tracking
  createdAt: string; // Data de acesso ao sistema
  courtesyStartDate?: string; // Data que iniciou cortesia
  paidStartDate?: string; // Data que iniciou pagante
}


export interface LawyerProfile {
  name: string;
  oab: string;
  email: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  primaryColor: string;
}

export interface CompanyProfile {
  name: string;
  phone: string;
  email: string; // Optional general contact email
  website: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
  }
}