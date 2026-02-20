import React, { useState } from 'react';
import { UserProfile, CompanyProfile } from '../types';
import { User, CreditCard, Save, CheckCircle, AlertTriangle, Calendar, UserCircle, Crown, ShieldCheck, Star, Building2 } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { CompanySettings } from './CompanySettings';

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
  company: CompanyProfile;
  onUpdateCompany: (company: CompanyProfile) => void;
}

export const ProfileSettings = ({ profile, onUpdate, company, onUpdateCompany }: ProfileSettingsProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'plan'>('profile');
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const daysRemaining = Math.ceil(
    (new Date(profile.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Header Card (Consistent with ShareWidget) */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
                <UserCircle size={32} />
            </div>
            <div>
                <h2 className="text-3xl font-bold">Minha Conta</h2>
                <p className="text-indigo-100 mt-1">Gerencie suas informações pessoais, configurações da calculadora e detalhes da assinatura.</p>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-700 mt-2 overflow-x-auto">
        <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 font-medium text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap
                ${activeTab === 'profile' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}
        >
            <User size={18} /> Dados Pessoais
        </button>
        <button 
            onClick={() => setActiveTab('company')}
            className={`pb-4 px-2 font-medium text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap
                ${activeTab === 'company' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}
        >
            <Building2 size={18} /> Empresa
        </button>
        <button 
            onClick={() => setActiveTab('plan')}
            className={`pb-4 px-2 font-medium text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap
                ${activeTab === 'plan' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}
        >
            <Crown size={18} /> Assinatura & Plano
        </button>
      </div>

      {/* TAB: PROFILE FORM */}
      {activeTab === 'profile' && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 w-full">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Seu Nome</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
              >
                {isSaved ? <CheckCircle size={18} /> : <Save size={18} />}
                {isSaved ? 'Salvo com Sucesso!' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: COMPANY SETTINGS */}
      {activeTab === 'company' && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
            <CompanySettings company={company} onUpdate={onUpdateCompany} hideHeader={true} />
        </div>
      )}

      {/* TAB: PLAN INFO */}
      {activeTab === 'plan' && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
          <div className={`p-8 rounded-xl border shadow-sm relative overflow-hidden
             ${profile.plan === 'Trial' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'}
          `}>
             <div className="flex items-center gap-2 mb-6">
                <div className={`p-2 rounded-lg ${profile.plan === 'Trial' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {profile.plan === 'Trial' ? <CreditCard size={24} /> : <ShieldCheck size={24} />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    Detalhes da Assinatura
                </h3>
             </div>

             <div className="flex flex-col lg:flex-row gap-10">
                 {/* Status Column */}
                 <div className="flex-1 space-y-6">
                     <div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status Atual</span>
                        <div className="mt-2">
                            {profile.plan === 'Trial' ? (
                                <span className="px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-2 bg-orange-200 text-orange-800">
                                    <AlertTriangle size={14} /> Período de Teste
                                </span>
                            ) : (
                                <span className="px-4 py-2 rounded-full text-base font-bold inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                                    <Star size={16} className="fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" /> 
                                    Cortesia Ativa – Cliente Lex Online
                                </span>
                            )}
                        </div>
                     </div>

                     {profile.plan === 'Trial' && (
                         <div className="space-y-2">
                            <p className="text-slate-700 dark:text-slate-300 font-medium text-lg">
                                {daysRemaining} dias restantes
                            </p>
                             <p className="text-sm text-slate-600 dark:text-slate-400">
                                Seu teste gratuito expira em <strong>{formatDate(profile.trialEndsAt.split('T')[0])}</strong>.
                                Aproveite para testar todas as funcionalidades premium.
                             </p>
                         </div>
                     )}

                     {/* Custom logic for "Pro" users (Courtesy) */}
                     {profile.plan !== 'Trial' && (
                         <div className="space-y-3 bg-white dark:bg-slate-800 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Parabéns!</span> Sua assinatura é uma cortesia exclusiva da Lex Online e permanecerá ativa enquanto seu contrato com a Lex Online estiver vigente.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700">
                                <CheckCircle size={14} className="text-emerald-500" /> Acesso total a todas as ferramentas
                            </div>
                         </div>
                     )}
                 </div>

                 {/* Divider */}
                 <div className="hidden lg:block w-px bg-slate-200 dark:bg-slate-700/50"></div>

                 {/* Action Column */}
                 <div className="flex-1 flex flex-col justify-center space-y-4">
                     {profile.plan === 'Trial' ? (
                         <>
                            <div>
                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Valor do Plano</p>
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">R$ 99,90 <span className="text-sm font-normal text-slate-500">/mês</span></div>
                            </div>
                            <button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white py-3 rounded-xl font-bold transition-colors shadow-lg">
                                Assinar Agora
                            </button>
                            <p className="text-xs text-center text-slate-500">Cancele a qualquer momento.</p>
                         </>
                     ) : (
                         <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10 text-center">
                             <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Resumo da Fatura</p>
                             
                             <div className="space-y-3 mb-6">
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-slate-600 dark:text-slate-300">Plano Pro Mensal</span>
                                     <span className="font-medium text-slate-900 dark:text-white">R$ 99,90</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm">
                                     <span className="text-emerald-600 dark:text-emerald-400 font-medium">Desconto Cliente Lex</span>
                                     <span className="font-medium text-emerald-600 dark:text-emerald-400">- R$ 99,90</span>
                                 </div>
                                 <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                                 <div className="flex justify-between items-center">
                                     <span className="font-bold text-slate-800 dark:text-white">Total a Pagar</span>
                                     <span className="text-2xl font-black text-slate-900 dark:text-white">R$ 0,00</span>
                                 </div>
                             </div>

                             <button disabled className="w-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 py-2.5 rounded-lg font-bold text-sm cursor-default flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Assinatura Válida
                             </button>
                         </div>
                     )}
                 </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};