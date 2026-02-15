import React, { useState, useEffect, useRef } from 'react';
import { Settings, Eye, Download, Palette, Type, Layout, ScanLine } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BANNER_COLORS = ['#e74c3c', '#2ecc71', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];
const FONT_COLORS = ['#ffffff', '#000000', '#2c3e50', '#7f8c8d', '#e67e22', '#8e44ad', '#27ae60', '#c0392b'];

interface BannerCreatorProps {
    initialCompanyName?: string;
}

export const BannerCreator = ({ initialCompanyName = 'Minha Empresa' }: BannerCreatorProps) => {
    // Config State
    const [companyName, setCompanyName] = useState(initialCompanyName);
    const [reviewLink, setReviewLink] = useState('https://google.com');
    const [bannerTitle, setBannerTitle] = useState('Avalie-nos no Google');
    const [bannerDescription, setBannerDescription] = useState('Adoraríamos ouvir sobre sua experiência!');
    const [qrInstruction, setQrInstruction] = useState('leia o QR Code');
    const [instructions, setInstructions] = useState('Nossa missão: Defender os interesses de nossos clientes com excelência e dedicação');
    
    // Visual State
    const [bannerColor, setBannerColor] = useState('#e74c3c');
    const [fontColor, setFontColor] = useState('#ffffff');
    const [frameType, setFrameType] = useState<'google' | 'black' | 'white'>('google');
    const [format, setFormat] = useState('a4');
    const [isGenerating, setIsGenerating] = useState(false);

    // Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bannerPreviewRef = useRef<HTMLDivElement>(null);

    // QR Code Generation
    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, reviewLink, {
                width: 112, // Increased by 40%
                margin: 0,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [reviewLink]);

    const handleDownload = async () => {
        if (!bannerPreviewRef.current) return;
        setIsGenerating(true);

        try {
            // Wait for render
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(bannerPreviewRef.current, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = 150; // mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            pdf.save('banner-avaliacao.pdf');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            
            {/* --- Configuration Panel --- */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <Settings className="text-indigo-500" size={24} />
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">Configurações do Banner</h1>
                </div>

                <div className="space-y-6">
                    {/* INPUTS ORDER:
                        1. Nome da Empresa
                        2. Link (QR)
                        3. Descrição
                        4. Título do Banner
                        5. Instrução (abaixo do QR)
                        6. Frase de destaque
                    */}
                    
                    {/* 1. Nome da Empresa */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nome da Empresa</label>
                        <input 
                            type="text" 
                            value={companyName} 
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* 2. Link QR Code */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Link para Avaliação (QR Code)</label>
                        <input 
                            type="url" 
                            value={reviewLink} 
                            onChange={(e) => setReviewLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* 3. Descrição */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Descrição</label>
                        <textarea 
                            value={bannerDescription} 
                            onChange={(e) => setBannerDescription(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                        />
                    </div>

                    {/* 4. Título do Banner */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Título do Banner (acima do QR)</label>
                        <input 
                            type="text" 
                            value={bannerTitle} 
                            onChange={(e) => setBannerTitle(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* 5. Instrução QR */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Instrução (abaixo do QR)</label>
                        <input 
                            type="text" 
                            value={qrInstruction} 
                            onChange={(e) => setQrInstruction(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* 6. Frase de Destaque */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Frase de destaque</label>
                        <textarea 
                            value={instructions} 
                            onChange={(e) => setInstructions(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px]"
                        />
                    </div>

                    {/* Visual Settings (Colors & Frame) */}
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

                        {/* Frame Selection */}
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

            {/* --- Preview Panel --- */}
            <div className="relative">
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 sticky top-8">
                     <div className="flex items-center gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <Eye className="text-indigo-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Prévia do Banner</h1>
                    </div>

                    {/* The Banner Canvas */}
                    <div 
                        ref={bannerPreviewRef}
                        className="w-full aspect-[210/297] max-w-[400px] mx-auto rounded-xl p-8 flex flex-col items-center text-center relative overflow-hidden shadow-2xl transition-colors duration-300"
                        style={{ backgroundColor: bannerColor, color: fontColor }}
                    >
                        {/* 1. Nome da Empresa (TOPO E MAIOR) */}
                        {companyName && (
                            <h1 className="text-2xl font-bold uppercase tracking-wide mb-6 leading-tight">
                                {companyName}
                            </h1>
                        )}

                        {/* 3. Título (Abaixo do nome da empresa) */}
                        {bannerTitle && <h2 className="text-2xl font-bold mb-4 leading-tight">{bannerTitle}</h2>}
                        
                        {/* 4. Descrição */}
                        {bannerDescription && <p className="text-base opacity-95 mb-8 leading-relaxed">{bannerDescription}</p>}

                        {/* 2. QR Code */}
                        <div className={`p-3 bg-white rounded-xl mb-3 relative w-fit mx-auto
                            ${frameType === 'black' ? 'border-[3px] border-black' : ''}
                            ${frameType === 'white' ? 'border-[3px] border-gray-200' : ''}
                        `}>
                             {frameType === 'google' && (
                                 <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
                                     borderTop: '4px solid #ea4335',
                                     borderRight: '4px solid #4285f4',
                                     borderBottom: '4px solid #34a853',
                                     borderLeft: '4px solid #fbbc05',
                                 }}></div>
                             )}
                             <canvas ref={canvasRef} className="w-[140px] h-[140px] block" />
                        </div>
                        
                        {/* 5. Instrução QR */}
                        {qrInstruction && <p className="text-xs font-medium uppercase tracking-wider mb-8 opacity-90">{qrInstruction}</p>}

                        {/* Visual Step Guide */}
                        <div className="w-full text-left space-y-3 mb-8 bg-black/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-xs">1</span>
                                <span>Abra o aplicativo da câmera</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-xs">2</span>
                                <span>Aponte para o QR Code</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-bold text-xs">3</span>
                                <span>Avalie nossa empresa</span>
                            </div>
                        </div>

                        {/* 6. Frase de Destaque (Rodapé/Final) */}
                        {instructions && (
                            <p className="text-sm italic opacity-90 mt-auto font-medium">{instructions}</p>
                        )}
                    </div>

                    {/* Download Actions */}
                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                             <div className="w-full sm:w-auto">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Formato</label>
                                <select 
                                    value={format} 
                                    onChange={(e) => setFormat(e.target.value)}
                                    className="w-full sm:w-40 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-3 py-2 text-sm dark:text-white"
                                >
                                    <option value="a4">A4 (PDF)</option>
                                    <option value="png">Imagem (PNG)</option>
                                </select>
                             </div>
                             
                             <button 
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                {isGenerating ? (
                                    <>Gerando...</>
                                ) : (
                                    <><Download size={20} /> Baixar Banner</>
                                )}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};