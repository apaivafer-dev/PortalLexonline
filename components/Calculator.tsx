import React, { useState, useEffect } from 'react';
import {
  CalculatorInput,
  TerminationType,
  NoticeType,
  CalculationResult,
  CompanyProfile
} from '../types';
import { calculatorApi, publishApi } from '../services/api';
import { formatCurrency, formatDate } from '../lib/utils';

import {
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Calculator,
  Clock,
  Pencil,
  X,
  Check,
  HelpCircle,
  AlertTriangle,
  Share2,
  ChevronDown,
  Info,
  MapPin,
  Phone,
  Globe,
  MessageCircle,
  Copy,
  ExternalLink,
  Settings,
  Layout,
  Palette,
  Code,
  Link as LinkIcon,
  MessageSquare,
  Unlock,
  BarChart,
  MousePointerClick,
  Monitor,
  Move,
  Target,
  Save
} from 'lucide-react';

const INITIAL_INPUT: CalculatorInput = {
  employeeName: '',
  salary: 3000,
  startDate: '2020-01-15',
  endDate: new Date().toISOString().split('T')[0],
  terminationType: TerminationType.SEM_JUSTA_CAUSA,
  noticeType: 'Indenizado',
  vacationOverdue: 0,
  dependents: 0,
  additionalHours: 0,
  additionalDanger: false,
  additionalNight: false,
  fgtsBalance: 15000,
  applyFine467: false,
  applyFine477: false,
  noticeStartDate: '',
  noticeEndDate: ''
};

const DEFAULT_WHATSAPP_MSG = "Quero falar com Especialista sobre meu Cálculo de Rescisão";
const PRESET_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#0f172a'];

interface CalculatorAppProps {
  companyProfile: CompanyProfile;
  onUpdateFirmName?: (name: string) => void;
  username?: string;
  isPublic?: boolean;
}

const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="group relative inline-flex ml-2 align-middle z-20">
      <HelpCircle size={15} className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-help transition-colors" />
      <div className="invisible group-hover:visible absolute z-50 w-64 p-4 mt-2 text-xs leading-relaxed text-white bg-slate-900 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity left-1/2 -translate-x-1/2 top-full shadow-xl pointer-events-none text-center">
        {text}
        <div className="absolute -top-1 left-1/2 -ml-1 border-4 border-transparent border-b-slate-900"></div>
      </div>
    </div>
  );
};

// --- SEO & CONTENT COMPONENT ---
const SEOGuide = ({ company }: { company: CompanyProfile }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const city = company.address.city || "Sua Cidade";
  const state = company.address.state || "Brasil";
  const firmName = company.name || "Advocacia Trabalhista";

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "O que é o Termo de Rescisão do Contrato de Trabalho?",
      answer: "O Termo de Rescisão do Contrato de Trabalho (TRCT) é um documento oficial que formaliza o fim do vínculo empregatício. Nele constam todos os valores a serem pagos (verbas rescisórias) e descontos. É essencial para o saque do FGTS e solicitação do Seguro-Desemprego."
    },
    {
      question: `Como fazer o cálculo da rescisão de forma exata em ${city}?`,
      answer: `O cálculo exato exige considerar as convenções coletivas da categoria em ${city}/${state}. Geralmente inclui: saldo de salário, aviso prévio, 13º proporcional, férias + 1/3 e multa do FGTS. Recomenda-se a conferência por um advogado trabalhista local.`
    },
    {
      question: "Como calcular a multa de 40% do FGTS?",
      answer: "A multa de 40% incide sobre o total depositado na conta do FGTS do trabalhador durante todo o contrato, somado aos depósitos da rescisão. O cálculo é: (Saldo Total do FGTS + Depósito Rescisório) x 0,40."
    },
    {
      question: "Qual o prazo para pagamento da rescisão?",
      answer: "Conforme a Reforma Trabalhista (Art. 477 da CLT), o pagamento das verbas rescisórias deve ser efetuado em até 10 dias corridos a partir do término do contrato, independentemente do tipo de aviso prévio."
    },
    {
      question: "O que eu perco se pedir demissão?",
      answer: "Ao pedir demissão, o trabalhador perde o direito à multa de 40% do FGTS, não pode sacar o saldo do FGTS (que fica retido) e não tem direito ao Seguro-Desemprego."
    }
  ];

  // Dynamic JSON-LD Generation
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": firmName,
    "description": `Cálculo de Rescisão Trabalhista e Assessoria Jurídica especializada em ${city} - ${state}`,
    "url": company.website,
    "telephone": company.phone,
    "email": company.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": `${company.address.street}, ${company.address.number}`,
      "addressLocality": city,
      "addressRegion": state,
      "postalCode": company.address.cep,
      "addressCountry": "BR"
    },
    "areaServed": {
      "@type": "City",
      "name": city
    },
    "priceRange": "Consultar"
  };

  return (
    <article className="mt-16 max-w-4xl mx-auto text-slate-700 dark:text-slate-300 pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <section className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Como Calcular Rescisão Trabalhista em <span className="text-slate-800 dark:text-white underline decoration-wavy decoration-indigo-500">{city}</span>
        </h2>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Entenda seus direitos conforme a CLT e tire suas dúvidas sobre o cálculo rescisório com a <strong>{firmName}</strong>.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="bg-white dark:bg-[#1A1D23] p-8 rounded-[32px] shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
            <DollarSign size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Verbas Rescisórias</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Incluem saldo de salário, férias vencidas e proporcionais (+1/3), 13º salário proporcional e aviso prévio. O cálculo depende do motivo do desligamento.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1D23] p-8 rounded-[32px] shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Descontos Legais</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Sobre o valor bruto incidem descontos como INSS e Imposto de Renda (IRRF). Em caso de pedido de demissão sem cumprimento de aviso, este também pode ser descontado.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1D23] p-8 rounded-[32px] shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">FGTS e Multa de 40%</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Na demissão sem justa causa, a empresa deve pagar multa de 40% sobre o saldo total do FGTS. O saque do valor depositado é liberado imediatamente.
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1D23] p-8 rounded-[32px] shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-colors">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-900 dark:text-white">
            <Clock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Prazos de Pagamento</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            A empresa tem até 10 dias corridos após o término do contrato para pagar a rescisão. O atraso gera multa no valor de um salário do funcionário.
          </p>
        </div>
      </div>

      <div className="bg-slate-100 dark:bg-[#1A1D23] p-8 rounded-[32px] mb-16 relative overflow-hidden">
        <div className="relative z-10">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Info size={20} /> Importante
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            O cálculo envolve somar proventos como saldo de salário, férias proporcionais, aviso prévio e 13º salário proporcional, além de deduzir os descontos legais. Por isso, é altamente recomendável contar com o apoio de um advogado trabalhista para análise individualizada do seu caso.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div key={index} className="bg-white dark:bg-[#1A1D23] rounded-3xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 overflow-hidden shadow-sm transition-all">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                {item.question}
                <div className={`p-2 rounded-full bg-slate-100 dark:bg-white/10 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                  <ChevronDown size={16} className="text-slate-500 dark:text-white" />
                </div>
              </button>
              <div
                className={`px-6 text-slate-600 dark:text-slate-400 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      </section>

    </article>
  );
};

