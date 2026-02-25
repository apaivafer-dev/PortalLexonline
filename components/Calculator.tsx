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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Settings State
  const [isPublished, setIsPublished] = useState(false);
  const [gaCode, setGaCode] = useState('');
  const [adsId, setAdsId] = useState('');
  const [googleAdsId, setGoogleAdsId] = useState('');
  const [googleAdsLabel, setGoogleAdsLabel] = useState('');
  const [copied, setCopied] = useState(false);

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

  const [isSavingConfig, setIsSavingConfig] = useState(false);

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
          companyName: companyProfile.name,
          whatsappNumber: customPhoneNumber,
          whatsappMessage,
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

  // Derived data
  const cityName = companyProfile.address.city || "Sua Cidade";
  const firmName = companyProfile.name;
  const currentYear = new Date().getFullYear();
  const displayTitle = firmName && firmName.trim() !== '' ? firmName : `Calculadora Rescisão em ${cityName}`;
  const baseUrl = import.meta.env.VITE_FRONTEND_URL || 'https://portallexonline-app.web.app';
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

  const handleGeneratePDF = async () => {
    const resultElement = document.getElementById('calculation-result');

    if (!resultElement) return;

    setIsGeneratingPdf(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let currentY = 15;

      // --- COMPANY HEADER SECTION ---
      // Background Box
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(203, 213, 225); // slate-300
      pdf.roundedRect(margin, currentY, pdfWidth - (margin * 2), 55, 3, 3, 'FD');

      // Header Content Container
      const contentX = margin + 8;
      let textY = currentY + 10;

      // Company Name
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(companyProfile.name || "Advocacia Trabalhista", contentX, textY);

      textY += 8;

      // Address (Symbolized with text label)
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105); // slate-600
      const address = companyProfile.address;
      const addressLine = `${address.street}, ${address.number} - ${address.neighborhood}`;
      const cityLine = `${address.city} - ${address.state}, CEP: ${address.cep}`;

      pdf.text(`Endereço: ${addressLine}`, contentX, textY);
      textY += 5;
      pdf.text(cityLine, contentX, textY);

      textY += 8;

      // Contact Info Row 1 (Email / Site)
      pdf.text(`Email: ${companyProfile.email}`, contentX, textY);
      if (companyProfile.website) {
        pdf.text(`Site: ${companyProfile.website}`, contentX + 80, textY);
      }

      textY += 8;

      // --- CLICKABLE CONTACTS ---
      const cleanPhone = companyProfile.phone.replace(/\D/g, '');
      const whatsMsg = encodeURIComponent("Quero falar com um especialista");

      // Phone Link
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(37, 99, 235); // blue-600
      pdf.textWithLink(`Tel: ${companyProfile.phone}`, contentX, textY, { url: `tel:${cleanPhone}` });

      // WhatsApp Link
      pdf.setTextColor(22, 163, 74); // green-600
      pdf.textWithLink(`WhatsApp: ${companyProfile.phone}`, contentX + 60, textY, { url: `https://wa.me/55${cleanPhone}?text=${whatsMsg}` });

      // Call to action hint
      textY += 6;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text("(Clique nos números acima para entrar em contato)", contentX, textY);


      // --- RESULT IMAGE ---
      // Scale logic moved here to avoid html2canvas capturing header
      const canvasResult = await html2canvas(resultElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgDataResult = canvasResult.toDataURL('image/png');
      const imgWidth = pdfWidth - (margin * 2);
      const imgHeight = (canvasResult.height * imgWidth) / canvasResult.width;

      // Place image below header
      const imageY = currentY + 60; // Header height + padding
      pdf.addImage(imgDataResult, 'PNG', margin, imageY, imgWidth, imgHeight);

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Gerado em ${new Date().toLocaleDateString()} por Portal LexOnline`, margin, pdf.internal.pageSize.getHeight() - 10);

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
      setLeadErrors({ email: "Por favor, insira um e-mail válido." });
      return;
    }
    // Clear errors if valid
    setLeadErrors({});

    if (!leadData.consent) {
      alert("Necessário aceitar os termos da LGPD.");
      return;
    }

    if (isPublic && username) {
      try {
        await publishApi.submitPublicLead(username, {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          estimatedValue: result?.netTotal || 0,
        });
      } catch (err: any) {
        console.error("Erro ao enviar lead", err);
        // We still proceed to result to not block the user, 
        // but normally we might want to alert if CRM fails
      }
    }

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
    const baseClass = "w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border rounded-2xl outline-none transition-all dark:text-white";
    const validClass = "border-transparent hover:border-slate-200 dark:hover:border-white/10 focus:border-slate-300 dark:focus:border-white/20 focus:ring-4 focus:ring-slate-100 dark:focus:ring-white/5";
    const errorClass = "border-red-300 focus:ring-4 focus:ring-red-100 bg-red-50 dark:bg-red-900/10";
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

  const noticeOptions: NoticeType[] = ['Indenizado', 'Trabalhado', 'Dispensado/Não Cumprido'];

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
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 text-white transition-all">
            <div className="flex flex-col gap-4">
              <h1 className="sr-only">Calculadora de Rescisão Trabalhista em {cityName}</h1>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  {!isPublic && isEditingTitle ? (
                    <div className="flex items-center gap-2 w-full max-w-lg animate-in fade-in slide-in-from-left-2 duration-200">
                      <input type="text" value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} autoFocus className="bg-white/10 text-white placeholder-slate-400 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold outline-none focus:ring-2 focus:ring-white/50 w-full" />
                      <button onClick={handleSaveEdit} className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl"><Check size={20} /></button>
                      <button onClick={() => setIsEditingTitle(false)} className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl"><X size={20} /></button>
                    </div>
                  ) : (
                    <div className={!isPublic && onUpdateFirmName ? "group cursor-pointer" : "group"} onClick={!isPublic && onUpdateFirmName ? handleStartEdit : undefined}>
                      <h2 className="text-3xl font-bold truncate tracking-tight">{displayTitle}</h2>
                      {!isPublic && onUpdateFirmName && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1 group-hover:text-white transition-colors">
                          <Pencil size={12} /><span>Clique para editar título</span>
                        </div>
                      )}
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
              <p className="text-slate-400 max-w-2xl text-lg">Simulador de rescisão CLT atualizado {currentYear}. Cálculo exato considerando as leis trabalhistas.</p>
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
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        Último Salário Bruto
                        <InfoTooltip text="Informe o salário base registrado em carteira, sem os descontos." />
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                          <DollarSign size={18} />
                        </div>
                        <input type="number" value={input.salary} onChange={(e) => handleInputChange('salary', Number(e.target.value))} className={getInputClass('salary')} placeholder="0,00" />
                      </div>
                      {errors.salary && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.salary}</p>}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Data de Admissão</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                          <Calendar size={18} />
                        </div>
                        <input type="date" value={input.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} className={getInputClass('startDate')} />
                      </div>
                      {errors.startDate && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.startDate}</p>}
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Data de Afastamento</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                          <Calendar size={18} />
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
                            <button key={t} onClick={() => handleInputChange('terminationType', t)} className={`flex-1 min-w-[150px] py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>
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
                            <button key={option} onClick={() => handleInputChange('noticeType', option)} className={`flex-1 py-3 px-6 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {input.noticeType === 'Trabalhado' && (
                      <>
                        <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Início do Aviso</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                              <Calendar size={18} />
                            </div>
                            <input type="date" value={input.noticeStartDate || ''} onChange={(e) => handleInputChange('noticeStartDate', e.target.value)} className={getInputClass('noticeStartDate')} />
                          </div>
                          {errors.noticeStartDate && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.noticeStartDate}</p>}
                        </div>
                        <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2">
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Fim do Aviso</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                              <Calendar size={18} />
                            </div>
                            <input type="date" value={input.noticeEndDate || ''} onChange={(e) => handleInputChange('noticeEndDate', e.target.value)} className={getInputClass('noticeEndDate')} />
                          </div>
                          {errors.noticeEndDate && <p className="text-xs text-red-500 flex items-center gap-1 ml-1 font-medium"><AlertTriangle size={12} />{errors.noticeEndDate}</p>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 dark:bg-white/5"></div>

                {/* Section 3 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-sm font-black">3</span>
                    Adicionais e Variáveis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        Média Valor Horas Extras (R$)
                        <InfoTooltip text="Média mensal do valor recebido como horas extras nos últimos 12 meses." />
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                          <DollarSign size={18} />
                        </div>
                        <input type="number" value={input.additionalHours} onChange={(e) => handleInputChange('additionalHours', Number(e.target.value))} className={getInputClass('additionalHours')} placeholder="0,00" />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                        Saldo FGTS (p/ Multa)
                        <InfoTooltip text="Informe o saldo total da conta do FGTS para cálculo da multa de 40%." />
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors">
                          <DollarSign size={18} />
                        </div>
                        <input type="number" value={input.fgtsBalance} onChange={(e) => handleInputChange('fgtsBalance', Number(e.target.value))} className={getInputClass('fgtsBalance')} placeholder="0,00" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-2.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Férias Vencidas</label>
                      <div className="flex gap-2 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-transparent">
                        {[{ label: '0', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }].map((opt) => (
                          <button key={opt.value} onClick={() => handleInputChange('vacationOverdue', opt.value)} className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${input.vacationOverdue === opt.value ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all h-[56px] mt-auto relative group select-none
                        ${input.additionalDanger ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white text-white dark:text-black' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-300'}
                    `}>
                      <input type="checkbox" checked={input.additionalDanger} onChange={(e) => handleInputChange('additionalDanger', e.target.checked)} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${input.additionalDanger ? 'border-white dark:border-black' : 'border-slate-400'}`}>
                        {input.additionalDanger && <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-black" />}
                      </div>
                      <span className="text-sm font-semibold">Periculosidade (30%)</span>
                    </label>

                    <label className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all h-[56px] mt-auto relative group select-none
                        ${input.additionalNight ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white text-white dark:text-black' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-300'}
                    `}>
                      <input type="checkbox" checked={input.additionalNight} onChange={(e) => handleInputChange('additionalNight', e.target.checked)} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${input.additionalNight ? 'border-white dark:border-black' : 'border-slate-400'}`}>
                        {input.additionalNight && <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-black" />}
                      </div>
                      <span className="text-sm font-semibold">Adic. Noturno (20%)</span>
                    </label>

                    <label className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all h-[56px] mt-auto relative group select-none
                        ${input.applyFine477 ? 'bg-slate-900 border-slate-900 dark:bg-white dark:border-white text-white dark:text-black' : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 text-slate-600 dark:text-slate-300'}
                    `}>
                      <input type="checkbox" checked={input.applyFine477} onChange={(e) => handleInputChange('applyFine477', e.target.checked)} className="hidden" />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${input.applyFine477 ? 'border-white dark:border-black' : 'border-slate-400'}`}>
                        {input.applyFine477 && <div className="w-2.5 h-2.5 rounded-full bg-white dark:bg-black" />}
                      </div>
                      <span className="text-sm font-semibold">Multa Art. 477</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-8">
                  <button onClick={handleCalculate} className="bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 transform hover:-translate-y-1">
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
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Para visualizar o demonstrativo completo e baixar o PDF detalhado, por favor, identifique-se abaixo.</p>
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
                    <label htmlFor="consent" className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer leading-relaxed">Concordo com o processamento dos meus dados conforme a <strong>Política de Privacidade</strong> e aceito receber o resultado.</label>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-bold py-4 rounded-2xl mt-4 shadow-lg transition-all hover:scale-[1.02]">Ver Resultado Completo</button>
                  <button onClick={() => setStep('input')} type="button" className="w-full text-slate-400 text-sm py-2 hover:text-slate-600 dark:hover:text-slate-200 font-medium">Voltar e editar dados</button>
                </form>
              </div>
            )}

            {step === 'result' && result && (
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Resultado do Cálculo</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Data Projetada: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(result.projectedEndDate)}</span></p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleGeneratePDF} disabled={isGeneratingPdf} className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGeneratingPdf ? 'Gerando...' : <><Download size={20} /> Baixar PDF</>}
                    </button>
                  </div>
                </div>

                <div id="calculation-result" className="p-4 bg-white dark:bg-[#1A1D23] rounded-3xl">
                  {/* DISCLAIMER */}
                  <div className="mb-8 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 p-5 rounded-r-xl">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-6 w-6 text-amber-500" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                          <strong>Estimativa Educativa:</strong> O valor exato depende da convenção coletiva de <strong>{cityName}</strong>. Consulte um advogado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden border border-slate-100 dark:border-white/5 rounded-2xl mb-8">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">Verba</th>
                          <th className="px-6 py-4">Ref.</th>
                          <th className="px-6 py-4 text-right">Proventos</th>
                          <th className="px-6 py-4 text-right">Descontos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {result.items.map((item, idx) => (
                          <tr key={idx} className="bg-white dark:bg-[#1A1D23] hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-900 dark:text-white block">{item.description}</span>
                              <span className="text-xs text-slate-400">{item.group}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.reference}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">{item.type === 'earning' ? formatCurrency(item.value) : '-'}</td>
                            <td className="px-6 py-4 text-right font-mono font-medium text-red-500 dark:text-red-400">{item.type === 'deduction' ? formatCurrency(item.value) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-white/5 font-bold border-t border-slate-200 dark:border-white/10">
                        <tr>
                          <td colSpan={2} className="px-6 py-5 text-right text-slate-600 dark:text-slate-300">Subtotais</td>
                          <td className="px-6 py-5 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(result.totalEarnings)}</td>
                          <td className="px-6 py-5 text-right text-red-500 dark:text-red-400">{formatCurrency(result.totalDeductions)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="bg-slate-900 dark:bg-black text-white rounded-[24px] p-8 md:p-10 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
                    <p className="text-slate-400 uppercase tracking-widest text-xs font-bold mb-3">Valor Líquido a Receber</p>
                    <div className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">{formatCurrency(result.netTotal)}</div>
                    <p className="text-slate-400 text-sm max-w-lg bg-white/10 px-4 py-1.5 rounded-full">* Pagamento em até 10 dias corridos.</p>
                  </div>
                </div>

                <div className="text-center mt-10">
                  <button onClick={() => { setStep('input'); setResult(null); }} className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline font-semibold transition-colors">Realizar Novo Cálculo</button>
                </div>
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
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 text-white">
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

          <div className="p-8 md:p-12 space-y-8">
            {/* Status Section */}
            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe size={20} className="text-indigo-500" /> Visibilidade
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Defina se sua calculadora está acessível publicamente.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">
                <span className={`text-sm font-bold px-3 ${isPublished ? 'text-green-500' : 'text-slate-400'}`}>
                  {isPublished ? 'Publicado' : 'Rascunho'}
                </span>
                <button
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isPublished ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isPublished ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <button
                  onClick={handleSavePublish}
                  disabled={isSavingConfig}
                  className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Save size={16} /> {isSavingConfig ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Left Column */}
              <div className="space-y-8">
                {/* Links de Acesso */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LinkIcon size={24} className="text-indigo-500" />
                    Links de Acesso
                  </h3>

                  <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Link Público da Página</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={publicUrl}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-slate-600 dark:text-slate-300 outline-none"
                        />
                        <button
                          onClick={() => handleCopy(publicUrl)}
                          className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                          title="Copiar Link"
                        >
                          <Copy size={20} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Código Iframe (Site)</label>
                      <div className="bg-slate-900 rounded-xl p-4 relative group">
                        <code className="text-indigo-300 font-mono text-xs break-all block pr-8">
                          {generateIframeCode()}
                        </code>
                        <button
                          onClick={() => handleCopy(generateIframeCode())}
                          className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Section */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart size={24} className="text-blue-500" />
                    Rastreamento
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Google Analytics (G-XXXX)</label>
                      <div className="relative">
                        <Code size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={gaCode}
                          onChange={(e) => setGaCode(e.target.value)}
                          placeholder="G-1234567890"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Meta Pixel ID</label>
                      <div className="relative">
                        <Code size={18} className="absolute left-4 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={adsId}
                          onChange={(e) => setAdsId(e.target.value)}
                          placeholder="123456789012345"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Google Ads Conversion Section */}
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Target size={18} className="text-red-500" />
                        Conversão Google Ads
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conversion ID</label>
                          <input
                            type="text"
                            value={googleAdsId}
                            onChange={(e) => setGoogleAdsId(e.target.value)}
                            placeholder="AW-123456789"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conversion Label</label>
                          <input
                            type="text"
                            value={googleAdsLabel}
                            onChange={(e) => setGoogleAdsLabel(e.target.value)}
                            placeholder="AbC-123_xYz"
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (Widget Config) */}
              <div className="space-y-6">

                {/* WhatsApp Message Config - NEW SECTION */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageCircle size={24} className="text-green-500" />
                    WhatsApp & Contato
                  </h3>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Número de Destino</label>
                    <input
                      type="tel"
                      value={customPhoneNumber}
                      onChange={(e) => setCustomPhoneNumber(e.target.value)}
                      placeholder={companyProfile.phone || "5511999999999"}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all"
                    />
                    <p className="text-xs text-slate-400 mt-1">Deixe em branco para usar o telefone do perfil da empresa.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem Inicial</label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-green-500 outline-none dark:text-white transition-all resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Texto pré-preenchido quando o cliente clicar no botão.</p>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 pt-4">
                  <Palette size={24} className="text-purple-500" />
                  Widget Flutuante
                </h3>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Cor Principal</label>
                    <div className="flex flex-wrap gap-3">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setWidgetColor(color)}
                          className={`w-10 h-10 rounded-full transition-transform hover:scale-110 shadow-sm ${widgetColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                      <input
                        type="color"
                        value={widgetColor}
                        onChange={(e) => setWidgetColor(e.target.value)}
                        className="w-10 h-10 p-0 rounded-full border-0 overflow-hidden cursor-pointer shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Text Input */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Texto do Botão</label>
                    <input
                      type="text"
                      value={widgetText}
                      onChange={(e) => setWidgetText(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none dark:text-white transition-all"
                    />
                  </div>

                  {/* Action Config */}
                  <div className="pt-2 space-y-3 border-t border-slate-100 dark:border-white/5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <MousePointerClick size={16} /> Ação do Clique
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setWidgetAction('modal')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${widgetAction === 'modal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
                      >
                        Abrir Calculadora
                      </button>
                      <button
                        onClick={() => setWidgetAction('link')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${widgetAction === 'link' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 ring-1 ring-purple-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
                      >
                        Redirecionar
                      </button>
                    </div>

                    {widgetAction === 'link' && (
                      <div className="animate-in fade-in slide-in-from-top-1 pt-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL de Destino</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={targetUrl}
                          onChange={(e) => setTargetUrl(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-purple-500"
                        />
                        <p className="text-xs text-slate-400 mt-1">Deixe em branco para usar o link da calculadora.</p>
                      </div>
                    )}
                  </div>

                  {/* Widget Preview (Updated with Interactive Corners) */}
                  <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-4">Prévia & Posição</p>
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl h-48 relative border border-dashed border-slate-300 dark:border-slate-700 shadow-inner overflow-hidden">

                      {/* Browser Mock Header */}
                      <div className="absolute top-0 left-0 w-full h-8 bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center px-3 gap-1.5 z-10">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        <div className="ml-2 text-[10px] text-slate-500 font-medium">site-do-cliente.com.br</div>
                      </div>

                      {/* Corner Position Selectors */}
                      {/* Top Left */}
                      <button
                        onClick={() => setWidgetPosition('top-left')}
                        title="Posicionar Acima à Esquerda"
                        className={`absolute top-12 left-4 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg transition-colors z-20 hover:scale-110
                                            ${widgetPosition === 'top-left' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
                      />
                      {/* Top Right */}
                      <button
                        onClick={() => setWidgetPosition('top-right')}
                        title="Posicionar Acima à Direita"
                        className={`absolute top-12 right-4 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg transition-colors z-20 hover:scale-110
                                            ${widgetPosition === 'top-right' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
                      />
                      {/* Bottom Left */}
                      <button
                        onClick={() => setWidgetPosition('bottom-left')}
                        title="Posicionar Abaixo à Esquerda"
                        className={`absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg transition-colors z-20 hover:scale-110
                                            ${widgetPosition === 'bottom-left' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
                      />
                      {/* Bottom Right */}
                      <button
                        onClick={() => setWidgetPosition('bottom-right')}
                        title="Posicionar Abaixo à Direita"
                        className={`absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 rounded-br-lg transition-colors z-20 hover:scale-110
                                            ${widgetPosition === 'bottom-right' ? 'border-purple-600 dark:border-purple-400 scale-110' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400'}`}
                      />

                      {/* The Widget Button */}
                      <div
                        className="absolute px-6 py-3 rounded-full text-white font-bold shadow-lg flex items-center gap-2 cursor-default transition-all duration-300 z-30"
                        style={{
                          backgroundColor: widgetColor,
                          color: widgetTextColor,
                          ...getPreviewStyle()
                        }}
                      >
                        <Calculator size={18} />
                        {widgetText}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget Script */}
                <div className="bg-slate-900 dark:bg-black p-6 rounded-[24px] text-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2"><Code size={20} className="text-green-400" /> Script do Widget</h3>
                    <button onClick={() => handleCopy(generateWidgetCode())} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <code className="block font-mono text-xs text-slate-300 bg-black/30 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                    {generateWidgetCode()}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button (Global) */}
      {activePhone && (
        <a href={`https://wa.me/55${activePhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noreferrer" className="fixed bottom-8 right-8 z-50 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-[0_8px_30px_rgba(37,211,102,0.4)] transition-all duration-300 hover:scale-110 group" title="Falar com Especialista" aria-label="Falar no WhatsApp">
          <MessageCircle size={28} className="text-white" />
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">Falar com Advogado</span>
        </a>
      )}
    </div>
  );
};