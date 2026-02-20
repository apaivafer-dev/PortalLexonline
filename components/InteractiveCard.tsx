import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { UserProfile } from '../types';
import { Image, Download, Settings } from 'lucide-react';

// Declare types for Ionicons and window libraries
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': any;
    }
  }
  interface Window {
    jspdf: any;
  }
}

// --- CONSTANTS & CONFIG ---
const NETWORK_DEFAULT_COLORS: Record<string, string> = {
    whatsapp: '#25D366', telegram: '#0088cc', telefone: '#10b981', email: '#ef4444',
    agendamento: '#8b5cf6', pagamento: '#22c55e', vcard: '#6366f1', linkedin: '#0A66C2',
    site: '#3b82f6', behance: '#1769ff', loja: '#f59e0b', instagram: '#E4405F',
    facebook: '#1877F2', youtube: '#FF0000', tiktok: '#000000', twitter: '#1DA1F2',
    medium: '#000000', spotify: '#1DB954', discord: '#5865F2', localizacao: '#ea4335'
};

const REDES = [
  {key: 'whatsapp', name: 'WhatsApp', urlPrefix: 'https://wa.me/', icon: 'logo-whatsapp'},
  {key: 'telegram', name: 'Telegram', urlPrefix: 'https://t.me/', icon: 'send-outline'},
  {key: 'telefone', name: 'Telefone', urlPrefix: 'tel:', icon: 'call-outline'},
  {key: 'email', name: 'Email', urlPrefix: 'mailto:', icon: 'mail-outline'},
  {key: 'agendamento', name: 'Agendamento', urlPrefix: 'https://calendly.com/', icon: 'calendar-outline'},
  {key: 'pagamento', name: 'Pagamento', urlPrefix: 'https://pay.me/', icon: 'cash-outline'},
  {key: 'vcard', name: 'Vcard', icon: 'person-circle-outline'},
  {key: 'linkedin', name: 'LinkedIn', urlPrefix: 'https://linkedin.com/in/', icon: 'logo-linkedin'},
  {key: 'site', name: 'Website', urlPrefix: 'https://', icon: 'globe-outline'},
  {key: 'behance', name: 'Behance', urlPrefix: 'https://www.behance.net/', icon: 'logo-behance'},
  {key: 'loja', name: 'Loja Online', urlPrefix: 'https://myshop.com/', icon: 'bag-handle-outline'},
  {key: 'instagram', name: 'Instagram', urlPrefix: 'https://instagram.com/', icon: 'logo-instagram'},
  {key: 'facebook', name: 'Facebook', urlPrefix: 'https://facebook.com/', icon: 'logo-facebook'},
  {key: 'youtube', name: 'YouTube', urlPrefix: 'https://youtube.com/', icon: 'logo-youtube'},
  {key: 'tiktok', name: 'TikTok', urlPrefix: 'https://tiktok.com/@', icon: 'logo-tiktok'},
  {key: 'twitter', name: 'Twitter', urlPrefix: 'https://twitter.com/', icon: 'logo-twitter'},
  {key: 'medium', name: 'Medium', urlPrefix: 'https://medium.com/@', icon: 'logo-medium'},
  {key: 'spotify', name: 'Spotify', urlPrefix: 'https://open.spotify.com/', icon: 'musical-notes-outline'},
  {key: 'discord', name: 'Discord', urlPrefix: 'https://discord.gg/', icon: 'logo-discord'},
  {key: 'localizacao', name: 'Localização', urlPrefix: 'https://maps.google.com/?q=', icon: 'location-outline'}
];

const DEFAULT_BUTTON_STYLE = {
    border: '#ffffff',
    bg: 'transparent',
    icon: '#ffffff',
    label: '#ffffff',
    fontFamily: 'Arial',
    fontSize: '12px',
    useNetworkColor: false,
    previewBg: '#00ABE4'
};

interface ButtonConfig {
    active: boolean;
    title: string;
    social: string | null;
    url: string;
    vcardData?: any;
    customColors?: { border?: string; bg?: string; icon?: string; label?: string };
    customFont?: string;
    customSize?: string;
}

