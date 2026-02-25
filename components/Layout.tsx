import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Calculator, PieChart, User, Menu, X, LogOut, Share2, UserCircle, ChevronRight, ChevronLeft, Bell, AlertTriangle, CheckCircle, Building2, Image, IdCard, Settings, Clock, ShieldAlert, Lock } from 'lucide-react';
import { UserProfile, Lead } from '../types';
import { formatCurrency } from '../lib/utils';

export const Layout = ({ children, activePage, setActivePage, userProfile, onLogout, notifications = [], onOpenLead }: {
    children?: React.ReactNode,
    activePage: string,
    setActivePage: (p: string) => void,
    userProfile?: UserProfile,
    onLogout: () => void,
    notifications?: Lead[],
    onOpenLead?: (id: string) => void
}) => {
    const [isDark, setIsDark] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // User Menu State
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Notification State
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const notifRef = useRef<HTMLButtonElement>(null);
    const notifDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    // Handle click outside for User Menu & Notifications
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            // User Menu
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            // Notifications
            if (notifDropdownRef.current &&
                notifRef.current &&
                !notifDropdownRef.current.contains(event.target as Node) &&
                !notifRef.current.contains(event.target as Node)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update unread status when notifications list changes (new leads added)
    useEffect(() => {
        if (notifications.length > 0) {
            // Logic: If list grows, assume new lead arrived, set unread true
            // Ideally we would track "readIds", but for this scope, simple reset works
            setHasUnread(true);
        }
    }, [notifications.length]);

    const toggleNotifications = () => {
        const newState = !isNotifOpen;
        setIsNotifOpen(newState);
        if (newState) {
            setHasUnread(false); // Mark as read when opening
        }
    };

    const handleNotificationClick = (id: string) => {
        setIsNotifOpen(false);
        if (onOpenLead) onOpenLead(id);
    };

    // ── Access Control: filter menus based on role and plan ──
    const isTrial = userProfile?.plan === 'Trial';
    const isOwner = userProfile?.role === 'Owner';

    const allNavItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <PieChart size={20} />, trialAccess: false },
        { id: 'leads', label: 'CRM', icon: <User size={20} />, trialAccess: false },
        { id: 'calculator', label: 'Calculadora', icon: <Calculator size={20} />, trialAccess: false },
        { id: 'banner', label: 'Banner', icon: <Image size={20} />, trialAccess: true },
        { id: 'interactive-card', label: 'Cartão', icon: <IdCard size={20} />, trialAccess: true },
        { id: 'company', label: 'Empresa', icon: <Building2 size={20} />, trialAccess: false },
        { id: 'profile', label: 'Meu Perfil', icon: <UserCircle size={20} />, trialAccess: false },
    ];

    // Trial users only see trialAccess items; others see all
    const navItems = isTrial
        ? allNavItems.filter(item => item.trialAccess)
        : allNavItems;

    // Add Admin item only if user is Owner
    if (isOwner) {
        navItems.push({ id: 'admin', label: 'Administrador', icon: <ShieldAlert size={20} />, trialAccess: false });
    }

    const handleNavClick = (id: string) => {
        setActivePage(id);
        setIsMobileMenuOpen(false);
    };

    const handleLogoutClick = () => {
        const confirm = window.confirm("Deseja realmente sair do sistema?");
        if (confirm) {
            setIsUserMenuOpen(false);
            setIsMobileMenuOpen(false);
            onLogout();
        }
    };

    const activePageLabel = navItems.find(i => i.id === activePage)?.label || 'Dashboard';

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#0F1115] transition-colors duration-300 font-sans">

            {/* --- DESKTOP SIDEBAR --- */}
            <aside
                className={`hidden md:flex flex-col fixed inset-y-4 left-4 z-50 bg-white dark:bg-[#1A1D23] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 dark:border-white/5 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-[260px]'}`}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 z-50 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:text-slate-500 p-1.5 rounded-full shadow-md transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                {/* Logo Area */}
                <div className={`h-24 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'px-8'}`}>
                    <div className="flex items-center gap-3 cursor-pointer overflow-hidden whitespace-nowrap" onClick={() => setActivePage('dashboard')}>
                        <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl shadow-lg flex-shrink-0">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight block">
                                LexOnline
                            </span>
                            {userProfile?.firmName && (
                                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5 truncate max-w-[150px]">
                                    {userProfile.firmName}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 flex flex-col py-4 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
                    {navItems.map((item) => {
                        const isActive = activePage === item.id;
                        const isRestricted = userProfile?.plan === 'Trial' && (item.id === 'calculator' || item.id === 'leads');

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                title={isCollapsed ? item.label : ''}
                                className={`flex items-center w-full py-3.5 rounded-full text-sm font-medium transition-all duration-300 group relative
                    ${isCollapsed ? 'justify-center px-0' : 'px-5 justify-start'}
                    ${isActive
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                    ${isRestricted ? 'opacity-70' : ''}
                    `}
                            >
                                <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {item.icon}
                                </div>
                                <span className={`ml-3 whitespace-nowrap transition-all duration-300 flex items-center gap-2 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                                    {item.label}
                                    {isRestricted && <Lock size={14} className="text-slate-400" />}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </aside>

            {/* --- MOBILE HEADER --- */}
            <nav className="md:hidden fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2" onClick={() => setActivePage('dashboard')}>
                        <div className="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg">
                            <Calculator className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
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
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl animate-in slide-in-from-top-2 rounded-b-[32px]">
                        <div className="p-4 space-y-2">
                            {navItems.map((item) => {
                                const isRestricted = userProfile?.plan === 'Trial' && (item.id === 'calculator' || item.id === 'leads');
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavClick(item.id)}
                                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-base font-medium transition-all
                        ${activePage === item.id
                                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }
                        ${isRestricted ? 'opacity-70' : ''}
                    `}
                                    >
                                        {item.icon}
                                        {item.label}
                                        {isRestricted && <Lock size={14} className="ml-auto" />}
                                    </button>
                                );
                            })}
                            <div className="h-px bg-slate-200 dark:bg-slate-800 my-2 mx-4"></div>
                            <button onClick={handleLogoutClick} className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
                                <LogOut size={20} />
                                Sair
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <main className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-[112px]' : 'md:pl-[292px]'}`}>

                {/* --- DESKTOP HEADER --- */}
                <header className="hidden md:flex items-center justify-between px-8 py-6 sticky top-0 z-40 bg-[#F3F4F6]/90 dark:bg-[#0F1115]/90 backdrop-blur-sm">

                    {/* Left: Functionality Name */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            {activePageLabel}
                        </h1>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-4">

                        {/* PLAN STATUS BADGE */}
                        {userProfile && (
                            <button
                                onClick={() => setActivePage('profile')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm hover:shadow transition-all hover:scale-105 border
                            ${userProfile.plan === 'Pro'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800'
                                        : (userProfile.plan === 'Premium'
                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800'
                                            : 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800')
                                    }`}
                                title="Clique para gerenciar assinatura"
                            >
                                {userProfile.plan === 'Pro' ? <CheckCircle size={14} /> : (userProfile.plan === 'Premium' ? <ShieldAlert size={14} /> : <AlertTriangle size={14} />)}
                                Plano: {userProfile.plan === 'Pro' ? 'Cortesia' : userProfile.plan === 'Premium' ? 'Pago' : 'Trial'}
                            </button>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2.5 text-slate-500 hover:bg-white dark:hover:bg-white/10 dark:text-slate-400 rounded-full transition-all shadow-sm hover:shadow"
                            title={isDark ? "Modo Claro" : "Modo Escuro"}
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                ref={notifRef}
                                onClick={toggleNotifications}
                                className={`p-2.5 text-slate-500 hover:bg-white dark:hover:bg-white/10 dark:text-slate-400 rounded-full transition-all shadow-sm hover:shadow relative ${isNotifOpen ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white' : ''}`}
                                title="Alertas"
                            >
                                <Bell size={20} />
                                {hasUnread && notifications.length > 0 && (
                                    <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {isNotifOpen && (
                                <div
                                    ref={notifDropdownRef}
                                    className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1A1D23] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-white/5 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                                >
                                    <div className="px-5 py-4 border-b border-slate-50 dark:border-white/5 flex justify-between items-center">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Novos Contatos CRM</p>
                                        <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
                                    </div>

                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length > 0 ? (
                                            notifications.map((lead) => (
                                                <button
                                                    key={lead.id}
                                                    onClick={() => handleNotificationClick(lead.id)}
                                                    className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-50 dark:border-white/5 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lead.name}</span>
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{new Date(lead.createdAt).toLocaleDateString().slice(0, 5)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                                                        <span className="font-mono">{formatCurrency(lead.estimatedValue)}</span>
                                                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-600 dark:text-green-400">
                                                            <Clock size={10} /> Novo
                                                        </span>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center px-4">
                                                <div className="bg-slate-50 dark:bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                                    <Bell size={20} />
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Nenhum contato novo no momento.</p>
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <div className="p-2 border-t border-slate-50 dark:border-white/5">
                                            <button
                                                onClick={() => {
                                                    setActivePage('leads');
                                                    setIsNotifOpen(false);
                                                }}
                                                className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 py-2"
                                            >
                                                Ir para o CRM
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Avatar Dropdown */}
                        <div className="relative ml-2" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="h-11 w-11 rounded-full bg-white dark:bg-white/10 border-2 border-white dark:border-white/10 overflow-hidden focus:outline-none transition-transform hover:scale-105 shadow-md"
                                title={userProfile?.name || 'Usuário'}
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.name || 'User')}&background=0f172a&color=fff&size=128`}
                                    alt={userProfile?.name}
                                    className="h-full w-full object-cover"
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-[#1A1D23] rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-white/5 py-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="px-5 py-4 border-b border-slate-50 dark:border-white/5">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{userProfile?.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{userProfile?.email}</p>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            onClick={() => {
                                                setActivePage('profile');
                                                setIsUserMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                                        >
                                            <UserCircle size={18} className="text-slate-400" /> Meu Perfil
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActivePage('company');
                                                setIsUserMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors"
                                        >
                                            <Settings size={18} className="text-slate-400" /> Empresa
                                        </button>
                                    </div>

                                    <div className="p-2 border-t border-slate-50 dark:border-white/5">
                                        <button
                                            onClick={handleLogoutClick}
                                            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl flex items-center gap-3 transition-colors"
                                        >
                                            <LogOut size={18} /> Sair do Sistema
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </header>

                <div className="flex-1 px-4 sm:px-8 pb-8 pt-20 md:pt-0 max-w-[1600px] mx-auto w-full">
                    {children}
                </div>
            </main>

        </div>
    );
};