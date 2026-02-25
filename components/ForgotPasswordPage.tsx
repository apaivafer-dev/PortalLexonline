import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ForgotPasswordPageProps {
    onBackToLogin: () => void;
}

export const ForgotPasswordPage = ({ onBackToLogin }: ForgotPasswordPageProps) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);
        try {
            await authApi.forgotPassword(email);
            setIsSent(true);
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao processar solicitação.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white">Email Enviado!</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Se o email <b>{email}</b> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                    </p>
                    <button onClick={onBackToLogin} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">
                        Voltar para o Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-8">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Recuperar Senha</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Informe seu email para receber o link de redefinição.</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
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
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Enviar Link de Recuperação'}
                    </button>

                    <button type="button" onClick={onBackToLogin} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors">
                        <ArrowLeft size={18} /> Voltar para o Login
                    </button>
                </form>
            </div>
        </div>
    );
};
