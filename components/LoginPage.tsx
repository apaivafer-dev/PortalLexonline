import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Calculator, CheckCircle2, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginPageProps {
    onLogin: () => void;
    onNavigateToRegister: () => void;
    setAuthView: (view: 'login' | 'register' | 'forgot-password' | 'reset-password' | 'confirm-email' | 'setup-password') => void;
}

export const LoginPage = ({ onLogin, onNavigateToRegister, setAuthView }: LoginPageProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepLogged, setKeepLogged] = useState(false);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            await authApi.login(email, password);
            onLogin();
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900 font-sans">

            {/* --- LEFT SIDE (Branding) --- */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-800 relative overflow-hidden items-center justify-center p-12 text-white">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    {/* Logo Area */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Calculator size={40} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">LexOnline</h1>
                    </div>

                    <h2 className="text-5xl font-bold mb-6 leading-tight">
                        A Revolução na <br />
                        <span className="text-indigo-200">Gestão Trabalhista</span>
                    </h2>

                    <p className="text-lg text-indigo-100 mb-8 leading-relaxed opacity-90">
                        Simplifique cálculos rescisórios, capture leads qualificados e gerencie seu escritório com a plataforma MicroSaaS mais completa para advogados.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-indigo-100">
                            <CheckCircle2 className="text-green-400" /> Cálculos exatos e atualizados pela CLT
                        </div>
                        <div className="flex items-center gap-3 text-indigo-100">
                            <CheckCircle2 className="text-green-400" /> Relatórios detalhados por e-mail
                        </div>
                        <div className="flex items-center gap-3 text-indigo-100">
                            <CheckCircle2 className="text-green-400" /> CRM Integrado
                        </div>
                    </div>
                </div>

                {/* Footer info left */}
                <div className="absolute bottom-8 left-12 text-xs text-indigo-300/60">
                    © {new Date().getFullYear()} LexOnline Tecnologia. Todos os direitos reservados.
                </div>
            </div>

            {/* --- RIGHT SIDE (Login Form) --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">

                    <div className="text-center">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex justify-center mb-6">
                            <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-500/30">
                                <Calculator size={32} className="text-white" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo de volta!</h3>
                        <p className="text-slate-500 dark:text-slate-400">Acesse sua conta para continuar</p>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">E-mail</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Senha</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Keep Logged & Forgot Password */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={keepLogged}
                                    onChange={(e) => setKeepLogged(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">Manter conectado</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setAuthView('forgot-password')}
                                className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold transition-colors"
                            >
                                Esqueci minha senha
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Entrar na Plataforma <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>



                    <div className="relative mt-8 pt-4">
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 py-1 rounded-full bg-slate-50 dark:bg-slate-900/50 text-slate-400 flex items-center gap-1.5 border border-slate-100 dark:border-slate-700">
                                <ShieldCheck size={14} /> Ambiente Seguro
                            </span>
                        </div>
                    </div>

                    <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                        Não tem uma conta? <button onClick={onNavigateToRegister} className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">Cadastre-se grátis</button>
                    </p>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Ao continuar, você concorda com nossos <a href="#" className="text-indigo-600 hover:underline font-bold">Termos de Serviço</a> e <a href="#" className="text-indigo-600 hover:underline font-bold">Política de Privacidade</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};