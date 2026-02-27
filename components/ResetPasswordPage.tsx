import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface ResetPasswordPageProps {
    token: string;
    onResetSuccess: () => void;
}

export const ResetPasswordPage = ({ token, onResetSuccess }: ResetPasswordPageProps) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword(token, password);
            setIsSuccess(true);
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao redefinir senha. Link pode estar expirado.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold dark:text-white">Sucesso!</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Sua senha foi configurada com sucesso. Agora você já pode acessar sua conta.
                    </p>
                    <button onClick={onResetSuccess} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-8">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Definir Nova Senha</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Escolha uma senha forte para sua segurança.</p>
                </div>

                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nova Senha</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={8}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-slate-400"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirmar Senha</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-indigo-500">
                                <Lock size={20} />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-11 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">Pelo menos 8 caracteres, uma letra maiúscula e uma minúscula.</p>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Redefinir Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
};
