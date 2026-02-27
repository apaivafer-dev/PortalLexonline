import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, CreditCard, Save, CheckCircle, AlertTriangle, UserCircle, Crown, ShieldCheck, Star } from 'lucide-react';
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
    <div className="w-full space-y-8 animate-in fade-in duration-500 flex flex-col items-center">

      {/* --- TOP PILL NAVIGATION --- */}
      <div className="bg-white dark:bg-[#1A1D23] rounded-full p-1.5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-white/5 w-fit mx-auto flex-shrink-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-8 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap
                ${activeTab === 'profile'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
          >
            <User size={16} /> Dados Pessoais
          </button>
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-8 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap
                ${activeTab === 'plan'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
          >
            <Crown size={16} /> Assinatura & Plano
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[32px] p-8 text-white shadow-xl w-full max-w-5xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl">
            <UserCircle size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black">Minha Conta</h2>
            <p className="text-indigo-100 mt-1 font-medium">Gerencie suas informações pessoais, configurações da calculadora e detalhes da assinatura.</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="w-full max-w-5xl">
        {activeTab === 'profile' ? (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm space-y-8 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Seu Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white font-medium transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 px-1 italic">O email não pode ser alterado por questões de segurança.</p>
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center bg-slate-50 dark:bg-white/5 -mx-8 -mb-8 p-8 rounded-b-[32px] border-t border-slate-100 dark:border-white/5">
                <p className="text-sm text-slate-500 font-medium">Certifique-se de salvar suas alterações antes de sair.</p>
                <button
                  type="submit"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                  {isSaved ? 'Salvo!' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 w-full">
            <div className={`p-10 rounded-[32px] border shadow-sm relative overflow-hidden
               ${profile.plan === 'Trial' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'}
            `}>
              <div className="flex items-center gap-3 mb-10">
                <div className={`p-2.5 rounded-2xl ${profile.plan === 'Trial' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {profile.plan === 'Trial' ? <CreditCard size={28} /> : <ShieldCheck size={28} />}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                  Detalhes da Assinatura
                </h3>
              </div>

              <div className="flex flex-col lg:flex-row gap-12">
                {/* Status Column */}
                <div className="flex-1 space-y-8">
                  <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[2px]">Status Atual</span>
                    <div className="mt-4">
                      {profile.plan === 'Trial' ? (
                        <span className="px-5 py-2.5 rounded-2xl text-sm font-black inline-flex items-center gap-2 bg-orange-200 text-orange-850">
                          <AlertTriangle size={16} /> Período de Teste
                        </span>
                      ) : (
                        <span className="px-5 py-3 rounded-2xl text-base font-black inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                          <Star size={18} className="fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                          Cortesia Ativa – Cliente Lex Online
                        </span>
                      )}
                    </div>
                  </div>

                  {profile.plan === 'Trial' && (
                    <div className="space-y-3">
                      <p className="text-slate-700 dark:text-slate-300 font-black text-2xl">
                        {daysRemaining} dias restantes
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Seu teste gratuito expira em <strong className="text-slate-900 dark:text-white">{formatDate(profile.trialEndsAt.split('T')[0])}</strong>.
                        Aproveite para testar todas as funcionalidades premium da plataforma.
                      </p>
                    </div>
                  )}

                  {profile.plan !== 'Trial' && (
                    <div className="space-y-4 bg-white dark:bg-slate-900/50 p-6 rounded-[24px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">Parabéns!</span> Sua assinatura é uma cortesia exclusiva da Lex Online e permanecerá ativa enquanto seu contrato estiver vigente.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <CheckCircle size={14} className="text-emerald-500" /> Acesso ilimitado a todas as ferramentas
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px bg-slate-200 dark:bg-slate-700/50"></div>

                {/* Action Column */}
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  {profile.plan === 'Trial' ? (
                    <>
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Valor do Plano</p>
                        <div className="text-4xl font-black text-slate-900 dark:text-white">R$ 99,90 <span className="text-sm font-medium text-slate-500">/mês</span></div>
                      </div>
                      <button className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white py-4 rounded-2xl font-black transition-all shadow-xl active:scale-[0.98]">
                        Assinar Agora
                      </button>
                      <p className="text-xs text-center text-slate-400 font-medium italic">Sem fidelidade, cancele a qualquer momento.</p>
                    </>
                  ) : (
                    <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm p-8 rounded-[32px] border border-white/20 dark:border-white/5 text-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-[2px] mb-6">Resumo da Fatura</p>

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Plano Pro Mensal</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">R$ 99,90</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Desconto Lex Online</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">- R$ 99,90</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-900 dark:text-white uppercase text-xs">Total a Pagar</span>
                          <span className="text-3xl font-black text-slate-900 dark:text-white">R$ 0,00</span>
                        </div>
                      </div>

                      <button disabled className="w-full bg-emerald-500 text-white py-3 rounded-2xl font-black text-sm cursor-default flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                        <CheckCircle size={18} /> Assinatura Ativa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};