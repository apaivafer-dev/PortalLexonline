import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CalculatorApp } from './components/Calculator';
import { Dashboard } from './components/Dashboard';
import { ProfileSettings } from './components/ProfileSettings';
import { LeadsList } from './components/LeadsList';
import { CompanySettings } from './components/CompanySettings';
import { BannerCreator } from './components/BannerCreator';
import { InteractiveCard } from './components/InteractiveCard';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { UserProfile, CompanyProfile, Lead } from './types';

// Mock initial state for a new user
const INITIAL_PROFILE: UserProfile = {
  id: 'user-1',
  name: 'Alexandre Paiva',
  firmName: 'Paiva & Associados',
  email: 'apaivafer@gmail.com', 
  phone: '11999999999',
  plan: 'Pro', // Cortesia
  trialEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), 
  subscriptionStatus: 'Active',
  isAdmin: true,
  stats: { leadsCount: 128, bannersCount: 12, cardsCount: 5 },
  createdAt: '2023-01-15',
  courtesyStartDate: '2023-01-15'
};

// Initial Mock Admin Data
const MOCK_ADMIN_USERS: UserProfile[] = [
    INITIAL_PROFILE,
    { 
      id: 'user-2', name: 'João Advogado', firmName: 'JS Advocacia', email: 'joao@adv.com', phone: '11988887777', 
      plan: 'Pro', trialEndsAt: new Date().toISOString(), subscriptionStatus: 'Active', isAdmin: false, 
      stats: { leadsCount: 45, bannersCount: 2, cardsCount: 1 },
      createdAt: '2023-11-20', courtesyStartDate: '2023-11-20'
    },
    { 
      id: 'user-3', name: 'Maria Silva', firmName: 'Silva Trabalhista', email: 'maria@lex.com', phone: '11977776666', 
      plan: 'Premium', trialEndsAt: new Date().toISOString(), subscriptionStatus: 'Active', isAdmin: false, 
      stats: { leadsCount: 310, bannersCount: 45, cardsCount: 10 },
      createdAt: '2023-05-10', courtesyStartDate: '2023-05-10', paidStartDate: '2023-08-01'
    },
    { 
      id: 'user-4', name: 'Roberto Justus', firmName: 'Justus Law', email: 'roberto@law.com', phone: '11955554444', 
      plan: 'Pro', trialEndsAt: new Date().toISOString(), subscriptionStatus: 'Disabled', isAdmin: false, 
      stats: { leadsCount: 12, bannersCount: 0, cardsCount: 0 },
      createdAt: '2024-01-05', courtesyStartDate: '2024-01-05'
    },
    { 
      id: 'user-5', name: 'Ana Pereira', firmName: 'Pereira Assoc.', email: 'ana@pereira.com', phone: '21999998888', 
      plan: 'Pro', trialEndsAt: new Date().toISOString(), subscriptionStatus: 'Active', isAdmin: false, 
      stats: { leadsCount: 89, bannersCount: 8, cardsCount: 3 },
      createdAt: '2024-02-15', courtesyStartDate: '2024-02-15'
    },
    { 
      id: 'user-6', name: 'Carlos Drumond', firmName: 'Drumond Legal', email: 'carlos@drumond.com', phone: '31999997777', 
      plan: 'Premium', trialEndsAt: new Date().toISOString(), subscriptionStatus: 'Active', isAdmin: false, 
      stats: { leadsCount: 542, bannersCount: 112, cardsCount: 20 },
      createdAt: '2023-03-22', courtesyStartDate: '2023-03-22', paidStartDate: '2024-01-10'
    },
];

const INITIAL_COMPANY: CompanyProfile = {
    name: 'Paiva & Associados Advocacia',
    phone: '(11) 99999-9999',
    email: 'apaivafer@gmail.com',
    website: 'https://app.lexonline.com.br',
    address: {
        cep: '01310-100',
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Conj 101',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP'
    }
};

// Initial Mock Data Moved to App level for sharing
const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', createdAt: '2023-10-25', estimatedValue: 12500, status: 'New' },
  { id: '2', name: 'Maria Souza', email: 'maria@email.com', phone: '11988888888', createdAt: '2023-10-24', estimatedValue: 8400, status: 'Contacted' },
  { id: '3', name: 'Pedro Santos', email: 'pedro@email.com', phone: '11977777777', createdAt: '2023-10-23', estimatedValue: 25000, status: 'Converted' },
  { id: '4', name: 'Ana Lima', email: 'ana@email.com', phone: '11966666666', createdAt: '2023-10-22', estimatedValue: 5600, status: 'Lost' },
  { id: '5', name: 'Carlos Pereira', email: 'carlos@email.com', phone: '11955555555', createdAt: '2023-10-21', estimatedValue: 45000, status: 'New' },
  { id: '6', name: 'Fernanda Costa', email: 'fer@email.com', phone: '11944444444', createdAt: '2023-10-20', estimatedValue: 18200, status: 'New' },
  { id: '7', name: 'Roberto Alves', email: 'beto@email.com', phone: '11933333333', createdAt: '2023-10-19', estimatedValue: 32100, status: 'Contacted' },
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);
  
  // Shared Leads State
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [targetLeadId, setTargetLeadId] = useState<string | null>(null);
  
  // Admin State
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>(MOCK_ADMIN_USERS);

  // Filter only 'New' leads for notifications
  const newLeads = leads.filter(l => l.status === 'New');

  // Extract username from email (part before @)
  const username = userProfile.email.split('@')[0];

  const handleUpdateFirmName = (newName: string) => {
    setUserProfile(prev => ({ ...prev, firmName: newName }));
    setCompanyProfile(prev => ({ ...prev, name: newName }));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('dashboard');
  };

  const handleOpenLeadFromNotification = (leadId: string) => {
      setTargetLeadId(leadId);
      setActivePage('leads');
  };

  const handleToggleUserStatus = (userId: string) => {
      setAdminUsers(prev => prev.map(u => {
          if (u.id === userId) {
              const newStatus = u.subscriptionStatus === 'Active' ? 'Disabled' : 'Active';
              // If it's the current user logged in, update their profile state too to reflect visually
              if (u.id === userProfile.id) {
                  setUserProfile(curr => ({ ...curr, subscriptionStatus: newStatus }));
              }
              return { ...u, subscriptionStatus: newStatus };
          }
          return u;
      }));
  };

  const handleUpdateUserPlan = (userId: string, newPlan: UserProfile['plan']) => {
      setAdminUsers(prev => prev.map(u => {
          if (u.id === userId) {
              // Update logged in user state if it matches to reflect changes immediately
              if (u.id === userProfile.id) {
                  setUserProfile(curr => ({ ...curr, plan: newPlan }));
              }
              return { ...u, plan: newPlan };
          }
          return u;
      }));
  };

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
                onUpdateLeads={setLeads} 
                initialOpenLeadId={targetLeadId}
                onClearTarget={() => setTargetLeadId(null)}
            />
        );
      case 'profile':
        return <ProfileSettings profile={userProfile} onUpdate={setUserProfile} />;
      case 'company':
        return <CompanySettings company={companyProfile} onUpdate={setCompanyProfile} />;
      case 'banner':
        return <BannerCreator initialCompanyName={companyProfile.name} userProfile={userProfile} />;
      case 'interactive-card':
        return <InteractiveCard userProfile={userProfile} />;
      case 'admin':
        return <AdminDashboard users={adminUsers} onToggleUserStatus={handleToggleUserStatus} onUpdateUserPlan={handleUpdateUserPlan} />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

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