import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { CalculatorApp } from './components/Calculator';
import { PublicCalculatorApp } from './components/PublicCalculatorApp';
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';
import { LeadsList } from './components/LeadsList';
import { CompanySettings } from './components/CompanySettings';
import { BannerCreator } from './components/BannerCreator';
import { InteractiveCard } from './components/InteractiveCard';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { EmailConfirmationPage } from './components/EmailConfirmationPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfile, CompanyProfile, Lead, Pipeline } from './types';
import { authApi, leadsApi, pipelinesApi, usersApi, adminApi } from './services/api';

// ─── Map backend row → frontend UserProfile ──────────────────────────────
function mapUser(u: any): UserProfile {
  return {
    id: u.id,
    name: u.name,
    firmName: u.firm_name || u.firmName || '',
    email: u.email,
    phone: u.phone || '',
    role: u.role || 'User',
    slug: u.slug || u.email?.split('@')[0] || '',
    plan: u.plan || 'Trial',
    trialEndsAt: u.trial_ends_at || u.trialEndsAt || new Date().toISOString(),
    subscriptionStatus: u.subscription_status || u.subscriptionStatus || 'Active',
    isAdmin: Boolean(u.is_admin ?? u.isAdmin),
    stats: {
      leadsCount: u.leads_count ?? u.stats?.leadsCount ?? 0,
      bannersCount: u.banners_count ?? u.stats?.bannersCount ?? 0,
      cardsCount: u.cards_count ?? u.stats?.cardsCount ?? 0,
    },
    createdAt: u.created_at || u.createdAt || '',
    courtesyStartDate: u.courtesy_start_date || u.courtesyStartDate || '',
    paidStartDate: u.paid_start_date || u.paidStartDate,
  };
}

// ─── Map backend row → frontend Lead ────────────────────────────────────
function mapLead(l: any): Lead {
  return {
    id: l.id,
    name: l.name,
    email: l.email || '',
    phone: l.phone || '',
    createdAt: l.created_at || l.createdAt || '',
    estimatedValue: l.estimated_value ?? l.estimatedValue ?? 0,
    pipelineId: l.pipeline_id || l.pipelineId || '',
    stageId: l.stage_id || l.stageId || '',
    notes: l.notes || '',
  };
}

// ─── Map backend row → frontend Pipeline ────────────────────────────────
function mapPipeline(p: any): Pipeline {
  return {
    id: p.id,
    name: p.name,
    isSystem: Boolean(p.is_system ?? p.isSystem),
    showValue: Boolean(p.show_value ?? p.showValue ?? true),
    showTotal: Boolean(p.show_total ?? p.showTotal ?? true),
    order: p.sort_order ?? p.order ?? 0,
    stages: (p.stages || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      order: s.stage_order ?? s.order ?? 0,
      type: s.type || 'active',
      color: s.color || 'blue',
    })),
  };
}

// ─── Map frontend CompanyProfile → backend payload ──────────────────────
function mapCompany(c: any): CompanyProfile {
  return {
    name: c.name || '',
    phone: c.phone || '',
    email: c.email || '',
    website: c.website || '',
    address: {
      cep: c.cep || '',
      street: c.street || '',
      number: c.number || '',
      complement: c.complement || '',
      neighborhood: c.neighborhood || '',
      city: c.city || '',
      state: c.state || '',
    },
  };
}

// ─── Blank fallbacks ─────────────────────────────────────────────────────
const BLANK_PROFILE: UserProfile = {
  id: '', name: '', firmName: '', email: '', phone: '', role: 'User', slug: '', plan: 'Trial',
  trialEndsAt: '', subscriptionStatus: 'Active', isAdmin: false,
  stats: { leadsCount: 0, bannersCount: 0, cardsCount: 0 },
  createdAt: '', courtesyStartDate: '',
};

