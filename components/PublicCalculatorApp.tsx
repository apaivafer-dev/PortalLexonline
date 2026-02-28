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
                        city: result.city || '',        // In case the API returns this in the future
                        state: result.state || '',      // We'll pass it if we have it
                        neighborhood: '',
                        complement: '',
                    },
                };

                setCompanyProfile(profile);

                // Apply custom styles from config
                if (result.headerBgColor || result.headerFontColor) {
                    const headerStyle = document.createElement('style');
                    headerStyle.id = 'public-calculator-header-style';
                    headerStyle.innerHTML = `
                        #calculator-header { 
                            background-color: ${result.headerBgColor || '#0f172a'} !important; 
                            color: ${result.headerFontColor || '#ffffff'} !important; 
                        }
                        #calculator-header * { 
                            color: inherit !important; 
                        }
                    `;
                    document.head.appendChild(headerStyle);
                }

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
            const headerStyle = document.getElementById('public-calculator-header-style');
            if (headerStyle) {
                headerStyle.remove();
            }
        };
    }, [slug]);

    useEffect(() => {
        if (error || !companyProfile) {
            let metaRobot = document.querySelector('meta[name="robots"]');
            if (metaRobot) metaRobot.setAttribute('content', 'noindex, nofollow');
            document.title = 'LexOnline - Calculadora Não Encontrada';
            return;
        }

        const city = companyProfile.address.city || 'Sua Cidade';
        const state = companyProfile.address.state || 'Brasil';
        const firmName = companyProfile.name || 'Advocacia Trabalhista';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ((import.meta as any).env.VITE_FRONTEND_URL || '');
        const url = `${baseUrl}/c/${slug}/calculorescisaotrabalhista`;
        const titleText = `Calculadora de Rescisão Trabalhista Grátis em ${city} - ${firmName}`;
        const descriptionText = `Precisa calcular sua rescisão em ${city}? Acesse a calculadora CLT oficial e saiba exatamente seus direitos na demissão. Simulação rápida e segura por ${firmName}.`;
        const keywordsText = `calculadora de rescisão trabalhista ${city}, cálculo rescisão CLT ${city}, simulador rescisão trabalhista ${city}, advogado do trabalho ${city}, direitos trabalhistas ${city}, rescisão sem justa causa ${city}`;

        // Helpers for DOM meta manipulation
        const setMeta = (name: string, content: string, isProperty = false) => {
            const attr = isProperty ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        const setLink = (rel: string, href: string) => {
            let link = document.querySelector(`link[rel="${rel}"]`);
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', rel);
                document.head.appendChild(link);
            }
            link.setAttribute('href', href);
        };

        // Title & Standard Meta
        document.title = titleText;
        setMeta('description', descriptionText);
        setMeta('keywords', keywordsText);
        setMeta('robots', 'index, follow');
        setLink('canonical', url);

        // Open Graph
        setMeta('og:title', titleText, true);
        setMeta('og:description', descriptionText, true);
        setMeta('og:type', 'website', true);
        setMeta('og:url', url, true);
        setMeta('og:locale', 'pt_BR', true);
        setMeta('og:site_name', firmName, true);

        // Twitter Cards
        setMeta('twitter:card', 'summary_large_image', true);
        setMeta('twitter:title', titleText, true);
        setMeta('twitter:description', descriptionText, true);

        return () => {
            // Cleanup generic tags (leave defaults for fallback)
            document.title = 'LexOnline - Calculadoras';
            let metaRobot = document.querySelector('meta[name="robots"]');
            if (metaRobot) metaRobot.setAttribute('content', 'index, follow');
        };
    }, [error, companyProfile, slug]);

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
