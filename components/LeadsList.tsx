import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Eye, X, FileText, Calendar, DollarSign, User, Phone, Mail, MessageCircle, Filter, ArrowRight, ChevronDown, ChevronUp, Sparkles, Send, Building2, LayoutGrid, List as ListIcon, MoreHorizontal, GripVertical, Settings, Plus, Briefcase, Users, Zap, Trash2, GripHorizontal, Check, Lock, Edit2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, generateId } from '../lib/utils';
import { Lead, Pipeline, PipelineStage } from '../types';

const DATE_FILTERS = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'month', label: 'Este Mês' },
    { id: 'all', label: 'Todos' },
    { id: 'custom', label: 'Personalizado' },
];

interface LeadsListProps {
    leads: Lead[];
    pipelines: Pipeline[];
    onUpdateLeads: (leads: Lead[]) => void;
    onUpdatePipelines: (pipelines: Pipeline[]) => void;
    initialOpenLeadId?: string | null;
    onClearTarget?: () => void;
}

export const LeadsList = ({ leads, pipelines, onUpdateLeads, onUpdatePipelines, initialOpenLeadId, onClearTarget }: LeadsListProps) => {
  // Tab State
  const [activeTab, setActiveTab] = useState<'oportunidades' | 'contatos' | 'empresas' | 'automacoes'>('oportunidades');

  // Pipeline State
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || '');
  const [isPipelineConfigOpen, setIsPipelineConfigOpen] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const startDateInputRef = useRef<HTMLInputElement>(null);

  const [dateFilter, setDateFilter] = useState('today');
  const [stageFilter, setStageFilter] = useState('all');
  
  // Interaction State
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [activeMessage, setActiveMessage] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Drag and Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId) || pipelines[0];
  const selectedLeadForModal = leads.find(l => l.id === expandedLeadId);

  // Auto-open modal if triggered from notification
  useEffect(() => {
      if (initialOpenLeadId) {
          setExpandedLeadId(initialOpenLeadId);
          // Find which pipeline this lead belongs to and switch to it
          const lead = leads.find(l => l.id === initialOpenLeadId);
          if (lead) {
              setSelectedPipelineId(lead.pipelineId);
              setActiveMessage(generateTemplate(lead));
          }
          if(onClearTarget) onClearTarget();
      }
  }, [initialOpenLeadId, leads]);

  // Ensure valid pipeline selection
  useEffect(() => {
      if (!pipelines.find(p => p.id === selectedPipelineId)) {
          setSelectedPipelineId(pipelines[0]?.id || '');
      }
  }, [pipelines]);

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
               return null; 
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
          if (startDateInputRef.current) {
              startDateInputRef.current.focus();
          }
      }
  }, [dateFilter]);

  useEffect(() => {
      const range = calculateDateRange('today');
      if (range) setDateRange(range);
  }, []);

  const handleManualDateChange = (field: 'start' | 'end', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }));
      setDateFilter('custom');
  };

  const generateTemplate = (lead: Lead) => {
      return `Olá, ${lead.name.split(' ')[0]}! Tudo bem?\n\nRecebi sua simulação de rescisão (estimada em ${formatCurrency(lead.estimatedValue)}) e gostaria de agendar uma breve conversa para verificar se todos os seus direitos foram calculados corretamente.\n\nPodemos falar?`;
  };

  const handleUpdateStage = (id: string, newStageId: string) => {
      onUpdateLeads(leads.map(lead => 
          lead.id === id ? { ...lead, stageId: newStageId } : lead
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

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
      e.preventDefault(); 
      if (dragOverColumn !== stageId) {
          setDragOverColumn(stageId);
      }
  };

  const handleDrop = (e: React.DragEvent, newStageId: string) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('leadId');
      if (id) {
          handleUpdateStage(id, newStageId);
      }
      setDraggedLeadId(null);
      setDragOverColumn(null);
  };

  const filteredLeads = leads.filter(lead => {
    // Only show leads for current pipeline
    if (lead.pipelineId !== selectedPipelineId) return false;

    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = stageFilter === 'all' || lead.stageId === stageFilter;
    const matchesDate = true; // Simplified date filter for demo

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleWhatsAppClick = (phone: string, message: string) => {
      const cleanPhone = phone.replace(/\D/g, '');
      const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
      window.open(`tel:${phone}`, '_self');
  };

  // --- PIPELINE MANAGER COMPONENT ---
  const PipelineConfigModal = () => {
      const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
      const [localPipelines, setLocalPipelines] = useState<Pipeline[]>(JSON.parse(JSON.stringify(pipelines)));
      
      // Selected Pipeline for detailed editing
      const currentEditPipeline = localPipelines.find(p => p.id === editingPipelineId);

      const handleSave = () => {
          onUpdatePipelines(localPipelines);
          setIsPipelineConfigOpen(false);
      };

      const addPipeline = () => {
          const newPipeline: Pipeline = {
              id: `pipeline-${Date.now()}`,
              name: 'Novo Pipeline',
              isSystem: false,
              showValue: true,
              showTotal: false,
              order: localPipelines.length,
              stages: [
                  { id: `stage-${Date.now()}-1`, name: 'Nova Etapa', order: 0, type: 'active' }
              ]
          };
          setLocalPipelines([...localPipelines, newPipeline]);
          setEditingPipelineId(newPipeline.id);
      };

      const deletePipeline = (id: string) => {
          if (confirm("Tem certeza? Todos os leads neste pipeline serão ocultados.")) {
              setLocalPipelines(localPipelines.filter(p => p.id !== id));
              if (editingPipelineId === id) setEditingPipelineId(null);
          }
      };

      const addStage = (pipelineId: string) => {
          setLocalPipelines(localPipelines.map(p => {
              if (p.id === pipelineId) {
                  return {
                      ...p,
                      stages: [...p.stages, { id: `stage-${Date.now()}`, name: 'Nova Etapa', order: p.stages.length, type: 'active' }]
                  };
              }
              return p;
          }));
      };

      const updateStage = (pipelineId: string, stageId: string, field: keyof PipelineStage, value: any) => {
          setLocalPipelines(localPipelines.map(p => {
              if (p.id === pipelineId) {
                  return {
                      ...p,
                      stages: p.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s)
                  };
              }
              return p;
          }));
      };

      const removeStage = (pipelineId: string, stageId: string) => {
          setLocalPipelines(localPipelines.map(p => {
              if (p.id === pipelineId) {
                  return {
                      ...p,
                      stages: p.stages.filter(s => s.id !== stageId)
                  };
              }
              return p;
          }));
      };

      return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Pipelines</h3>
                          <p className="text-sm text-slate-500">Configure seus funis de vendas e etapas.</p>
                      </div>
                      <button onClick={() => setIsPipelineConfigOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      {/* Sidebar List */}
                      <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/30">
                          <div className="space-y-2">
                              {localPipelines.sort((a,b) => a.order - b.order).map((pipeline, idx) => (
                                  <div 
                                    key={pipeline.id}
                                    onClick={() => setEditingPipelineId(pipeline.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group
                                        ${editingPipelineId === pipeline.id 
                                            ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md' 
                                            : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className="text-slate-400 font-mono text-xs">{idx + 1}</div>
                                          <span className="font-medium text-sm truncate dark:text-white">{pipeline.name}</span>
                                          {pipeline.isSystem && <span title="Pipeline do Sistema"><Lock size={12} className="text-slate-400" /></span>}
                                      </div>
                                      {!pipeline.isSystem && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); deletePipeline(pipeline.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      )}
                                  </div>
                              ))}
                              <button onClick={addPipeline} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 hover:border-indigo-500 hover:text-indigo-500 flex items-center justify-center gap-2 font-medium text-sm transition-colors mt-4">
                                  <Plus size={16} /> Novo Pipeline
                              </button>
                          </div>
                      </div>

                      {/* Detail View */}
                      <div className="w-2/3 p-6 overflow-y-auto bg-white dark:bg-slate-900">
                          {currentEditPipeline ? (
                              <div className="space-y-8">
                                  <div className="space-y-4">
                                      <label className="text-xs font-bold text-slate-500 uppercase">Nome do Pipeline</label>
                                      <input 
                                        type="text" 
                                        value={currentEditPipeline.name}
                                        disabled={currentEditPipeline.isSystem}
                                        onChange={(e) => setLocalPipelines(localPipelines.map(p => p.id === currentEditPipeline.id ? { ...p, name: e.target.value } : p))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-lg font-bold dark:text-white outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                      />
                                      
                                      <div className="flex gap-4">
                                          <label className={`flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ${currentEditPipeline.isSystem ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                              <input 
                                                type="checkbox" 
                                                checked={currentEditPipeline.showValue}
                                                disabled={currentEditPipeline.isSystem}
                                                onChange={(e) => setLocalPipelines(localPipelines.map(p => p.id === currentEditPipeline.id ? { ...p, showValue: e.target.checked } : p))}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                                              />
                                              Exibir Valor Monetário
                                          </label>
                                          <label className={`flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 ${currentEditPipeline.isSystem ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                              <input 
                                                type="checkbox" 
                                                checked={currentEditPipeline.showTotal}
                                                disabled={currentEditPipeline.isSystem}
                                                onChange={(e) => setLocalPipelines(localPipelines.map(p => p.id === currentEditPipeline.id ? { ...p, showTotal: e.target.checked } : p))}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:cursor-not-allowed"
                                              />
                                              Exibir Totalizador
                                          </label>
                                      </div>
                                      {currentEditPipeline.isSystem && (
                                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                              <Lock size={10} /> Configurações de exibição fixas para este pipeline.
                                          </p>
                                      )}
                                  </div>

                                  <div className="space-y-4">
                                      <div className="flex justify-between items-end">
                                          <label className="text-xs font-bold text-slate-500 uppercase">Etapas do Pipeline</label>
                                          {!currentEditPipeline.isSystem && (
                                              <button onClick={() => addStage(currentEditPipeline.id)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                                  <Plus size={12} /> Adicionar Etapa
                                              </button>
                                          )}
                                      </div>
                                      
                                      <div className="space-y-2">
                                          {currentEditPipeline.stages.map((stage, idx) => (
                                              <div key={stage.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 group">
                                                  <GripVertical size={16} className="text-slate-400 cursor-move" />
                                                  <input 
                                                    type="text" 
                                                    value={stage.name}
                                                    disabled={currentEditPipeline.isSystem}
                                                    onChange={(e) => updateStage(currentEditPipeline.id, stage.id, 'name', e.target.value)}
                                                    className="flex-1 bg-transparent border-none outline-none font-medium text-sm dark:text-white disabled:opacity-70"
                                                  />
                                                  
                                                  {!currentEditPipeline.isSystem && (
                                                      <>
                                                          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-2"></div>
                                                          <input 
                                                            type="number" 
                                                            className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-xs text-center" 
                                                            value={10 + (idx * 10)} 
                                                            disabled 
                                                            title="Probabilidade (Mock)"
                                                          />
                                                          <button onClick={() => removeStage(currentEditPipeline.id, stage.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                              <Trash2 size={16} />
                                                          </button>
                                                      </>
                                                  )}
                                                  {currentEditPipeline.isSystem && <Lock size={14} className="text-slate-400 ml-2" />}
                                              </div>
                                          ))}
                                      </div>
                                      {currentEditPipeline.isSystem && (
                                          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg flex items-center gap-2">
                                              <Lock size={12} />
                                              As etapas deste pipeline são gerenciadas pelo sistema para garantir a integração com a calculadora.
                                          </p>
                                      )}
                                  </div>
                              </div>
                          ) : (
                              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                  <Settings size={48} className="mb-4 opacity-20" />
                                  <p>Selecione um pipeline para editar</p>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                      <button onClick={() => setIsPipelineConfigOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">Cancelar</button>
                      <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg transition-all">Salvar Alterações</button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
      
      {/* HEADER WITH TABS */}
      <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm inline-flex">
          {[
              { id: 'oportunidades', label: 'Oportunidades', icon: <Briefcase size={16} /> },
              { id: 'contatos', label: 'Contatos', icon: <Users size={16} /> },
              { id: 'empresas', label: 'Empresas', icon: <Building2 size={16} /> },
              { id: 'automacoes', label: 'Automações', icon: <Zap size={16} /> }
          ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all
                    ${activeTab === tab.id 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
              >
                  {tab.icon} {tab.label}
              </button>
          ))}
      </div>

      {activeTab !== 'oportunidades' ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-100 dark:bg-slate-700/50 mb-4">
                  <Settings size={32} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Em Desenvolvimento</h3>
              <p className="text-slate-500 mt-2">O módulo de {activeTab} estará disponível em breve.</p>
          </div>
      ) : (
        <>
            {/* CONTROLS AREA */}
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                
                {/* Row 2: Unified Toolbar */}
                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                    
                    {/* Pipeline Selector */}
                    <div className="flex items-center gap-2">
                        <div className="relative group min-w-[240px]">
                            <select 
                                value={selectedPipelineId}
                                onChange={(e) => setSelectedPipelineId(e.target.value)}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none rounded-lg font-bold text-sm cursor-pointer shadow-md hover:opacity-90 transition-opacity"
                            >
                                {pipelines.sort((a,b) => a.order - b.order).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white dark:text-slate-900">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsPipelineConfigOpen(true)}
                            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 rounded-lg transition-colors" 
                            title="Configurar Pipelines"
                        >
                            <Settings size={18} />
                        </button>
                    </div>

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
                                    {selectedPipeline.showValue && <th className="px-6 py-4">Valor Estimado</th>}
                                    <th className="px-6 py-4">Etapa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredLeads.map(lead => {
                                    const isExpanded = expandedLeadId === lead.id;
                                    const currentStage = selectedPipeline.stages.find(s => s.id === lead.stageId);
                                    
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
                                                {selectedPipeline.showValue && (
                                                    <td className="px-6 py-4 font-mono font-medium text-slate-800 dark:text-white">
                                                        {formatCurrency(lead.estimatedValue)}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4">
                                                    <div className="relative group" onClick={(e) => e.stopPropagation()}>
                                                        <select 
                                                            value={lead.stageId}
                                                            onChange={(e) => handleUpdateStage(lead.id, e.target.value)}
                                                            className={`appearance-none cursor-pointer pl-3 pr-8 py-1 rounded-full text-xs font-bold border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-all bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700`}
                                                        >
                                                            {selectedPipeline.stages.map(stage => (
                                                                <option key={stage.id} value={stage.id}>{stage.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                            <ChevronDown size={12} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            
                                            {isExpanded && (
                                                <tr className="bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default">
                                                    <td colSpan={6} className="px-6 py-6 border-b border-slate-200 dark:border-slate-700">
                                                        {/* Use existing detail renderer but maybe adapt if needed */}
                                                        {selectedPipeline.isSystem 
                                                            ? (
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-sm font-bold uppercase flex items-center gap-2"><FileText size={16} className="text-indigo-500"/> Detalhamento</h4>
                                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm space-y-2">
                                                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Estimativa</span> <span className="font-bold text-green-600">{formatCurrency(lead.estimatedValue)}</span></div>
                                                                            <div className="text-xs text-slate-400 mt-2">* Este lead veio da calculadora de rescisão.</div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <h4 className="text-sm font-bold uppercase flex items-center gap-2"><MessageCircle size={16} className="text-green-500"/> Ação</h4>
                                                                        <button onClick={() => handleWhatsAppClick(lead.phone, generateTemplate(lead))} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                                                                            <Send size={16}/> Contatar via WhatsApp
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) 
                                                            : (
                                                                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                    <h3 className="font-bold mb-2">Detalhes da Oportunidade</h3>
                                                                    <p className="text-sm text-slate-500 mb-4">Gerencie as informações desta oportunidade manualmente.</p>
                                                                    <div className="flex gap-2">
                                                                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">Adicionar Nota</button>
                                                                        <button className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Agendar Reunião</button>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {filteredLeads.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                            Nenhum contato encontrado nesta etapa.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- KANBAN BOARD VIEW --- */}
            {viewMode === 'board' && (
                <div className="flex gap-4 overflow-x-auto pb-6 animate-in fade-in slide-in-from-bottom-2 h-[calc(100vh-280px)] min-h-[500px]">
                    {selectedPipeline.stages.sort((a, b) => a.order - b.order).map((stage) => {
                        const columnLeads = filteredLeads.filter(l => l.stageId === stage.id);
                        const isDragOver = dragOverColumn === stage.id;
                        const totalValue = columnLeads.reduce((acc, curr) => acc + curr.estimatedValue, 0);

                        return (
                            <div 
                                key={stage.id}
                                onDragOver={(e) => handleDragOver(e, stage.id)}
                                onDrop={(e) => handleDrop(e, stage.id)}
                                onDragLeave={() => setDragOverColumn(null)}
                                className={`min-w-[320px] w-[320px] flex flex-col bg-slate-100 dark:bg-slate-900/50 rounded-xl border transition-all duration-200 h-full
                                    ${isDragOver 
                                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-800' 
                                        : 'border-slate-200 dark:border-slate-700/50'
                                    }`}
                            >
                                {/* Column Header */}
                                <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-1 rounded-t-xl
                                    ${stage.type === 'won' ? 'bg-green-50 dark:bg-green-900/10' : ''}
                                    ${stage.type === 'lost' ? 'bg-red-50 dark:bg-red-900/10' : ''}
                                `}>
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 truncate">
                                            {stage.name}
                                            <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full text-xs text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700">
                                                {columnLeads.length}
                                            </span>
                                        </h3>
                                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Plus size={16} /></button>
                                    </div>
                                    {selectedPipeline.showTotal && (
                                        <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                                            {formatCurrency(totalValue)}
                                        </div>
                                    )}
                                    {/* Progress Bar Visual */}
                                    <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${stage.color ? `bg-${stage.color}-500` : 'bg-indigo-500'}`} 
                                            style={{ width: '100%', opacity: columnLeads.length > 0 ? 1 : 0.2 }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Column Content */}
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                    {columnLeads.map(lead => {
                                        const isDragging = draggedLeadId === lead.id;

                                        // Conditional Rendering based on Pipeline Type
                                        if (selectedPipeline.isSystem) {
                                            // Rich Card for Calculator Pipeline (Restored View)
                                            return (
                                                <div 
                                                    key={lead.id}
                                                    draggable="true"
                                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                                    onDragEnd={() => { setDraggedLeadId(null); setDragOverColumn(null); }}
                                                    onClick={() => toggleRow(lead.id)}
                                                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border transition-all duration-200 group relative
                                                        ${isDragging ? 'opacity-40 scale-95 cursor-grabbing shadow-inner' : 'hover:shadow-md hover:-translate-y-1 cursor-pointer'}
                                                        ${stage.type === 'won' ? 'border-l-4 border-l-green-500 border-slate-100 dark:border-slate-700' : ''}
                                                        ${stage.type === 'lost' ? 'border-l-4 border-l-red-500 border-slate-100 dark:border-slate-700' : 'border-l-4 border-l-indigo-500 border-slate-100 dark:border-slate-700'}
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate w-full pr-4">{lead.name}</h4>
                                                        <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                                                            <GripHorizontal size={16} />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1.5 mb-3">
                                                        <span className="text-[10px] uppercase font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <Briefcase size={10} /> Calculadora
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">Mock Corp</span>
                                                    </div>

                                                    <div className="mb-3">
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Valor Estimado</p>
                                                        <p className="text-lg font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(lead.estimatedValue)}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                                                        <div className="flex -space-x-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                                {lead.name.charAt(0)}
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                                                            {formatDate(lead.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // Generic Card for Custom Pipelines
                                        return (
                                            <div 
                                                key={lead.id}
                                                draggable="true"
                                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                                onDragEnd={() => { setDraggedLeadId(null); setDragOverColumn(null); }}
                                                onClick={() => toggleRow(lead.id)}
                                                className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all duration-200 group relative
                                                    ${isDragging ? 'opacity-40 scale-95 cursor-grabbing shadow-inner' : 'hover:shadow-md hover:-translate-y-1 cursor-pointer'}
                                                    ${stage.type === 'won' ? 'border-l-4 border-l-green-500' : ''}
                                                    ${stage.type === 'lost' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent hover:border-l-indigo-500'}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-slate-800 dark:text-white text-sm truncate w-full pr-6">{lead.name}</div>
                                                    <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                                                        <GripHorizontal size={16} />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                                    <Building2 size={12} /> 
                                                    <span className="truncate">{lead.name.split(' ')[0]} Corp (Mock)</span>
                                                </div>

                                                {selectedPipeline.showValue && (
                                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-3">
                                                        {formatCurrency(lead.estimatedValue)}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                                        {lead.name.charAt(0)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {formatDate(lead.createdAt).slice(0,5)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {columnLeads.length === 0 && (
                                        <div className="h-24 flex items-center justify-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                                            Vazio
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- PIPELINE CONFIG DIALOG --- */}
            {isPipelineConfigOpen && <PipelineConfigModal />}

            {/* --- DETAIL MODAL --- */}
            {selectedLeadForModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setExpandedLeadId(null)}
                >
                    <div 
                        className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-800 z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${selectedPipeline.isSystem ? 'bg-indigo-500' : 'bg-slate-400'}`}></span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{selectedPipeline.name}</span>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {selectedLeadForModal.name}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Etapa Atual: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedPipeline.stages.find(s => s.id === selectedLeadForModal.stageId)?.name}</span>
                                </p>
                            </div>
                            <button onClick={() => setExpandedLeadId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <X size={24} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="p-8">
                            {/* Reuse the lead detail renderer if available or show basic info */}
                            {selectedPipeline.isSystem 
                                ? (
                                    <div className="flex flex-col lg:flex-row gap-8">
                                        {/* Left Column: Details */}
                                        <div className="flex-1 space-y-6">
                                            {/* Value Card */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                                        <DollarSign size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-500 uppercase">Valor Estimado da Rescisão</p>
                                                        <p className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(selectedLeadForModal.estimatedValue)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                                                    <AlertCircle size={12} />
                                                    <span>Baseado nos dados inseridos pelo lead na calculadora.</span>
                                                </div>
                                            </div>

                                            {/* Contact Info */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                                    <User size={16} className="text-indigo-500"/> Dados de Contato
                                                </h4>
                                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                                                    <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                            <Mail size={14} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-slate-400">Email</p>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedLeadForModal.email}</p>
                                                        </div>
                                                        <button className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="Copiar"><CopyIcon size={14}/></button>
                                                    </div>
                                                    <div className="p-4 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                            <Phone size={14} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs text-slate-400">Telefone / WhatsApp</p>
                                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedLeadForModal.phone}</p>
                                                        </div>
                                                        <button onClick={() => handleCall(selectedLeadForModal.phone)} className="text-indigo-500 hover:bg-indigo-50 p-1.5 rounded transition-colors" title="Ligar"><Phone size={14}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column: Actions */}
                                        <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 h-fit">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2 mb-4">
                                                <MessageCircle size={16} className="text-indigo-500"/> Ação Rápida
                                            </h4>
                                            
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-500 block">Mensagem Personalizada</label>
                                                <textarea 
                                                    className="w-full h-32 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-700 dark:text-slate-300 resize-none shadow-sm" 
                                                    value={activeMessage}
                                                    onChange={(e) => setActiveMessage(e.target.value)}
                                                    placeholder="Digite sua mensagem..." 
                                                />
                                                <button 
                                                    onClick={() => handleWhatsAppClick(selectedLeadForModal.phone, activeMessage)} 
                                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
                                                >
                                                    <Send size={18}/> Iniciar Conversa no WhatsApp
                                                </button>
                                            </div>

                                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                                <p className="text-xs text-slate-400 text-center mb-3">Outras opções</p>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                        Agendar Reunião
                                                    </button>
                                                    <button className="py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                        Arquivar Lead
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : (
                                    <div className="text-center py-10 text-slate-500">
                                        <Briefcase size={48} className="mx-auto mb-4 opacity-20"/>
                                        <p>Detalhes customizados do CRM Comercial em breve.</p>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};

// Helper component for copy icon since we used it inline
const CopyIcon = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
);