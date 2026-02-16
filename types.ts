
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

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  estimatedValue: number;
  status: 'New' | 'Contacted' | 'Converted' | 'Lost';
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
  plan: 'Trial' | 'Pro' | 'Premium'; // Pro = Cortesia, Premium = Pago
  trialEndsAt: string; // ISO Date
  subscriptionStatus: 'Active' | 'Past_Due' | 'Canceled' | 'Disabled';
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