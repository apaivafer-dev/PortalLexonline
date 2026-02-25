import React, { useState, useEffect } from 'react';
import { CalculatorApp } from './Calculator';
import { publishApi } from '../services/api';
import { CompanyProfile } from '../types';

interface PublicCalculatorAppProps {
    slug: string;
}

export const PublicCalculatorApp = ({ slug }: PublicCalculatorAppProps) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const result = await publishApi.getPublicCalculator(slug);

                // Map public config to a dummy CompanyProfile for the Calculator App
                const profile: CompanyProfile = {
                    name: result.companyName || 'Advocacia Trabalhista',
                    phone: result.whatsappNumber || '',
                    email: '', // Not exposed publicly
                    website: '',
                    address: {
                        street: '',
                        number: '',
                        cep: '',
                        city: '',
                        state: '',
                        neighborhood: '',
                        complement: '',
                    },
                };

                setCompanyProfile(profile);

                // Apply custom CSS if provided
                if (result.customCss) {
                    const style = document.createElement('style');
                    style.id = 'public-calculator-custom-css';
                    style.innerHTML = result.customCss;
                    document.head.appendChild(style);
                }

            } catch (err: any) {
                setError(err.message || 'Calculadora não encontrada');
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();

        return () => {
            const style = document.getElementById('public-calculator-custom-css');
            if (style) {
                style.remove();
            }
        };
    }, [slug]);

    useEffect(() => {
        // Inject robots meta tag for SEO controls
        let meta = document.querySelector('meta[name="robots"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'robots');
            document.head.appendChild(meta);
        }

        if (error || !companyProfile) {
            meta.setAttribute('content', 'noindex, nofollow');
        } else {
            meta.setAttribute('content', 'index, follow');
        }

        return () => {
            // Cleanup robots config if leaving public app
            if (meta) {
                meta.setAttribute('content', 'index, follow');
            }
        };
    }, [error, companyProfile]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !companyProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">404 - Não Encontrada</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
                <a href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition">
                    Voltar para Início
                </a>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0D11] md:py-10 md:px-8 flex align-center justify-center">
            <div className="w-full max-w-[1200px]">
                <CalculatorApp
                    companyProfile={companyProfile}
                    username={slug}
                    isPublic={true}
                />
            </div>
        </div>
    );
};
