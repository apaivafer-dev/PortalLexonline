import React, { useState, useEffect } from 'react';
import { 
  CalculatorInput, 
  TerminationType, 
  NoticeType,
  CalculationResult, 
  CompanyProfile 
} from '../types';
import { calculateRescisao } from '../services/calculator';
import { formatCurrency, formatDate } from '../lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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
  BarChart
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

const WHATSAPP_MSG = "Quero falar com Especialista sobre Cálculo de Rescisão Trabalhista";
const PRESET_COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#0f172a'];

interface CalculatorAppProps {
    companyProfile: CompanyProfile;
    onUpdateFirmName?: (name: string) => void;
    username?: string;
}

const InfoTooltip = ({ text }: { text: string }) => {
  return (
    <div className="group relative inline-flex ml-2 align-middle z-20">
        <HelpCircle size={15} className="text-slate-400 hover:text-indigo-500 cursor-help transition-colors" />
        <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-xs leading-relaxed text-white bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity left-1/2 -translate-x-1/2 top-full shadow-xl pointer-events-none text-center">
        {text}
        <div className="absolute -top-1 left-1/2 -ml-1 border-4 border-transparent border-b-slate-800"></div>
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
          Como Calcular Rescisão Trabalhista em <span className="text-indigo-600 dark:text-indigo-400">{city}</span>
        </h2>
        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Entenda seus direitos conforme a CLT e tire suas dúvidas sobre o cálculo rescisório com a <strong>{firmName}</strong>.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
            <DollarSign size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Verbas Rescisórias</h3>
          <p className="text-sm">
            Incluem saldo de salário, férias vencidas e proporcionais (+1/3), 13º salário proporcional e aviso prévio. O cálculo depende do motivo do desligamento.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Descontos Legais</h3>
          <p className="text-sm">
            Sobre o valor bruto incidem descontos como INSS e Imposto de Renda (IRRF). Em caso de pedido de demissão sem cumprimento de aviso, este também pode ser descontado.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">FGTS e Multa de 40%</h3>
          <p className="text-sm">
            Na demissão sem justa causa, a empresa deve pagar multa de 40% sobre o saldo total do FGTS. O saque do valor depositado é liberado imediatamente.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-colors">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
            <Clock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Prazos de Pagamento</h3>
          <p className="text-sm">
            A empresa tem até 10 dias corridos após o término do contrato para pagar a rescisão. O atraso gera multa no valor de um salário do funcionário.
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 p-6 rounded-r-xl mb-16">
        <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
          <Info size={20} /> Importante
        </h4>
        <p className="text-indigo-700 dark:text-indigo-200">
          O cálculo envolve somar proventos como saldo de salário, férias proporcionais, aviso prévio e 13º salário proporcional, além de deduzir os descontos legais. Por isso, é altamente recomendável contar com o apoio de um advogado trabalhista para análise individualizada do seu caso.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 text-center">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqs.map((item, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {item.question}
                <ChevronDown 
                  size={20} 
                  className={`text-indigo-500 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`} 
                />
              </button>
              <div 
                className={`px-5 text-slate-600 dark:text-slate-400 leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
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

export const CalculatorApp = ({ companyProfile, onUpdateFirmName, username }: CalculatorAppProps) => {
  const [activeTab, setActiveTab] = useState<'page' | 'settings'>('page');
  const [step, setStep] = useState<'input' | 'lead' | 'result'>('input');
  const [input, setInput] = useState<CalculatorInput>(INITIAL_INPUT);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [leadData, setLeadData] = useState({ name: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState<Partial<Record<keyof CalculatorInput, string>>>({});
  const [leadErrors, setLeadErrors] = useState<{ email?: string }>({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Settings State
  const [isPublished, setIsPublished] = useState(false);
  const [gaCode, setGaCode] = useState('');
  const [adsId, setAdsId] = useState('');
  const [adsLabel, setAdsLabel] = useState('');
  const [copied, setCopied] = useState(false);

  // Widget State
  const [widgetColor, setWidgetColor] = useState('#2563eb');
  const [widgetTextColor, setWidgetTextColor] = useState('#ffffff');
  const [widgetText, setWidgetText] = useState('Calcular Rescisão');
  const [widgetPosition, setWidgetPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  const [widgetAction, setWidgetAction] = useState<'modal' | 'link'>('modal');
  const [targetUrl, setTargetUrl] = useState('');

  // Derived data
  const cityName = companyProfile.address.city || "Sua Cidade";
  const firmName = companyProfile.name;
  const currentYear = new Date().getFullYear();
  const displayTitle = firmName && firmName.trim() !== '' ? firmName : `Calculadora Rescisão em ${cityName}`;
  const publicUrl = `https://app.lexonline.com.br/c/${username || 'usuario'}/calculorescisaotrabalhista`;

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

  const handleGeneratePDF = async () => {
    const resultElement = document.getElementById('calculation-result');
    
    if (!resultElement) return;
    
    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Header for PDF
      pdf.setFontSize(10);
      pdf.text(`Gerado por: ${firmName}`, 10, 10);
      pdf.text(`Data: ${new Date().toLocaleDateString()}`, 10, 15);

      const canvasResult = await html2canvas(resultElement, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const imgDataResult = canvasResult.toDataURL('image/png');
      const imgHeightResult = (canvasResult.height * pdfWidth) / canvasResult.width;
      
      pdf.addImage(imgDataResult, 'PNG', 0, 20, pdfWidth, imgHeightResult);

      pdf.save(`calculo-rescisao-${input.employeeName || 'funcionario'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
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

  const handleCalculate = () => { if (validateForm()) { setResult(calculateRescisao(input)); setStep('lead'); } };
  
  const submitLead = (e: React.FormEvent) => { 
      e.preventDefault(); 
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
          setLeadErrors({ email: "Por favor, insira um e-mail válido." });
          return;
      }
      // Clear errors if valid
      setLeadErrors({});

      if (!leadData.consent) { 
          alert("Necessário aceitar os termos da LGPD."); 
          return; 
      } 
      setStep('result'); 
  };
  
  const generateWidgetCode = () => {
    const dataAttrs = [
        `id="rescisao-widget"`,
        `data-color="${widgetColor}"`,
        `data-text-color="${widgetTextColor}"`,
        `data-text="${widgetText}"`,
        `data-pos="${widgetPosition}"`,
        `data-type="${widgetAction}"`,
        widgetAction === 'link' ? `data-url="${targetUrl}"` : ''
    ].filter(Boolean).join(' ');
    return `<!-- Widget Calculadora de Rescisão -->\n<div ${dataAttrs}></div>\n<script src="https://calculadora.lexonline.com.br/widget.js" async></script>\n<!-- End Widget -->`;
  };

  const getInputClass = (fieldName: keyof CalculatorInput) => {
      const baseClass = "w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg outline-none transition-all dark:text-white";
      const validClass = "border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500";
      const errorClass = "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50 dark:bg-red-900/10";
      return `${baseClass} ${errors[fieldName] ? errorClass : validClass}`;
  };

  const noticeOptions: NoticeType[] = ['Indenizado', 'Trabalhado', 'Dispensado/Não Cumprido'];

  return (
    <div className="w-full space-y-6">
      
      {/* --- TAB NAVIGATION --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button 
                  onClick={() => setActiveTab('page')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all border-b-2
                      ${activeTab === 'page' 
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' 
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                  <Layout size={18} /> Página da Calculadora
              </button>
              <button 
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all border-b-2
                      ${activeTab === 'settings' 
                          ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20' 
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                  <Settings size={18} /> Configurações
              </button>
          </div>
      </div>

      {/* --- TAB: PAGE (CALCULATOR UI) --- */}
      {activeTab === 'page' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-visible w-full relative z-10 animate-in fade-in slide-in-from-bottom-2">
          {/* Calculator Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white transition-all rounded-t-2xl">
            <div className="flex flex-col gap-2">
              <h1 className="sr-only">Calculadora de Rescisão Trabalhista em {cityName}</h1>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-h-[40px]">
                    <Calculator className="h-6 w-6 text-indigo-200 flex-shrink-0" />
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2 w-full max-w-lg animate-in fade-in slide-in-from-left-2 duration-200">
                        <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} autoFocus className="bg-white/10 text-white placeholder-indigo-200 border border-white/30 rounded px-2 py-1 text-2xl font-bold outline-none focus:ring-2 focus:ring-white/50 w-full" />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-200 rounded-lg"><Check size={20} /></button>
                        <button onClick={() => setIsEditingTitle(false)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg"><X size={20} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 group">
                        <h2 className="text-2xl font-bold truncate">{displayTitle}</h2>
                        {onUpdateFirmName && (
                          <button onClick={handleStartEdit} className="flex items-center gap-2 text-indigo-200 hover:text-white hover:bg-white/10 px-2 py-1 rounded-lg transition-all cursor-pointer opacity-80 hover:opacity-100">
                            <Pencil size={16} /><span className="text-xs font-normal">Editar</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {username && isPublished && (
                      <div className="flex items-center gap-2 hidden md:flex">
                          <div className="flex items-center gap-2 bg-green-500/20 px-4 py-2 rounded-lg border border-green-400/50">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-green-100 uppercase tracking-wide">
                                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> No Ar
                              </span>
                              <div className="h-4 w-px bg-white/20 mx-1"></div>
                              <button onClick={() => handleCopy(publicUrl)} className="text-white hover:text-green-200"><Copy size={16} /></button>
                              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-200"><ExternalLink size={16} /></a>
                          </div>
                      </div>
                  )}
              </div>
              <p className="text-indigo-100 mt-1 opacity-90 pl-8">Simulador de rescisão CLT atualizado {currentYear}. Cálculo exato para {cityName}.</p>
            </div>
          </div>

          {/* Calculator Inputs/Results */}
          <div className="p-6 md:p-8">
            {step === 'input' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2"><FileText size={18} /> Dados do Contrato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
                            Último Salário Bruto 
                            <InfoTooltip text="Informe o salário base registrado em carteira, sem os descontos." />
                        </label>
                        <div className="relative"><DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="number" value={input.salary} onChange={(e) => handleInputChange('salary', Number(e.target.value))} className={getInputClass('salary')} placeholder="0,00" /></div>
                        {errors.salary && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium"><AlertTriangle size={12}/>{errors.salary}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Data de Admissão</label>
                        <div className="relative"><Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="date" value={input.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className={getInputClass('startDate')} /></div>
                        {errors.startDate && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium"><AlertTriangle size={12}/>{errors.startDate}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Data de Afastamento</label>
                        <div className="relative"><Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="date" value={input.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} className={getInputClass('endDate')} /></div>
                        {errors.endDate && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium"><AlertTriangle size={12}/>{errors.endDate}</p>}
                    </div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2"><label className="text-sm font-medium text-slate-600 dark:text-slate-400">Motivo da Rescisão</label><div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">{Object.values(TerminationType).map(t => { const isActive = input.terminationType === t; return <button key={t} onClick={() => handleInputChange('terminationType', t)} className={`flex-1 min-w-[150px] py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>{t}</button>; })}</div></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2"><Clock size={18} /> Aviso Prévio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2"><label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">Tipo de Aviso</label><div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">{noticeOptions.map((option) => { const isActive = input.noticeType === option; return <button key={option} onClick={() => handleInputChange('noticeType', option)} className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700 ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>{option}</button>; })}</div></div>
                    {input.noticeType === 'Trabalhado' && ( 
                        <> 
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
                                    Início do Aviso
                                    <InfoTooltip text="Data de início do cumprimento do aviso prévio." />
                                </label>
                                <div className="relative"><Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="date" value={input.noticeStartDate || ''} onChange={(e) => handleInputChange('noticeStartDate', e.target.value)} className={getInputClass('noticeStartDate')} /></div>
                                {errors.noticeStartDate && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium"><AlertTriangle size={12}/>{errors.noticeStartDate}</p>}
                            </div> 
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
                                    Fim do Aviso
                                    <InfoTooltip text="Data do último dia trabalhado no aviso." />
                                </label>
                                <div className="relative"><Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="date" value={input.noticeEndDate || ''} onChange={(e) => handleInputChange('noticeEndDate', e.target.value)} className={getInputClass('noticeEndDate')} /></div>
                                {errors.noticeEndDate && <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium"><AlertTriangle size={12}/>{errors.noticeEndDate}</p>}
                            </div> 
                        </> 
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2"><AlertCircle size={18} /> Adicionais e Variáveis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
                            Média Valor Horas Extras (R$)
                            <InfoTooltip text="Média mensal do valor recebido como horas extras nos últimos 12 meses." />
                        </label>
                        <div className="relative"><DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="number" value={input.additionalHours} onChange={(e) => handleInputChange('additionalHours', Number(e.target.value))} className={getInputClass('additionalHours')} placeholder="0,00" /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center">
                            Saldo FGTS (p/ Multa)
                            <InfoTooltip text="Informe o saldo total da conta do FGTS para cálculo da multa de 40%." />
                        </label>
                        <div className="relative"><DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="number" value={input.fgtsBalance} onChange={(e) => handleInputChange('fgtsBalance', Number(e.target.value))} className={getInputClass('fgtsBalance')} placeholder="0,00" /></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-2"><label className="text-sm font-medium text-slate-600 dark:text-slate-400">Férias Vencidas</label><div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">{[{ label: '0', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }].map((opt) => ( <button key={opt.value} onClick={() => handleInputChange('vacationOverdue', opt.value)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${input.vacationOverdue === opt.value ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}>{opt.label}</button> ))}</div></div>
                    <label className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors h-[50px] mt-auto relative group">
                        <input type="checkbox" checked={input.additionalDanger} onChange={(e) => handleInputChange('additionalDanger', e.target.checked)} className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Periculosidade (30%)</span>
                        <div className="absolute right-2 top-2"><InfoTooltip text="Adicional para atividades de risco." /></div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors h-[50px] mt-auto relative group">
                        <input type="checkbox" checked={input.additionalNight} onChange={(e) => handleInputChange('additionalNight', e.target.checked)} className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center">Adic. Noturno (20%)</span>
                        <div className="absolute right-2 top-2"><InfoTooltip text="Para trabalho entre 22h e 5h." /></div>
                    </label>
                    <label className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors h-[50px] mt-auto relative group">
                        <input type="checkbox" checked={input.applyFine477} onChange={(e) => handleInputChange('applyFine477', e.target.checked)} className="h-5 w-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Multa Art. 477</span>
                        <div className="absolute right-2 top-2"><InfoTooltip text="Multa por atraso no pagamento da rescisão." /></div>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-4"><button onClick={handleCalculate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center gap-2">Calcular Rescisão <ArrowRight size={20} /></button></div>
              </div>
            )}
            {step === 'lead' && ( 
                <div className="max-w-md mx-auto py-8 animate-in fade-in zoom-in duration-300">
                    <div className="text-center mb-6">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Cálculo Pronto!</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Para visualizar o demonstrativo completo e baixar o PDF, preencha seus dados abaixo.</p>
                    </div>
                    <form onSubmit={submitLead} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Seu Nome</label>
                            <input required type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={leadData.name} onChange={e => setLeadData({...leadData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <input 
                                required 
                                type="email" 
                                className={`w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:text-white transition-colors ${leadErrors.email ? 'border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/10' : 'dark:border-slate-600'}`}
                                value={leadData.email} 
                                onChange={e => {
                                    setLeadData({...leadData, email: e.target.value});
                                    if(leadErrors.email) setLeadErrors({...leadErrors, email: undefined});
                                }} 
                            />
                            {leadErrors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12}/>{leadErrors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                            <input required type="tel" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white" value={leadData.phone} onChange={e => setLeadData({...leadData, phone: e.target.value})} />
                        </div>
                        <div className="flex items-start gap-3 mt-4">
                            <input type="checkbox" required id="consent" checked={leadData.consent} onChange={e => setLeadData({...leadData, consent: e.target.checked})} className="mt-1 h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                            <label htmlFor="consent" className="text-xs text-slate-500 dark:text-slate-400">Concordo com o processamento dos meus dados conforme a <strong>Política de Privacidade</strong> e aceito receber o resultado por email.</label>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4 shadow-lg transition-transform hover:scale-[1.02]">Ver Resultado Completo</button>
                        <button onClick={() => setStep('input')} type="button" className="w-full text-slate-500 text-sm py-2 hover:underline">Voltar e editar dados</button>
                    </form>
                </div> 
            )}
            {step === 'result' && result && ( 
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Demonstrativo de Rescisão</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data Projetada: <span className="font-mono text-slate-700 dark:text-slate-300">{formatDate(result.projectedEndDate)}</span> • Aviso Prévio: <span className="font-mono text-slate-700 dark:text-slate-300">{input.noticeType} {result.noticeDays > 0 ? `(${result.noticeDays} dias)` : ''}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGeneratingPdf ? 'Gerando...' : <><Download size={18} /> Baixar PDF</>}
                    </button>
                  </div>
                </div>
                
                <div id="calculation-result" className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                  {/* DISCLAIMER RESTAURADO E DESTACADO */}
                  <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                          <strong>Atenção:</strong> Esta é uma estimativa aproximada para fins educativos. O cálculo exato pode variar dependendo de convenções coletivas de <strong>{cityName} / {companyProfile.address.state}</strong> e detalhes específicos do contrato. Não substitui a conferência de um advogado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border rounded-lg dark:border-slate-700 mb-8">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-3">Descrição</th>
                          <th className="px-6 py-3">Base Calc.</th>
                          <th className="px-6 py-3">Ref.</th>
                          <th className="px-6 py-3 text-right text-green-600 dark:text-green-400">Proventos</th>
                          <th className="px-6 py-3 text-right text-red-600 dark:text-red-400">Descontos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {result.items.map((item, idx) => ( 
                          <tr key={idx} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="px-6 py-3 font-medium text-slate-800 dark:text-slate-200">{item.description}<span className="block text-xs text-slate-400 font-normal">{item.group}</span></td>
                            <td className="px-6 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{item.calculationBasis ? formatCurrency(item.calculationBasis) : '-'}</td>
                            <td className="px-6 py-3 text-slate-500 dark:text-slate-400">{item.reference}</td>
                            <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{item.type === 'earning' ? formatCurrency(item.value) : '-'}</td>
                            <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-300">{item.type === 'deduction' ? formatCurrency(item.value) : '-'}</td>
                          </tr> 
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Totais</td>
                          <td className="px-6 py-4 text-right text-green-600 dark:text-green-400">{formatCurrency(result.totalEarnings)}</td>
                          <td className="px-6 py-4 text-right text-red-600 dark:text-red-400">{formatCurrency(result.totalDeductions)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-slate-300 uppercase tracking-widest text-xs font-bold mb-2">Valor Líquido Rescisório</p>
                    <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">{formatCurrency(result.netTotal)}</div>
                    <p className="text-slate-400 text-sm max-w-lg">* O pagamento deve ser feito em até 10 dias após o término do contrato.</p>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <button onClick={() => { setStep('input'); setResult(null); }} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline font-medium">Realizar Novo Cálculo</button>
                </div>
              </div> 
            )}
          </div>

          {/* SEO Content in Page Tab */}
          <div className="px-6 md:px-8 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl border-t border-slate-200 dark:border-slate-700">
            <SEOGuide company={companyProfile} />
          </div>
        </div>
      )}

      {/* --- TAB: SETTINGS (4 SECTIONS) --- */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {/* Section 1: Rastreamento & Publicação */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <BarChart size={24} className="text-indigo-600" /> 1. Rastreamento & Publicação
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure suas tags de conversão e publique sua página.</p>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Google Analytics (ID)</label>
                            <input type="text" value={gaCode} onChange={(e) => setGaCode(e.target.value)} placeholder="G-XXXXXXXXXX" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Google Ads ID</label>
                                <input type="text" value={adsId} onChange={(e) => setAdsId(e.target.value)} placeholder="AW-..." className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Ads Label</label>
                                <input type="text" value={adsLabel} onChange={(e) => setAdsLabel(e.target.value)} placeholder="AbC..." className="w-full px-4 py-2 border rounded-lg dark:bg-slate-900 dark:border-slate-600 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        <span className="text-sm text-slate-500">Status atual: <span className={`font-bold ${isPublished ? 'text-green-600' : 'text-orange-500'}`}>{isPublished ? 'Publicada' : 'Rascunho'}</span></span>
                        <button onClick={() => setIsPublished(!isPublished)} className={`px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all ${isPublished ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`}>
                            {isPublished ? <><Unlock size={18} /> Despublicar</> : <><Globe size={18} /> Publicar Página</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 2: Embed / Iframe */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Code size={24} className="text-blue-600" /> 2. Embed no Site (Iframe)
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Copie o código abaixo para inserir a calculadora no seu site WordPress, Wix, etc.</p>
                </div>
                <div className="p-6">
                    <div className="bg-slate-900 rounded-xl p-4 relative group">
                        <code className="text-blue-300 font-mono text-sm break-all block leading-relaxed">
                            &lt;iframe src="{publicUrl}" width="100%" height="800px" frameborder="0"&gt;&lt;/iframe&gt;
                        </code>
                        <button onClick={() => handleCopy(`<iframe src="${publicUrl}" width="100%" height="800px" frameborder="0"></iframe>`)} className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 3: Direct Link */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <LinkIcon size={24} className="text-purple-600" /> 3. Link Direto
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Link otimizado para compartilhar no WhatsApp, Instagram ou Email.</p>
                </div>
                <div className="p-6">
                    <div className="flex gap-2">
                        <div className="relative w-full">
                            <input readOnly value={publicUrl} className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300 outline-none" />
                            <LinkIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                        </div>
                        <button onClick={() => handleCopy(publicUrl)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
                            Copiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 4: Widget Config */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <MessageSquare size={24} className="text-green-600" /> 4. Widget Flutuante
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Crie um botão flutuante para seu site que abre a calculadora.</p>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Widget Controls */}
                    <div className="lg:col-span-5 space-y-6">
                        <div>
                            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 block flex items-center gap-2"><Palette size={16}/> Cor do Botão</label>
                            <div className="flex flex-wrap gap-2">
                                {PRESET_COLORS.map(color => (
                                    <button key={color} onClick={() => setWidgetColor(color)} className={`w-8 h-8 rounded-full border-2 transition-transform ${widgetColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                                ))}
                                <input type="color" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} className="w-8 h-8 p-0 rounded-full border-0 cursor-pointer overflow-hidden" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-sm font-semibold text-slate-600 mb-2 block">Cor Texto</label><input type="color" value={widgetTextColor} onChange={(e) => setWidgetTextColor(e.target.value)} className="w-full h-10 p-1 border rounded cursor-pointer" /></div>
                            <div>
                                <label className="text-sm font-semibold text-slate-600 mb-2 block">Posição</label>
                                <select value={widgetPosition} onChange={(e) => setWidgetPosition(e.target.value as any)} className="w-full p-2 border rounded bg-slate-50 text-sm">
                                    <option value="bottom-right">Inferior Dir.</option>
                                    <option value="bottom-left">Inferior Esq.</option>
                                    <option value="top-right">Superior Dir.</option>
                                    <option value="top-left">Superior Esq.</option>
                                </select>
                            </div>
                        </div>
                        <div><label className="text-sm font-semibold text-slate-600 mb-2 block">Texto</label><input type="text" value={widgetText} onChange={(e) => setWidgetText(e.target.value)} className="w-full p-2 border rounded text-sm" /></div>
                        
                        <div className="pt-4 border-t border-slate-100">
                            <label className="text-sm font-semibold text-slate-600 mb-2 block flex items-center gap-2"><Code size={16}/> Código do Widget</label>
                            <div className="bg-slate-900 rounded-lg p-3 relative group">
                                <code className="text-green-300 font-mono text-xs block break-all">{generateWidgetCode()}</code>
                                <button onClick={() => handleCopy(generateWidgetCode())} className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white"><Copy size={14} /></button>
                            </div>
                        </div>
                    </div>
                    {/* Widget Preview */}
                    <div className="lg:col-span-7 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[300px] relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#64748b 1px, transparent 1px)', backgroundSize: '16px 16px'}}></div>
                        <div className="text-slate-400 text-sm font-medium">Prévia do Site</div>
                        
                        {/* The Widget */}
                        <div 
                            className={`absolute flex items-center gap-3 p-4 shadow-xl rounded-full cursor-pointer transition-all hover:scale-105 animate-pulse
                                ${widgetPosition.includes('bottom') ? 'bottom-6' : 'top-6'}
                                ${widgetPosition.includes('right') ? 'right-6' : 'left-6'}
                            `}
                            style={{ backgroundColor: widgetColor, color: widgetTextColor }}
                        >
                            <div className="bg-white/20 p-2 rounded-full"><Layout size={24} color={widgetTextColor} /></div>
                            <div className="font-bold pr-2">{widgetText}</div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      )}

      {/* Floating WhatsApp Button (Global) */}
      {companyProfile.phone && (
        <a href={`https://wa.me/55${companyProfile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MSG)}`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-pulse group" title="Falar com Especialista" aria-label="Falar no WhatsApp">
          <MessageCircle size={28} className="text-white" />
          <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm pointer-events-none">Falar com Advogado</span>
        </a>
      )}
    </div>
  );
};