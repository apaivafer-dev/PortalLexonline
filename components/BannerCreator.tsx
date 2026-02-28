import React, { useState, useEffect, useRef } from 'react';
import { Settings, Eye, Download, Palette, Type, Layout, ScanLine, Plus, ArrowLeft, Trash2, Clock, Save, Lock } from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { formatDate } from '../lib/utils';
import { UserProfile } from '../types';
import { bannersApi } from '../services/api';

const BANNER_COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];
const FONT_COLORS = ['#ffffff', '#000000', '#2c3e50', '#7f8c8d', '#e67e22', '#8e44ad', '#27ae60', '#c0392b'];

interface BannerConfig {
    id: string;
    createdAt: string;
    companyName: string;
    reviewLink: string;
    bannerTitle: string;
    bannerDescription: string;
    qrInstruction: string;
    instructions: string;
    bannerColor: string;
    fontColor: string;
    frameType: 'google' | 'black' | 'white';
}

const DEFAULT_CONFIG: Omit<BannerConfig, 'id' | 'createdAt'> = {
    companyName: 'Minha Empresa',
    reviewLink: 'https://google.com',
    bannerTitle: 'Avalie-nos no Google',
    bannerDescription: 'Adoraríamos ouvir sobre sua experiênicia!',
    qrInstruction: 'leia o QR Code',
    instructions: 'Nossa missão: Defender os interesses de nossos clientes com excelência e dedicação',
    bannerColor: '#e74c3c',
    fontColor: '#ffffff',
    frameType: 'google'
};

// Sub-component for Mini Preview (Gallery Item)
const MiniBannerPreview: React.FC<{ config: BannerConfig, onClick: () => void, isLocked?: boolean }> = ({ config, onClick, isLocked }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, config.reviewLink, {
                width: 60,
                margin: 0,
                color: { dark: '#000000', light: '#ffffff' }
            }, (error) => { if (error) console.error(error); });
        }
    }, [config.reviewLink]);

    const formattedDate = new Date(config.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div
            onClick={onClick}
            className={`group cursor-pointer flex flex-col gap-3 ${isLocked ? 'opacity-70' : ''}`}
        >
            <div className="relative w-full pt-[141%] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:shadow-lg group-hover:border-indigo-300 group-hover:scale-[1.02]">
                <div
                    className="absolute inset-0 p-4 flex flex-col items-center text-center"
                    style={{ backgroundColor: config.bannerColor, color: config.fontColor }}
                >
                    <h1 className="text-[10px] font-bold uppercase tracking-wide mb-2 leading-tight line-clamp-2">{config.companyName}</h1>
                    <h2 className="text-[8px] font-bold mb-1 leading-tight line-clamp-1">{config.bannerTitle}</h2>
                    <p className="text-[6px] opacity-95 mb-2 leading-relaxed line-clamp-2">{config.bannerDescription}</p>

                    <div className={`p-1 bg-white rounded mb-1 relative w-fit mx-auto ${config.frameType === 'black' ? 'border border-black' : ''} ${config.frameType === 'white' ? 'border border-gray-200' : ''}`}>
                        {config.frameType === 'google' && (
                            <div className="absolute inset-0 rounded pointer-events-none" style={{ borderTop: '2px solid #ea4335', borderRight: '2px solid #4285f4', borderBottom: '2px solid #34a853', borderLeft: '2px solid #fbbc05' }}></div>
                        )}
                        <canvas ref={canvasRef} className="w-[40px] h-[40px] block" />
                    </div>

                    <p className="text-[5px] font-medium uppercase tracking-wider mb-2 opacity-90">{config.qrInstruction}</p>
                    <div className="mt-auto pt-1 w-full text-center">
                        <p className="text-[5px] italic opacity-90 font-medium line-clamp-2 leading-tight">
                            {config.instructions}
                        </p>
                    </div>
                </div>

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    {isLocked ? (
                        <div className="bg-white text-red-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                            <Lock size={12} /> Bloqueado
                        </div>
                    ) : (
                        <div className="bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all shadow-lg flex items-center gap-1">
                            <Settings size={12} /> Editar
                        </div>
                    )}
                </div>
            </div>

            <div className="px-1">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{config.companyName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <Clock size={10} />
                    <span>Criado em: {formattedDate}</span>
                </div>
            </div>
        </div>
    );
};

interface BannerCreatorProps {
    initialCompanyName?: string;
    userProfile?: UserProfile;
}

