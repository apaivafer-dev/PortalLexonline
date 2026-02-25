import { CalculatorInput, CalculationResult } from '../types';

// Central API service - all backend communication goes through here
// OWASP: credentials: 'include' ensures HttpOnly cookies are sent
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken(): string | null {
    return null; // Cookies are handled by the browser
}

function setToken(token: string): void {
    // No longer storing in localStorage
}

function removeToken(): void {
    // Session is cleared by the server (or just expires)
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
    }

    if (!data.success) {
        throw new Error(data.error || 'Unexpected error');
    }

    return data.data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
    async login(email: string, password: string) {
        const result = await request<{ user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        return result;
    },

    async register(data: { name: string; email: string; password: string; phone?: string; firmName?: string }) {
        const result = await request<void>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        return result;
    },

    async getMe() {
        return request<any>('/auth/me');
    },

    async confirmEmail(token: string) {
        return request<void>('/auth/confirm-email', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    },

    async forgotPassword(email: string) {
        return request<void>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    async resetPassword(token: string, password: string) {
        return request<void>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        });
    },

    logout() {
        removeToken();
    },

    isAuthenticated(): boolean {
        return !!getToken();
    },
};

// ─── Leads ─────────────────────────────────────────────────────────────────
export const leadsApi = {
    async getAll() {
        return request<any[]>('/leads');
    },

    async create(data: {
        name: string;
        email?: string;
        phone?: string;
        pipelineId: string;
        stageId: string;
        estimatedValue?: number;
        notes?: string;
    }) {
        return request<any>('/leads', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: Partial<{
        name: string;
        email: string;
        phone: string;
        pipelineId: string;
        stageId: string;
        estimatedValue: number;
        notes: string;
    }>) {
        return request<any>(`/leads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return request<void>(`/leads/${id}`, { method: 'DELETE' });
    },
};

// ─── Pipelines ─────────────────────────────────────────────────────────────
export const pipelinesApi = {
    async getAll() {
        return request<any[]>('/pipelines');
    },

    async create(data: { name: string; showValue?: boolean; showTotal?: boolean; stages: any[] }) {
        return request<any>('/pipelines', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update(id: string, data: { name?: string; showValue?: boolean; showTotal?: boolean }) {
        return request<any>(`/pipelines/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async delete(id: string) {
        return request<void>(`/pipelines/${id}`, { method: 'DELETE' });
    },
};

// ─── User Profile ───────────────────────────────────────────────────────────
export const usersApi = {
    async getProfile() {
        return request<any>('/users/profile');
    },

    async updateProfile(data: { name?: string; phone?: string; firmName?: string }) {
        return request<any>('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async getCompany() {
        return request<any>('/users/company');
    },

    async updateCompany(data: any) {
        return request<any>('/users/company', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ─── Admin ──────────────────────────────────────────────────────────────────
export const adminApi = {
    async getUsers() {
        return request<any[]>('/admin/users');
    },

    async createUser(data: { name: string; email: string; password: string; phone?: string; firmName?: string }) {
        return request<any>('/admin/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getStats() {
        return request<any>('/admin/stats');
    },

    async toggleUserStatus(userId: string) {
        return request<any>(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
    },

    async updateUserPlan(userId: string, plan: string) {
        return request<any>(`/admin/users/${userId}/plan`, {
            method: 'PATCH',
            body: JSON.stringify({ plan }),
        });
    },
};

// ─── Calculator ─────────────────────────────────────────────────────────────
export const calculatorApi = {
    async calculate(data: CalculatorInput) {
        return request<CalculationResult>('/calculator/calculate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
};

// ─── CRM ────────────────────────────────────────────────────────────────────
export const crmApi = {
    // Contacts
    async getContacts() {
        return request<any[]>('/crm/contacts');
    },
    async createContact(data: any) {
        return request<any>('/crm/contacts', { method: 'POST', body: JSON.stringify(data) });
    },
    async updateContact(id: string, data: any) {
        return request<any>(`/crm/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async deleteContact(id: string) {
        return request<void>(`/crm/contacts/${id}`, { method: 'DELETE' });
    },

    // Companies
    async getCompanies() {
        return request<any[]>('/crm/companies');
    },
    async createCompany(data: any) {
        return request<any>('/crm/companies', { method: 'POST', body: JSON.stringify(data) });
    },
    async updateCompany(id: string, data: any) {
        return request<any>(`/crm/companies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async deleteCompany(id: string) {
        return request<void>(`/crm/companies/${id}`, { method: 'DELETE' });
    },

    // Tags
    async getTags() {
        return request<any[]>('/crm/tags');
    },
    async createTag(data: { name: string; color: string; entityType: string }) {
        return request<any>('/crm/tags', { method: 'POST', body: JSON.stringify(data) });
    },
    async deleteTag(id: string) {
        return request<void>(`/crm/tags/${id}`, { method: 'DELETE' });
    },

    // Custom Fields
    async getCustomFields() {
        return request<any[]>('/crm/custom-fields');
    },
    async createCustomField(data: any) {
        return request<any>('/crm/custom-fields', { method: 'POST', body: JSON.stringify(data) });
    },
    async updateCustomField(id: string, data: any) {
        return request<any>(`/crm/custom-fields/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async deleteCustomField(id: string) {
        return request<void>(`/crm/custom-fields/${id}`, { method: 'DELETE' });
    },
};

// ─── Banners ────────────────────────────────────────────────────────────────
export const bannersApi = {
    async getAll() {
        return request<any[]>('/banners');
    },
    async create(data: any) {
        return request<any>('/banners', { method: 'POST', body: JSON.stringify(data) });
    },
    async update(id: string, data: any) {
        return request<any>(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async delete(id: string) {
        return request<void>(`/banners/${id}`, { method: 'DELETE' });
    },
};

// ─── Cards ──────────────────────────────────────────────────────────────────
export const cardsApi = {
    async getAll() {
        return request<any[]>('/cards');
    },
    async create(data: { cardName: string; config: any }) {
        return request<any>('/cards', { method: 'POST', body: JSON.stringify(data) });
    },
    async update(id: string, data: { cardName?: string; config: any }) {
        return request<any>(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async delete(id: string) {
        return request<void>(`/cards/${id}`, { method: 'DELETE' });
    },
};

// ─── Publish (Calculator) ───────────────────────────────────────────────────
export const publishApi = {
    async publishCalculator(data: {
        companyName?: string;
        primaryColor?: string;
        whatsappNumber?: string;
        whatsappMessage?: string;
        showLeadForm?: boolean;
        customCss?: string;
    }) {
        return request<any>('/publish/calculator', { method: 'POST', body: JSON.stringify(data) });
    },
    async getPublished() {
        return request<any>('/publish/calculator');
    },
    async unpublish() {
        return request<void>('/publish/calculator', { method: 'DELETE' });
    },
    async getPublicCalculator(slug: string) {
        return request<any>(`/publish/public/calculator/${slug}`);
    },
};

export const dashboardApi = {
    async getStats() {
        return request<any>('/admin/stats');
    },
};