export const CalculatorApp = ({ companyProfile, onUpdateFirmName, username, isPublic = false }: CalculatorAppProps) => {
  const [activeTab, setActiveTab] = useState<'page' | 'settings'>('page');
  const [step, setStep] = useState<'input' | 'lead' | 'result'>('input');
  const [input, setInput] = useState<CalculatorInput>(INITIAL_INPUT);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorInput, string>>>({});
  const [leadErrors, setLeadErrors] = useState<{ email?: string }>({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Settings State
  const [isPublished, setIsPublished] = useState(false);
  const [gaCode, setGaCode] = useState('');
  const [adsId, setAdsId] = useState('');
  const [googleAdsId, setGoogleAdsId] = useState('');
  const [googleAdsLabel, setGoogleAdsLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Message & Contact State
  const [whatsappMessage, setWhatsappMessage] = useState(DEFAULT_WHATSAPP_MSG);
  const [customPhoneNumber, setCustomPhoneNumber] = useState("");

  // Widget State
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [widgetTextColor, setWidgetTextColor] = useState('#ffffff');
  const [widgetText, setWidgetText] = useState('Calcular Rescisão');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  const [widgetAction, setWidgetAction] = useState<'modal' | 'link'>('modal');
  const [targetUrl, setTargetUrl] = useState('');

  const [headerBgColor, setHeaderBgColor] = useState('#0f172a');
  const [headerFontColor, setHeaderFontColor] = useState('#ffffff');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    // Inject tracking scripts dynamically if configured and we are in public view
    const injectScripts = () => {
      // 1. Google Analytics / Google Ads
      const googleId = gaCode || googleAdsId;
      if (googleId && !document.getElementById('gtag-base')) {
        const script = document.createElement('script');
        script.async = true;
        script.id = 'gtag-base';
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleId}`;
        document.head.appendChild(script);

        const inlineScript = document.createElement('script');
        inlineScript.id = 'gtag-config';
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${gaCode ? `gtag('config', '${gaCode}');` : ''}
          ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
        `;
        document.head.appendChild(inlineScript);
      }

      // 2. Meta Pixel
      if (adsId && !document.getElementById('meta-pixel-base')) {
        const metaScript = document.createElement('script');
        metaScript.id = 'meta-pixel-base';
        metaScript.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${adsId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(metaScript);

        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${adsId}&ev=PageView&noscript=1" />`;
        document.head.appendChild(noscript);
      }
    };

    if (gaCode || adsId || googleAdsId) {
      injectScripts();
    }
  }, [gaCode, adsId, googleAdsId]);

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const publishedData = await publishApi.getPublished();
        if (publishedData) {
          setIsPublished(true);
          const config = publishedData.config || {};
          if (config.gaCode) setGaCode(config.gaCode);
          if (config.adsId) setAdsId(config.adsId);
          if (config.googleAdsId) setGoogleAdsId(config.googleAdsId);
          if (config.googleAdsLabel) setGoogleAdsLabel(config.googleAdsLabel);
          if (config.customPhoneNumber) setCustomPhoneNumber(config.customPhoneNumber);
          if (config.whatsappMessage) setWhatsappMessage(config.whatsappMessage);
          if (config.widgetColor) setWidgetColor(config.widgetColor);
          if (config.widgetText) setWidgetText(config.widgetText);
          if (config.widgetPosition) setWidgetPosition(config.widgetPosition);
          if (config.widgetAction) setWidgetAction(config.widgetAction);
          if (config.targetUrl) setTargetUrl(config.targetUrl);
          if (publishedData.header_bg_color) setHeaderBgColor(publishedData.header_bg_color);
          if (publishedData.header_font_color) setHeaderFontColor(publishedData.header_font_color);

          // Recovery for top-level fields
          if (publishedData.company_name !== undefined && publishedData.company_name !== null) {
            if (onUpdateFirmName) onUpdateFirmName(publishedData.company_name);
          }
          if (publishedData.whatsapp_number !== undefined && publishedData.whatsapp_number !== null) {
            setCustomPhoneNumber(publishedData.whatsapp_number);
          }
        }
      } catch (err: any) {
        if (err.message !== 'Calculadora não publicada') {
          console.error("Failed to fetch published status", err);
        }
      }
    };
    fetchPublished();
  }, []);

  const handleSavePublish = async () => {
    setIsSavingConfig(true);
    try {
      if (isPublished) {
        const config = {
          gaCode, adsId, googleAdsId, googleAdsLabel, customPhoneNumber, whatsappMessage, widgetColor, widgetText, widgetPosition, widgetAction, targetUrl
        };
        await publishApi.publishCalculator({
          companyName: displayTitle,
          whatsappNumber: customPhoneNumber,
          whatsappMessage,
          headerBgColor,
          headerFontColor,
          config
        } as any);
        alert('Configurações salvas e calculadora publicada com sucesso!');
      } else {
        await publishApi.unpublish();
        alert('Calculadora despublicada com sucesso.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // --- Conversion Tracking ---
  const triggerConversions = () => {
    // Google Ads Conversion
    if (googleAdsId && googleAdsLabel) {
      try {
        const w = window as any;
        if (typeof w.gtag === 'function') {
          w.gtag('event', 'conversion', {
            send_to: `${googleAdsId}/${googleAdsLabel}`,
          });
        }
      } catch (e) { console.warn('gtag not available', e); }
    }
    // Meta Pixel Lead Event
    if (adsId) {
      try {
        const w = window as any;
        if (typeof w.fbq === 'function') {
          w.fbq('track', 'Lead');
        }
      } catch (e) { console.warn('fbq not available', e); }
    }
    // Google Analytics event
    if (gaCode) {
      try {
        const w = window as any;
        if (typeof w.gtag === 'function') {
          w.gtag('event', 'generate_lead', { event_category: 'Calculator', event_label: 'Lead Form Submit' });
        }
      } catch (e) { console.warn('gtag not available', e); }
    }
  };

  // Derived data
  const cityName = companyProfile.address.city || "Sua Cidade";
  const firmName = companyProfile.name;
  const currentYear = new Date().getFullYear();
  const displayTitle = firmName && firmName.trim() !== '' ? firmName : `Calculadora Rescisão em ${cityName}`;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ((import.meta as any).env.VITE_FRONTEND_URL || '');
  const publicUrl = `${baseUrl}/c/${username || 'usuario'}/calculorescisaotrabalhista`;
  const activePhone = customPhoneNumber || companyProfile.phone;

  // --- Handlers ---
  const handleStartEdit = () => {
    setTempTitle(displayTitle);
    setIsEditingTitle(true);
  };

  const handleSaveEdit = () => {
    if (onUpdateFirmName) onUpdateFirmName(tempTitle);
    setIsEditingTitle(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };



  const handleInputChange = (field: keyof CalculatorInput, value: any) => {
    setInput(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CalculatorInput, string>> = {};
    let isValid = true;

    // Validate Salary
    if (!input.salary) {
      newErrors.salary = "Informe o salário.";
      isValid = false;
    } else if (input.salary <= 0) {
      newErrors.salary = "O salário deve ser maior que zero.";
      isValid = false;
    }

    // Validate Dates
    if (!input.startDate) { newErrors.startDate = "Data de admissão obrigatória."; isValid = false; }
    if (!input.endDate) { newErrors.endDate = "Data de afastamento obrigatória."; isValid = false; }

    if (input.startDate && input.endDate) {
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      if (end <= start) {
        newErrors.endDate = "A data de afastamento deve ser posterior à admissão.";
        isValid = false;
      }
    }

    // Validate Notice Period Logic
    if (input.noticeType === 'Trabalhado') {
      if (!input.noticeStartDate) {
        newErrors.noticeStartDate = "Obrigatório para aviso trabalhado.";
        isValid = false;
      }
      if (!input.noticeEndDate) {
        newErrors.noticeEndDate = "Obrigatório para aviso trabalhado.";
        isValid = false;
      }

      if (input.noticeStartDate && input.noticeEndDate) {
        const nStart = new Date(input.noticeStartDate);
        const nEnd = new Date(input.noticeEndDate);
        if (nEnd <= nStart) {
          newErrors.noticeEndDate = "Data final deve ser após a inicial.";
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCalculate = async () => {
    if (validateForm()) {
      try {
        const response = await calculatorApi.calculate(input);
        setResult(response);
        setStep('lead');
      } catch (error: any) {
        alert('Erro ao realizar o cálculo: ' + (error.message || 'Erro desconhecido'));
      }
    }
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      setLeadErrors({ email: 'Por favor, insira um e-mail válido.' });
      return;
    }
    setLeadErrors({});

    if (!leadData.consent) {
      alert('Necessário aceitar os termos para continuar.');
      return;
    }

    setIsSendingEmail(true);

    // --- Generate HTML summary ---
    let calculationHtml: string | null = null;

    if (result) {
      // Always generate HTML summary from data, regardless of DOM
      calculationHtml = `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead><tr style="background:#f1f5f9;">
            <th style="padding:8px;text-align:left;">Verba</th>
            <th style="padding:8px;text-align:right;color:#16a34a;">Proventos</th>
            <th style="padding:8px;text-align:right;color:#dc2626;">Descontos</th>
          </tr></thead>
          <tbody>
            ${result.items.map(item => `<tr>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;">${item.description}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#16a34a;">${item.type === 'earning' ? 'R$ ' + item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</td>
              <td style="padding:6px 8px;border-bottom:1px solid #f1f5f9;text-align:right;color:#dc2626;">${item.type === 'deduction' ? 'R$ ' + item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</td>
            </tr>`).join('')}
          </tbody>
          <tfoot><tr style="background:#0f172a;color:#fff;">
            <td style="padding:10px 8px;font-weight:800;">Líquido a Receber</td>
            <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:800;font-size:16px;">R$ ${result.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          </tr></tfoot>
        </table>
      `;
    }

    // Submit lead to backend (saves to CRM + sends email)
    if (isPublic && username) {
      try {
        await publishApi.submitPublicLead(username, {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          estimatedValue: result?.netTotal || 0,
          calculationHtml,
        } as any);
      } catch (err: any) {
        console.error('Erro ao enviar lead', err);
      }
    }

    setIsSendingEmail(false);

    // Fire conversion tags
    triggerConversions();

    setStep('result');
  };

  const generateWidgetCode = () => {
    // If widget action is modal, use the publicUrl (which contains the calculator) as iframe source.
    // If widget action is link, use the targetUrl.
    const finalUrl = widgetAction === 'link' ? (targetUrl || publicUrl) : publicUrl;

    const dataAttrs = [
      `id="lex-widget"`,
      `data-color="${widgetColor}"`,
      `data-text-color="${widgetTextColor}"`,
      `data-text="${widgetText}"`,
      `data-pos="${widgetPosition}"`,
      `data-type="${widgetAction}"`,
      widgetAction === 'link' ? `data-url="${finalUrl}"` : `data-iframe="${finalUrl}"`
    ].filter(Boolean).join(' ');

    return `<!-- Widget Calculadora de Rescisão -->\n<div ${dataAttrs}></div>\n<script src="https://calculadora.lexonline.com.br/widget.js" async></script>\n<!-- End Widget -->`;
  };

  const generateIframeCode = () => {
    return `<iframe src="${publicUrl}" width="100%" height="800px" style="border:0; border-radius:12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" allowfullscreen></iframe>`;
  };

  const getInputClass = (fieldName: keyof CalculatorInput) => {
    const baseClass = "w-full pl-12 pr-4 py-4 bg-transparent border-b-2 border-slate-100 dark:border-white/10 outline-none transition-all dark:text-white text-3xl font-bold text-[#0f172a] dark:text-white placeholder:text-slate-300";
    const validClass = "focus:border-[#0f172a] dark:focus:border-white/40";
    const errorClass = "border-red-300 bg-red-50 dark:bg-red-900/10";
    return `${baseClass} ${errors[fieldName] ? errorClass : validClass}`;
  };

  // Helper to determine style based on position for the PREVIEW
  const getPreviewStyle = () => {
    switch (widgetPosition) {
      case 'top-left': return { top: '3.5rem', left: '1rem', bottom: 'auto', right: 'auto' };
      case 'top-right': return { top: '3.5rem', right: '1rem', bottom: 'auto', left: 'auto' };
      case 'bottom-left': return { bottom: '1rem', left: '1rem', top: 'auto', right: 'auto' };
      case 'bottom-right': return { bottom: '1rem', right: '1rem', top: 'auto', left: 'auto' };
    }
  };

  const noticeOptions: NoticeType[] = ['Indenizado', 'Dispensado/Não Cumprido', 'Trabalhado'];

  return (
    <div className="w-full space-y-8">

      {/* --- TAB NAVIGATION --- */}
      {!isPublic && (
        <div className="bg-white dark:bg-[#1A1D23] rounded-full p-1.5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-white/5 w-fit mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('page')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all
                      ${activeTab === 'page'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <Layout size={16} /> Página da Calculadora
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all
                      ${activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              <Settings size={16} /> Configurações
            </button>
          </div>
        </div>
      )}

      {/* --- TAB: PAGE (CALCULATOR UI) --- */}
      {activeTab === 'page' && (
        <div className="bg-white dark:bg-[#1A1D23] rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-white/5 overflow-hidden w-full relative z-10 animate-in fade-in slide-in-from-bottom-2">
          {/* ... (Header and Calculator Inputs remain unchanged) ... */}
          <div
            id="calculator-header"
            className="p-8 md:p-10 transition-all"
            style={{ backgroundColor: headerBgColor, color: headerFontColor }}
          >
            <div className="flex flex-col gap-4">
              <h1 className="sr-only">Calculadora de Rescisão Trabalhista em {cityName} – Simulador CLT Gratuito</h1>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <Calculator className="h-6 w-6" style={{ color: headerFontColor }} />
                  </div>
                  {!isPublic && isEditingTitle ? (
                    <div className="flex items-center gap-2 w-full max-w-lg animate-in fade-in slide-in-from-left-2 duration-200">
                      <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} autoFocus className="bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold outline-none focus:ring-2 focus:ring-white/50 w-full" />
                      <button onClick={handleSaveEdit} className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl"><Check size={20} /></button>
                      <button onClick={() => setIsEditingTitle(false)} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl"><X size={20} /></button>
                    </div>
                  ) : (
                    <div className="group">
                      <h2 className="text-3xl font-bold truncate tracking-tight" style={{ color: headerFontColor }}>{displayTitle}</h2>
                    </div>
                  )}
                </div>
                {!isPublic && username && isPublished && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 hover:bg-white/20 transition-all">
                      <span className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> No Ar
                      </span>
                      <div className="h-4 w-px bg-white/20"></div>
                      <button onClick={() => handleCopy(publicUrl)} className="text-white/80 hover:text-white"><Copy size={16} /></button>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white"><ExternalLink size={16} /></a>
                    </div>
                  </div>
                )}
              </div>
              <p className="max-w-2xl text-lg opacity-70" style={{ color: headerFontColor }}>Simulador de rescisão CLT atualizado {currentYear}. Cálculo exato considerando as leis trabalhistas.</p>
            </div>
          </div>

          {/* Calculator Inputs/Results */}
          <div className="p-8 md:p-12">
            {step === 'input' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* ... (Existing Input Fields remain unchanged - Section 1, 2, 3) ... */}
                {/* Section 1 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-black">1</span>
                    Dados do Contrato
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1 flex items-center gap-2">
                        Último Salário Bruto
                        <InfoTooltip text="Informe o salário base registrado em carteira, sem os descontos." />
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300">
                            <span className="text-3xl font-bold">$</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(input.salary)}
                              readOnly
                              className={getInputClass('salary') + " !pl-8 bg-transparent border-0 ring-0 focus:ring-0 cursor-default"}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleInputChange('salary', Math.max(0, input.salary - 100))} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">-</span>
                          </button>
                          <button onClick={() => handleInputChange('salary', input.salary + 100)} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">+</span>
                          </button>
                        </div>
                      </div>
                      {errors.salary && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.salary}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Data de Admissão</label>
                      <div className="relative group">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-500">
                          <Pencil size={24} />
                        </div>
                        <input type="date" value={input.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className={getInputClass('startDate')} />
                      </div>
                      {errors.startDate && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.startDate}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Data de Afastamento</label>
                      <div className="relative group">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-500">
                          <Pencil size={24} />
                        </div>
                        <input type="date" value={input.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className={getInputClass('endDate')} />
                      </div>
                      {errors.endDate && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.endDate}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Motivo da Rescisão</label>
                      <div className="flex flex-wrap gap-3 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        {Object.values(TerminationType).map(t => {
                          const isActive = input.terminationType === t;
                          return (
                            <button key={t} onClick={() => handleInputChange('terminationType', t)} className={`flex-1 min-w-[150px] py-4 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? 'bg-[#0f172a] text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}>
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-white/5"></div>

                {/* Section 2 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-black">2</span>
                    Aviso Prévio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Tipo de Aviso</label>
                      <div className="flex flex-col sm:flex-row gap-3 p-1.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        {noticeOptions.map((option) => {
                          const isActive = input.noticeType === option;
                          return (
                            <button key={option} onClick={() => handleInputChange('noticeType', option)} className={`flex-1 py-4 px-6 rounded-xl text-sm font-bold transition-all duration-200 ${isActive ? 'bg-[#0f172a] text-white shadow-xl scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100'}`}>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {input.noticeType === 'Trabalhado' && (
                      <>
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Início do Aviso</label>
                          <div className="relative group">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-500">
                              <Pencil size={24} />
                            </div>
                            <input type="date" value={input.noticeStartDate || ''} onChange={(e) => handleInputChange('noticeStartDate', e.target.value)} className={getInputClass('noticeStartDate')} />
                          </div>
                        </div>
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Fim do Aviso</label>
                          <div className="relative group">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-500">
                              <Pencil size={24} />
                            </div>
                            <input type="date" value={input.noticeEndDate || ''} onChange={(e) => handleInputChange('noticeEndDate', e.target.value)} className={getInputClass('noticeEndDate')} />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Dependentes para IRRF</label>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-blue-500">
                            <Pencil size={24} />
                          </div>
                          <input type="number" min="0" value={input.dependents} onChange={(e) => handleInputChange('dependents', Number(e.target.value))} className={getInputClass('dependents')} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleInputChange('dependents', Math.max(0, input.dependents - 1))} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">-</span>
                          </button>
                          <button onClick={() => handleInputChange('dependents', input.dependents + 1)} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-white/5"></div>

                {/* Section 3 */}
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-black">3</span>
                    Adicionais e Variáveis
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Média Valor Horas Extras (R$)</label>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300">
                            <span className="text-3xl font-bold">$</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(input.additionalHours)}
                              readOnly
                              className={getInputClass('additionalHours') + " !pl-8 bg-transparent border-0 ring-0 focus:ring-0 cursor-default"}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleInputChange('additionalHours', Math.max(0, input.additionalHours - 100))} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">-</span>
                          </button>
                          <button onClick={() => handleInputChange('additionalHours', input.additionalHours + 100)} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">+</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Saldo FGTS (p/ Multa)</label>
                      <div className="flex items-center gap-4">
                        <div className="relative flex-1 group">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300">
                            <span className="text-3xl font-bold">$</span>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(input.fgtsBalance)}
                              readOnly
                              className={getInputClass('fgtsBalance') + " !pl-8 bg-transparent border-0 ring-0 focus:ring-0 cursor-default"}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleInputChange('fgtsBalance', Math.max(0, input.fgtsBalance - 100))} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">-</span>
                          </button>
                          <button onClick={() => handleInputChange('fgtsBalance', input.fgtsBalance + 100)} className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                            <span className="text-2xl font-bold">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-4">
                      <label className="text-sm font-bold text-slate-900 dark:text-slate-300 ml-1">Férias Vencidas</label>
                      <div className="flex p-1 bg-slate-100/50 dark:bg-white/5 rounded-2xl w-fit">
                        {[0, 1, 2].map((num) => (
                          <button
                            key={num}
                            onClick={() => handleInputChange('vacationOverdue', num)}
                            className={`w-16 py-3 rounded-xl font-bold text-lg transition-all ${input.vacationOverdue === num ? 'bg-[#0f172a] text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                      {[
                        { id: 'additionalDanger', label: 'Periculosidade (30%)' },
                        { id: 'additionalNight', label: 'Adic. Noturno (20%)' },
                        { id: 'applyFine477', label: 'Multa Art. 477' }
                      ].map((opt) => {
                        const active = input[opt.id as keyof CalculatorInput];
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleInputChange(opt.id as keyof CalculatorInput, !active)}
                            className={`flex items-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-[#0f172a] text-white shadow-xl' : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-white bg-white/20' : 'border-slate-300'}`}>
                              {active && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                            </div>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button onClick={handleCalculate} className="bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 transform hover:-translate-y-1">
                    Calcular Agora <ArrowRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ... Rest of steps (lead and result) remain unchanged ... */}
            {step === 'lead' && (
              <div className="max-w-md mx-auto py-12 animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                  <div className="bg-green-100 dark:bg-green-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Cálculo Pronto!</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Para visualizar o demonstrativo completo, que será enviado para seu e-mail, por favor, identifique-se abaixo.</p>
                </div>
                <form onSubmit={submitLead} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Seu Nome</label>
                    <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-white/20 outline-none transition-all dark:text-white" value={leadData.name} onChange={e => setLeadData({ ...leadData, name: e.target.value })} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                    <input
                      required
                      type="email"
                      placeholder="seu@email.com"
                      className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border rounded-2xl focus:bg-white dark:focus:bg-slate-900 outline-none transition-all dark:text-white ${leadErrors.email ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-transparent focus:border-slate-300 dark:focus:border-white/20'}`}
                      value={leadData.email}
                      onChange={e => {
                        setLeadData({ ...leadData, email: e.target.value });
                        if (leadErrors.email) setLeadErrors({ ...leadErrors, email: undefined });
                      }}
                    />
                    {leadErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium"><AlertTriangle size={12} />{leadErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp</label>
                    <input required type="tel" placeholder="(00) 90000-0000" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-transparent rounded-2xl focus:bg-white dark:focus:bg-slate-900 focus:border-slate-300 dark:focus:border-white/20 outline-none transition-all dark:text-white" value={leadData.phone} onChange={e => setLeadData({ ...leadData, phone: e.target.value })} />
                  </div>
                  <div className="flex items-start gap-3 mt-2 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    <input type="checkbox" required id="consent" checked={leadData.consent} onChange={e => setLeadData({ ...leadData, consent: e.target.checked })} className="mt-1 h-5 w-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer" />
                    <label htmlFor="consent" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer leading-relaxed">
                      Concordo com o processamento dos meus dados conforme a <strong>Política de Privacidade</strong> e aceito receber o resultado bem como o contato do advogado especialista.
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={!leadData.consent || isSendingEmail}
                    className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold py-4 rounded-2xl mt-4 shadow-lg transition-all hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSendingEmail ? 'Enviando...' : 'Ver Resultado Completo'}
                  </button>
                  <button onClick={() => setStep('input')} type="button" className="w-full text-slate-400 text-sm py-2 hover:text-slate-600 dark:hover:text-slate-200 font-medium">Voltar e editar dados</button>
                </form>
              </div>
            )}



            {step === 'result' && (
              <div className="max-w-lg mx-auto py-12 animate-in fade-in zoom-in duration-300">
                {/* Success Header */}
                <div className="text-center mb-10">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Parabéns!</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base">
                    Seu cálculo foi processado e o <strong className="text-slate-700 dark:text-slate-200">demonstrativo completo</strong> foi enviado para o e-mail:
                  </p>
                  <p className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">{leadData.email}</p>
                </div>

                {/* Disclaimer */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-4 rounded-r-xl mb-8">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Estimativa Educativa:</strong> O valor exato depende da convenção coletiva de São Paulo. Consulte um advogado.
                    </p>
                  </div>
                </div>

                {/* Lawyer contact card */}
                {companyProfile.name && (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 mb-6 space-y-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fale com o Especialista</p>
                    <p className="font-bold text-slate-900 dark:text-white text-base">{companyProfile.name}</p>
                    {companyProfile.address?.city && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <MapPin size={14} />{companyProfile.address.city}{companyProfile.address.state ? ` - ${companyProfile.address.state}` : ''}
                      </p>
                    )}
                    {companyProfile.phone && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Phone size={14} />
                        <a href={`tel:${companyProfile.phone.replace(/\D/g, '')}`} className="hover:underline">{companyProfile.phone}</a>
                      </p>
                    )}
                    {companyProfile.email && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span style={{ fontSize: 14 }}>✉</span>
                        <a href={`mailto:${companyProfile.email}`} className="hover:underline">{companyProfile.email}</a>
                      </p>
                    )}
                    {companyProfile.website && (
                      <p className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Globe size={14} />
                        <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">{companyProfile.website}</a>
                      </p>
                    )}
                  </div>
                )}

                {/* WhatsApp button */}
                {activePhone && (
                  <a
                    href={`https://wa.me/55${activePhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-3 bg-[#25d366] hover:bg-[#20b858] text-white font-bold py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-lg mb-4"
                  >
                    <MessageCircle size={22} />
                    Falar com Advogado no WhatsApp
                  </a>
                )}

                {/* New calculation */}
                <button
                  onClick={() => { setStep('input'); setResult(null); setLeadData({ name: '', email: '', phone: '', consent: false }); }}
                  className="w-full py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  Realizar Novo Cálculo
                </button>
              </div>
            )}
          </div>

          {/* SEO Content in Page Tab */}
          <div className="px-8 md:px-12 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
            <SEOGuide company={companyProfile} />
          </div>
        </div>
      )}

      {/* --- TAB: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#1A1D23] rounded-[40px] shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-100 dark:border-white/5 overflow-hidden w-full relative z-10 animate-in fade-in slide-in-from-bottom-2">
          {/* Settings Header */}
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Configurações da Página</h2>
                <p className="text-slate-400 mt-1">Gerencie rastreamento, aparência e integração.</p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-10 space-y-8">

            {/* ── 1. VISIBILIDADE ── */}
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[24px] border border-slate-100 dark:border-white/5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe size={20} className="text-indigo-500" /> Visibilidade
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Defina se sua calculadora está acessível publicamente.
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-sm font-bold ${isPublished ? 'text-green-500' : 'text-slate-400'}`}>
                    {isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                  <button
                    onClick={() => setIsPublished(!isPublished)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${isPublished ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <button
                    onClick={handleSavePublish}
                    disabled={isSavingConfig}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Save size={16} /> {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </div>
            </div>

            {/* ── 2. LINK PÚBLICO ── */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Link Público da Página</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl text-slate-600 dark:text-slate-300 outline-none text-sm"
                />
                <button
                  onClick={() => handleCopy(publicUrl)}
                  className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors flex-shrink-0"
                  title="Copiar Link"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                </button>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors flex-shrink-0"
                  title="Abrir página"
                >
                  <ExternalLink size={20} />
                </a>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Envie este link diretamente para seus clientes.</p>
            </div>

            {/* ── 3. APARÊNCIA DA CALCULADORA ── */}
            <div className="bg-white dark:bg-[#1E2128] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette size={18} className="text-indigo-500" />
                  Aparência da Calculadora
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Personalize o visual para combinar com a identidade do seu escritório</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Título da Calculadora</label>
                  <div className="relative">
                    <Pencil size={16} className="absolute left-4 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={displayTitle}
                      onChange={(e) => onUpdateFirmName && onUpdateFirmName(e.target.value)}
                      placeholder="Ex: Minha Empresa"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white text-sm transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Este título substitui o nome padrão exibido no topo da calculadora.</p>
                </div>
                {/* Cores lado a lado */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cor de Fundo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={headerBgColor}
                        onChange={(e) => setHeaderBgColor(e.target.value)}
                        className="w-12 h-12 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer shadow-sm bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={headerBgColor}
                        onChange={(e) => setHeaderBgColor(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm outline-none dark:text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cor da Fonte</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={headerFontColor}
                        onChange={(e) => setHeaderFontColor(e.target.value)}
                        className="w-12 h-12 p-0.5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden cursor-pointer shadow-sm bg-transparent flex-shrink-0"
                      />
                      <input
                        type="text"
                        value={headerFontColor}
                        onChange={(e) => setHeaderFontColor(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm outline-none dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 4. WHATSAPP & CONTATO ── */}
            <div className="bg-white dark:bg-[#1E2128] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageCircle size={18} className="text-green-500" />
                  WhatsApp & Contato
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Configure o botão de contato exibido após o cálculo</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Número de Destino</label>
                    <input
                      type="tel"
                      value={customPhoneNumber}
                      onChange={(e) => setCustomPhoneNumber(e.target.value)}
                      placeholder={companyProfile.phone || "11999763164"}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none dark:text-white text-sm transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Deixe em branco para usar o número do perfil da empresa</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mensagem Inicial</label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none dark:text-white text-sm transition-all resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Texto pré-preenchido quando o cliente clicar no botão</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 5. RASTREAMENTO & ANALYTICS ── */}
            <div className="bg-white dark:bg-[#1E2128] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart size={18} className="text-blue-500" />
                    Rastreamento & Analytics
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Acompanhe conversões e comportamento dos usuários na calculadora</p>
                </div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800/30">Opcional</span>
              </div>
              <div className="p-6 space-y-5">
                {/* GA + Meta Pixel em grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300 font-bold text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">G·</span>
                      Google Analytics
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={gaCode}
                        onChange={(e) => setGaCode(e.target.value)}
                        placeholder="G-1234567890"
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm transition-all font-mono"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">ID de Medição do G4A</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="text-slate-700 dark:text-slate-300 font-bold text-xs bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">Fb</span>
                      Meta Pixel ID
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={adsId}
                        onChange={(e) => setAdsId(e.target.value)}
                        placeholder="123456789012345"
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm transition-all font-mono"
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">ID do Pixel do Facebook/Instagram Ads</p>
                  </div>
                </div>

                {/* Google Ads Conversion */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Target size={14} className="text-slate-500" /> Google Ads · Conversão
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                        <span className="text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">AW·</span>
                        Conversion ID
                      </label>
                      <input
                        type="text"
                        value={googleAdsId}
                        onChange={(e) => setGoogleAdsId(e.target.value)}
                        placeholder="AW-123456789"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500 text-sm transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                        <span className="text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">#</span>
                        Conversion Label
                      </label>
                      <input
                        type="text"
                        value={googleAdsLabel}
                        onChange={(e) => setGoogleAdsLabel(e.target.value)}
                        placeholder="AbC-123_xYz"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500 text-sm transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 6. WIDGET FLUTUANTE ── */}
            <div className="bg-white dark:bg-[#1E2128] rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MousePointerClick size={18} className="text-purple-500" />
                  Widget Flutuante
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Botão fixo que aparece em qualquer página do seu site</p>
              </div>
              <div className="p-6 space-y-6">
                {/* Cor Principal + Prévia & Posição lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cor Principal</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setWidgetColor(color)}
                          className={`w-9 h-9 rounded-full transition-transform hover:scale-110 shadow-sm flex-shrink-0 ${widgetColor === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : ''}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      <input
                        type="color"
                        value={widgetColor}
                        onChange={(e) => setWidgetColor(e.target.value)}
                        className="w-9 h-9 p-0 rounded-full border-0 overflow-hidden cursor-pointer shadow-sm flex-shrink-0"
                        title="Cor personalizada"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Prévia & Posição</label>
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl h-36 relative border border-dashed border-slate-300 dark:border-slate-700 shadow-inner overflow-hidden">
                      {/* Browser Mock Header */}
                      <div className="absolute top-0 left-0 w-full h-7 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center px-2.5 gap-1.5 z-10">
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div className="ml-2 text-[9px] text-slate-500 font-medium">site-do-cliente.com.br</div>
                      </div>
                      {/* Corner Position Selectors */}
                      <button onClick={() => setWidgetPosition('top-left')} title="Acima à Esquerda"
                        className={`absolute top-10 left-3 w-7 h-7 border-t-2 border-l-2 rounded-tl-lg transition-colors z-20 hover:scale-110 ${widgetPosition === 'top-left' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      />
                      <button onClick={() => setWidgetPosition('top-right')} title="Acima à Direita"
                        className={`absolute top-10 right-3 w-7 h-7 border-t-2 border-r-2 rounded-tr-lg transition-colors z-20 hover:scale-110 ${widgetPosition === 'top-right' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      />
                      <button onClick={() => setWidgetPosition('bottom-left')} title="Abaixo à Esquerda"
                        className={`absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 rounded-bl-lg transition-colors z-20 hover:scale-110 ${widgetPosition === 'bottom-left' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      />
                      <button onClick={() => setWidgetPosition('bottom-right')} title="Abaixo à Direita"
                        className={`absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 rounded-br-lg transition-colors z-20 hover:scale-110 ${widgetPosition === 'bottom-right' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      />
                      {/* Widget Preview Button */}
                      <div
                        className="absolute px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1.5 cursor-default transition-all duration-300 z-30 text-xs"
                        style={{ backgroundColor: widgetColor, color: widgetTextColor, ...getPreviewStyle() }}
                      >
                        <Calculator size={14} />
                        {widgetText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto do Botão */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Texto do Botão</label>
                  <input
                    type="text"
                    value={widgetText}
                    onChange={(e) => setWidgetText(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white text-sm transition-all"
                  />
                </div>

                {/* Ação ao Clicar */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ação ao Clicar</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setWidgetAction('modal')}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 justify-center ${widgetAction === 'modal' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
                    >
                      <Layout size={16} /> Abrir Calculadora
                    </button>
                    <button
                      onClick={() => setWidgetAction('link')}
                      className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 justify-center ${widgetAction === 'link' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'}`}
                    >
                      <ExternalLink size={16} /> Redirecionar
                    </button>
                  </div>
                  {widgetAction === 'link' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL de Destino</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-purple-500 dark:text-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">Deixe em branco para usar o link da calculadora.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── 7. SCRIPT DO WIDGET ── */}
            <div className="bg-slate-900 dark:bg-black rounded-[24px] overflow-hidden">
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <Code size={18} className="text-green-400" /> Script do Widget
                </h3>
                <button
                  onClick={() => handleCopy(generateWidgetCode())}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? 'Copiado!' : 'Copiar Script'}
                </button>
              </div>
              <div className="p-6">
                <code className="block font-mono text-xs text-slate-300 bg-black/40 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {generateWidgetCode()}
                </code>
                <p className="text-xs text-slate-500 mt-3">Cole este código uma só vez em todas as páginas onde o widget deve aparecer.</p>
              </div>
            </div>

            {/* ── 8. LINKS & EMBED ── */}
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <LinkIcon size={18} className="text-indigo-500" />
                Links & Embed
              </h3>
              <p className="text-xs text-slate-400 mb-4">Compartilhe ou incorpore sua calculadora em qualquer site</p>
              <div className="bg-slate-900 dark:bg-black rounded-[24px] overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Código IFrame</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono">EMBED</span>
                  </div>
                  <button
                    onClick={() => handleCopy(generateIframeCode())}
                    className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    Copiar
                  </button>
                </div>
                <div className="p-6">
                  <code className="block font-mono text-xs text-indigo-300 bg-black/40 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed break-all">
                    {generateIframeCode()}
                  </code>
                  <p className="text-xs text-slate-500 mt-3">Cole este código no seu site para exibir a calculadora embutida.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1D23] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10">
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Prévia da Página</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Visualização como cliente</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <ExternalLink size={16} /> Abrir em nova aba
                </a>
                <button onClick={() => setIsPreviewOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-black relative">
              <iframe src={publicUrl} className="w-full h-full border-0" title="Prévia da Calculadora" />
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button (Global) */}
      {activePhone && (
        <a
          href={`https://wa.me/55${activePhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => triggerConversions()}
          className="fixed bottom-8 right-8 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 group animate-whatsapp-pulse"
          title="Falar com Especialista"
          aria-label="Falar no WhatsApp"
        >
          <MessageCircle size={28} className="text-white" />
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">Falar com Advogado</span>

          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes whatsapp-pulse {
              0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
              70% { box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
              100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
            }
            .animate-whatsapp-pulse {
              animation: whatsapp-pulse 2s infinite;
            }
          `}} />
        </a>
      )}
    </div>
  );
};