const mapBanner = (b: any): BannerConfig => ({
    id: b.id,
    createdAt: b.created_at || b.createdAt || new Date().toISOString(),
    companyName: b.company_name || b.companyName || '',
    reviewLink: b.review_link || b.reviewLink || '',
    bannerTitle: b.banner_title || b.bannerTitle || '',
    bannerDescription: b.banner_description || b.bannerDescription || '',
    qrInstruction: b.qr_instruction || b.qrInstruction || '',
    instructions: b.instructions || b.instructions || '',
    bannerColor: b.banner_color || b.bannerColor || '#e74c3c',
    fontColor: b.font_color || b.fontColor || '#ffffff',
    frameType: b.frame_type || b.frameType || 'google'
});

export const BannerCreator = ({ initialCompanyName = 'Minha Empresa', userProfile }: BannerCreatorProps) => {
    // View State
    const [viewMode, setViewMode] = useState<'gallery' | 'editor'>('gallery');
    const [banners, setBanners] = useState<BannerConfig[]>([]);

    // Editor State
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState(initialCompanyName);
    const [reviewLink, setReviewLink] = useState(DEFAULT_CONFIG.reviewLink);
    const [bannerTitle, setBannerTitle] = useState(DEFAULT_CONFIG.bannerTitle);
    const [bannerDescription, setBannerDescription] = useState(DEFAULT_CONFIG.bannerDescription);
    const [qrInstruction, setQrInstruction] = useState(DEFAULT_CONFIG.qrInstruction);
    const [instructions, setInstructions] = useState(DEFAULT_CONFIG.instructions);

    // Visual State
    const [bannerColor, setBannerColor] = useState(DEFAULT_CONFIG.bannerColor);
    const [fontColor, setFontColor] = useState(DEFAULT_CONFIG.fontColor);
    const [frameType, setFrameType] = useState<BannerConfig['frameType']>(DEFAULT_CONFIG.frameType);
    const [isGenerating, setIsGenerating] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bannerPreviewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await bannersApi.getAll();
                const mapped = data.map(mapBanner);
                setBanners(mapped);
                if (mapped.length === 0) {
                    handleCreateNew();
                }
            } catch (err) {
                console.error("Failed to load banners:", err);
            }
        };
        fetchBanners();
    }, [initialCompanyName]);

    // QR Code Generation for Editor
    useEffect(() => {
        if (canvasRef.current && viewMode === 'editor') {
            QRCode.toCanvas(canvasRef.current, reviewLink, {
                width: 112,
                margin: 0,
                color: { dark: '#000000', light: '#ffffff' }
            }, (error) => { if (error) console.error(error); });
        }
    }, [reviewLink, viewMode]);

    const isTrial = userProfile?.plan === 'Trial';
    const limitReached = isTrial && banners.length >= 1;

    const handleCreateNew = () => {
        if (isTrial && banners.length >= 1) {
            alert("Limite de 1 banner atingido no plano Trial. Faça upgrade para criar mais.");
            return;
        }

        setCurrentId(null);
        setCompanyName(initialCompanyName);
        setReviewLink(DEFAULT_CONFIG.reviewLink);
        setBannerTitle(DEFAULT_CONFIG.bannerTitle);
        setBannerDescription(DEFAULT_CONFIG.bannerDescription);
        setQrInstruction(DEFAULT_CONFIG.qrInstruction);
        setInstructions(DEFAULT_CONFIG.instructions);
        setBannerColor(DEFAULT_CONFIG.bannerColor);
        setFontColor(DEFAULT_CONFIG.fontColor);
        setFrameType(DEFAULT_CONFIG.frameType);
        setViewMode('editor');
    };

    const handleEditBanner = (banner: BannerConfig) => {
        if (isTrial && banners.length > 1) {
            alert("Sua conta possui mais banners do que o permitido no plano Trial. Faça o upgrade para voltar a editar.");
            return;
        }

        setCurrentId(banner.id);
        setCompanyName(banner.companyName);
        setReviewLink(banner.reviewLink);
        setBannerTitle(banner.bannerTitle);
        setBannerDescription(banner.bannerDescription);
        setQrInstruction(banner.qrInstruction);
        setInstructions(banner.instructions);
        setBannerColor(banner.bannerColor);
        setFontColor(banner.fontColor);
        setFrameType(banner.frameType);
        setViewMode('editor');
    };

    const handleSaveOnly = async () => {
        setIsGenerating(true);
        try {
            const newConfig = {
                companyName, reviewLink, bannerTitle, bannerDescription,
                qrInstruction, instructions, bannerColor, fontColor, frameType
            };

            if (currentId) {
                const updated = await bannersApi.update(currentId, newConfig);
                const mapped = mapBanner(updated);
                setBanners(prev => prev.map(b => b.id === currentId ? mapped : b));
            } else {
                const created = await bannersApi.create(newConfig);
                const mapped = mapBanner(created);
                setBanners(prev => [mapped, ...prev]);
                setCurrentId(mapped.id);
            }
            return true;
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar. Tente novamente.');
            return false;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!bannerPreviewRef.current) return;

        setIsGenerating(true);
        try {
            const saved = await handleSaveOnly();
            if (!saved) return;

            const element = bannerPreviewRef.current;

            // ── SEGUINDO A LÓGICA QUE FUNCIONOU NO CARTÃO ──
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: bannerColor,
                logging: false,
                onclone: (clonedDoc) => {
                    const area = clonedDoc.getElementById('banner-capture-area');
                    if (area) {
                        // Forçar remoção de qualquer filtro que cause oklab
                        area.style.filter = 'none';
                        area.style.backdropFilter = 'none';
                        area.style.boxShadow = 'none';
                        area.style.transition = 'none';

                        const all = area.querySelectorAll('*');
                        all.forEach(el => {
                            if (el instanceof HTMLElement) {
                                el.style.filter = 'none';
                                el.style.backdropFilter = 'none';
                                el.style.boxShadow = 'none';
                                el.style.transition = 'none';
                                el.style.animation = 'none';

                                // Converter cores oklab potenciais para RGBA fixo em caso de transparência
                                const computedStyle = window.getComputedStyle(el);
                                if (computedStyle.backgroundColor.includes('oklab')) {
                                    el.style.backgroundColor = 'rgba(0,0,0,0.1)';
                                }
                            }
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png');

            // Usando pontos (pt) para garantir precisão como no InteractiveCard
            const pdf = new jsPDF({
                unit: 'pt',
                format: [canvas.width * 0.75, canvas.height * 0.75]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
            pdf.save(`banner-${companyName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

            alert('Banner salvo e PDF gerado com sucesso!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setIsGenerating(false);
        }
    };

    if (viewMode === 'gallery') {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus Banners</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie e crie novos materiais de divulgação.</p>
                        {isTrial && (
                            <p className="text-xs text-orange-600 mt-2 font-bold flex items-center gap-1">
                                <Lock size={12} /> Plano Trial: Limite de 1 banner. {banners.length}/1 usado(s).
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleCreateNew}
                        disabled={limitReached}
                        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg
                            ${limitReached
                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/20'
                            }`}
                    >
                        {limitReached ? <Lock size={20} /> : <Plus size={20} />}
                        Criar Novo Banner
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <button
                        onClick={handleCreateNew}
                        disabled={limitReached}
                        className={`group flex flex-col items-center justify-center gap-4 aspect-[210/297] rounded-xl border-2 border-dashed transition-all
                            ${limitReached
                                ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-60'
                                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-pointer'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${limitReached ? 'bg-slate-200 dark:bg-slate-700 text-slate-400' : 'bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600'}`}>
                            {limitReached ? <Lock size={24} /> : <Plus size={24} />}
                        </div>
                        <span className={`font-bold text-sm ${limitReached ? 'text-slate-400' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                            {limitReached ? 'Limite Atingido' : 'Adicionar Novo'}
                        </span>
                    </button>

                    {banners.map(banner => (
                        <MiniBannerPreview
                            key={banner.id}
                            config={banner}
                            isLocked={isTrial && banners.length > 1}
                            onClick={() => handleEditBanner(banner)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setViewMode('gallery')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                            {currentId ? 'Editar Banner' : 'Novo Banner'}
                        </h1>
                    </div>
                    {currentId && (
                        <button
                            onClick={async () => {
                                if (confirm('Tem certeza que deseja excluir este banner?')) {
                                    try {
                                        await bannersApi.delete(currentId);
                                        setBanners(prev => prev.filter(b => b.id !== currentId));
                                        setViewMode('gallery');
                                    } catch (err) {
                                        console.error('Falha ao excluir banner:', err);
                                        alert('Erro ao excluir banner.');
                                    }
                                }
                            }}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors" title="Excluir"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome da Empresa</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Título do Banner (acima do QR)</label>
                        <input
                            type="text"
                            value={bannerTitle}
                            onChange={(e) => setBannerTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                        <textarea
                            value={bannerDescription}
                            onChange={(e) => setBannerDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Link para Avaliação (QR Code)</label>
                        <input
                            type="url"
                            value={reviewLink}
                            onChange={(e) => setReviewLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Instrução (abaixo do QR)</label>
                        <input
                            type="text"
                            value={qrInstruction}
                            onChange={(e) => setQrInstruction(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Frase de destaque</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-100 dark:text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                        />
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                    <Palette size={16} /> Cor do Fundo
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {BANNER_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setBannerColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${bannerColor === c ? 'border-slate-800 dark:border-white scale-110 shadow-md' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={bannerColor}
                                        onChange={(e) => setBannerColor(e.target.value)}
                                        className="w-8 h-8 p-0 rounded-full overflow-hidden border-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                    <Type size={16} /> Cor da Fonte
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {FONT_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFontColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${fontColor === c ? 'border-slate-800 dark:border-white scale-110 shadow-md' : 'border-slate-200'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={fontColor}
                                        onChange={(e) => setFontColor(e.target.value)}
                                        className="w-8 h-8 p-0 rounded-full overflow-hidden border-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2">
                                <ScanLine size={16} /> Moldura do QR Code
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'google', label: 'Google', border: 'border-transparent' },
                                    { id: 'black', label: 'Preta', border: 'border-black' },
                                    { id: 'white', label: 'Branca', border: 'border-slate-300' }
                                ].map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => setFrameType(f.id as any)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
                                            ${frameType === f.id
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold text-slate-400 ${f.id === 'black' ? 'border-2 border-black' : f.id === 'white' ? 'border-2 border-slate-300' : ''}`}>
                                            {f.id === 'google' ? (
                                                <div className="w-full h-full rounded relative overflow-hidden p-1">
                                                    <div className="absolute top-0 left-0 w-full h-[3px] bg-[#ea4335]"></div>
                                                    <div className="absolute right-0 top-0 h-full w-[3px] bg-[#4285f4]"></div>
                                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#34a853]"></div>
                                                    <div className="absolute left-0 top-0 h-full w-[3px] bg-[#fbbc05]"></div>
                                                    <div className="w-full h-full flex items-center justify-center">QR</div>
                                                </div>
                                            ) : 'QR'}
                                        </div>
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{f.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <Eye className="text-indigo-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Prévia do Banner</h1>
                    </div>

                    <div
                        id="banner-capture-area"
                        ref={bannerPreviewRef}
                        className="w-full aspect-[210/297] max-w-[400px] mx-auto rounded-xl px-12 pt-10 pb-12 flex flex-col items-center text-center relative transition-colors duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
                        style={{ backgroundColor: bannerColor, color: fontColor }}
                    >
                        <div className="flex-1 w-full flex flex-col items-center justify-center">
                            {companyName && (
                                <h1 className="text-2xl font-bold uppercase tracking-wide mb-6 leading-tight">
                                    {companyName}
                                </h1>
                            )}
                            {bannerTitle && <h2 className="text-2xl font-bold mb-4 leading-tight">{bannerTitle}</h2>}
                            {bannerDescription && <p className="text-lg opacity-95 mb-6 leading-relaxed whitespace-pre-wrap">{bannerDescription}</p>}

                            <div className={`p-4 bg-white rounded-2xl mb-4 relative w-fit mx-auto
                                ${frameType === 'black' ? 'border-[3px] border-black' : ''}
                                ${frameType === 'white' ? 'border-[3px] border-gray-200' : ''}
                            `}>
                                {frameType === 'google' && (
                                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                                        borderTop: '4px solid #ea4335',
                                        borderRight: '4px solid #4285f4',
                                        borderBottom: '4px solid #34a853',
                                        borderLeft: '4px solid #fbbc05',
                                    }}></div>
                                )}
                                <canvas ref={canvasRef} className="w-[140px] h-[140px] block" />
                            </div>

                            {qrInstruction && <p className="text-sm font-medium uppercase tracking-wider mb-4 opacity-90">{qrInstruction}</p>}

                            <div className="w-full text-left space-y-2.5 mb-6 rounded-xl p-5 instructions-box" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-[12px]">1</span>
                                    <span className="font-medium">Abra o aplicativo da câmera</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-[12px]">2</span>
                                    <span className="font-medium">Aponte para o QR Code</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-[12px]">3</span>
                                    <span className="font-medium">Avalie nossa empresa</span>
                                </div>
                            </div>
                        </div>

                        {instructions && (
                            <div className="w-full mt-auto">
                                <p className="text-sm italic opacity-90 font-medium leading-tight whitespace-pre-wrap">
                                    {instructions}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex justify-center flex-col items-center">
                            <button
                                onClick={handleDownloadPDF}
                                disabled={isGenerating}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50"
                            >
                                {isGenerating ? "Processando..." : (
                                    <><Download size={22} /> Salvar e Baixar PDF</>
                                )}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-2">O banner será salvo automaticamente antes do download.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};