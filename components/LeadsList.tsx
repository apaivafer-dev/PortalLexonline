import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Eye, X, FileText, Calendar, DollarSign, User, Phone, Mail, MessageCircle, Filter, ArrowRight, ChevronDown, ChevronUp, Sparkles, Send, Building2, LayoutGrid, List as ListIcon, MoreHorizontal, GripVertical } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';
import { Lead } from '../types';

// Initial Mock Data
const INITIAL_LEADS: Lead[] = [
  { id: '1', name: 'João Silva', email: 'joao@email.com', phone: '11999999999', createdAt: '2023-10-25', estimatedValue: 12500, status: 'New' },
  { id: '2', name: 'Maria Souza', email: 'maria@email.com', phone: '11988888888', createdAt: '2023-10-24', estimatedValue: 8400, status: 'Contacted' },
  { id: '3', name: 'Pedro Santos', email: 'pedro@email.com', phone: '11977777777', createdAt: '2023-10-23', estimatedValue: 25000, status: 'Converted' },
  { id: '4', name: 'Ana Lima', email: 'ana@email.com', phone: '11966666666', createdAt: '2023-10-22', estimatedValue: 5600, status: 'Lost' },
  { id: '5', name: 'Carlos Pereira', email: 'carlos@email.com', phone: '11955555555', createdAt: '2023-10-21', estimatedValue: 45000, status: 'New' },
  { id: '6', name: 'Fernanda Costa', email: 'fer@email.com', phone: '11944444444', createdAt: '2023-10-20', estimatedValue: 18200, status: 'New' },
  { id: '7', name: 'Roberto Alves', email: 'beto@email.com', phone: '11933333333', createdAt: '2023-10-19', estimatedValue: 32100, status: 'Contacted' },
];

const DATE_FILTERS = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'month', label: 'Este Mês' },
    { id: 'all', label: 'Todos' },
    { id: 'custom', label: 'Personalizado' },
];

