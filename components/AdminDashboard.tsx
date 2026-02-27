import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { Users, CreditCard, Award, Image, IdCard, ShieldAlert, CheckCircle, XCircle, Search, Power, MoreHorizontal, Calendar, ArrowRight, ChevronDown, Eye, Building2, TrendingUp, Mail, Phone, Globe, Lock, User, Filter, AlertTriangle, Clock, Plus, X } from 'lucide-react';
import { formatDate } from '../lib/utils';

import { adminApi } from '../services/api';

interface AdminDashboardProps {
    users: UserProfile[];
    onToggleUserStatus: (userId: string) => void;
    onUpdateUserPlan: (userId: string, newPlan: UserProfile['plan']) => void;
    onCreateUser: (data: { name: string; email: string; password?: string; phone?: string; firmName?: string }) => Promise<void>;
    onUpdateUser: (userId: string, data: any) => Promise<void>;
    onResendInvite: (userId: string) => Promise<void>;
    initialTab?: 'stats' | 'users';
}

const FILTER_OPTIONS = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: 'month', label: 'Este Mês' },
    { id: 'year', label: 'Este Ano' },
    { id: 'all', label: 'Todo Período' },
    { id: 'custom', label: 'Personalizado' },
];

export const AdminDashboard = ({ users, onToggleUserStatus, onUpdateUserPlan, onCreateUser, onUpdateUser, onResendInvite, initialTab = 'stats' }: AdminDashboardProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDateFilter, setSelectedDateFilter] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const startDateInputRef = useRef<HTMLInputElement>(null);

    // Create/Edit User Form State
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', firmName: '' });
    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState('');
    const [resendLoading, setResendLoading] = useState<string | null>(null);

    // Calculate dates based on filter
    const calculateDateRange = (filterId: string) => {
        const end = new Date();
        const start = new Date();

        switch (filterId) {
            case 'today':
                // start is today
                break;
            case '7d':
                start.setDate(end.getDate() - 6);
                break;
            case '30d':
                start.setDate(end.getDate() - 29);
                break;
            case 'month':
                start.setDate(1);
                break;
            case 'year':
                start.setMonth(0, 1);
                break;
            case 'all':
                return { start: '', end: '' }; // No range limit
            case 'custom':
                return null;
            default:
                return null;
        }
        return {
            start: start.toLocaleDateString('en-CA'),
            end: end.toLocaleDateString('en-CA')
        };
    };

    useEffect(() => {
        if (selectedDateFilter !== 'custom') {
            const range = calculateDateRange(selectedDateFilter);
            if (range) {
                setDateRange(range);
            }
        } else {
            if (startDateInputRef.current) startDateInputRef.current.focus();
        }
    }, [selectedDateFilter]);

    const handleManualDateChange = (field: 'start' | 'end', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
        setSelectedDateFilter('custom');
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.firmName.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateRange.start && dateRange.end) {
            const userDate = new Date(user.createdAt);
            // Adjust timezone offset for correct comparison
            userDate.setMinutes(userDate.getMinutes() + userDate.getTimezoneOffset());
            const start = new Date(dateRange.start);
            start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
            const end = new Date(dateRange.end);
            end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
            // End of day
            end.setHours(23, 59, 59, 999);

            matchesDate = userDate >= start && userDate <= end;
        }

        return matchesSearch && matchesDate;
    });

    // Stats Calculations based on FILTERED users
    const totalUsers = filteredUsers.length;
    const courtesyUsers = filteredUsers.filter(u => u.plan === 'Pro').length;
    const paidUsers = filteredUsers.filter(u => u.plan === 'Premium').length;
    const trialUsers = filteredUsers.filter(u => u.plan === 'Trial').length;

    // Usage Metrics based on FILTERED users
    const totalLeads = filteredUsers.reduce((acc, u) => acc + (u.stats?.leadsCount || 0), 0);
    const totalBanners = filteredUsers.reduce((acc, u) => acc + (u.stats?.bannersCount || 0), 0);
    const totalCards = filteredUsers.reduce((acc, u) => acc + (u.stats?.cardsCount || 0), 0);

    const handleCreateUser = async () => {
        if (!createForm.name || !createForm.email) {
            setCreateError('Nome e email são obrigatórios');
            return;
        }
        setCreateLoading(true);
        setCreateError('');
        try {
            if (editingUserId) {
                await onUpdateUser(editingUserId, createForm);
            } else {
                await onCreateUser(createForm);
            }
            setCreateForm({ name: '', email: '', password: '', phone: '', firmName: '' });
            setShowCreateForm(false);
            setEditingUserId(null);
        } catch (err: any) {
            setCreateError(err.message || 'Erro ao processar solicitação');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleOpenCreateForm = () => {
        setCreateForm({ name: '', email: '', password: '', phone: '', firmName: '' });
        setEditingUserId(null);
        setCreateError('');
        setShowCreateForm(true);
    };

    const handleEditUser = (user: UserProfile) => {
        setCreateForm({
            name: user.name,
            email: user.email,
            password: '', // Password not editable here
            phone: user.phone || '',
            firmName: user.firmName || '',
        });
        setEditingUserId(user.id);
        setShowCreateForm(true);
    };

    const handleResendInvite = async (userId: string) => {
        setResendLoading(userId);
        try {
            await onResendInvite(userId);
        } finally {
            setResendLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header & Unified Filter Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-[#1A1D23] p-8 rounded-[32px] shadow-[0_2px_20px_rgba(0,0,0,0.02)] dark:shadow-none border border-slate-100 dark:border-white/5">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {initialTab === 'stats' ? <ShieldAlert className="text-indigo-600" size={28} /> : <Users className="text-indigo-600" size={28} />}
                        {initialTab === 'stats' ? 'Painel Administrativo' : 'Gerenciamento de Usuários'}
                    </h2>
                    <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                        {initialTab === 'stats' ? 'Métricas e estatísticas globais' : 'Lista de usuários e acessos'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                    {initialTab === 'users' && (
                        <>
                            {/* Create User Button */}
                            <button
                                onClick={handleOpenCreateForm}
                                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 h-[48px]"
                            >
                                <Plus size={18} /> Novo Usuário
                            </button>
                            {/* Search Input */}
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar nome, email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-2xl text-sm font-medium outline-none w-full sm:w-64 dark:text-white focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/20 transition-all h-[48px]"
                                />
                            </div>
                        </>
                    )}

                    {initialTab === 'stats' && (
                        <>
                            {/* Date Presets Dropdown */}
                            <div className="relative w-full sm:w-auto group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={16} className="text-slate-400" />
                                </div>
                                <select
                                    value={selectedDateFilter}
                                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                                    className="pl-10 pr-10 py-3 bg-slate-50 dark:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-2xl text-sm font-medium outline-none w-full sm:w-auto dark:text-white focus:ring-2 focus:ring-slate-200 dark:focus:ring-white/20 appearance-none cursor-pointer h-[48px] transition-all"
                                >
                                    {FILTER_OPTIONS.map((opt) => (
                                        <option key={opt.id} value={opt.id}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <ChevronDown size={16} className="text-slate-400" />
                                </div>
                            </div>

                            {/* Date Inputs */}
                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 p-1.5 rounded-2xl border border-transparent h-[48px] w-full sm:w-auto justify-center">
                                <div className="relative h-full">
                                    <input
                                        ref={startDateInputRef}
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => handleManualDateChange('start', e.target.value)}
                                        className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 border-none outline-none focus:ring-0 px-2 w-[130px] h-full rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors"
                                    />
                                </div>
                                <span className="text-slate-300"><ArrowRight size={16} /></span>
                                <div className="relative h-full">
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => handleManualDateChange('end', e.target.value)}
                                        className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 border-none outline-none focus:ring-0 px-2 w-[130px] h-full rounded-xl hover:bg-white dark:hover:bg-white/5 transition-colors"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Big Numbers Cards (Now Reactive to Filter) */}
            {initialTab === 'stats' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Users Card */}
                    <div className="bg-white dark:bg-[#1A1D23] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Usuários no Período</p>
                            <h3 className="text-4xl font-black text-slate-900 dark:text-white transition-all duration-300">{totalUsers}</h3>
                            <div className="flex gap-3 mt-4 text-xs font-bold">
                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                                    <Award size={12} /> {courtesyUsers} Cortesia
                                </span>
                                <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                                    <CreditCard size={12} /> {paidUsers} Pagos
                                </span>
                                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                                    <Clock size={12} /> {trialUsers} Trial
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Leads Collected */}
                    <div className="bg-white dark:bg-[#1A1D23] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users size={80} className="text-blue-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Contatos CRM</p>
                            <h3 className="text-4xl font-black text-blue-600 dark:text-blue-400 transition-all duration-300">{totalLeads}</h3>
                            <p className="text-xs text-slate-400 mt-2">No período filtrado</p>
                        </div>
                    </div>

                    {/* Banners Generated */}
                    <div className="bg-white dark:bg-[#1A1D23] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Image size={80} className="text-purple-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Banners Gerados</p>
                            <h3 className="text-4xl font-black text-purple-600 dark:text-purple-400 transition-all duration-300">{totalBanners}</h3>
                            <p className="text-xs text-slate-400 mt-2">No período filtrado</p>
                        </div>
                    </div>

                    {/* Cards Generated */}
                    <div className="bg-white dark:bg-[#1A1D23] p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <IdCard size={80} className="text-orange-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">Cartões Digitais</p>
                            <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400 transition-all duration-300">{totalCards}</h3>
                            <p className="text-xs text-slate-400 mt-2">No período filtrado</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table Section */}
            {initialTab === 'users' && (
                <div className="bg-white dark:bg-[#1A1D23] rounded-[32px] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
                    {/* Minimal Header for Table */}
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Lista de Usuários Filtrados ({filteredUsers.length})</h3>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Usuário / Escritório</th>
                                    <th className="px-6 py-4">Função</th>
                                    <th className="px-6 py-4">Início Cortesia</th>
                                    <th className="px-6 py-4">Início Pago</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} onClick={() => handleEditUser(user)} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                                <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">{user.firmName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${user.role === 'Owner'
                                                ? 'text-amber-700 bg-amber-50 dark:bg-amber-900/20'
                                                : 'text-slate-500 bg-slate-50 dark:bg-white/5'
                                                }`}>
                                                {user.role === 'Owner' ? <ShieldAlert size={12} /> : <User size={12} />}
                                                {user.role || 'User'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.courtesyStartDate ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">{formatDate(user.courtesyStartDate)}</span>
                                                    {user.plan === 'Pro' && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Plano Atual"></span>}
                                                </div>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.paidStartDate ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono text-xs">{formatDate(user.paidStartDate)}</span>
                                                    {user.plan === 'Premium' && <span className="w-2 h-2 rounded-full bg-indigo-500" title="Plano Atual"></span>}
                                                </div>
                                            ) : <span className="text-slate-300">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.subscriptionStatus === 'Active' ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                                    <CheckCircle size={12} /> Ativo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
                                                    <XCircle size={12} /> Inativo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleResendInvite(user.id)}
                                                    disabled={resendLoading === user.id}
                                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm disabled:opacity-50"
                                                    title="Reenviar Convite"
                                                >
                                                    <Mail size={16} className={resendLoading === user.id ? 'animate-pulse' : ''} />
                                                </button>

                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white transition-colors shadow-sm"
                                                    title="Visualizar Detalhes"
                                                >
                                                    <Eye size={16} />
                                                </button>

                                                <button
                                                    onClick={() => user.id && onToggleUserStatus(user.id)}
                                                    className={`p-2 rounded-lg transition-colors shadow-sm
                                            ${user.subscriptionStatus === 'Active'
                                                            ? 'bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-white/5 dark:border-white/10 dark:hover:bg-red-900/20'
                                                            : 'bg-green-600 text-white hover:bg-green-700 border border-green-600'
                                                        }`}
                                                    title={user.subscriptionStatus === 'Active' ? 'Inativar Usuário' : 'Reativar Usuário'}
                                                >
                                                    <Power size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                            Nenhum usuário encontrado no período selecionado.
                        </div>
                    )}
                </div>
            )}

            {/* USER DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedUser(null)}>
                    <div className="bg-white dark:bg-[#1A1D23] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col relative" onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=0f172a&color=fff&size=128`}
                                        alt={selectedUser.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1"><Mail size={12} /> {selectedUser.email}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${selectedUser.subscriptionStatus === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                            {selectedUser.subscriptionStatus === 'Active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500">
                                <ArrowRight size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 space-y-8">

                            {/* PLAN SELECTOR & STATUS */}
                            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                        <Award size={18} className="text-indigo-500" />
                                        Plano Atual
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Altere o plano de assinatura do usuário
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <select
                                            value={selectedUser.plan}
                                            onChange={(e) => selectedUser.id && onUpdateUserPlan(selectedUser.id, e.target.value as UserProfile['plan'])}
                                            className="appearance-none pl-4 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm min-w-[180px]"
                                        >
                                            <option value="Pro">Cortesia (Pro)</option>
                                            <option value="Trial">Trial (Limitado)</option>
                                            <option value="Premium">Pago (Premium)</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Specific Big Numbers */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-4">Performance do Usuário</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <Users className="text-blue-500" size={24} />
                                            <span className="text-xs font-bold text-blue-600 bg-white/50 px-2 py-1 rounded">CRM</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">{selectedUser.stats?.leadsCount || 0}</div>
                                    </div>
                                    <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <Image className="text-purple-500" size={24} />
                                            <span className="text-xs font-bold text-purple-600 bg-white/50 px-2 py-1 rounded">Banners</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">{selectedUser.stats?.bannersCount || 0}</div>
                                        {selectedUser.plan === 'Trial' && (selectedUser.stats?.bannersCount || 0) > 1 && (
                                            <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-bold">
                                                <AlertTriangle size={10} /> Acima do Limite (1)
                                            </p>
                                        )}
                                    </div>
                                    <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                        <div className="flex justify-between items-start mb-2">
                                            <IdCard className="text-orange-500" size={24} />
                                            <span className="text-xs font-bold text-orange-600 bg-white/50 px-2 py-1 rounded">Cartões</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">{selectedUser.stats?.cardsCount || 0}</div>
                                        {selectedUser.plan === 'Trial' && (selectedUser.stats?.cardsCount || 0) > 1 && (
                                            <p className="text-[10px] text-red-500 mt-2 flex items-center gap-1 font-bold">
                                                <AlertTriangle size={10} /> Acima do Limite (1)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* User Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                        <User size={16} /> Dados Pessoais
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Mail size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300">{selectedUser.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300">{selectedUser.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Calendar size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300">Cadastro em: {formatDate(selectedUser.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Lock size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300">ID: <span className="font-mono text-xs opacity-70">{selectedUser.id}</span></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Company Info (Simulated based on firmName since we don't store full company obj in user list usually, but here we can mock display) */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                                        <Building2 size={16} /> Dados do Escritório
                                    </h4>
                                    <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building2 size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300 font-bold">{selectedUser.firmName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Globe size={16} className="text-slate-400" />
                                            <span className="text-slate-700 dark:text-slate-300 italic opacity-70">Site não informado</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar inside Modal */}
                            <div className="bg-slate-100 dark:bg-black/30 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Gerenciamento:</span>
                                    <button
                                        onClick={() => selectedUser.id && onToggleUserStatus(selectedUser.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2
                                            ${selectedUser.subscriptionStatus === 'Active'
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                                                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                            }`}
                                    >
                                        <Power size={16} />
                                        {selectedUser.subscriptionStatus === 'Active' ? 'Inativar Usuário' : 'Reativar Usuário'}
                                    </button>
                                    <button
                                        onClick={() => handleResendInvite(selectedUser.id)}
                                        disabled={resendLoading === selectedUser.id}
                                        className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Mail size={16} />
                                        Reenviar Convite
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-end">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-xl font-bold transition-all shadow-lg"
                            >
                                Fechar e Voltar
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* CREATE USER MODAL */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCreateForm(false)}>
                    <div className="bg-white dark:bg-[#1A1D23] rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {editingUserId ? <User size={20} className="text-indigo-600" /> : <Plus size={20} className="text-indigo-600" />}
                                {editingUserId ? 'Editar Usuário' : 'Criar Novo Usuário'}
                            </h3>
                            <button onClick={() => { setShowCreateForm(false); setEditingUserId(null); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {createError && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle size={16} /> {createError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome *</label>
                                <input type="text" value={createForm.name} onChange={(e) => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Nome completo" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                <input type="email" value={createForm.email} onChange={(e) => setCreateForm(p => ({ ...p, email: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="email@exemplo.com" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                    <input type="text" value={createForm.phone} onChange={(e) => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="(11) 99999-9999" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Escritório</label>
                                    <input type="text" value={createForm.firmName} onChange={(e) => setCreateForm(p => ({ ...p, firmName: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Nome do escritório" />
                                </div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl text-xs text-blue-700 dark:text-blue-400">
                                O usuário será criado com plano <strong>Cortesia (Pro)</strong> e função <strong>User</strong>.
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end gap-3">
                            <button onClick={() => { setShowCreateForm(false); setEditingUserId(null); }} className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleCreateUser} disabled={createLoading}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center gap-2">
                                {createLoading ? 'Salvando...' : (editingUserId ? 'Salvar Alterações' : 'Criar Usuário')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};