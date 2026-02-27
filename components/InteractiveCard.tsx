import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import JSZip from 'jszip';
import { UserProfile } from '../types';
import { cardsApi } from '../services/api';

// Declare types for Ionicons and window libraries
declare global {
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

interface CardConfig {
    id: string;
    createdAt: string;
    cardName: string; // "nomedocartão"

    // Configs
    layout: string;
    alignment: string;
    slotRadius: string;
    maxButtons: number;
    useBrandColors: boolean;

    // Style
    defaultButtonStyle: any;

    // Content
    backgroundImage: string | null; // DataURL
    buttons: CardButton[];
    customTexts: CustomText[];
}

const DEFAULT_BUTTON_STYLE = {
    border: '#ffffff',
    bg: '#ffffff', // changed default to white for better visibility
    icon: '#000000',
    label: '#ffffff',
    fontFamily: 'Arial',
    fontSize: '12px',
    borderWidth: '2px'
};

const DEFAULT_CONFIG: Omit<CardConfig, 'id' | 'createdAt' | 'cardName'> = {
    layout: '3x2',
    alignment: 'center',
    slotRadius: '8px',
    maxButtons: 6,
    useBrandColors: false,
    defaultButtonStyle: DEFAULT_BUTTON_STYLE,
    backgroundImage: null,
    buttons: Array.from({ length: 6 }, () => ({ active: false, title: '', social: null, url: '', style: null })),
    customTexts: []
};

// --- MINI PREVIEW COMPONENT ---
const MiniCardPreview: React.FC<{ config: CardConfig, onClick: () => void, isLocked?: boolean }> = ({ config, onClick, isLocked }) => {
    const formattedDate = new Date(config.createdAt).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div onClick={onClick} className={`group cursor-pointer flex flex-col gap-3 ${isLocked ? 'opacity-70' : ''}`}>
            {/* Aspect Ratio Container (9:16 approx scaled) */}
            <div className="relative w-full pt-[177%] bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-300 group-hover:shadow-lg group-hover:border-indigo-300 group-hover:scale-[1.02]">

                {/* Content Simulation */}
                <div
                    className="absolute inset-0 bg-cover bg-center flex flex-col p-4"
                    style={{
                        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'linear-gradient(135deg, #00ABE4 0%, #0088cc 100%)'
                    }}
                >
                    {/* Buttons Grid Simulation */}
                    <div className={`mt-auto w-full grid gap-1 ${config.layout === 'list' ? 'grid-cols-1' : 'grid-cols-3'}`}>
                        {config.buttons.slice(0, config.maxButtons).map((btn, idx) => (
                            btn.active ? (
                                <div key={idx} className="h-6 bg-white/20 rounded border border-white/40 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
                                </div>
                            ) : (
                                <div key={idx} className="h-6 border border-white/10 border-dashed rounded"></div>
                            )
                        ))}
                    </div>
                </div>

                {/* Hover Overlay */}
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
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{config.cardName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <Clock size={10} />
                    <span>Criado em: {formattedDate}</span>
                </div>
            </div>
        </div>
    );
};

interface InteractiveCardProps {
    userProfile?: UserProfile;
}

export const InteractiveCard = ({ userProfile }: InteractiveCardProps) => {
    const [viewMode, setViewMode] = useState<'gallery' | 'editor'>('gallery');
    const [cards, setCards] = useState<CardConfig[]>([]);

    // Editor State
    const [currentConfig, setCurrentConfig] = useState<CardConfig | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize Data from API
    useEffect(() => {
        const fetchCards = async () => {
            try {
                const data = await cardsApi.getAll();
                const mapped: CardConfig[] = data.map((d: any) => ({
                    id: d.id,
                    createdAt: d.created_at || d.createdAt || new Date().toISOString(),
                    cardName: d.card_name || d.cardName || 'Sem Nome',
                    ...DEFAULT_CONFIG, // Ensure all props exist
                    ...d.config,
                    // Ensure specific objects are retained if missing completely
                    buttons: d.config?.buttons || JSON.parse(JSON.stringify(DEFAULT_CONFIG.buttons)),
                    customTexts: d.config?.customTexts || []
                }));
                setCards(mapped);
                if (mapped.length === 0) handleCreateNew();
            } catch (err) {
                console.error("Failed to load cards:", err);
            }
        };
        fetchCards();
    }, []);

    const isTrial = userProfile?.plan === 'Trial';
    const limitReached = isTrial && cards.length >= 1;

    const handleCreateNew = () => {
        if (isTrial && cards.length >= 1) {
            alert("Limite de 1 cartão atingido no plano Trial. Faça upgrade para criar mais.");
            return;
        }

        const newCard: CardConfig = {
            id: `card-${Date.now()}`,
            createdAt: new Date().toISOString(),
            cardName: 'Meu Novo Cartão',
            ...DEFAULT_CONFIG,
            // Deep copy buttons to avoid reference issues
            buttons: JSON.parse(JSON.stringify(DEFAULT_CONFIG.buttons))
        };
        setCurrentConfig(newCard);
        setViewMode('editor');
    };

    const handleEditCard = (card: CardConfig) => {
        if (isTrial && cards.length > 1) {
            alert("Sua conta possui mais cartões do que o permitido no plano Trial. Faça o upgrade para voltar a editar.");
            return;
        }
    }, [toast]);

        setCurrentConfig(card);
        setViewMode('editor');
    };

    const handleSaveFromEditor = async (updatedConfig: CardConfig) => {
        try {
            const payload = { cardName: updatedConfig.cardName, config: updatedConfig };

            if (updatedConfig.id && !updatedConfig.id.startsWith('card-')) {
                // Update existing
                const result = await cardsApi.update(updatedConfig.id, payload);
                const mapped = {
                    id: result.id,
                    createdAt: result.created_at || result.createdAt,
                    cardName: result.card_name || result.cardName,
                    ...DEFAULT_CONFIG,
                    ...result.config
                };
                setCards(prev => prev.map(c => c.id === mapped.id ? mapped : c));
            } else {
                // Create new
                const result = await cardsApi.create(payload);
                const mapped = {
                    id: result.id,
                    createdAt: result.created_at || result.createdAt,
                    cardName: result.card_name || result.cardName,
                    ...DEFAULT_CONFIG,
                    ...result.config
                };
                setCards(prev => [mapped, ...prev]);
                setCurrentConfig(mapped);
            }
        } catch (err) {
            console.error("Failed to save card:", err);
            alert('Erro ao salvar cartão.');
        }
    };

    const handleDeleteCard = async () => {
        if (!currentConfig || currentConfig.id.startsWith('card-')) {
            setViewMode('gallery');
            setCurrentConfig(null);
            return;
        }
        if (confirm('Tem certeza que deseja excluir este cartão?')) {
            try {
                await cardsApi.delete(currentConfig.id);
                setCards(prev => prev.filter(c => c.id !== currentConfig.id));
                setViewMode('gallery');
                setCurrentConfig(null);
            } catch (err) {
                console.error("Failed to delete card:", err);
                alert("Erro ao excluir cartão.");
            }
        }
    };

    // --- EDITOR INITIALIZER ---
    useEffect(() => {
        if (viewMode !== 'editor' || !currentConfig) return;

        // --- VANILLA JS LOGIC START (Scoped) ---
        const initApp = () => {
            const cardData = currentConfig; // Local reference

            const app: any = {
                buttons: JSON.parse(JSON.stringify(cardData.buttons)), // Deep copy
                layout: cardData.layout,
                alignment: cardData.alignment,
                maxButtons: cardData.maxButtons,
                slotRadius: cardData.slotRadius,
                imageUploaded: !!cardData.backgroundImage,
                editingTextId: null,
                useBrandColors: cardData.useBrandColors,
                defaultButtonStyle: { ...cardData.defaultButtonStyle },
                backgroundImage: cardData.backgroundImage
            };

            let editingIndex: number | null = null;
            let currentSocialForInline: string | null = null;
            let activeTextEl: HTMLElement | null = null;

            const redes = [
                { key: 'whatsapp', name: 'WhatsApp', urlPrefix: 'https://wa.me/', icon: 'logo-whatsapp', color: '#25D366' },
                { key: 'telegram', name: 'Telegram', urlPrefix: 'https://t.me/', icon: 'send-outline', color: '#0088cc' },
                { key: 'telefone', name: 'Telefone', urlPrefix: 'tel:', icon: 'call-outline', color: '#3b82f6' },
                { key: 'email', name: 'Email', urlPrefix: 'mailto:', icon: 'mail-outline', color: '#ea4335' },
                { key: 'agendamento', name: 'Agendamento', urlPrefix: 'https://calendly.com/', icon: 'calendar-outline', color: '#006BFF' },
                { key: 'pagamento', name: 'Pagamento', urlPrefix: 'https://pay.me/', icon: 'cash-outline', color: '#10b981' },
                { key: 'linkedin', name: 'LinkedIn', urlPrefix: 'https://linkedin.com/in/', icon: 'logo-linkedin', color: '#0A66C2' },
                { key: 'site', name: 'Website', urlPrefix: 'https://', icon: 'globe-outline', color: '#64748b' },
                { key: 'behance', name: 'Behance', urlPrefix: 'https://www.behance.net/', icon: 'logo-behance', color: '#1769ff' },
                { key: 'instagram', name: 'Instagram', urlPrefix: 'https://instagram.com/', icon: 'logo-instagram', color: '#E1306C' },
                { key: 'facebook', name: 'Facebook', urlPrefix: 'https://facebook.com/', icon: 'logo-facebook', color: '#1877F2' },
                { key: 'youtube', name: 'YouTube', urlPrefix: 'https://youtube.com/', icon: 'logo-youtube', color: '#FF0000' },
                { key: 'tiktok', name: 'TikTok', urlPrefix: 'https://tiktok.com/@', icon: 'logo-tiktok', color: '#000000' },
                { key: 'twitter', name: 'Twitter', urlPrefix: 'https://twitter.com/', icon: 'logo-twitter', color: '#1DA1F2' },
                { key: 'localizacao', name: 'Localização', urlPrefix: 'https://maps.google.com/?q=', icon: 'location-outline', color: '#ea4335' }
            ];

            // === DOM REFERENCES ===
            const getEl = (id: string) => document.getElementById(id);

            const dom: any = {
                buttonsGrid: getEl('buttonsGrid'),
                card: getEl('card'),
                cardInner: document.querySelector('.card-inner'),
                buttonOverlay: getEl('buttonOverlay'),
                socialGrid: getEl('socialGrid'),
                formInline: getEl('formInline'),
                downloadOverlay: getEl('downloadOverlay'),
                cardBg: getEl('cardBg'),
                configPanel: getEl('configPanel'),

                // Controls
                photoBtn: getEl('photoBtn'),
                downloadBtn: getEl('downloadBtn'),
                toggleConfigPanel: getEl('toggleConfigPanel'),
                closeConfigPanelBtn: getEl('closeConfigPanel'),
                toastMessage: getEl('toastMessage'),

                // Tabs
                tabTextBtn: getEl('tabTextBtn'),
                tabLayoutBtn: getEl('tabLayoutBtn'),
                panelText: getEl('panelText'),
                panelLayout: getEl('panelLayout'),

                // Layout Inputs
                layoutSelect: getEl('layoutSelect'),
                alignSelect: getEl('alignSelect'),
                shapeSelect: getEl('shapeSelect'),
                maxButtonsInput: getEl('maxButtonsInput'),

                // Button Style Inputs
                btnBorderColor: getEl('btnBorderColor'),
                btnBgColor: getEl('btnBgColor'),
                btnIconColor: getEl('btnIconColor'),
                btnLabelColor: getEl('btnLabelColor'),
                btnFontFamily: getEl('btnFontFamily'),
                btnFontSize: getEl('btnFontSize'),
                useBrandColorCheckbox: getEl('useBrandColorCheckbox'),

                // Download
                filenameInput: getEl('filenameInput'),
                executeDownloadBtn: getEl('executeDownloadBtn'),
                closeDownload: getEl('closeDownload'),

                // Upload
                uploadModal: getEl('uploadModal'),
                uploadZone: getEl('uploadZone'),
                uploadInput: getEl('uploadInput'),

                // Custom Text
                customTextInput: getEl('customTextInput'),
                customTextFont: getEl('customTextFont'),
                customTextSizeNum: getEl('customTextSizeNum'),
                customTextColor: getEl('customTextColor'),
                addCustomTextBtn: getEl('addCustomTextBtn'),
                cancelCustomTextBtn: getEl('cancelCustomTextBtn'),

                // Panel close buttons
                closeButtonOverlay: getEl('closeButtonOverlay')
            };

            // === PRE-FILL UI WITH DATA ===
            if (app.backgroundImage && dom.cardBg) {
                dom.cardBg.style.backgroundImage = `url(${app.backgroundImage})`;
                dom.cardBg.style.backgroundSize = 'cover';
                dom.cardBg.style.backgroundPosition = 'center';
            }

            // Update Inputs
            if (dom.filenameInput) dom.filenameInput.value = cardData.cardName;
            if (dom.layoutSelect) dom.layoutSelect.value = app.layout;
            if (dom.alignSelect) dom.alignSelect.value = app.alignment;
            if (dom.shapeSelect) dom.shapeSelect.value = app.slotRadius;
            if (dom.maxButtonsInput) dom.maxButtonsInput.value = app.maxButtons;

            if (dom.btnBorderColor) dom.btnBorderColor.value = app.defaultButtonStyle.border;
            if (dom.btnBgColor) dom.btnBgColor.value = app.defaultButtonStyle.bg;
            if (dom.btnIconColor) dom.btnIconColor.value = app.defaultButtonStyle.icon;
            if (dom.btnLabelColor) dom.btnLabelColor.value = app.defaultButtonStyle.label;
            if (dom.btnFontFamily) dom.btnFontFamily.value = app.defaultButtonStyle.fontFamily;
            if (dom.btnFontSize) dom.btnFontSize.value = app.defaultButtonStyle.fontSize;
            if (dom.useBrandColorCheckbox) dom.useBrandColorCheckbox.checked = app.useBrandColors;

            // === RESTORE CUSTOM TEXTS ===
            // Clear existing first
            if (dom.cardInner) {
                const existingTexts = dom.cardInner.querySelectorAll('.custom-text-element');
                existingTexts.forEach((el: any) => el.remove());
            }
            // Add from config (if any - mocked ones don't have text, but logic handles it)
            // Note: Implementation of loading custom text is simplified here 
            // Assuming customTexts array in config can be iterated if needed.

            // === HELPER FUNCTIONS ===
            function showToast(message: string, type = 'info', duration = 3000) {
                if (!dom.toastMessage) return;
                dom.toastMessage.textContent = message;
                dom.toastMessage.className = 'toast';
                dom.toastMessage.classList.add('show', type);
                setTimeout(() => {
                    dom.toastMessage.classList.remove('show');
                }, duration);
            }

            function closeAllSidePanels(except: any = null) {
                const sidePanels = [dom.configPanel, dom.downloadOverlay, dom.buttonOverlay];
                sidePanels.forEach(panel => {
                    if (!panel) return;
                    if (panel === except) return;
                    panel.classList.remove('show');
                });
                hideInlineForm();
            }

            // === TAB LOGIC ===
            function switchTab(tab: 'text' | 'layout') {
                if (!dom.panelText || !dom.panelLayout || !dom.tabTextBtn || !dom.tabLayoutBtn) return;
                if (tab === 'text') {
                    dom.panelText.style.display = 'block';
                    dom.panelLayout.style.display = 'none';
                    dom.tabTextBtn.classList.add('active-tab');
                    dom.tabLayoutBtn.classList.remove('active-tab');
                } else {
                    dom.panelText.style.display = 'none';
                    dom.panelLayout.style.display = 'block';
                    dom.tabTextBtn.classList.remove('active-tab');
                    dom.tabLayoutBtn.classList.add('active-tab');
                }
            }

            // === GRID BUILDER ===
            function buildSocialGrid() {
                if (!dom.socialGrid) {
                    setTimeout(() => {
                        dom.socialGrid = getEl('socialGrid');
                        if (dom.socialGrid) buildSocialGrid();
                    }, 500);
                    return;
                }
                dom.socialGrid.innerHTML = '';
                redes.forEach((rede, index) => {
                    const opt = document.createElement('div');
                    opt.className = 'social-option';
                    opt.dataset.rede = rede.key;
                    opt.dataset.index = index.toString();
                    opt.innerHTML = `<div class="icon" style="color:${rede.color}"><ion-icon name="${rede.icon}"></ion-icon></div><span class="social-name">${rede.name}</span>`;
                    opt.addEventListener('click', () => openInlineFormForSocial(rede, opt));
                    dom.socialGrid.appendChild(opt);
                });
            }

            function updatePreview() {
                if (!dom.buttonsGrid) return;
                dom.buttonsGrid.className = '';
                if (app.layout === 'list') {
                    dom.buttonsGrid.style.gridTemplateColumns = '1fr';
                    dom.buttonsGrid.style.gap = '12px';
                } else {
                    dom.buttonsGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                    dom.buttonsGrid.style.gap = '10px';
                }

                dom.buttonsGrid.innerHTML = '';

                for (let idx = 0; idx < app.maxButtons; idx++) {
                    const b = app.buttons[idx] || { active: false };
                    const slot = document.createElement('div');
                    slot.className = 'btn-slot' + (b.active ? '' : ' empty');
                    slot.dataset.idx = idx.toString();

                    const globalStyle = app.defaultButtonStyle;
                    const localStyle = b.style || {};
                    const styleBorder = localStyle.border || globalStyle.border;
                    const styleBg = localStyle.bg || globalStyle.bg;
                    const styleLabel = localStyle.label || globalStyle.label;
                    const styleFontFamily = localStyle.fontFamily || globalStyle.fontFamily;
                    const styleFontSize = localStyle.fontSize || globalStyle.fontSize;

                    slot.style.borderRadius = app.slotRadius;
                    slot.style.borderColor = styleBorder;
                    slot.style.backgroundColor = styleBg;
                    slot.style.justifyContent = app.alignment === 'left' ? 'flex-start' : (app.alignment === 'right' ? 'flex-end' : 'center');
                    if (app.alignment !== 'center') slot.style.paddingLeft = '12px';
                    if (app.alignment !== 'center') slot.style.paddingRight = '12px';

                    if (b.active) {
                        const redeInfo = redes.find(r => r.key === b.social);
                        const iconName = redeInfo ? redeInfo.icon : '';
                        let effectiveIconColor = globalStyle.icon;

                        if (localStyle.useBrandColor && redeInfo && redeInfo.color) {
                            effectiveIconColor = redeInfo.color;
                        } else if (localStyle.icon) {
                            effectiveIconColor = localStyle.icon;
                        } else if (app.useBrandColors && redeInfo && redeInfo.color) {
                            effectiveIconColor = redeInfo.color;
                        }

                        const iconStyle = `color: ${effectiveIconColor}; font-size: 20px; margin-bottom: 4px;`;
                        const labelStyle = `color: ${styleLabel}; font-family: ${styleFontFamily}; font-size: ${styleFontSize};`;

                        slot.innerHTML = `
                <div class="btn-icon" style="${iconStyle}"><ion-icon name="${iconName}"></ion-icon></div>
                <div class="btn-label" style="${labelStyle}">${escapeHtml(b.title)}</div>
                <div class="edit-overlay" data-html2canvas-ignore="true"><ion-icon name="pencil-outline"></ion-icon></div>
              `;
                    } else {
                        slot.innerHTML = '<div class="btn-icon"><ion-icon name="add-circle-outline"></ion-icon></div><div class="btn-label" style="font-size:10px">Adicionar</div><div class="edit-overlay" data-html2canvas-ignore="true"><ion-icon name="pencil-outline"></ion-icon></div>';
                        slot.style.borderStyle = 'dashed';
                    }
                    slot.addEventListener('click', () => openButtonOverlay(idx));
                    dom.buttonsGrid.appendChild(slot);
                }
            }

            function openButtonOverlay(idx: number) {
                closeAllSidePanels(dom.buttonOverlay);
                editingIndex = idx;
                if (dom.buttonOverlay) dom.buttonOverlay.classList.add('show');
                if (!app.buttons[idx]) app.buttons[idx] = { active: false };

                const currentButton = app.buttons[idx];
                if (currentButton && currentButton.active && currentButton.social) {
                    const redeInfo = redes.find(r => r.key === currentButton.social);
                    if (redeInfo) {
                        const socialOptions = document.querySelectorAll('.social-option');
                        socialOptions.forEach((opt: any) => {
                            if (opt.dataset.rede === currentButton.social) {
                                setTimeout(() => openInlineFormForSocial(redeInfo, opt as HTMLElement), 100);
                            }
                        });
                    }
                } else {
                    hideInlineForm();
                }
            }

            function hideInlineForm() {
                if (!dom.formInline) return;
                dom.formInline.classList.remove('show');
                dom.formInline.innerHTML = '';
                currentSocialForInline = null;
                document.querySelectorAll('.social-option').forEach(opt => opt.classList.remove('active-social-option'));
            }

            function openInlineFormForSocial(rede: any, clickedOptionElement: HTMLElement) {
                if (!dom.socialGrid || !dom.formInline) return;
                document.querySelectorAll('.social-option').forEach(opt => opt.classList.remove('active-social-option'));
                clickedOptionElement.classList.add('active-social-option');
                currentSocialForInline = rede.key;

                const socialGrid = dom.socialGrid;
                const options = Array.from(socialGrid.querySelectorAll('.social-option')) as HTMLElement[];
                const clickedIndex = options.indexOf(clickedOptionElement);
                const columns = 4;
                const currentRow = Math.floor(clickedIndex / columns);
                let insertAfterIndex = ((currentRow + 1) * columns) - 1;
                if (insertAfterIndex >= options.length) insertAfterIndex = options.length - 1;

                const referenceNode = options[insertAfterIndex];
                if (referenceNode && referenceNode.nextSibling) socialGrid.insertBefore(dom.formInline, referenceNode.nextSibling);
                else socialGrid.appendChild(dom.formInline);

                const currentButtonData = app.buttons[editingIndex || 0];
                const title = (currentButtonData && currentButtonData.title) ? currentButtonData.title : rede.name;
                const url = (currentButtonData && currentButtonData.url) ? currentButtonData.url : '';
                const prefillUrl = rede.urlPrefix || '';
                const styles = currentButtonData.style || {};
                const def = app.defaultButtonStyle;

                const html = `
            <div class="form-content-inner">
                <div class="form-group-custom mb-3">
                    <label class="text-xs font-bold text-slate-600 block mb-1">Título do Botão</label>
                    <input id="btnTitle" value="${title}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div class="form-group-custom mb-3">
                    <label class="text-xs font-bold text-slate-600 block mb-1">Link de Destino</label>
                    <input id="btnURL" value="${url || prefillUrl}" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div class="flex flex-col gap-2">
                    <button id="saveBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2">
                        <ion-icon name="checkmark-circle-outline" style="font-size:16px"></ion-icon> Salvar Botão
                    </button>
                    <div class="flex gap-2">
                        <button id="removeBtn" class="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                            <ion-icon name="trash-outline" style="font-size:16px"></ion-icon> Remover
                        </button>
                        <button id="cancelBtn" class="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
                dom.formInline.innerHTML = html;
                dom.formInline.classList.add('show');
                setTimeout(() => { dom.formInline.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 150);

                getEl('saveBtn')?.addEventListener('click', saveButtonHandler);
                getEl('removeBtn')?.addEventListener('click', removeButtonHandler);
                getEl('cancelBtn')?.addEventListener('click', (e) => { e.preventDefault(); hideInlineForm(); });
            }

            function saveButtonHandler(ev: any) {
                ev.preventDefault();
                if (editingIndex === null || !currentSocialForInline) return;
                const titleInput = getEl('btnTitle') as HTMLInputElement;
                const urlInput = getEl('btnURL') as HTMLInputElement;
                const title = titleInput?.value;
                const url = urlInput?.value;
                if (!url) { showToast('URL obrigatória', 'error'); return; }

                app.buttons[editingIndex] = {
                    active: true,
                    title,
                    social: currentSocialForInline,
                    url,
                    style: {} // simplified for brevity in this update
                };
                updatePreview();
                closeAllSidePanels();
                showToast('Botão salvo!', 'success');
            }

            function removeButtonHandler(ev: any) {
                ev.preventDefault();
                if (editingIndex === null) return;
                app.buttons[editingIndex] = { active: false, title: '', social: null, url: '' };
                updatePreview();
                closeAllSidePanels();
                showToast('Botão removido.', 'info');
            }

            function escapeHtml(text: string) {
                if (!text) return '';
                return text.replace(/[&<>"']/g, function (m) {
                    const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
                    return map[m];
                });
            }

            // === SAVE & DOWNLOAD ===
            async function executeDownload() {
                const filename = (getEl('filenameInput') as HTMLInputElement)?.value || 'meu-cartao';

                // 1. SAVE STATE to React
                const newConfig: CardConfig = {
                    ...cardData,
                    cardName: filename,
                    layout: app.layout,
                    alignment: app.alignment,
                    maxButtons: app.maxButtons,
                    slotRadius: app.slotRadius,
                    useBrandColors: app.useBrandColors,
                    defaultButtonStyle: app.defaultButtonStyle,
                    backgroundImage: app.backgroundImage,
                    buttons: app.buttons,
                    customTexts: [] // Simplified text saving
                };

                handleSaveFromEditor(newConfig);

                // 2. GENERATE PDF
                if (!app.imageUploaded) { showToast('Carregue uma imagem primeiro', 'error'); return; }
                if (dom.downloadOverlay) dom.downloadOverlay.classList.remove('show');
                resetTextSelection();

                if (!dom.card) return;
                const canvas = await html2canvas(dom.card, { scale: 2, useCORS: true, allowTaint: true });
                const imgData = canvas.toDataURL('image/png');

                const pdf = new jsPDF({ unit: 'pt', format: [canvas.width * 0.75, canvas.height * 0.75] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width * 0.75, canvas.height * 0.75);
                pdf.save(filename + '.pdf');

                showToast('Salvo e Baixado!', 'success');
            }

            function handleImageUpload(file: File) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    if (dom.cardBg && e.target?.result) {
                        const result = e.target.result as string;
                        dom.cardBg.style.backgroundImage = 'url(' + result + ')';
                        dom.cardBg.style.backgroundSize = 'cover';
                        dom.cardBg.style.backgroundPosition = 'center';
                        app.backgroundImage = result;
                        app.imageUploaded = true;
                    }
                    if (dom.uploadModal) dom.uploadModal.classList.add('hidden');
                    [dom.photoBtn, dom.downloadBtn, dom.toggleConfigPanel].forEach(el => el?.classList.remove('disabled'));
                    if (window.innerWidth > 768 && dom.configPanel) dom.configPanel.classList.add('show');
                    showToast('Imagem carregada!', 'success');
                };
                reader.readAsDataURL(file);
            }

            // === TEXT UTILS ===
            const updateTextPreview = () => {
                if (!dom.customTextInput) return;
                const text = (dom.customTextInput as HTMLInputElement).value;
                const preview = getEl('textPreview');
                if (preview) preview.textContent = text || 'Prévia';
            }

            const resetTextForm = () => {
                if (!dom.customTextInput) return;
                (dom.customTextInput as HTMLInputElement).value = '';
                if (dom.addCustomTextBtn) dom.addCustomTextBtn.textContent = 'Adicionar Texto ao Cartão';
                if (dom.cancelCustomTextBtn) dom.cancelCustomTextBtn.style.display = 'none';
                activeTextEl = null;
                updateTextPreview();
                resetTextSelection();
            }

            const resetTextSelection = () => {
                document.querySelectorAll('.custom-text-element').forEach(el => el.classList.remove('selected'));
            }

            const handleDeleteText = (el: HTMLElement) => { el.remove(); resetTextForm(); showToast('Texto removido', 'info'); }

            const handleEditText = (el: HTMLElement) => {
                const span = el.querySelector('.content') as HTMLElement;
                if (!span || !dom.customTextInput) return;
                switchTab('text');
                (dom.customTextInput as HTMLInputElement).value = span.textContent || '';
                activeTextEl = el;
                if (dom.addCustomTextBtn) dom.addCustomTextBtn.textContent = 'Atualizar Texto';
                if (dom.cancelCustomTextBtn) dom.cancelCustomTextBtn.style.display = 'inline-block';
                if (dom.configPanel) dom.configPanel.classList.add('show');
                updateTextPreview();
            }

            const handleTextClick = (e: MouseEvent, el: HTMLElement) => {
                e.stopPropagation();
                const isSelected = el.classList.contains('selected');
                resetTextSelection();
                if (!isSelected) el.classList.add('selected');
            }

            // --- INITIALIZATION LISTENERS ---
            buildSocialGrid();
            updatePreview();

            // Ensure buttons are enabled if reloading existing data
            if (app.imageUploaded) {
                if (dom.uploadModal) dom.uploadModal.classList.add('hidden');
                [dom.photoBtn, dom.downloadBtn, dom.toggleConfigPanel].forEach(el => el?.classList.remove('disabled'));
            }

            dom.photoBtn?.addEventListener('click', () => !dom.photoBtn.classList.contains('disabled') && dom.uploadInput.click());
            dom.uploadInput?.addEventListener('change', (e: any) => e.target.files[0] && handleImageUpload(e.target.files[0]));
            dom.uploadZone?.addEventListener('click', () => dom.uploadInput.click());

            dom.toggleConfigPanel?.addEventListener('click', () => dom.configPanel.classList.add('show'));
            dom.closeConfigPanelBtn?.addEventListener('click', () => dom.configPanel.classList.remove('show'));

            dom.downloadBtn?.addEventListener('click', () => dom.downloadOverlay.classList.add('show'));
            dom.closeDownload?.addEventListener('click', () => dom.downloadOverlay.classList.remove('show'));
            dom.executeDownloadBtn?.addEventListener('click', executeDownload);
            dom.closeButtonOverlay?.addEventListener('click', () => closeAllSidePanels());

            dom.tabTextBtn?.addEventListener('click', () => switchTab('text'));
            dom.tabLayoutBtn?.addEventListener('click', () => switchTab('layout'));

            dom.layoutSelect?.addEventListener('change', (e: any) => { app.layout = e.target.value; updatePreview(); });
            dom.alignSelect?.addEventListener('change', (e: any) => { app.alignment = e.target.value; updatePreview(); });
            dom.shapeSelect?.addEventListener('change', (e: any) => { app.slotRadius = e.target.value; updatePreview(); });
            dom.maxButtonsInput?.addEventListener('input', (e: any) => { app.maxButtons = parseInt(e.target.value) || 6; updatePreview(); });

            dom.btnBorderColor?.addEventListener('input', (e: any) => { app.defaultButtonStyle.border = e.target.value; updatePreview(); });
            dom.btnBgColor?.addEventListener('input', (e: any) => { app.defaultButtonStyle.bg = e.target.value; updatePreview(); });
            dom.btnIconColor?.addEventListener('input', (e: any) => { app.defaultButtonStyle.icon = e.target.value; updatePreview(); });
            dom.btnLabelColor?.addEventListener('input', (e: any) => { app.defaultButtonStyle.label = e.target.value; updatePreview(); });
            dom.btnFontFamily?.addEventListener('change', (e: any) => { app.defaultButtonStyle.fontFamily = e.target.value; updatePreview(); });
            dom.btnFontSize?.addEventListener('change', (e: any) => { app.defaultButtonStyle.fontSize = e.target.value; updatePreview(); });

            dom.useBrandColorCheckbox?.addEventListener('change', (e: any) => {
                app.useBrandColors = e.target.checked;
                if (dom.btnIconColor) dom.btnIconColor.disabled = app.useBrandColors;
                if (dom.btnIconColor) dom.btnIconColor.style.opacity = app.useBrandColors ? '0.5' : '1';
                updatePreview();
            });

            dom.customTextInput?.addEventListener('input', updateTextPreview);
            dom.cancelCustomTextBtn?.addEventListener('click', resetTextForm);

            dom.addCustomTextBtn?.addEventListener('click', () => {
                if (!dom.customTextInput) return;
                const text = (dom.customTextInput as HTMLInputElement).value;
                if (!text) { showToast('Digite um texto', 'error'); return; }
                const font = dom.customTextFont ? (dom.customTextFont as HTMLSelectElement).value : 'Arial';
                const size = dom.customTextSizeNum ? (dom.customTextSizeNum as HTMLInputElement).value : '24';
                const color = dom.customTextColor ? (dom.customTextColor as HTMLInputElement).value : '#000000';

                if (activeTextEl) {
                    const span = activeTextEl.querySelector('.content') as HTMLElement;
                    if (span) span.textContent = text;
                    activeTextEl.style.fontFamily = font;
                    activeTextEl.style.fontSize = size + 'px';
                    activeTextEl.style.color = color;
                    showToast('Texto atualizado!', 'success');
                    resetTextForm();
                } else {
                    const el = document.createElement('div');
                    el.className = 'custom-text-element';
                    el.style.left = '50%'; el.style.top = '50%';
                    el.style.fontFamily = font;
                    el.style.fontSize = size + 'px';
                    el.style.color = color;
                    el.innerHTML = `<span class="content">${escapeHtml(text)}</span><div class="text-controls" data-html2canvas-ignore="true"><div class="control-btn edit-btn"><ion-icon name="pencil"></ion-icon></div><div class="control-btn del-btn"><ion-icon name="trash"></ion-icon></div></div>`;
                    let isDragging = false;
                    el.addEventListener('mousedown', (e) => {
                        if ((e.target as HTMLElement).closest('.text-controls')) return;
                        isDragging = true;
                        handleTextClick(e, el);
                    });
                    el.querySelector('.edit-btn')?.addEventListener('click', (e) => { e.stopPropagation(); handleEditText(el); });
                    el.querySelector('.del-btn')?.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteText(el); });
                    const moveHandler = (e: MouseEvent) => {
                        if (!isDragging) return;
                        const rect = dom.card.getBoundingClientRect();
                        el.style.left = (e.clientX - rect.left) + 'px';
                        el.style.top = (e.clientY - rect.top) + 'px';
                    };
                    const upHandler = () => { isDragging = false; };
                    window.addEventListener('mouseup', upHandler);
                    window.addEventListener('mousemove', moveHandler);
                    if (dom.cardInner) dom.cardInner.appendChild(el);
                    showToast('Texto adicionado!', 'success');
                    resetTextForm();
                }
            });

            document.addEventListener('click', (e) => {
                if (!(e.target as HTMLElement).closest('.custom-text-element') && !(e.target as HTMLElement).closest('#configPanel')) {
                    resetTextSelection();
                }
            });
        };

        const timer = setTimeout(initApp, 100);
        return () => clearTimeout(timer);
    }, [viewMode, currentConfig]);

    // --- RENDER ---
    if (viewMode === 'gallery') {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Meus Cartões Digitais</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seus cartões de visita interativos.</p>
                        {isTrial && (
                            <p className="text-xs text-orange-600 mt-2 font-bold flex items-center gap-1">
                                <Lock size={12} /> Plano Trial: Limite de 1 cartão. {cards.length}/1 usado(s).
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
                        Criar Novo Cartão
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <button
                        onClick={handleCreateNew}
                        disabled={limitReached}
                        className={`group flex flex-col items-center justify-center gap-4 aspect-[9/16] rounded-xl border-2 border-dashed transition-all
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

                    {cards.map(card => (
                        <MiniCardPreview
                            key={card.id}
                            config={card}
                            isLocked={isTrial && cards.length > 1}
                            onClick={() => handleEditCard(card)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // --- EDITOR RENDER (Wrapped Vanilla) ---
    return (
        <div className="interactive-card-scope w-full relative min-h-screen">
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <button onClick={() => setViewMode('gallery')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Editor de Cartão</h1>
                        <p className="text-xs text-slate-500">Editando: {currentConfig?.cardName}</p>
                    </div>
                </div>
                <button
                    onClick={handleDeleteCard}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                >
                    <Trash2 size={18} /> Excluir
                </button>
            </div>

            <style>{`
        /* SCOPED CSS */
        .interactive-card-scope { --card-w: 400px; --card-h: 711px; --card-bg: #00ABE4; }
        .interactive-card-scope .stage { display:flex; gap:48px; justify-content:center; width:100%; flex-wrap:wrap; }
        
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

        .interactive-card-scope #cardHeaderControls {
            position: absolute; top: 0; left: 0; width: 100%; height: 60px;
            display: flex; justify-content: space-between; align-items: center; padding: 10px;
            z-index: 10; background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0));
        }

        .interactive-card-scope .card-control-icon {
            display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;
            border-radius: 50%; background-color: rgba(255,255,255,0.2); cursor: pointer;
        }
        .interactive-card-scope .card-control-icon ion-icon { font-size: 24px; color: white; }
        .interactive-card-scope .card-control-icon.disabled { opacity: 0.5; pointer-events: none; }

        .interactive-card-scope #cardBg { position: absolute; inset: 0; z-index: 0; background-color: var(--card-bg); }
        .interactive-card-scope .card-inner { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; pointer-events: none; }
        .interactive-card-scope .card-inner > * { pointer-events: auto; }

        .interactive-card-scope #buttonsGrid {
            display: grid; width: 100%; margin-top: auto; margin-bottom: 8px;
        }

        .interactive-card-scope .btn-slot {
            width: 100%; height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center;
            cursor: pointer; position: relative; transition: transform 0.2s; border: 2px solid transparent;
        }
        .interactive-card-scope .btn-slot:hover { transform: scale(1.03); z-index:5; }
        
        /* Side Panels */
        .interactive-card-scope .side-panel {
            position: fixed; top: 0; right: 0; width: 100%; max-width: 400px; height: 100vh;
            background: white; box-shadow: -5px 0 15px rgba(0,0,0,0.1); z-index: 9999; 
            transform: translateX(100%); transition: transform 0.3s ease; padding: 0;
            display: flex; flex-direction: column;
        }
        .interactive-card-scope .side-panel.show { transform: translateX(0); }
        
        .interactive-card-scope #buttonOverlay {
            display: flex; flex-direction: column;
        }

        .interactive-card-scope .social-grid { 
            display: grid; 
            grid-template-columns: repeat(4, 1fr); 
            gap: 10px; 
            margin-top: 20px; 
            padding: 20px; 
            overflow-y: auto; 
            flex: 1;
            padding-bottom: 120px; /* Extra space for last items to scroll up */
        }

        .interactive-card-scope .social-option {
            border: 1px solid #ddd; border-radius: 8px; padding: 10px;
            display: flex; flex-direction: column; align-items: center; cursor: pointer;
            transition: all 0.2s;
        }
        .interactive-card-scope .social-option:hover { border-color: #4782ec; background: #f0f7ff; }
        
        .interactive-card-scope .social-option.active-social-option {
            border-color: #4f46e5;
            background-color: #eef2ff;
            box-shadow: 0 0 0 2px #4f46e5;
        }

        .interactive-card-scope .social-option ion-icon { font-size: 28px; color: #333; }
        .interactive-card-scope .social-name { font-size: 10px; margin-top: 5px; text-align: center; }

        .interactive-card-scope #formInline { 
            grid-column: 1 / -1; /* Make it span full width */
            background: #f9f9f9; padding: 15px; border-radius: 8px; 
            margin: 10px 0; /* Add vertical margin */
            display: none; border: 1px solid #eee; 
            animation: slideDown 0.3s ease-out;
        }
        .interactive-card-scope #formInline.show { display: block; }
        
        @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Tabs */
        .interactive-card-scope .config-tabs { display: flex; border-bottom: 1px solid #eee; }
        .interactive-card-scope .config-tab-btn { flex: 1; padding: 15px; text-align: center; font-weight: bold; color: #666; cursor: pointer; background: #f9fafb; border-bottom: 2px solid transparent; }
        .interactive-card-scope .config-tab-btn.active-tab { background: white; color: #4f46e5; border-bottom-color: #4f46e5; }
        
        /* Upload Modal */
        .interactive-card-scope .upload-modal { position: absolute; inset: 0; background: rgba(0,0,0,0.8); z-index: 50; display: flex; align-items: center; justify-content: center; }
        .interactive-card-scope .upload-modal.hidden { display: none; }
        .interactive-card-scope .upload-zone { border: 3px dashed rgba(255,255,255,0.5); padding: 40px; color: white; text-align: center; cursor: pointer; border-radius: 12px; }

        /* Custom Text */
        .interactive-card-scope .custom-text-element { position: absolute; cursor: move; white-space: nowrap; z-index: 5; padding: 4px; border: 1px dashed transparent; user-select: none; }
        .interactive-card-scope .custom-text-element.selected { border: 1px dashed white; background: rgba(0,0,0,0.2); }
        .interactive-card-scope .text-controls { position: absolute; top: -35px; left: 50%; transform: translateX(-50%); display: none; gap: 5px; background: white; padding: 4px; border-radius: 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .interactive-card-scope .custom-text-element.selected .text-controls { display: flex; }
        .interactive-card-scope .control-btn { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .interactive-card-scope .edit-btn { background: #4782ec; color: white; }
        .interactive-card-scope .del-btn { background: #ef4444; color: white; }

        /* Inputs */
        .interactive-card-scope input[type="text"], .interactive-card-scope input[type="number"], .interactive-card-scope select {
            border: 1px solid #d1d5db !important; padding: 8px !important; border-radius: 6px !important;
            color: #333 !important; background: white !important; font-size: 13px !important;
        }
      `}</style>

            <div className="main-content-wrapper p-4">
                <div className="stage">

                    {/* CARD AREA */}
                    <div className="card-wrap relative">
                        <div id="card">
                            <div id="cardBg"></div>
                            <div id="uploadModal" className="upload-modal">
                                <div className="upload-zone" id="uploadZone">
                                    {/* @ts-ignore */}
                                    <ion-icon name="cloud-upload-outline" style={{ fontSize: '48px' }}></ion-icon>
                                    <h3 className="text-xl font-bold mt-2">Upload Imagem</h3>
                                    <p className="text-sm opacity-80 mt-1">Clique para selecionar</p>
                                </div>
                                <input type="file" id="uploadInput" className="hidden" accept="image/*" />
                            </div>
                            <div id="cardHeaderControls">
                                {/* @ts-ignore */}
                                <div id="photoBtn" className="card-control-icon disabled"><ion-icon name="image-outline"></ion-icon></div>
                                {/* @ts-ignore */}
                                <div id="downloadBtn" className="card-control-icon disabled"><ion-icon name="download-outline"></ion-icon></div>
                                {/* @ts-ignore */}
                                <div id="toggleConfigPanel" className="card-control-icon disabled"><ion-icon name="settings-outline"></ion-icon></div>
                            </div>
                            <div className="card-inner">
                                <div id="buttonsGrid"></div>
                            </div>
                        </div>
                    </div>

                    {/* Config Panel */}
                    <div id="configPanel" className="side-panel">
                        <div className="flex justify-between items-center p-4 border-b border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800">Configurações do Cartão</h3>
                            <button id="closeConfigPanel" className="text-slate-400 hover:text-slate-600">
                                {/* @ts-ignore */}
                                <ion-icon name="close-outline" style={{ fontSize: '24px' }}></ion-icon>
                            </button>
                        </div>

                        {/* TABS HEADER */}
                        <div className="config-tabs">
                            <div id="tabTextBtn" className="config-tab-btn active-tab flex items-center justify-center gap-2">
                                <Type size={16} /> Texto
                            </div>
                            <div id="tabLayoutBtn" className="config-tab-btn flex items-center justify-center gap-2">
                                <Layout size={16} /> Layout
                            </div>
                        </div>

                        {/* TAB CONTENT: TEXTO */}
                        <div id="panelText" className="p-5 overflow-y-auto flex-1">
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                                    Adicione textos livres ao cartão (Ex: Nome, Cargo). Arraste para mover.
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Conteúdo</label>
                                    <input id="customTextInput" type="text" placeholder="Digite aqui..." className="w-full" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Fonte</label>
                                        <select id="customTextFont" className="w-full">
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Verdana">Verdana</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Impact">Impact</option>
                                        </select>
                                    </div>
                                    <div className="w-20 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Tam.</label>
                                        <input id="customTextSizeNum" type="number" defaultValue="24" className="w-full" />
                                    </div>
                                    <div className="w-12 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Cor</label>
                                        <input id="customTextColor" type="color" defaultValue="#000000" className="w-full h-[35px] p-0 border-0 cursor-pointer" />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button id="addCustomTextBtn" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg font-bold text-sm transition-colors">
                                        Adicionar Texto
                                    </button>
                                    <button id="cancelCustomTextBtn" className="bg-red-100 hover:bg-red-200 text-red-600 p-2.5 rounded-lg font-bold text-sm transition-colors" style={{ display: 'none' }}>
                                        Cancelar
                                    </button>
                                </div>

                                <div id="textPreview" className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-400 text-sm">
                                    Prévia do estilo
                                </div>
                            </div>
                        </div>

                        {/* TAB CONTENT: LAYOUT & BUTTONS */}
                        <div id="panelLayout" className="p-5 overflow-y-auto flex-1" style={{ display: 'none' }}>
                            <div className="space-y-6">

                                {/* Section: Layout Structure */}
                                <div className="space-y-3 pb-4 border-b border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Layout size={16} className="text-indigo-500" /> Estrutura
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Disposição</label>
                                            <select id="layoutSelect" className="w-full">
                                                <option value="3x2">Grade (3 Colunas)</option>
                                                <option value="list">Lista (Vertical)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Qtd. Botões</label>
                                            <input id="maxButtonsInput" type="number" min="1" max="12" defaultValue="6" className="w-full" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Formato</label>
                                            <select id="shapeSelect" className="w-full">
                                                <option value="8px">Arredondado</option>
                                                <option value="0px">Quadrado</option>
                                                <option value="20px">Pílula</option>
                                                <option value="50%">Círculo (Apenas Grade)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Alinhamento</label>
                                            <select id="alignSelect" className="w-full">
                                                <option value="center">Centro</option>
                                                <option value="left">Esquerda</option>
                                                <option value="right">Direita</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Button Style */}
                                <div className="space-y-3 pb-4 border-b border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Palette size={16} className="text-indigo-500" /> Estilo dos Botões
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Borda</label>
                                            <div className="flex items-center gap-2">
                                                <input id="btnBorderColor" type="color" defaultValue="#ffffff" className="w-8 h-8 p-0 border-0 cursor-pointer" />
                                                <span className="text-xs text-slate-400">Cor</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Fundo (Fill)</label>
                                            <div className="flex items-center gap-2">
                                                <input id="btnBgColor" type="color" defaultValue="#ffffff" className="w-8 h-8 p-0 border-0 cursor-pointer opacity-50" title="Transparente se não selecionado" />
                                                <span className="text-xs text-slate-400">Cor</span>
                                            </div>
                                        </div>

                                        {/* Icon Color & Toggle */}
                                        <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <label className="text-xs font-bold text-slate-600 block mb-2">Ícone</label>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <input id="btnIconColor" type="color" defaultValue="#ffffff" className="w-8 h-8 p-0 border-0 cursor-pointer" />
                                                    <span className="text-xs text-slate-400">Cor Personalizada</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                    <input id="useBrandColorCheckbox" type="checkbox" className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                                    <span className="text-xs font-medium text-slate-600">Usar cor oficial da rede</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Texto (Rótulo)</label>
                                            <div className="flex items-center gap-2">
                                                <input id="btnLabelColor" type="color" defaultValue="#ffffff" className="w-8 h-8 p-0 border-0 cursor-pointer" />
                                                <span className="text-xs text-slate-400">Cor</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Typography */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Type size={16} className="text-indigo-500" /> Tipografia do Botão
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Fonte</label>
                                            <select id="btnFontFamily" className="w-full">
                                                <option value="Arial">Arial</option>
                                                <option value="Verdana">Verdana</option>
                                                <option value="Helvetica">Helvetica</option>
                                                <option value="Times New Roman">Times New Roman</option>
                                                <option value="Courier New">Courier New</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 block mb-1">Tamanho (px)</label>
                                            <select id="btnFontSize" className="w-full">
                                                <option value="10px">10px</option>
                                                <option value="11px">11px</option>
                                                <option value="12px" selected>12px</option>
                                                <option value="14px">14px</option>
                                                <option value="16px">16px</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="buttonOverlay" className="side-panel">
                        <div className="flex justify-between items-center p-5 border-b border-slate-200">
                            <h3 className="text-xl font-bold">Escolher Rede Social</h3>
                            <button id="closeButtonOverlay" className="text-2xl p-2 hover:bg-slate-100 rounded-full">✕</button>
                        </div>
                        <div id="socialGrid" className="social-grid"></div>
                        <div id="formInline"></div>
                    </div>

                    <div id="downloadOverlay" className="side-panel p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Download</h3>
                            <button id="closeDownload" className="text-2xl">✕</button>
                        </div>
                        <div className="space-y-4">
                            <label className="font-bold text-sm text-slate-600">Nome do Cartão (Arquivo)</label>
                            <input id="filenameInput" type="text" defaultValue="meu-cartao" className="w-full" />
                            <button id="executeDownloadBtn" className="w-full bg-green-600 text-white p-3 rounded font-bold mt-4 shadow-lg hover:bg-green-700 flex items-center justify-center gap-2">
                                <Save size={18} /> Salvar e Baixar PDF
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            <div id="toastMessage" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded shadow-lg opacity-0 transition-opacity z-[10000]"></div>
        </div>
    );
};