interface CustomText {
    id: string;
    text: string;
    font: string;
    size: string;
    color: string;
    x: number;
    y: number;
}

interface InteractiveCardProps {
    userProfile?: UserProfile;
}

export const InteractiveCard = ({ userProfile }: InteractiveCardProps) => {
    // --- STATE ---
    const [imageUploaded, setImageUploaded] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [buttons, setButtons] = useState<ButtonConfig[]>(Array.from({length: 6}, () => ({ active: false, title: '', social: null, url: '' })));
    const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
    
    // Layout Config
    const [layout, setLayout] = useState('3x2');
    const [alignment, setAlignment] = useState('center');
    const [maxButtons, setMaxButtons] = useState(3);
    const [slotRadius, setSlotRadius] = useState('0px');
    const [defaultStyle, setDefaultStyle] = useState(DEFAULT_BUTTON_STYLE);

    // UI State
    const [activePanel, setActivePanel] = useState<'none' | 'text' | 'config' | 'button' | 'download'>('none');
    const [mobileTab, setMobileTab] = useState<'text' | 'layout'>('text');
    const [editingButtonIndex, setEditingButtonIndex] = useState<number | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'warning'|'info'} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    
    // Refs
    const cardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        // Initial setup or responsive check could go here
        if (window.innerWidth > 768 && !imageUploaded) {
            // Desktop initial state handled by conditional rendering
        }
    }, [imageUploaded]);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // --- HANDLERS ---

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            setBackgroundImage(ev.target?.result as string);
            setImageUploaded(true);
            if (window.innerWidth > 768) {
                setActivePanel('text'); // Show text panel by default on desktop after upload
            }
            showToast('Imagem carregada com sucesso!', 'success');
        };
        reader.readAsDataURL(file);
    };

    const showToast = (msg: string, type: 'success'|'error'|'warning'|'info' = 'info') => {
        setToast({ msg, type });
    };

    const toggleButtonActive = (idx: number) => {
        if (idx >= maxButtons) {
            showToast(`Aumente o número de botões para usar o slot ${idx + 1}`, 'warning');
            return;
        }
        setEditingButtonIndex(idx);
        setActivePanel('button');
    };

    const saveButton = (idx: number, data: Partial<ButtonConfig>) => {
        setButtons(prev => {
            const newButtons = [...prev];
            newButtons[idx] = { ...newButtons[idx], ...data, active: true };
            return newButtons;
        });
        setActivePanel(window.innerWidth > 768 ? 'config' : 'none');
        setEditingButtonIndex(null);
        showToast('Botão salvo!', 'success');
    };

    const removeButton = (idx: number) => {
        setButtons(prev => {
            const newButtons = [...prev];
            newButtons[idx] = { active: false, title: '', social: null, url: '' };
            return newButtons;
        });
        setActivePanel(window.innerWidth > 768 ? 'config' : 'none');
        setEditingButtonIndex(null);
        showToast('Botão removido.', 'info');
    };

    const addCustomText = (text: string, font: string, size: string, color: string) => {
        if (!text.trim()) {
            showToast('Digite um texto', 'warning');
            return;
        }
        const newText: CustomText = {
            id: `text-${Date.now()}`,
            text,
            font,
            size: size + 'px',
            color,
            x: 50,
            y: 50
        };
        setCustomTexts(prev => [...prev, newText]);
        showToast('Texto adicionado! Arraste para posicionar', 'success');
    };

    const updateCustomText = (id: string, data: Partial<CustomText>) => {
        setCustomTexts(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    };

    const removeCustomText = (id: string) => {
        setCustomTexts(prev => prev.filter(t => t.id !== id));
        if (editingTextId === id) setEditingTextId(null);
        showToast('Texto removido', 'info');
    };

    // --- DRAG AND DROP LOGIC ---
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
        // Simple implementation - could be improved with a library like dnd-kit but keeping it simple/vanilla-like
        const el = e.currentTarget as HTMLElement;
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const isTouch = 'touches' in e;
        const clientX = isTouch ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = isTouch ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;

        const startX = clientX;
        const startY = clientY;
        const startLeft = parseFloat(el.style.left);
        const startTop = parseFloat(el.style.top);

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            moveEvent.preventDefault();
            const moveClientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
            const moveClientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;

            const deltaX = moveClientX - startX;
            const deltaY = moveClientY - startY;

            // Convert delta to percentage relative to card size
            const deltaXPercent = (deltaX / rect.width) * 100;
            const deltaYPercent = (deltaY / rect.height) * 100;

            let newLeft = startLeft + deltaXPercent;
            let newTop = startTop + deltaYPercent;

            // Boundary checks (0-100%)
            newLeft = Math.max(0, Math.min(100, newLeft));
            newTop = Math.max(0, Math.min(100, newTop));

            updateCustomText(id, { x: newLeft, y: newTop });
        };

        const handleUp = () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleUp);
        };

        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleUp);
    };

    // --- DOWNLOAD LOGIC ---
    const handleDownload = async (format: 'pdf' | 'html' | 'qrcode') => {
        if (!cardRef.current) return;
        setIsLoading(true);
        setLoadingMsg('Gerando arquivo...');

        try {
            // Hide controls for capture
            const controls = cardRef.current.querySelector('#cardHeaderControls') as HTMLElement;
            if (controls) controls.style.display = 'none';

            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: null,
                allowTaint: true
            });

            if (controls) controls.style.display = 'flex';

            if (format === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'pt',
                    format: [canvas.width * 0.75, canvas.height * 0.75]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
                
                // Add Links
                const cardRect = cardRef.current.getBoundingClientRect();
                const scaleX = (canvas.width * 0.75) / cardRect.width;
                const scaleY = (canvas.height * 0.75) / cardRect.height;

                buttons.forEach((btn, idx) => {
                    if (!btn.active || !btn.url) return;
                    const slotEl = cardRef.current?.querySelector(`.btn-slot[data-idx="${idx}"]`);
                    if (slotEl) {
                        const rect = slotEl.getBoundingClientRect();
                        const x = (rect.left - cardRect.left) * scaleX;
                        const y = (rect.top - cardRect.top) * scaleY;
                        const w = rect.width * scaleX;
                        const h = rect.height * scaleY;
                        pdf.link(x, y, w, h, { url: btn.url });
                    }
                });

                pdf.save('cartao_interativo.pdf');
            } else if (format === 'qrcode') {
                 // Generate QR Code for a URL (needs a hosted URL, for now we just generate QR of a placeholder or the first link)
                 // In a real app, you'd upload the HTML and get a URL. Here we'll just generate a QR code image of the first link or a placeholder.
                 const url = buttons.find(b => b.active && b.url)?.url || 'https://www.lexonline.com.br';
                 const qrUrl = await QRCode.toDataURL(url);
                 const link = document.createElement('a');
                 link.href = qrUrl;
                 link.download = 'qrcode.png';
                 link.click();
            }

            showToast('Download concluído!', 'success');
        } catch (error) {
            console.error(error);
            showToast('Erro ao gerar arquivo.', 'error');
        } finally {
            setIsLoading(false);
            setActivePanel(window.innerWidth > 768 ? 'config' : 'none');
        }
    };

    // --- RENDER HELPERS ---
    const renderButtons = () => {
        const slots = [];
        const isRectangular = slotRadius === '4px' || slotRadius === '16px';
        
        // Determine grid columns based on layout
        let gridStyle: React.CSSProperties = {
            display: 'grid',
            gap: layout === '3x2' ? '10px' : '24px',
            width: '100%',
            alignItems: 'end',
            justifyItems: alignment === 'left' ? 'start' : (alignment === 'right' ? 'end' : 'center'),
        };

        if (layout === '3x2') {
            gridStyle.gridTemplateColumns = isRectangular ? '1fr' : 'repeat(3, 1fr)';
            gridStyle.gridAutoRows = '72px';
            gridStyle.marginBottom = '48px';
        } else {
            // Vertical layouts
            gridStyle.display = 'flex';
            gridStyle.flexDirection = 'column';
            gridStyle.position = 'absolute';
            gridStyle.top = '84px';
            gridStyle.width = '90px';
            gridStyle.gap = '24px';
            if (layout === 'vertical-left') gridStyle.left = '4px';
            if (layout === 'vertical-right') gridStyle.right = '4px';
        }

        for (let i = 0; i < maxButtons; i++) {
            const btn = buttons[i];
            const rede = btn.social ? REDES.find(r => r.key === btn.social) : null;
            
            // Styles
            const border = btn.customColors?.border || defaultStyle.border;
            const bg = btn.customColors?.bg || defaultStyle.bg;
            const iconColor = btn.customColors?.icon || (defaultStyle.useNetworkColor && rede ? NETWORK_DEFAULT_COLORS[rede.key] : defaultStyle.icon);
            const labelColor = btn.customColors?.label || defaultStyle.label;
            const font = btn.customFont || defaultStyle.fontFamily;
            const size = btn.customSize || defaultStyle.fontSize;

            const slotStyle: React.CSSProperties = {
                borderRadius: slotRadius,
                border: `2px ${border === 'transparent' ? 'dashed' : 'solid'} ${border === 'transparent' ? '#ffffff' : border}`,
                backgroundColor: bg,
                color: labelColor,
                fontFamily: font,
                fontSize: size,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: isRectangular ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isRectangular ? 'flex-start' : 'center',
                padding: isRectangular ? '12px 16px' : '8px',
                gap: '6px',
                width: isRectangular ? '100%' : (slotRadius === '50%' ? '56px' : '100%'),
                height: isRectangular ? 'auto' : (slotRadius === '50%' ? '56px' : '100%'),
                minHeight: isRectangular ? '56px' : 'auto',
                position: 'relative'
            };

            slots.push(
                <div 
                    key={i} 
                    className={`btn-slot group transition-transform hover:scale-105 ${!btn.active ? 'opacity-70 border-dashed' : ''}`}
                    style={slotStyle}
                    onClick={() => toggleButtonActive(i)}
                    data-idx={i}
                >
                    {btn.active ? (
                        <>
                            <div className="btn-icon" style={{ color: iconColor, fontSize: '22px', display: 'flex' }}>
                                <ion-icon name={rede?.icon || 'link-outline'}></ion-icon>
                            </div>
                            <div className="btn-label" style={{ 
                                position: slotRadius === '50%' ? 'absolute' : 'static',
                                bottom: slotRadius === '50%' ? '-24px' : 'auto',
                                width: slotRadius === '50%' ? 'max-content' : 'auto',
                                maxWidth: slotRadius === '50%' ? '100px' : 'auto'
                            }}>
                                {btn.title || rede?.name || 'Link'}
                            </div>
                            <div className="absolute top-1 right-1 bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition-opacity">
                                <ion-icon name="pencil-outline" style={{ fontSize: '14px' }}></ion-icon>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="btn-icon"><ion-icon name="add-circle-outline" style={{ fontSize: '24px' }}></ion-icon></div>
                            <div className="btn-label" style={{ fontSize: '10px' }}>Adicionar</div>
                        </>
                    )}
                </div>
            );
        }

        return <div id="buttonsGrid" style={gridStyle}>{slots}</div>;
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col items-center overflow-hidden">
            
            {/* --- STYLES --- */}
            <style>{`
                :root { --card-w: 400px; --card-h: 711px; --card-bg: #00ABE4; }
                .card-shadow { box-shadow: 0 20px 60px rgba(0,0,0,0.12); }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 3px; }
                @media (max-width: 768px) {
                    :root { --card-w: calc(100vw - 24px); --card-h: auto; }
                }
            `}</style>

            {/* --- TOAST --- */}
            {toast && (
                <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium z-[9999] animate-in fade-in slide-in-from-bottom-2 ${
                    toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-slate-800'
                }`}>
                    {toast.msg}
                </div>
            )}

            {/* --- LOADING OVERLAY --- */}
            {isLoading && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="font-medium">{loadingMsg}</p>
                </div>
            )}

            {/* --- MAIN LAYOUT --- */}
            <div className="fixed inset-0 z-40 bg-[#f8fafc] overflow-y-auto custom-scrollbar">
                <div className="min-h-full w-full flex flex-col md:flex-row items-center justify-center p-4 pt-24 md:p-8 gap-8 md:gap-12">
                
                {/* --- LEFT PANEL (Desktop: Instructions) --- */}
                <div className="hidden md:flex flex-col w-[320px] h-[711px] bg-white rounded-[20px] shadow-xl overflow-hidden shrink-0 transition-all duration-300">
                    <div className="p-8 flex flex-col h-full">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Guia rápido</h2>
                        <div className="space-y-6">
                            {[
                                {icon: 'image-outline', title: '1. Suba uma foto', desc: 'Faça Upload inicial para o fundo.'},
                                {icon: 'settings-outline', title: '2. Configure o layout', desc: 'Personalize cores e botões.'},
                                {icon: 'download-outline', title: '3. Faça o download', desc: 'Baixe em PDF, HTML ou QR Code.'}
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl hover:bg-blue-50 transition-colors group">
                                    <div className="w-10 h-10 bg-[#00ABE4] rounded-full flex items-center justify-center text-white shrink-0">
                                        <ion-icon name={item.icon} style={{fontSize: '20px'}}></ion-icon>
                                    </div>
                                    <div>
                                        <strong className="block text-slate-700 mb-1">{item.title}</strong>
                                        <p className="text-sm text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-auto p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800 flex items-center gap-2">
                                <ion-icon name="information-circle-outline" style={{fontSize: '18px'}}></ion-icon>
                                <strong>Dica:</strong> Use a aba "Texto" no painel direito para adicionar textos personalizados.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- CENTER: CARD --- */}
                <div className="relative z-10 shrink-0">
                    <div 
                        id="card" 
                        ref={cardRef}
                        className="relative bg-[#00ABE4] shadow-2xl overflow-hidden flex flex-col"
                        style={{
                            width: 'var(--card-w)',
                            height: 'var(--card-h)',
                            aspectRatio: window.innerWidth <= 768 ? '400/711' : 'auto',
                            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {/* Header Controls */}
                        <div id="cardHeaderControls" className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/50 to-transparent grid grid-cols-3 items-center px-4 z-20">
                            {/* Left: Upload */}
                            <div className="flex justify-start">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors backdrop-blur-sm ${!imageUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!imageUploaded}
                                    title="Alterar Imagem"
                                >
                                    <Image size={24} />
                                </button>
                            </div>

                            {/* Center: Download */}
                            <div className="flex justify-center">
                                <button 
                                    onClick={() => setActivePanel('download')}
                                    className={`w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors backdrop-blur-sm ${!imageUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!imageUploaded}
                                    title="Download"
                                >
                                    <Download size={24} />
                                </button>
                            </div>

                            {/* Right: Settings */}
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setActivePanel('config')}
                                    className={`w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors backdrop-blur-sm ${!imageUploaded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!imageUploaded}
                                    title="Configurações"
                                >
                                    <Settings size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Upload Overlay */}
                        {!imageUploaded && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <ion-icon name="cloud-upload-outline" style={{fontSize: '48px', color: 'white'}}></ion-icon>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Envie a imagem do cartão</h2>
                                <p className="text-white/80 mb-8">Arraste e solte ou clique para selecionar</p>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/50 rounded-xl text-white font-bold transition-all w-full"
                                >
                                    Selecionar Arquivo
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleImageUpload}
                                />
                            </div>
                        )}

                        {/* Custom Texts Layer */}
                        {customTexts.map(text => (
                            <div
                                key={text.id}
                                className="absolute cursor-move select-none z-10 group"
                                style={{
                                    left: `${text.x}%`,
                                    top: `${text.y}%`,
                                    fontFamily: text.font,
                                    fontSize: text.size,
                                    color: text.color,
                                    whiteSpace: 'nowrap'
                                }}
                                onMouseDown={(e) => handleDragStart(e, text.id)}
                                onTouchStart={(e) => handleDragStart(e, text.id)}
                            >
                                {text.text}
                                <div className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 cursor-pointer shadow-md" onClick={(e) => { e.stopPropagation(); removeCustomText(text.id); }}>×</div>
                                <div className="absolute -top-3 -left-3 w-6 h-6 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 cursor-pointer shadow-md" onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setEditingTextId(text.id);
                                    const input = document.getElementById('desktopTextInput') as HTMLInputElement;
                                    if(input) input.value = text.text;
                                    if(window.innerWidth <= 768) setActivePanel('config');
                                }}>
                                    <ion-icon name="pencil-outline"></ion-icon>
                                </div>
                            </div>
                        ))}

                        {/* Buttons Grid */}
                        <div className="mt-auto w-full relative z-0 p-4">
                            {renderButtons()}
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 w-full bg-white/90 py-1 text-center border-t border-black/5 z-20">
                            <a href="https://www.lexonline.com.br" target="_blank" className="text-[9px] font-bold text-slate-600 hover:text-blue-600">Feito por LexOnline</a>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT PANEL (Config/Download/Button) --- */}
                <div className={`
                    fixed inset-0 z-50 md:static md:inset-auto md:z-0
                    flex flex-col w-full md:w-[480px] h-full md:h-[711px] 
                    bg-white md:rounded-[20px] md:shadow-xl overflow-hidden 
                    transition-transform duration-300
                    ${activePanel !== 'none' || (window.innerWidth > 768 && imageUploaded) ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                    ${window.innerWidth > 768 && !imageUploaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                `}>
                    
                    {/* Header (Mobile Only) */}
                    <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100">
                        <h3 className="font-bold text-lg text-slate-800">
                            {activePanel === 'config' ? 'Configurações' : activePanel === 'button' ? 'Editar Botão' : 'Download'}
                        </h3>
                        <button onClick={() => setActivePanel('none')} className="p-2 bg-slate-100 rounded-full">✕</button>
                    </div>

                    {/* CONTENT: CONFIG PANEL */}
                    {(activePanel === 'config' || (window.innerWidth > 768 && activePanel !== 'button' && activePanel !== 'download')) && (
                        <div className="flex flex-col h-full">
                            {/* Tabs (Mobile & Desktop) */}
                            <div className="flex border-b border-slate-100">
                                <button 
                                    onClick={() => setMobileTab('text')}
                                    className={`flex-1 py-3 font-medium text-sm ${mobileTab === 'text' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                                >
                                    Texto
                                </button>
                                <button 
                                    onClick={() => setMobileTab('layout')}
                                    className={`flex-1 py-3 font-medium text-sm ${mobileTab === 'layout' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}
                                >
                                    Layout
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                                {/* Text Tab Content */}
                                <div className={`${mobileTab === 'text' ? 'block' : 'hidden'}`}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Conteúdo</label>
                                            <input 
                                                id="configTextInput"
                                                type="text" 
                                                placeholder="Digite o texto..." 
                                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                                onChange={(e) => {
                                                    if (editingTextId) updateCustomText(editingTextId, { text: e.target.value });
                                                }}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fonte</label>
                                                <select 
                                                    id="configFontSelect" 
                                                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                                    onChange={(e) => {
                                                        if (editingTextId) updateCustomText(editingTextId, { font: e.target.value });
                                                    }}
                                                >
                                                    {['Arial', 'Inter', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'].map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tamanho</label>
                                                <input 
                                                    id="configSizeInput" 
                                                    type="number" 
                                                    defaultValue="24" 
                                                    min="12" 
                                                    max="72" 
                                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                                                    onChange={(e) => {
                                                        if (editingTextId) updateCustomText(editingTextId, { size: e.target.value + 'px' });
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cor</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    id="configColorInput" 
                                                    type="color" 
                                                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" 
                                                    defaultValue="#000000" 
                                                    onChange={(e) => {
                                                        const hexInput = document.getElementById('configColorHex') as HTMLInputElement;
                                                        if (hexInput) hexInput.value = e.target.value.toUpperCase();
                                                        if (editingTextId) updateCustomText(editingTextId, { color: e.target.value });
                                                    }}
                                                />
                                                <input 
                                                    id="configColorHex"
                                                    type="text" 
                                                    className="flex-1 p-2 border border-slate-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                                                    placeholder="#000000" 
                                                    defaultValue="#000000"
                                                    onChange={(e) => {
                                                        const colorInput = document.getElementById('configColorInput') as HTMLInputElement;
                                                        if (colorInput && /^#[0-9A-F]{6}$/i.test(e.target.value)) {
                                                            colorInput.value = e.target.value;
                                                            if (editingTextId) updateCustomText(editingTextId, { color: e.target.value });
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            id="addCustomTextBtn"
                                            onClick={() => {
                                                const input = document.getElementById('configTextInput') as HTMLInputElement;
                                                const font = (document.getElementById('configFontSelect') as HTMLSelectElement).value;
                                                const size = (document.getElementById('configSizeInput') as HTMLInputElement).value;
                                                const color = (document.getElementById('configColorInput') as HTMLInputElement).value;
                                                
                                                if (editingTextId) {
                                                    updateCustomText(editingTextId, { text: input.value, font, size: size + 'px', color });
                                                    setEditingTextId(null);
                                                    input.value = '';
                                                    
                                                    // Reset button state
                                                    const btn = document.getElementById('addCustomTextBtn');
                                                    if (btn) {
                                                        btn.textContent = 'Adicionar Texto ao Cartão';
                                                        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                                        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                                                    }
                                                    
                                                    showToast('Texto atualizado', 'success');
                                                } else {
                                                    addCustomText(input.value, font, size, color);
                                                    input.value = '';
                                                }
                                            }}
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            Adicionar Texto ao Cartão
                                        </button>
                                        
                                        {editingTextId && (
                                            <button 
                                                onClick={() => {
                                                    setEditingTextId(null);
                                                    const input = document.getElementById('configTextInput') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                    
                                                    // Reset button state
                                                    const btn = document.getElementById('addCustomTextBtn');
                                                    if (btn) {
                                                        btn.textContent = 'Adicionar Texto ao Cartão';
                                                        btn.classList.remove('bg-green-600', 'hover:bg-green-700');
                                                        btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                                                    }
                                                }}
                                                className="w-full py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                                            >
                                                Cancelar Edição
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Layout Content */}
                                <div className={`${mobileTab === 'layout' ? 'block' : 'hidden'} space-y-8`}>
                                    <h2 className="hidden md:block text-2xl font-bold text-slate-800 mb-6">Layout</h2>
                                    
                                    {/* Shapes */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Formato</label>
                                        <div className="flex gap-3">
                                            {[
                                                {val: '0px', label: '■'}, {val: '12px', label: '▢'}, 
                                                {val: '50%', label: '●'}, {val: '4px', label: '▬'}, {val: '16px', label: '▭'}
                                            ].map(s => (
                                                <button 
                                                    key={s.val}
                                                    onClick={() => setSlotRadius(s.val)}
                                                    className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center text-xl transition-all ${slotRadius === s.val ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-blue-300'}`}
                                                    title={s.label}
                                                >
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Max Buttons */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Número de Botões</label>
                                        <div className="flex gap-3">
                                            {[3, 4, 5, 6].map(n => (
                                                <button 
                                                    key={n}
                                                    onClick={() => setMaxButtons(n)}
                                                    className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center font-bold transition-all ${maxButtons === n ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-400 hover:border-blue-300'}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Layout Type */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Posicionamento</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                {id: '3x2', label: 'Grade'},
                                                {id: 'vertical-left', label: 'Esq.'},
                                                {id: 'vertical-right', label: 'Dir.'}
                                            ].map(l => (
                                                <button 
                                                    key={l.id}
                                                    onClick={() => setLayout(l.id)}
                                                    className={`py-3 border-2 rounded-xl font-medium text-sm transition-all ${layout === l.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}
                                                >
                                                    {l.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Global Style */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Estilo Padrão</label>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Cor do Fundo</span>
                                                <input type="color" value={defaultStyle.bg === 'transparent' ? '#ffffff' : defaultStyle.bg} onChange={(e) => setDefaultStyle({...defaultStyle, bg: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Cor da Borda</span>
                                                <input type="color" value={defaultStyle.border} onChange={(e) => setDefaultStyle({...defaultStyle, border: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Cor do Texto</span>
                                                <input type="color" value={defaultStyle.label} onChange={(e) => setDefaultStyle({...defaultStyle, label: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0" />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer mt-2">
                                                <input type="checkbox" checked={defaultStyle.useNetworkColor} onChange={(e) => setDefaultStyle({...defaultStyle, useNetworkColor: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-600">Usar cores oficiais das redes</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT: BUTTON OVERLAY */}
                    {activePanel === 'button' && editingButtonIndex !== null && (
                        <div className="flex flex-col h-full p-6 md:p-8 overflow-y-auto custom-scrollbar">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Editar Botão {editingButtonIndex + 1}</h2>
                            
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                {REDES.map(r => (
                                    <button 
                                        key={r.key}
                                        onClick={() => saveButton(editingButtonIndex!, { social: r.key, title: r.name })}
                                        className={`flex flex-col items-center justify-center p-2 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all ${buttons[editingButtonIndex!].social === r.key ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200'}`}
                                    >
                                        <ion-icon name={r.icon} style={{fontSize: '24px', color: r.key === 'vcard' ? '#6366f1' : '#334155'}}></ion-icon>
                                        <span className="text-[10px] mt-1 text-slate-600 truncate w-full text-center">{r.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Título</label>
                                    <input 
                                        type="text" 
                                        value={buttons[editingButtonIndex].title} 
                                        onChange={(e) => saveButton(editingButtonIndex!, { title: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Link (URL)</label>
                                    <input 
                                        type="text" 
                                        value={buttons[editingButtonIndex].url} 
                                        onChange={(e) => saveButton(editingButtonIndex!, { url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => removeButton(editingButtonIndex!)} className="flex-1 py-3 border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors">Remover</button>
                                    <button onClick={() => setActivePanel(window.innerWidth > 768 ? 'config' : 'none')} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Concluir</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONTENT: DOWNLOAD OVERLAY */}
                    {activePanel === 'download' && (
                        <div className="flex flex-col h-full p-6 md:p-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6">Download</h2>
                            
                            <div className="space-y-4">
                                <button onClick={() => handleDownload('pdf')} className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <ion-icon name="document-outline" style={{fontSize: '24px'}}></ion-icon>
                                    </div>
                                    <div className="text-left">
                                        <strong className="block text-slate-800">PDF Interativo</strong>
                                        <span className="text-sm text-slate-500">Ideal para enviar por WhatsApp</span>
                                    </div>
                                </button>

                                <button onClick={() => handleDownload('qrcode')} className="w-full flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                                    <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                                        <ion-icon name="qr-code-outline" style={{fontSize: '24px'}}></ion-icon>
                                    </div>
                                    <div className="text-left">
                                        <strong className="block text-slate-800">QR Code</strong>
                                        <span className="text-sm text-slate-500">Para imprimir ou compartilhar</span>
                                    </div>
                                </button>
                            </div>

                            <div className="mt-auto">
                                <button onClick={() => setActivePanel(window.innerWidth > 768 ? 'config' : 'none')} className="w-full py-3 text-slate-500 font-medium hover:text-slate-800">Voltar</button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    </div>
    );
};

export default InteractiveCard;
