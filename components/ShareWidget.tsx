import React, { useState, useEffect, useRef } from 'react';
import { Share2, Code, Copy, Check, Palette, Layout, MousePointerClick, Link as LinkIcon, MessageSquare, Monitor, ArrowUpRight, Hand } from 'lucide-react';

type WidgetPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
type WidgetAction = 'modal' | 'link';

const PRESET_COLORS = [
    '#2563eb', // Blue
    '#16a34a', // Green
    '#dc2626', // Red
    '#9333ea', // Purple
    '#0f172a', // Slate
];

interface ShareWidgetProps {
    username?: string;
    initialTab?: 'embed' | 'widget';
}

export const ShareWidget = ({ username = 'usuario', initialTab = 'embed' }: ShareWidgetProps) => {
    const [activeTab, setActiveTab] = useState<'embed' | 'widget'>(initialTab);
    const [copied, setCopied] = useState(false);

    // Widget State
    const [widgetColor, setWidgetColor] = useState('#2563eb');
    const [widgetTextColor, setWidgetTextColor] = useState('#ffffff');
    const [widgetText, setWidgetText] = useState('Calcular Rescisão');
    const [widgetPosition, setWidgetPosition] = useState<WidgetPosition>('bottom-right');
    const [widgetAction, setWidgetAction] = useState<WidgetAction>('modal');
    const [targetUrl, setTargetUrl] = useState('');

    // Preview Drag State
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 }); // Relative to container
    const [isDraggingPreview, setIsDraggingPreview] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_FRONTEND_URL || '');
    const publicUrl = `${baseUrl}/c/${username}/calculorescisaotrabalhista`;

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    // Reset preview position when position setting changes
    useEffect(() => {
        if (!previewContainerRef.current) return;
        const container = previewContainerRef.current;
        const padding = 24; // 6 in tailwind = 24px

        let x = 0;
        let y = 0;

        // Calculate initial position based on selected corner
        if (widgetPosition.includes('right')) x = container.clientWidth - 180 - padding; // approx width
        else x = padding;

        if (widgetPosition.includes('bottom')) y = container.clientHeight - 60 - padding; // approx height
        else y = padding;

        setPreviewPos({ x, y });
    }, [widgetPosition]);


    // Handle Preview Dragging
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!previewContainerRef.current) return;
        setIsDraggingPreview(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        // Calculate offset from the top-left of the button
        dragOffset.current = {
            x: clientX - previewPos.x,
            y: clientY - previewPos.y
        };
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingPreview || !previewContainerRef.current) return;
        e.preventDefault(); // Prevent scrolling on touch

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const container = previewContainerRef.current;
        const rect = container.getBoundingClientRect();

        // Calculate new position relative to the preview container, not screen
        // We use the mouse position minus the offset we grabbed the button at
        // And adjust for the container's position on screen

        // Simplified approach for the contained preview:
        // Movement delta isn't enough because we are setting absolute 'left/top' style

        // 1. Get mouse pos relative to container
        const relX = clientX - rect.left;
        const relY = clientY - rect.top;

        // 2. Apply offset (where inside the button we clicked)
        // Note: This needs a bit of 'fake' logic since we track pos state directly
        // Let's just track raw movement for simplicity in this demo or follow standard drag logic

        // Actually, let's use a simpler approach for the preview:
        // Set pos to mouse pos minus half button width/height (centering) 
        // OR better: use the initial offset.

        // Since we can't easily get the button rect inside the handler without ref,
        // we'll approximate centering for the UX demo feel

        let newX = relX - (dragOffset.current.x - rect.left); // Adjust based on where we clicked relative to screen
        let newY = relY - (dragOffset.current.y - rect.top);

        // Boundaries
        const maxX = container.clientWidth - 50; // allow partial overlap
        const maxY = container.clientHeight - 40;

        if (newX < 0) newX = 0;
        if (newX > maxX) newX = maxX;
        if (newY < 0) newY = 0;
        if (newY > maxY) newY = maxY;

        setPreviewPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDraggingPreview(false);
    };


    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateWidgetCode = () => {
        // We generate a self-contained script to ensure the drag functionality works 
        // without depending on an external file update for this demo.

        const scriptContent = `
(function() {
  // Config
  var config = {
    color: "${widgetColor}",
    textColor: "${widgetTextColor}",
    text: "${widgetText}",
    position: "${widgetPosition}",
    action: "${widgetAction}",
    url: "${targetUrl || '#'}",
    iframeUrl: "${publicUrl}"
  };

  // Create Button
  var btn = document.createElement('div');
  btn.id = "lex-widget-btn";
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg><span>' + config.text + '</span>';
  
  // Styles
  Object.assign(btn.style, {
    position: 'fixed',
    zIndex: '9999',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: config.color,
    color: config.textColor,
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 'bold',
    fontSize: '14px',
    userSelect: 'none',
    touchAction: 'none', // Critical for dragging on mobile
    transition: 'transform 0.1s'
  });

  // Initial Position
  if(config.position.includes('bottom')) btn.style.bottom = '20px';
  else btn.style.top = '20px';
  
  if(config.position.includes('right')) btn.style.right = '20px';
  else btn.style.left = '20px';

  document.body.appendChild(btn);

  // --- Drag & Drop Logic ---
  var isDragging = false;
  var hasMoved = false;
  var startX, startY, initialLeft, initialTop;

  function onDown(e) {
    // Only left click or touch
    if (e.type === 'mousedown' && e.button !== 0) return;

    isDragging = true;
    hasMoved = false;
    btn.style.transition = 'none'; // Disable transition for direct follow
    btn.style.cursor = 'grabbing';
    btn.style.transform = 'scale(0.95)';

    var clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    var clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    // Get current fixed position computed
    var rect = btn.getBoundingClientRect();
    
    // We calculate offset from the top-left of the viewport
    startX = clientX;
    startY = clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    
    // Switch to explicitly setting left/top to allow free movement
    // and clear bottom/right constraints
    btn.style.left = initialLeft + 'px';
    btn.style.top = initialTop + 'px';
    btn.style.bottom = 'auto';
    btn.style.right = 'auto';
    
    e.preventDefault(); // Prevent text selection / scrolling
  }

  function onMove(e) {
    if (!isDragging) return;

    var clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    var clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

    var dx = clientX - startX;
    var dy = clientY - startY;
    
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;

    // Boundary Checks (Keep in viewport)
    var newLeft = initialLeft + dx;
    var newTop = initialTop + dy;
    
    var maxLeft = window.innerWidth - btn.offsetWidth;
    var maxTop = window.innerHeight - btn.offsetHeight;

    if (newLeft < 0) newLeft = 0;
    if (newLeft > maxLeft) newLeft = maxLeft;
    if (newTop < 0) newTop = 0;
    if (newTop > maxTop) newTop = maxTop;

    btn.style.left = newLeft + 'px';
    btn.style.top = newTop + 'px';
  }

  function onUp(e) {
    if (!isDragging) return;
    isDragging = false;
    btn.style.cursor = 'pointer';
    btn.style.transform = 'scale(1)';
    btn.style.transition = 'transform 0.1s';

    if (!hasMoved) {
      handleClick();
    }
  }

  function handleClick() {
    if (config.action === 'link') {
      window.open(config.url, '_blank');
    } else {
      // Modal Logic
      var modal = document.createElement('div');
      Object.assign(modal.style, {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      });
      modal.onclick = function(e) { if(e.target === modal) modal.remove(); };
      
      var iframe = document.createElement('iframe');
      iframe.src = config.iframeUrl;
      Object.assign(iframe.style, {
        width: '90%', maxWidth: '1000px', height: '90%', maxHeight: '800px',
        backgroundColor: 'white', borderRadius: '12px', border: 'none'
      });
      
      modal.appendChild(iframe);
      document.body.appendChild(modal);
    }
  }

  // Events
  btn.addEventListener('mousedown', onDown);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);

  btn.addEventListener('touchstart', onDown, {passive: false});
  document.addEventListener('touchmove', onMove, {passive: false});
  document.addEventListener('touchend', onUp);
})();
`;
        return `<script>${scriptContent}</script>`;
    };

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <Share2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">Divulgação & Integração</h2>
                        <p className="text-indigo-100 mt-1">Ferramentas para instalar a calculadora no seu site e capturar contatos no CRM.</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8 border-b border-slate-200 dark:border-slate-700 mt-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('embed')}
                    className={`pb-4 px-2 font-medium text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap
                        ${activeTab === 'embed'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}
                >
                    <Code size={18} /> Link Direto & Embed Simples
                </button>
                <button
                    onClick={() => setActiveTab('widget')}
                    className={`pb-4 px-2 font-medium text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap
                        ${activeTab === 'widget'
                            ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}
                >
                    <MessageSquare size={18} /> Criador de Widget Flutuante
                </button>
            </div>

            {/* TAB: EMBED & LINKS */}
            {activeTab === 'embed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2 fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                            <Monitor size={20} className="text-indigo-500" />
                            Iframe (Embed no Site)
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                            Use este código para exibir a calculadora inteira dentro de uma página do seu site (WordPress, Wix, etc).
                        </p>

                        <div className="bg-slate-900 rounded-lg p-4 relative group">
                            <code className="text-green-400 font-mono text-sm break-all block">
                                &lt;iframe src="{publicUrl}" width="100%" height="800px" frameborder="0"&gt;&lt;/iframe&gt;
                            </code>
                            <button
                                onClick={() => handleCopy(`<iframe src="${publicUrl}" width="100%" height="800px" frameborder="0"></iframe>`)}
                                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                            <LinkIcon size={20} className="text-blue-500" />
                            Link Direto (Redes Sociais)
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                            Link ideal para colocar na Bio do Instagram, enviar por WhatsApp ou usar em campanhas de email.
                        </p>

                        <div className="flex gap-2">
                            <input
                                readOnly
                                value={publicUrl}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-600 dark:text-slate-300 outline-none"
                            />
                            <button
                                onClick={() => handleCopy(publicUrl)}
                                className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium text-sm hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: WIDGET BUILDER */}
            {activeTab === 'widget' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-2 fade-in">

                    {/* Left: Configuration */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">

                            {/* Visual Config */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <Palette size={18} /> Configuração Visual
                                </h3>

                                <div>
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">Cor de Fundo</label>
                                    <div className="flex flex-wrap gap-3 items-center">
                                        {PRESET_COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setWidgetColor(color)}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${widgetColor === color ? 'border-slate-400 ring-2 ring-offset-2 ring-slate-400 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                        <div className="relative ml-2">
                                            <input
                                                type="color"
                                                value={widgetColor}
                                                onChange={(e) => setWidgetColor(e.target.value)}
                                                className="w-10 h-10 p-0 rounded-lg border-0 cursor-pointer overflow-hidden"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">Cor do Texto</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={widgetTextColor}
                                                onChange={(e) => setWidgetTextColor(e.target.value)}
                                                className="w-8 h-8 p-0 rounded border-0 cursor-pointer"
                                            />
                                            <span className="text-xs text-slate-500 font-mono uppercase">{widgetTextColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">Posição Inicial</label>
                                        <select
                                            value={widgetPosition}
                                            onChange={(e) => setWidgetPosition(e.target.value as WidgetPosition)}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1.5 text-sm dark:text-white"
                                        >
                                            <option value="bottom-right">Canto Inferior Direito</option>
                                            <option value="bottom-left">Canto Inferior Esquerdo</option>
                                            <option value="top-right">Canto Superior Direito</option>
                                            <option value="top-left">Canto Superior Esquerdo</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">Texto do Botão</label>
                                    <input
                                        type="text"
                                        value={widgetText}
                                        onChange={(e) => setWidgetText(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Behavior Config */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <MousePointerClick size={18} /> Comportamento
                                </h3>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="action"
                                            checked={widgetAction === 'modal'}
                                            onChange={() => setWidgetAction('modal')}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Abrir Calculadora Padrão (Modal)</span>
                                    </label>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="action"
                                            checked={widgetAction === 'link'}
                                            onChange={() => setWidgetAction('link')}
                                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="text-sm text-slate-700 dark:text-slate-300">Redirecionar para um Link</span>
                                    </label>
                                </div>

                                {widgetAction === 'link' && (
                                    <div className="animate-in fade-in slide-in-from-top-1">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">URL de Destino</label>
                                        <div className="relative">
                                            <ArrowUpRight className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <input
                                                type="url"
                                                placeholder="https://seusite.com/contato"
                                                value={targetUrl}
                                                onChange={(e) => setTargetUrl(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview & Code */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Live Preview */}
                        <div
                            ref={previewContainerRef}
                            className="bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[400px] relative"
                            onMouseMove={handleMouseMove}
                            onTouchMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onTouchEnd={handleMouseUp}
                        >
                            <div className="bg-slate-200 dark:bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 z-10">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded text-xs text-slate-500 flex-1 text-center opacity-50">
                                    seusite.com.br
                                </div>
                            </div>

                            <div className="relative flex-1 bg-white dark:bg-slate-950 p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200 flex items-center gap-1">
                                    <Hand size={12} /> Tente arrastar o botão!
                                </div>

                                <div className="max-w-md mx-auto space-y-4 opacity-20 pointer-events-none select-none">
                                    <div className="h-8 bg-slate-300 dark:bg-slate-800 rounded w-3/4"></div>
                                    <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                                    </div>
                                </div>

                                {/* The Floating Widget Preview - Draggable */}
                                <div
                                    onMouseDown={handleMouseDown}
                                    onTouchStart={handleMouseDown}
                                    className={`absolute flex items-center gap-3 p-4 shadow-xl rounded-full select-none
                                        ${isDraggingPreview ? 'cursor-grabbing scale-95' : 'cursor-grab hover:scale-105 animate-pulse'}
                                    `}
                                    style={{
                                        backgroundColor: widgetColor,
                                        color: widgetTextColor,
                                        left: previewPos.x,
                                        top: previewPos.y,
                                        transition: isDraggingPreview ? 'none' : 'transform 0.2s',
                                        zIndex: 50
                                    }}
                                >
                                    <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm pointer-events-none">
                                        <Layout size={24} color={widgetTextColor} />
                                    </div>
                                    <div className="font-bold pr-2 whitespace-nowrap pointer-events-none">
                                        {widgetText || 'Texto do Botão'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Code Output */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                                <Code size={20} className="text-indigo-500" />
                                Código de Integração
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                                O código abaixo inclui toda a funcionalidade de <strong>Arrastar e Soltar (Desktop e Mobile)</strong> automaticamente.
                                Copie e cole antes da tag de fechamento <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded text-indigo-500">&lt;/body&gt;</code>.
                            </p>

                            <div className="bg-slate-900 rounded-lg p-4 relative group">
                                <code className="text-blue-300 font-mono text-xs sm:text-sm break-all whitespace-pre-wrap block leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                                    {generateWidgetCode()}
                                </code>
                                <button
                                    onClick={() => handleCopy(generateWidgetCode())}
                                    className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors"
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};