const STATUS_CONFIG = {
    'New': { label: 'Novo', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
    'Contacted': { label: 'Contatado', color: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
    'Converted': { label: 'Convertido', color: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
    'Lost': { label: 'Perdido', color: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' }
};

export const LeadsList = () => {
  // Data State
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);

  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Interaction State
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Lead['status'] | null>(null);

  // Helper to calculate date range from filter ID
  const calculateDateRange = (filterId: string) => {
      const end = new Date();
      const start = new Date();
      
      switch (filterId) {
          case 'today':
              break; // start is today
          case '7d':
              start.setDate(end.getDate() - 7);
              break;
          case '30d':
              start.setDate(end.getDate() - 30);
              break;
          case 'month':
              start.setDate(1);
              break;
          case 'all':
              return { start: '', end: '' };
          case 'custom':
               return null; // Don't change dates on custom select, just mode
          default:
              return null;
      }
      return {
          start: start.toLocaleDateString('en-CA'),
          end: end.toLocaleDateString('en-CA')
      };
  };

  useEffect(() => {
      if (dateFilter !== 'custom') {
          const range = calculateDateRange(dateFilter);
          if (range) setDateRange(range);
      } else {
          // If switched to custom via dropdown, focus start date
          if (startDateInputRef.current) {
              startDateInputRef.current.focus();
          }
      }
  }, [dateFilter]);

  // Initial load for "Today"
  useEffect(() => {
      const range = calculateDateRange('today');
      if (range) setDateRange(range);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleManualDateChange = (field: 'start' | 'end', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }));
      setDateFilter('custom');
  };

  const generateTemplate = (lead: Lead) => {
      return `Olá, ${lead.name.split(' ')[0]}! Tudo bem?\n\nRecebi sua simulação de rescisão (estimada em ${formatCurrency(lead.estimatedValue)}) e gostaria de agendar uma breve conversa para verificar se todos os seus direitos foram calculados corretamente.\n\nPodemos falar?`;
  };

  const handleUpdateStatus = (id: string, newStatus: Lead['status']) => {
      setLeads(prev => prev.map(lead => 
          lead.id === id ? { ...lead, status: newStatus } : lead
      ));
  };

  const toggleRow = (id: string) => {
      if (expandedLeadId === id) {
          setExpandedLeadId(null);
          setActiveMessage('');
      } else {
          setExpandedLeadId(id);
          const lead = leads.find(l => l.id === id);
          if (lead) {
              setActiveMessage(generateTemplate(lead));
          }
      }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData('leadId', id);
      e.dataTransfer.effectAllowed = 'move';
      setDraggedLeadId(id);
  };

  const handleDragOver = (e: React.DragEvent, status: Lead['status']) => {
      e.preventDefault(); 
      if (dragOverColumn !== status) {
          setDragOverColumn(status);
      }
  };

  const handleDragLeave = () => {
      // Logic to prevent flickering
  };

  const handleDrop = (e: React.DragEvent, newStatus: Lead['status']) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('leadId');
      if (id) {
          handleUpdateStatus(id, newStatus);
      }
      setDraggedLeadId(null);
      setDragOverColumn(null);
  };

  const handleDragEnd = () => {
      setDraggedLeadId(null);
      setDragOverColumn(null);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesDate = true; 

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Mock calculations
  const getMockCalculationDetails = (value: number) => {
    const gross = value * 1.15; 
    const deductions = gross - value;
    return { gross, deductions, net: value };
  };

  const handleWhatsAppClick = (phone: string, message: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
      window.open(`tel:${phone}`, '_self');
  };

  // --- REUSABLE LEAD DETAIL COMPONENT ---
  const renderLeadDetails = (lead: Lead) => {
      const details = getMockCalculationDetails(lead.estimatedValue);
      
      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left: Values Breakdown */}
              <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <FileText size={16} className="text-indigo-500" />
                      Detalhamento do Cálculo
                  </h4>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Total Proventos</span>
                          <span className="font-medium text-green-600 dark:text-green-400">+ {formatCurrency(details.gross)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-700 pb-3">
                          <span className="text-slate-500 dark:text-slate-400">Total Descontos</span>
                          <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(details.deductions)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                          <span className="font-bold text-slate-700 dark:text-slate-200">Valor Líquido</span>
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(details.net)}</span>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Dados do Lead</div>
                      <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <User size={14} className="text-indigo-500" /> {lead.name}
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Mail size={14} className="text-indigo-500" /> {lead.email}
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Phone size={14} className="text-indigo-500" /> {lead.phone}
                          </div>
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                              <Calendar size={14} className="text-indigo-500" /> Capturado em {formatDate(lead.createdAt)}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right: Personal Message & Action */}
              <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <MessageCircle size={16} className="text-green-500" />
                      Contato Rápido
                  </h4>
                  
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2 block">
                          Mensagem Personalizada (Editável)
                      </label>
                      
                      <textarea 
                          value={activeMessage}
                          onChange={(e) => setActiveMessage(e.target.value)}
                          className="w-full text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4 h-32 resize-none leading-relaxed"
                      />
                      
                      <div className="grid grid-cols-1 gap-3">
                          <button 
                              onClick={() => handleWhatsAppClick(lead.phone, activeMessage)}
                              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                          >
                              <Send size={18} fill="white" className="text-white" />
                              Enviar no WhatsApp
                          </button>

                          <button 
                              onClick={() => handleCall(lead.phone)}
                              className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                          >
                              <Phone size={18} />
                              Ligar para o Lead
                          </button>
                      </div>
                  </div>
              </div>

          </div>
      );
  };

  // --- RENDER HELPERS ---

  const StatusSelect = ({ currentStatus, onChange }: { currentStatus: Lead['status'], onChange: (s: Lead['status']) => void }) => (
      <div className="relative group" onClick={(e) => e.stopPropagation()}>
        <select 
            value={currentStatus}
            onChange={(e) => onChange(e.target.value as Lead['status'])}
            className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all ${STATUS_CONFIG[currentStatus].color}`}
        >
            <option value="New">Novo</option>
            <option value="Contacted">Contatado</option>
            <option value="Converted">Convertido</option>
            <option value="Lost">Perdido</option>
        </select>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <ChevronDown size={12} />
        </div>
      </div>
  );

  const selectedLeadForModal = leads.find(l => l.id === expandedLeadId);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      
      {/* Header & Controls Area */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        
        {/* Row 1: Title */}
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciamento de Leads</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Visualize e entre em contato com potenciais clientes.</p>
        </div>

        {/* Row 2: Unified Toolbar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                {/* Date Controls Group */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {/* Date Presets Dropdown */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar size={14} className="text-slate-400" />
                        </div>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none w-full sm:w-auto dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer h-[38px]"
                        >
                            {DATE_FILTERS.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
                    </div>

                    {/* Date Inputs */}
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 h-[38px]">
                        <div className="relative h-full">
                            <input 
                                ref={startDateInputRef}
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => handleManualDateChange('start', e.target.value)}
                                className="bg-transparent text-sm text-slate-600 dark:text-slate-300 border-none outline-none focus:ring-0 px-1 w-[130px] h-full"
                            />
                        </div>
                        <span className="text-slate-400"><ArrowRight size={14}/></span>
                        <div className="relative h-full">
                            <input 
                                type="date" 
                                value={dateRange.end}
                                onChange={(e) => handleManualDateChange('end', e.target.value)}
                                className="bg-transparent text-sm text-slate-600 dark:text-slate-300 border-none outline-none focus:ring-0 px-1 w-[130px] h-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[160px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Filter size={14} className="text-slate-400" />
                    </div>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none w-full dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer h-[38px]"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="New">Novo</option>
                        <option value="Contacted">Contatado</option>
                        <option value="Converted">Convertido</option>
                        <option value="Lost">Perdido</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <ChevronDown size={14} className="text-slate-400" />
                    </div>
                </div>

                {/* Expandable Search */}
                <div className={`relative flex items-center transition-all duration-300 ease-in-out ${isSearchOpen || searchTerm ? 'w-64' : 'w-10'}`}>
                    <div className={`absolute left-0 z-10 p-2.5 rounded-full cursor-pointer transition-colors ${isSearchOpen || searchTerm ? 'text-slate-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`} onClick={() => setIsSearchOpen(!isSearchOpen)}>
                         <Search size={16} />
                    </div>
                    <input 
                        ref={searchInputRef}
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onBlur={() => { if(!searchTerm) setIsSearchOpen(false); }}
                        className={`pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white focus:ring-2 focus:ring-indigo-500 h-[38px] transition-all duration-300 ${isSearchOpen || searchTerm ? 'w-full opacity-100' : 'w-0 opacity-0 pointer-events-none border-none'}`}
                    />
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0 h-[38px] ml-auto xl:ml-0">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-2.5 rounded-md transition-all flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                        title="Visualização em Lista"
                    >
                        <ListIcon size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`px-2.5 rounded-md transition-all flex items-center justify-center ${viewMode === 'board' ? 'bg-white dark:bg-slate-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/50'}`}
                        title="Visualização em Kanban"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>

            </div>
        </div>
      </div>

      {/* --- LIST VIEW --- */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 w-8"></th>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">Contato</th>
                            <th className="px-6 py-4">Data Captura</th>
                            <th className="px-6 py-4">Valor Estimado</th>
                            <th className="px-6 py-4">Status (Ajustável)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredLeads.map(lead => {
                            const isExpanded = expandedLeadId === lead.id;
                            
                            return (
                                <React.Fragment key={lead.id}>
                                    <tr 
                                        onClick={() => toggleRow(lead.id)}
                                        className={`cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <td className="px-6 py-4 text-slate-400">
                                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800 dark:text-white">{lead.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1"><Mail size={12}/> {lead.email}</div>
                                            <div className="flex items-center gap-1 mt-1 text-xs"><Phone size={12}/> {lead.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {formatDate(lead.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-800 dark:text-white">
                                            {formatCurrency(lead.estimatedValue)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusSelect 
                                                currentStatus={lead.status} 
                                                onChange={(s) => handleUpdateStatus(lead.id, s)} 
                                            />
                                        </td>
                                    </tr>
                                    
                                    {/* EXPANDED DETAILS ROW */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default">
                                            <td colSpan={6} className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
                                                {renderLeadDetails(lead)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        {filteredLeads.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    Nenhum lead encontrado com os filtros selecionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 text-center">
                Mostrando {filteredLeads.length} leads
            </div>
        </div>
      )}

      {/* --- KANBAN BOARD VIEW (With Drag & Drop) --- */}
      {viewMode === 'board' && (
        <div className="flex gap-4 overflow-x-auto pb-6 animate-in fade-in slide-in-from-bottom-2">
            {Object.keys(STATUS_CONFIG).map((statusKey) => {
                const status = statusKey as Lead['status'];
                const config = STATUS_CONFIG[status];
                const columnLeads = filteredLeads.filter(l => l.status === status);
                const isDragOver = dragOverColumn === status;

                return (
                    <div 
                        key={status}
                        onDragOver={(e) => handleDragOver(e, status)}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragLeave={handleDragLeave}
                        className={`min-w-[300px] flex-1 flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl p-3 border transition-all duration-200
                             ${isDragOver 
                                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800' 
                                : 'border-slate-200 dark:border-slate-700/50'
                             }`}
                    >
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                {config.label}
                                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700">
                                    {columnLeads.length}
                                </span>
                            </h3>
                        </div>

                        <div className="flex-1 space-y-3 min-h-[200px]">
                            {columnLeads.map(lead => {
                                const isDragging = draggedLeadId === lead.id;

                                return (
                                    <div 
                                        key={lead.id}
                                        draggable="true"
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onDragEnd={handleDragEnd}
                                        onClick={() => toggleRow(lead.id)}
                                        className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200 group
                                            ${isDragging ? 'opacity-40 scale-95 cursor-grabbing shadow-inner' : 'hover:shadow-xl hover:scale-[1.02] cursor-pointer'}
                                        `}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-start gap-2 max-w-[85%]">
                                                <div className="mt-0.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <GripVertical size={14} />
                                                </div>
                                                <div className="font-bold text-slate-800 dark:text-white truncate">{lead.name}</div>
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(lead.createdAt)}</div>
                                        </div>
                                        
                                        <div className="space-y-1 mb-3 pl-5">
                                            <div className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                {formatCurrency(lead.estimatedValue)}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                <Mail size={10} /> {lead.email}
                                            </div>
                                        </div>

                                        {/* Card Footer: Status Change & Actions */}
                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <label className="text-[10px] text-slate-400 uppercase font-bold mb-1 block">Mover para:</label>
                                                <select 
                                                    value={lead.status} 
                                                    onChange={(e) => handleUpdateStatus(lead.id, e.target.value as Lead['status'])}
                                                    className="w-full text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 cursor-pointer"
                                                >
                                                    <option value="New">Novo</option>
                                                    <option value="Contacted">Contatado</option>
                                                    <option value="Converted">Convertido</option>
                                                    <option value="Lost">Perdido</option>
                                                </select>
                                            </div>
                                            
                                            <div className="flex gap-2 mt-1">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleWhatsAppClick(lead.phone, generateTemplate(lead)); }}
                                                    className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                                    title="WhatsApp"
                                                >
                                                    <MessageCircle size={14} /> Whats
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleCall(lead.phone); }}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                                    title="Ligar"
                                                >
                                                    <Phone size={14} /> Ligar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {columnLeads.length === 0 && (
                                <div className={`h-full flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-colors ${isDragOver ? 'bg-indigo-100/50 dark:bg-indigo-900/30 border-indigo-300' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                                    {isDragOver ? 'Solte aqui' : 'Vazio'}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* --- BOARD VIEW MODAL --- */}
      {viewMode === 'board' && selectedLeadForModal && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setExpandedLeadId(null)}
        >
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {selectedLeadForModal.name}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${STATUS_CONFIG[selectedLeadForModal.status].color.replace('bg-', 'bg-opacity-20 ')}`}>
                                {STATUS_CONFIG[selectedLeadForModal.status].label}
                            </span>
                        </h3>
                        <p className="text-sm text-slate-500">Detalhes do Lead • Estimativa: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{formatCurrency(selectedLeadForModal.estimatedValue)}</span></p>
                    </div>
                    <button 
                        onClick={() => setExpandedLeadId(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    {renderLeadDetails(selectedLeadForModal)}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
