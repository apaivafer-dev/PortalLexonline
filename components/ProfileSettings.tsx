import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, CreditCard, Save, CheckCircle, AlertTriangle, Calendar, UserCircle, Crown } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export const ProfileSettings = ({ profile, onUpdate }: ProfileSettingsProps) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'plan'>('profile');
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

      {/* TAB: PLAN INFO */}
      {activeTab === 'plan' && (
        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 w-full">
          <div className={`p-8 rounded-xl border shadow-sm relative overflow-hidden
             ${profile.plan === 'Trial' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' : 'bg-green-50 border-green-200'}
          `}>
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <CreditCard className="text-slate-600 dark:text-slate-400" />
                Detalhes da Assinatura
             </h3>

             <div className="flex flex-col md:flex-row gap-8">
                 {/* Status Column */}
                 <div className="flex-1 space-y-6">
                     <div>
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status Atual</span>
                        <div className="mt-2">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold inline-flex items-center gap-2
                                ${profile.plan === 'Trial' ? 'bg-orange-200 text-orange-800' : 'bg-green-200 text-green-800'}
                            `}>
                                {profile.plan === 'Trial' ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                                {profile.plan === 'Trial' ? 'Período de Teste' : 'Assinatura Pro'}
                            </span>
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

                     {profile.plan === 'Pro' && (
                         <div className="space-y-2">
                            <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                                <Calendar size={18} className="text-indigo-500" />
                                Renovação em 25/11/2023
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Seu plano está ativo e você tem acesso ilimitado a todas as ferramentas.
                            </p>
                         </div>
                     )}
                 </div>

                 {/* Divider */}
                 <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700/50"></div>

                 {/* Action Column */}
                 <div className="flex-1 flex flex-col justify-center space-y-4">
                     {profile.plan === 'Trial' ? (
                         <>
                            <div>
                                <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide">Valor da Assinatura</p>
                                <div className="text-3xl font-bold text-slate-800 dark:text-white">R$ 29,90 <span className="text-sm font-normal text-slate-500">/mês</span></div>
                            </div>
                            <button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white py-3 rounded-xl font-bold transition-colors shadow-lg">
                                Assinar Agora
                            </button>
                            <p className="text-xs text-center text-slate-500">Cancele a qualquer momento.</p>
                         </>
                     ) : (
                         <>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                                Alterar Cartão de Crédito
                            </button>
                            <button className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 py-2.5 rounded-lg font-medium transition-colors">
                                Ver Histórico de Faturas
                            </button>
                         </>
                     )}
                 </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};