const BLANK_COMPANY: CompanyProfile = {
  name: '', phone: '', email: '', website: '',
  address: { cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authApi.isAuthenticated());
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password' | 'confirm-email' | 'setup-password'>('login');
  const [token, setToken] = useState<string>('');
  const [activePage, setActivePage] = useState('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<'stats' | 'users'>('stats');
  const [userProfile, setUserProfile] = useState<UserProfile>(BLANK_PROFILE);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(BLANK_COMPANY);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [targetLeadId, setTargetLeadId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  // ── Load data once authenticated ──────────────────────────────────────
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const [me, company, rawLeads, rawPipelines] = await Promise.all([
        authApi.getMe(),
        usersApi.getCompany(),
        leadsApi.getAll(),
        pipelinesApi.getAll(),
      ]);

      setUserProfile(mapUser(me));
      if (company) setCompanyProfile(mapCompany(company));
      setLeads(rawLeads.map(mapLead));
      setPipelines(rawPipelines.map(mapPipeline));

      if (me.is_admin) {
        const users = await adminApi.getUsers();
        setAdminUsers(users.map(mapUser));
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData();
    } else {
      // Check for tokens in URL
      const params = new URLSearchParams(window.location.search);
      const qToken = params.get('token');
      const path = window.location.pathname;

      if (qToken) {
        setToken(qToken);
        if (path.includes('confirm-email')) setAuthView('confirm-email');
        else if (path.includes('reset-password')) setAuthView('reset-password');
        else if (path.includes('setup-password')) setAuthView('setup-password');
      }
    }
  }, [isAuthenticated, loadUserData]);

  const username = userProfile.email.split('@')[0];
  const newLeads = leads.filter(l => {
    const pipeline = pipelines.find(p => p.id === l.pipelineId);
    const stage = pipeline?.stages.find(s => s.id === l.stageId);
    return stage?.type === 'active' && stage?.order === 0;
  });

  // ── Auth handlers ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUserProfile(BLANK_PROFILE);
    setCompanyProfile(BLANK_COMPANY);
    setLeads([]);
    setPipelines([]);
    setAdminUsers([]);
    setActivePage('dashboard');
  };

  // ── Profile handlers ──────────────────────────────────────────────────
  const handleUpdateProfile = async (updated: UserProfile) => {
    try {
      const result = await usersApi.updateProfile({
        name: updated.name,
        phone: updated.phone,
        firmName: updated.firmName,
      });
      setUserProfile(mapUser(result));
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleUpdateCompany = async (updated: CompanyProfile) => {
    try {
      const payload = {
        name: updated.name,
        phone: updated.phone,
        email: updated.email,
        website: updated.website,
        ...updated.address,
      };
      const result = await usersApi.updateCompany(payload);
      setCompanyProfile(mapCompany(result));
    } catch (err) {
      console.error('Failed to update company:', err);
    }
  };

  const handleUpdateFirmName = async (newName: string) => {
    setUserProfile(prev => ({ ...prev, firmName: newName }));
    setCompanyProfile(prev => ({ ...prev, name: newName }));
    await usersApi.updateProfile({ firmName: newName }).catch(console.error);
  };

  // ── Leads handlers ────────────────────────────────────────────────────
  const handleUpdateLeads = async (updatedLeads: Lead[]) => {
    setLeads(updatedLeads);
    // Sync changes: find added/updated leads and persist them
    for (const lead of updatedLeads) {
      const existing = leads.find(l => l.id === lead.id);
      if (!existing) {
        // new lead
        try {
          const created = await leadsApi.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            pipelineId: lead.pipelineId,
            stageId: lead.stageId,
            estimatedValue: lead.estimatedValue,
            notes: lead.notes,
          });
          setLeads(prev => prev.map(l => l.id === lead.id ? mapLead(created) : l));
        } catch (err) {
          console.error('Failed to create lead:', err);
        }
      } else if (JSON.stringify(existing) !== JSON.stringify(lead)) {
        // updated lead
        try {
          await leadsApi.update(lead.id, {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            pipelineId: lead.pipelineId,
            stageId: lead.stageId,
            estimatedValue: lead.estimatedValue,
            notes: lead.notes,
          });
        } catch (err) {
          console.error('Failed to update lead:', err);
        }
      }
    }
    // find deleted leads
    const deletedLeads = leads.filter(l => !updatedLeads.find(ul => ul.id === l.id));
    for (const lead of deletedLeads) {
      leadsApi.delete(lead.id).catch(err => console.error('Failed to delete lead:', err));
    }
  };

  // ── Admin handlers ────────────────────────────────────────────────────
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const result = await adminApi.toggleUserStatus(userId);
      setAdminUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, subscriptionStatus: result.subscription_status } : u
      ));
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      const result = await adminApi.updateUser(userId, data);
      setAdminUsers(prev => prev.map(u => u.id === userId ? mapUser(result) : u));
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      await adminApi.resendInvite(userId);
      alert('Convite reenviado com sucesso!');
    } catch (err: any) {
      alert('Erro ao reenviar convite: ' + err.message);
    }
  };

  const handleUpdateUserPlan = async (userId: string, newPlan: UserProfile['plan']) => {
    try {
      await adminApi.updateUserPlan(userId, newPlan);
      setAdminUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
    } catch (err) {
      console.error('Failed to update user plan:', err);
    }
  };

  const handleCreateUser = async (data: { name: string; email: string; password: string; phone?: string; firmName?: string }) => {
    const newUser = await adminApi.createUser(data);
    setAdminUsers(prev => [mapUser(newUser), ...prev]);
  };

  const handleOpenLeadFromNotification = (leadId: string) => {
    setTargetLeadId(leadId);
    setActivePage('leads');
  };

  // ── Render ─────────────────────────────────────────────────────────────

  // Public Calculator Route interception (bypassing auth)
  const pathParts = window.location.pathname.split('/');
  if (pathParts[1] === 'c' && pathParts[2]) {
    return <PublicCalculatorApp slug={pathParts[2]} />;
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onRegister={() => setAuthView('login')} onBackToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot-password') {
      return <ForgotPasswordPage onBackToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'reset-password' || authView === 'setup-password') {
      return <ResetPasswordPage token={token} onResetSuccess={() => setAuthView('login')} />;
    }
    if (authView === 'confirm-email') {
      return <EmailConfirmationPage token={token} onContinue={() => setAuthView('login')} />;
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToRegister={() => setAuthView('register')}
        setAuthView={setAuthView}
      />
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', color: 'white', flexDirection: 'column', gap: 16
      }}>
        <div style={{ width: 48, height: 48, border: '4px solid #334155', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 18, color: '#94a3b8' }}>Carregando LexOnline...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'calculator':
        return (
          <CalculatorApp
            companyProfile={companyProfile}
            onUpdateFirmName={handleUpdateFirmName}
            username={username}
          />
        );
      case 'leads':
        return (
          <LeadsList
            leads={leads}
            pipelines={pipelines}
            onUpdateLeads={handleUpdateLeads}
            onUpdatePipelines={setPipelines}
            initialOpenLeadId={targetLeadId}
            onClearTarget={() => setTargetLeadId(null)}
          />
        );
      case 'profile':
        return <ProfileSettings profile={userProfile} onUpdate={handleUpdateProfile} />;
      case 'company':
        return <CompanySettings company={companyProfile} onUpdate={handleUpdateCompany} />;
      case 'banner':
        return <BannerCreator initialCompanyName={companyProfile.name} userProfile={userProfile} />;
      case 'interactive-card':
        return <InteractiveCard userProfile={userProfile} />;
      case 'admin':
      case 'users-admin':
        return (
          <AdminDashboard
            users={adminUsers}
            onToggleUserStatus={handleToggleUserStatus}
            onUpdateUserPlan={handleUpdateUserPlan}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onResendInvite={handleResendInvite}
            initialTab={activePage === 'admin' ? 'stats' : 'users'}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      userProfile={userProfile}
      onLogout={handleLogout}
      notifications={newLeads}
      onOpenLead={handleOpenLeadFromNotification}
    >
      {renderContent()}
    </Layout>
  );
}