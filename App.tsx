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
import { UserProfile, CompanyProfile } from './types';

// Mock initial state for a new user
const INITIAL_PROFILE: UserProfile = {
  name: 'Alexandre Paiva',
  firmName: 'Paiva & Associados',
  email: 'apaivafer@gmail.com', // Updated according to requirements
  phone: '11999999999',
  plan: 'Trial',
  trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  subscriptionStatus: 'Active'
};

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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(INITIAL_COMPANY);

  // Extract username from email (part before @)
  const username = userProfile.email.split('@')[0];

  const handleUpdateFirmName = (newName: string) => {
    setUserProfile(prev => ({ ...prev, firmName: newName }));
    // Also update company name if it matches roughly or is empty
    setCompanyProfile(prev => ({ ...prev, name: newName }));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActivePage('dashboard'); // Reset page to default on logout
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
        return <LeadsList />;
      case 'profile':
        return <ProfileSettings profile={userProfile} onUpdate={setUserProfile} />;
      case 'company':
        return <CompanySettings company={companyProfile} onUpdate={setCompanyProfile} />;
      case 'banner':
        return <BannerCreator initialCompanyName={companyProfile.name} />;
      case 'interactive-card':
        return <InteractiveCard />;
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
    >
      {renderContent()}
    </Layout>
  );
}