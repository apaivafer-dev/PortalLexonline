import React, { useState } from 'react';
import { Calculator, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate network delay for realistic feel
    setTimeout(() => {
      onLogin();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-50 dark:bg-slate-900">
      
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
                A Revolução na <br/>
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
                    <CheckCircle2 className="text-green-400" /> Geração de PDFs profissionais
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
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

            <div className="space-y-4 pt-4">
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 py-3.5 px-4 rounded-xl font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                    ) : (
                        <>
                            {/* Google Icon SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span>Entrar com Google</span>
                        </>
                    )}
                </button>
            </div>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={14} /> Ambiente Seguro
                    </span>
                </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-8">
                Ao continuar, você concorda com nossos <a href="#" className="text-indigo-600 hover:underline">Termos de Serviço</a> e <a href="#" className="text-indigo-600 hover:underline">Política de Privacidade</a>.
            </p>
        </div>
      </div>
    </div>
  );
};