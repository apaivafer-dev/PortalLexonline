import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Calculator, PieChart, User, Menu, X, LogOut, Share2, UserCircle, ChevronRight, ChevronLeft, Bell, AlertTriangle, CheckCircle, Building2, Image, IdCard, Settings } from 'lucide-react';
import { UserProfile } from '../types';

export const Layout = ({ children, activePage, setActivePage, userProfile }: { 
    children?: React.ReactNode, 
    activePage: string, 
    setActivePage: (p: string) => void,
    userProfile?: UserProfile // Added prop
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // User Menu State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Handle click outside for User Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <PieChart size={20} /> },
    { id: 'calculator', label: 'Calculadora', icon: <Calculator size={20} /> },
    { id: 'leads', label: 'Leads', icon: <User size={20} /> },
    { id: 'banner', label: 'Criador de Banner', icon: <Image size={20} /> },
    { id: 'interactive-card', label: 'Cartão Interativo', icon: <IdCard size={20} /> },
    { id: 'company', label: 'Empresa', icon: <Building2 size={20} /> },
    { id: 'profile', label: 'Meu Perfil', icon: <UserCircle size={20} /> },
  ];

  const handleNavClick = (id: string) => {
    setActivePage(id);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
      // Mock logout logic
      const confirm = window.confirm("Deseja realmente sair do sistema?");
      if(confirm) {
          alert("Sessão encerrada.");
          setIsUserMenuOpen(false);
          // In a real app, this would clear tokens and redirect to login
      }
  };

  const activePageLabel = navItems.find(i => i.id === activePage)?.label || 'Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        className={`hidden md:flex flex-col fixed inset-y-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        {/* Toggle Button - Centered relative to h-20 (80px) header -> top-10 roughly */}
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-1 rounded-full shadow-md hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Logo Area - Increased to h-20 to match Header */}
        <div className={`h-20 flex items-center border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="flex items-center gap-2 cursor-pointer overflow-hidden whitespace-nowrap" onClick={() => setActivePage('dashboard')}>
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Calculator className="text-white h-5 w-5" />
            </div>
            <span className={`font-bold text-lg text-slate-800 dark:text-white tracking-tight transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
              LexOnline
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${isCollapsed ? 'justify-center px-0' : 'px-4 justify-between'}
                ${activePage === item.id 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              <div className={`flex items-center gap-3 ${isCollapsed ? '' : ''}`}>
                <div className="flex-shrink-0">{item.icon}</div>
                <span className={`whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                    {item.label}
                </span>
              </div>
              {!isCollapsed && activePage === item.id && <ChevronRight size={16} className="text-indigo-500" />}
            </button>
          ))}
        </div>
        
        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <span className={`text-xs text-slate-400 dark:text-slate-600 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                Portal LexOnline v2.0
            </span>
        </div>
      </aside>

      {/* --- MOBILE HEADER --- */}
      <nav className="md:hidden fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={() => setActivePage('dashboard')}>
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Calculator className="text-white h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white">
                LexOnline
              </span>
            </div>

            <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                  >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                  </button>
                  <button 
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
                  </button>
            </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-2">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium
                     ${activePage === item.id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                 <LogOut size={20} />
                 Sair
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <main className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        
        {/* --- DESKTOP HEADER --- */}
        <header className="hidden md:flex items-center justify-between px-8 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
            
            {/* Left: Functionality Name */}
            <div>
                 <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    {activePageLabel}
                 </h1>
            </div>

            {/* Right: Actions (Subscription Status, Theme, Bell, User Avatar) */}
            <div className="flex items-center gap-3">
                
                {/* Subscription Status Badge */}
                {userProfile && (
                    <div className="hidden lg:flex items-center gap-3 mr-4 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                         <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${userProfile.plan === 'Trial' 
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' 
                                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                             {userProfile.plan === 'Trial' ? <AlertTriangle size={12} /> : <CheckCircle size={12} />}
                             {userProfile.plan === 'Trial' ? 'Período de Teste' : 'Plano Pro'}
                         </div>
                         <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                             {userProfile.plan === 'Trial' ? 'Vence em' : 'Renova em'} <span className="text-slate-700 dark:text-slate-200 font-semibold">{new Date(userProfile.trialEndsAt).toLocaleDateString('pt-BR')}</span>
                         </span>
                    </div>
                )}
                
                {/* Theme Toggle */}
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={isDark ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button 
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                    title="Alertas"
                >
                    <Bell size={20} />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                </button>
                
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* User Avatar Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="h-10 w-10 rounded-full bg-indigo-100 border-2 border-white dark:border-slate-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-transform hover:scale-105 shadow-sm"
                        title={userProfile?.name || 'Usuário'}
                    >
                         <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=6366f1&color=fff&size=128`} 
                            alt={userProfile?.name}
                            className="h-full w-full object-cover"
                         />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{userProfile?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userProfile?.email}</p>
                            </div>
                            
                            <div className="py-1">
                                <button
                                    onClick={() => {
                                        setActivePage('profile');
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                >
                                    <UserCircle size={16} className="text-indigo-500" /> Meu Perfil
                                </button>
                                <button
                                    onClick={() => {
                                        setActivePage('company');
                                        setIsUserMenuOpen(false);
                                    }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                >
                                    <Settings size={16} className="text-indigo-500" /> Configurações
                                </button>
                            </div>

                            <div className="py-1 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={16} /> Sair do Sistema
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </header>

        <div className="flex-1 p-4 sm:p-8 pt-20 md:pt-8 max-w-7xl mx-auto w-full">
            {children}
        </div>
      </main>
      
    </div>
  );
};