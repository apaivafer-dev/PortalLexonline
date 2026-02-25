import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Calculator, Mail, Lock, User, Phone, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';

interface RegisterPageProps {
    onRegister: () => void;
    onBackToLogin: () => void;
}

export const RegisterPage = ({ onRegister, onBackToLogin }: RegisterPageProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        firmName: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            await authApi.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                firmName: formData.firmName
            });
            onRegister();
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao criar conta. Verifique os dados.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900 font-sans">
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Comece grátis hoje!</h3>
                        <p className="text-slate-500 dark:text-slate-400">Crie sua conta em menos de 1 minuto</p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Nome Completo</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <User size={18} />
                                </div>
                                <input required type="text" placeholder="Seu nome" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">E-mail Profissional</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input required type="email" placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Senha (8+ chars, A-a)</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input required type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">WhatsApp</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Phone size={18} />
                                    </div>
                                    <input type="text" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">Escritório</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <Briefcase size={18} />
                                    </div>
                                    <input type="text" placeholder="Nome do escritório" value={formData.firmName} onChange={e => setFormData({ ...formData, firmName: e.target.value })} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Criar minha conta <ArrowRight size={18} /></>}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                        Já tem uma conta? <button onClick={onBackToLogin} className="text-indigo-600 font-bold hover:underline">Entre aqui</button>
                    </p>
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 bg-slate-900 items-center justify-center p-12 text-white">
                <div className="max-w-md space-y-6">
                    <div className="flex items-center gap-3">
                        <Calculator size={32} />
                        <h2 className="text-2xl font-bold">LexOnline</h2>
                    </div>
                    <h3 className="text-4xl font-bold">Tudo o que seu escritório precisa.</h3>
                    <p className="text-slate-400">Junte-se a milhares de advogados que já estão automatizando seus cálculos e capturando leads qualificados.</p>
                </div>
            </div>
        </div>
    );
};
