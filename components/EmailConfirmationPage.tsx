import React, { useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface EmailConfirmationPageProps {
    token: string;
    onContinue: () => void;
}

export const EmailConfirmationPage = ({ token, onContinue }: EmailConfirmationPageProps) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Confirmando seu email...');

    useEffect(() => {
        const confirm = async () => {
            try {
                await authApi.confirmEmail(token);
                setStatus('success');
                setMessage('Email confirmado com sucesso!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Link de confirmação inválido ou expirado.');
            }
        };
        confirm();
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <div className="flex justify-center">
                            <Loader2 size={48} className="text-indigo-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Verificando...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center">
                            <div className="bg-green-100 p-4 rounded-full">
                                <CheckCircle2 size={48} className="text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Sucesso!</h2>
                        <p className="text-slate-500 dark:text-slate-400">{message}</p>
                        <button onClick={onContinue} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">
                            Continuar para Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="flex justify-center">
                            <div className="bg-red-100 p-4 rounded-full">
                                <XCircle size={48} className="text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Ops!</h2>
                        <p className="text-slate-500 dark:text-slate-400">{message}</p>
                        <button onClick={onContinue} className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-300 transition-all">
                            Voltar ao Login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
