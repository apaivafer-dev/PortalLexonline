import React, { useState, useEffect, useRef } from 'react';
import { Search, Download, Eye, X, FileText, Calendar, DollarSign, User, Phone, Mail, MessageCircle, Filter, ArrowRight, ChevronDown, ChevronUp, Sparkles, Send, Building2, LayoutGrid, List as ListIcon, MoreHorizontal, GripVertical, Settings, Plus, Briefcase, Users, Zap, Trash2, GripHorizontal, Check, Lock, Edit2, AlertCircle, Save, XCircle, UserPlus, PhoneCall, ListFilter, Type, Hash, CheckSquare, MousePointerClick, Link as LinkIcon, Image as ImageIcon, AlignLeft, Tag as TagIcon } from 'lucide-react';
import { formatCurrency, formatDate, generateId } from '../lib/utils';
import { Lead, Pipeline, PipelineStage, CRMContact, CRMCompany, CRMPhone, CompanyType, CustomField, CustomFieldType, CustomFieldOption, CRMTag } from '../types';
import { crmApi } from '../services/api';

const DATE_FILTERS = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: 'month', label: 'Este Mês' },
    { id: 'all', label: 'Todos' },
    { id: 'custom', label: 'Personalizado' },
];

const COMPANY_TYPES: CompanyType[] = ['Cliente', 'Fornecedor', 'Concorrente', 'Parceiro'];

const ICON_OPTIONS = [
    { id: 'whatsapp', icon: <MessageCircle size={16} />, label: 'WhatsApp' },
    { id: 'phone', icon: <Phone size={16} />, label: 'Telefone' },
    { id: 'mail', icon: <Mail size={16} />, label: 'Email' },
    { id: 'link', icon: <LinkIcon size={16} />, label: 'Link' },
    { id: 'calendar', icon: <Calendar size={16} />, label: 'Agenda' },
    { id: 'map', icon: <Building2 size={16} />, label: 'Local' }
];

const TAG_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#64748B', // Slate
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

    // CRM Data State (Mocked locally for now, would be lifted up or fetched in real app)
    const [contacts, setContacts] = useState<CRMContact[]>([]);
    const [crmCompanies, setCrmCompanies] = useState<CRMCompany[]>([]);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [tags, setTags] = useState<CRMTag[]>([]);

    // Modals State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false); // Unified Config Modal
    const [editingContact, setEditingContact] = useState<CRMContact | null>(null);
    const [editingCompany, setEditingCompany] = useState<CRMCompany | null>(null);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);

    // Pipeline State
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || '');

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

    // Initialize CRM Data from API
    useEffect(() => {
        const fetchCRMData = async () => {
            try {
                const [fetchedContacts, fetchedCompanies, fetchedTags, fetchedFields] = await Promise.all([
                    crmApi.getContacts().catch(() => []),
                    crmApi.getCompanies().catch(() => []),
                    crmApi.getTags().catch(() => []),
                    crmApi.getCustomFields().catch(() => [])
                ]);

                if (fetchedContacts) setContacts(fetchedContacts);
                if (fetchedCompanies) setCrmCompanies(fetchedCompanies);
                if (fetchedTags) setTags(fetchedTags);
                if (fetchedFields) setCustomFields(fetchedFields);

            } catch (error) {
                console.error("Failed to fetch CRM data:", error);
            }
        };

        fetchCRMData();
    }, []);

    // ... (Effects and standard handlers kept same as previous) ...
    useEffect(() => {
        if (initialOpenLeadId) {
            setExpandedLeadId(initialOpenLeadId);
            const lead = leads.find(l => l.id === initialOpenLeadId);
            if (lead) {
                setSelectedPipelineId(lead.pipelineId);
                setActiveMessage(generateTemplate(lead));
            }
            if (onClearTarget) onClearTarget();
        }
    }, [initialOpenLeadId, leads]);

    useEffect(() => {
        if (!pipelines.find(p => p.id === selectedPipelineId)) {
            setSelectedPipelineId(pipelines[0]?.id || '');
        }
    }, [pipelines]);

    const calculateDateRange = (filterId: string) => {
        const end = new Date();
        const start = new Date();
        switch (filterId) {
            case 'today': break;
            case '7d': start.setDate(end.getDate() - 7); break;
            case '30d': start.setDate(end.getDate() - 30); break;
            case 'month': start.setDate(1); break;
            case 'all': return { start: '', end: '' };
            case 'custom': return null;
            default: return null;
        }
        return { start: start.toLocaleDateString('en-CA'), end: end.toLocaleDateString('en-CA') };
    };

    useEffect(() => {
        if (dateFilter !== 'custom') {
            const range = calculateDateRange(dateFilter);
            if (range) setDateRange(range);
        } else if (startDateInputRef.current) startDateInputRef.current.focus();
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
        onUpdateLeads(leads.map(lead => lead.id === id ? { ...lead, stageId: newStageId } : lead));
    };

    const toggleRow = (id: string) => {
        if (expandedLeadId === id) {
            setExpandedLeadId(null);
            setActiveMessage('');
        } else {
            setExpandedLeadId(id);
            const lead = leads.find(l => l.id === id);
            if (lead) setActiveMessage(generateTemplate(lead));
        }
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('leadId', id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedLeadId(id);
    };

    const handleDragOver = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        if (dragOverColumn !== stageId) setDragOverColumn(stageId);
    };

    const handleDrop = (e: React.DragEvent, newStageId: string) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('leadId');
        if (id) handleUpdateStage(id, newStageId);
        setDraggedLeadId(null);
        setDragOverColumn(null);
    };

    const filteredLeads = leads.filter(lead => {
        if (lead.pipelineId !== selectedPipelineId) return false;
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = stageFilter === 'all' || lead.stageId === stageFilter;
        return matchesSearch && matchesStatus;
    });

    // --- CRM CRUD HANDLERS ---
    const handleSaveContact = async (contactData: any) => {
        try {
            if (editingContact && contactData.id) {
                const updated = await crmApi.updateContact(contactData.id, contactData);
                setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const created = await crmApi.createContact(contactData);
                setContacts(prev => [created, ...prev]);
            }
            setIsContactModalOpen(false);
            setEditingContact(null);
        } catch (error) {
            console.error("Failed to save contact:", error);
            alert("Erro ao salvar contato.");
        }
    };

    const handleDeleteContact = async (id: string) => {
        if (confirm('Deseja excluir este contato?')) {
            try {
                await crmApi.deleteContact(id);
                setContacts(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Failed to delete contact:", error);
                alert("Erro ao excluir contato.");
            }
        }
    };

    const handleSaveCompany = async (companyData: any) => {
        try {
            if (editingCompany && companyData.id) {
                const updated = await crmApi.updateCompany(companyData.id, companyData);
                setCrmCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
            } else {
                const created = await crmApi.createCompany(companyData);
                setCrmCompanies(prev => [created, ...prev]);
            }
            setIsCompanyModalOpen(false);
            setEditingCompany(null);
        } catch (error) {
            console.error("Failed to save company:", error);
            alert("Erro ao salvar empresa.");
        }
    };

    const handleDeleteCompany = async (id: string) => {
        if (confirm('Deseja excluir esta empresa?')) {
            try {
                await crmApi.deleteCompany(id);
                setCrmCompanies(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Failed to delete company:", error);
                alert("Erro ao excluir empresa.");
            }
        }
    };

    const handleSaveLead = (lead: Lead) => {
        if (editingLead) {
            onUpdateLeads(leads.map(l => l.id === lead.id ? lead : l));
        } else {
            onUpdateLeads([...leads, { ...lead, id: generateId(), createdAt: new Date().toISOString() }]);
        }
        setIsLeadModalOpen(false);
        setEditingLead(null);
    };

    // --- UNIFIED SETTINGS MODAL (PIPELINE + FIELDS + TAGS) ---
    const UnifiedConfigModal = () => {
        // ... (Implementation remains same, hidden for brevity as requested only changes, but keeping for context if needed by user. Assuming user wants ContactFormModal changes primarily)
        // For this XML output, I will include the full UnifiedConfigModal to ensure no code loss, as I am replacing the file content.
        const showPipelineConfig = activeTab === 'oportunidades';
        const [modalTab, setModalTab] = useState<'pipeline' | 'fields' | 'tags'>(showPipelineConfig ? 'pipeline' : 'fields');

        // PIPELINE STATE
        const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
        const [localPipelines, setLocalPipelines] = useState<Pipeline[]>(JSON.parse(JSON.stringify(pipelines)));
        const [pipelineSubTab, setPipelineSubTab] = useState<'general' | 'fields'>('general');
        const currentEditPipeline = localPipelines.find(p => p.id === editingPipelineId);

        // CUSTOM FIELDS STATE
        const [fieldManagerContext, setFieldManagerContext] = useState<'contact' | 'company' | 'lead'>('contact');
        const [localFields, setLocalFields] = useState<CustomField[]>(JSON.parse(JSON.stringify(customFields)));
        const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
        const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

        const emptyField: CustomField = {
            id: '', key: '', label: 'Novo Campo', type: 'text', entityType: fieldManagerContext, group: 'Geral', required: false, multiple: false, options: [], buttonConfig: { color: '#2563eb', label: 'Ação', icon: 'zap', urlTemplate: '' }
        };
        const [fieldForm, setFieldForm] = useState<CustomField>(emptyField);

        // TAGS STATE
        const [localTags, setLocalTags] = useState<CRMTag[]>(JSON.parse(JSON.stringify(tags)));
        const [newTagName, setNewTagName] = useState('');
        const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

        // --- SAVE LOGIC ---
        const handleSaveAll = () => {
            onUpdatePipelines(localPipelines);
            onUpdateCustomFields(localFields);
            setTags(localTags);
            setIsConfigModalOpen(false);
        };

        const onUpdateCustomFields = (newFields: CustomField[]) => setCustomFields(newFields);

        // ... Pipeline helper methods ...
        const addPipeline = () => {
            const newPipeline: Pipeline = {
                id: `pipeline-${Date.now()}`, name: 'Novo Pipeline', isSystem: false, showValue: true, showTotal: false, order: localPipelines.length,
                stages: [{ id: `stage-${Date.now()}-1`, name: 'Nova Etapa', order: 0, type: 'active' }], associatedFieldIds: []
            };
            setLocalPipelines([...localPipelines, newPipeline]); setEditingPipelineId(newPipeline.id);
        };
        const updatePipelineName = (id: string, name: string) => setLocalPipelines(prev => prev.map(p => p.id === id ? { ...p, name } : p));
        const deletePipeline = (id: string) => {
            if (confirm("Tem certeza?")) { setLocalPipelines(localPipelines.filter(p => p.id !== id)); if (editingPipelineId === id) setEditingPipelineId(null); }
        };
        const addStage = (pipelineId: string) => {
            setLocalPipelines(localPipelines.map(p => p.id === pipelineId ? { ...p, stages: [...p.stages, { id: `stage-${Date.now()}`, name: 'Nova Etapa', order: p.stages.length, type: 'active' }] } : p));
        };
        const updateStage = (pipelineId: string, stageId: string, field: keyof PipelineStage, value: any) => {
            setLocalPipelines(localPipelines.map(p => p.id === pipelineId ? { ...p, stages: p.stages.map(s => s.id === stageId ? { ...s, [field]: value } : s) } : p));
        };
        const removeStage = (pipelineId: string, stageId: string) => {
            setLocalPipelines(localPipelines.map(p => p.id === pipelineId ? { ...p, stages: p.stages.filter(s => s.id !== stageId) } : p));
        };
        const toggleFieldAssociation = (pipelineId: string, fieldId: string) => {
            setLocalPipelines(localPipelines.map(p => {
                if (p.id === pipelineId) {
                    const currentIds = p.associatedFieldIds || [];
                    const newIds = currentIds.includes(fieldId) ? currentIds.filter(id => id !== fieldId) : [...currentIds, fieldId];
                    return { ...p, associatedFieldIds: newIds };
                }
                return p;
            }));
        };

        // --- FIELD LOGIC ---
        useEffect(() => {
            if (editingFieldId) {
                const field = localFields.find(f => f.id === editingFieldId);
                if (field) setFieldForm(JSON.parse(JSON.stringify(field)));
            } else {
                setFieldForm({ ...emptyField, id: `field-${Date.now()}`, entityType: fieldManagerContext });
            }
        }, [editingFieldId, fieldManagerContext]);

        useEffect(() => {
            if (!editingFieldId && fieldForm.label && !fieldForm.key) {
                const slug = fieldForm.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                setFieldForm(prev => ({ ...prev, key: slug }));
            }
        }, [fieldForm.label]);

        const handleSaveField = () => {
            if (!fieldForm.label) return alert("O nome do campo é obrigatório.");
            if (!fieldForm.key) return alert("A chave exclusiva é obrigatória.");
            if (!fieldForm.group) return alert("Defina um grupo.");
            const keyRegex = /^[a-z0-9_]+$/;
            if (!keyRegex.test(fieldForm.key)) return alert("A chave deve conter apenas letras minúsculas, números e underlines.");
            setLocalFields(prev => {
                if (editingFieldId) return prev.map(f => f.id === editingFieldId ? fieldForm : f);
                return [...prev, fieldForm];
            });
            setEditingFieldId(null);
            setFieldForm({ ...emptyField, id: `field-${Date.now() + 1}`, entityType: fieldManagerContext });
        };

        const handleDeleteField = (id: string) => {
            if (confirm('Excluir este campo?')) {
                setLocalFields(prev => prev.filter(f => f.id !== id));
                if (editingFieldId === id) setEditingFieldId(null);
            }
        };

        // --- TAG LOGIC ---
        const handleAddTag = () => {
            if (!newTagName) return;
            const newTag: CRMTag = {
                id: generateId(),
                name: newTagName,
                color: newTagColor,
                entityType: fieldManagerContext
            };
            setLocalTags([...localTags, newTag]);
            setNewTagName('');
        };

        const handleDeleteTag = (id: string) => {
            if (confirm('Excluir etiqueta?')) {
                setLocalTags(prev => prev.filter(t => t.id !== id));
            }
        };

        const getTypeIcon = (type: CustomFieldType) => {
            switch (type) {
                case 'text': return <Type size={14} />;
                case 'number': return <Hash size={14} />;
                case 'date': return <Calendar size={14} />;
                case 'select': return <ListFilter size={14} />;
                case 'multiselect': return <CheckSquare size={14} />;
                case 'button': return <MousePointerClick size={14} />;
                case 'file': return <ImageIcon size={14} />;
                default: return <Type size={14} />;
            }
        };

        const filteredEntityFields = localFields.filter(f => f.entityType === fieldManagerContext);
        const fieldGroups = Array.from(new Set(filteredEntityFields.map(f => f.group))).filter(Boolean) as string[];
        const suggestedGroups = fieldGroups.filter(g => g.toLowerCase().includes((fieldForm.group || '').toLowerCase()));
        const filteredTags = localTags.filter(t => t.entityType === fieldManagerContext);

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <div><h3 className="text-xl font-bold text-slate-800 dark:text-white">Configurações do CRM</h3></div>
                        <button onClick={() => setIsConfigModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full"><X size={20} /></button>
                    </div>

                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6">
                        {showPipelineConfig && (
                            <button onClick={() => setModalTab('pipeline')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${modalTab === 'pipeline' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Pipelines</button>
                        )}
                        <button onClick={() => setModalTab('fields')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${modalTab === 'fields' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Campos Personalizados</button>
                        <button onClick={() => setModalTab('tags')} className={`py-4 px-6 font-bold text-sm border-b-2 transition-colors ${modalTab === 'tags' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}>Etiquetas</button>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* --- PIPELINE TAB --- */}
                        {showPipelineConfig && modalTab === 'pipeline' && (
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-950/30">
                                    <div className="space-y-2">
                                        {localPipelines.sort((a, b) => a.order - b.order).map((pipeline) => (
                                            <div key={pipeline.id} onClick={() => setEditingPipelineId(pipeline.id)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between group ${editingPipelineId === pipeline.id ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md' : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}>
                                                <div className="flex items-center gap-3"><span className="font-medium text-sm truncate dark:text-white">{pipeline.name}</span> {pipeline.isSystem && <Lock size={12} className="text-slate-400" />}</div>
                                                {!pipeline.isSystem && <button onClick={(e) => { e.stopPropagation(); deletePipeline(pipeline.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 size={14} /></button>}
                                            </div>
                                        ))}
                                        <button onClick={addPipeline} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 hover:text-indigo-500 flex items-center justify-center gap-2 text-sm mt-4 font-medium"><Plus size={16} /> Novo Pipeline</button>
                                    </div>
                                </div>
                                <div className="w-2/3 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                                    {currentEditPipeline ? (
                                        <>
                                            <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2">
                                                <button onClick={() => setPipelineSubTab('general')} className={`mr-6 py-3 text-xs font-bold border-b-2 uppercase tracking-wide ${pipelineSubTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}>Geral & Etapas</button>
                                                <button onClick={() => setPipelineSubTab('fields')} className={`py-3 text-xs font-bold border-b-2 uppercase tracking-wide ${pipelineSubTab === 'fields' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'}`}>Campos do Formulário</button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-6">
                                                {pipelineSubTab === 'general' ? (
                                                    <div className="space-y-8">
                                                        <div className="space-y-4">
                                                            <label className="text-xs font-bold text-slate-500 uppercase">Nome do Pipeline</label>
                                                            <input type="text" value={currentEditPipeline.name} disabled={currentEditPipeline.isSystem} onChange={(e) => updatePipelineName(currentEditPipeline.id, e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-end"><label className="text-xs font-bold text-slate-500 uppercase">Etapas</label>{!currentEditPipeline.isSystem && <button onClick={() => addStage(currentEditPipeline.id)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"><Plus size={12} /> Adicionar</button>}</div>
                                                            <div className="space-y-2">
                                                                {currentEditPipeline.stages.map((stage, idx) => (
                                                                    <div key={stage.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 group"><GripVertical size={16} className="text-slate-400" /><input type="text" value={stage.name} disabled={currentEditPipeline.isSystem} onChange={(e) => updateStage(currentEditPipeline.id, stage.id, 'name', e.target.value)} className="flex-1 bg-transparent border-none outline-none dark:text-white" />{!currentEditPipeline.isSystem && <button onClick={() => removeStage(currentEditPipeline.id, stage.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>}</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <p className="text-sm text-slate-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-100 dark:border-blue-800">Selecione quais campos personalizados de <strong>Oportunidade (Lead)</strong> devem aparecer ao criar um card neste pipeline.</p>
                                                        {localFields.filter(f => f.entityType === 'lead').length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Nenhum campo de oportunidade criado.</div>}
                                                        {Array.from(new Set(localFields.filter(f => f.entityType === 'lead').map(f => f.group))).map(group => (
                                                            <div key={group}>
                                                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 bg-slate-50 dark:bg-slate-800 p-2 rounded">{group}</h4>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {localFields.filter(f => f.entityType === 'lead' && f.group === group).map(field => {
                                                                        const isChecked = (currentEditPipeline.associatedFieldIds || []).includes(field.id);
                                                                        return (
                                                                            <label key={field.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                                                                <input type="checkbox" checked={isChecked} onChange={() => toggleFieldAssociation(currentEditPipeline.id, field.id)} className="w-4 h-4 text-indigo-600 rounded" />
                                                                                <span className="text-sm font-medium dark:text-white">{field.label}</span>
                                                                            </label>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><Settings size={48} className="mb-4 opacity-20" /><p>Selecione um pipeline para editar</p></div>}
                                </div>
                            </div>
                        )}

                        {/* --- CUSTOM FIELDS TAB --- */}
                        {modalTab === 'fields' && (
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30 flex flex-col">
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Contexto</label>
                                        <select value={fieldManagerContext} onChange={(e) => { setFieldManagerContext(e.target.value as any); setEditingFieldId(null); }} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white">
                                            <option value="lead">Oportunidades (Cards)</option><option value="contact">Contatos (Pessoas)</option><option value="company">Empresas</option>
                                        </select>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto">
                                        <button onClick={() => setEditingFieldId(null)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 mb-6 transition-colors"><Plus size={16} /> Novo Campo</button>
                                        <div className="space-y-6">
                                            {fieldGroups.map(group => (
                                                <div key={group}><h4 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">{group}</h4><div className="space-y-1">{filteredEntityFields.filter(f => f.group === group).map(field => (<div key={field.id} onClick={() => setEditingFieldId(field.id)} className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between group ${editingFieldId === field.id || (!editingFieldId && field.id === fieldForm.id) ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-300 dark:hover:border-slate-700'}`}><div className="flex items-center gap-3 overflow-hidden"><div className={`p-1.5 rounded-md ${field.type === 'button' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'} dark:bg-slate-800`}>{getTypeIcon(field.type)}</div><div className="flex flex-col overflow-hidden"><span className="font-medium text-sm truncate dark:text-white">{field.label}</span><span className="text-[10px] text-slate-400 font-mono truncate">{field.key}</span></div></div><button onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id); }} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded transition-opacity"><Trash2 size={14} /></button></div>))}</div></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-2/3 p-8 overflow-y-auto bg-white dark:bg-slate-900">
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">{editingFieldId ? 'Editar Campo' : 'Criar Novo Campo'}</h4>
                                    <div className="space-y-6 max-w-2xl">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2"><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Campo</label><input type="text" value={fieldForm.label} onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" /></div>
                                            <div className="col-span-2"><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Chave Exclusiva</label><div className="flex items-center"><span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-lg px-3 py-2.5 text-slate-500 text-sm font-mono select-none">{fieldManagerContext}.</span><input type="text" value={fieldForm.key} onChange={e => setFieldForm({ ...fieldForm, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })} className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-r-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono text-sm" /></div></div>
                                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Tipo</label><select value={fieldForm.type} onChange={e => setFieldForm({ ...fieldForm, type: e.target.value as CustomFieldType })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"><option value="text">Texto</option><option value="select">Lista</option><option value="button">Botão</option><option value="date">Data</option><option value="number">Número</option></select></div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Grupo</label>
                                                <div className="relative">
                                                    <input type="text" value={fieldForm.group} onChange={e => { setFieldForm({ ...fieldForm, group: e.target.value }); setIsGroupDropdownOpen(true); }} onFocus={() => setIsGroupDropdownOpen(true)} onBlur={() => setTimeout(() => setIsGroupDropdownOpen(false), 200)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Ex: Geral" />
                                                    {isGroupDropdownOpen && (<div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">{suggestedGroups.map(g => (<div key={g} className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm dark:text-white" onClick={() => setFieldForm({ ...fieldForm, group: g })}>{g}</div>))}{fieldForm.group && !suggestedGroups.includes(fieldForm.group) && (<div className="px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 font-bold border-t border-slate-100 dark:border-slate-700" onClick={() => setFieldForm({ ...fieldForm, group: fieldForm.group })}><Plus size={12} className="inline mr-1" /> Criar: "{fieldForm.group}"</div>)}</div>)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4"><button onClick={handleSaveField} className="px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold w-full hover:opacity-90 transition-opacity">{editingFieldId ? 'Atualizar Campo' : 'Adicionar Campo'}</button></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAGS TAB --- */}
                        {modalTab === 'tags' && (
                            <div className="flex flex-1 overflow-hidden">
                                <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/30 p-4 flex flex-col">
                                    <div className="mb-6">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Contexto</label>
                                        <select value={fieldManagerContext} onChange={(e) => setFieldManagerContext(e.target.value as any)} className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white">
                                            <option value="lead">Oportunidades</option><option value="contact">Contatos</option><option value="company">Empresas</option>
                                        </select>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Nova Etiqueta</h4>
                                        <div className="space-y-3">
                                            <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="Nome da etiqueta" className="w-full p-2 border rounded-lg text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
                                            <div className="flex gap-2 flex-wrap">
                                                {TAG_COLORS.map(color => (
                                                    <button key={color} onClick={() => setNewTagColor(color)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${newTagColor === color ? 'border-slate-600 scale-110 shadow' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                                                ))}
                                            </div>
                                            <button onClick={handleAddTag} disabled={!newTagName} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">Adicionar</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-2/3 p-8 overflow-y-auto bg-white dark:bg-slate-900">
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Etiquetas Existentes</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        {filteredTags.length === 0 && <p className="text-slate-400 text-sm col-span-2">Nenhuma etiqueta criada para este contexto.</p>}
                                        {filteredTags.map(tag => (
                                            <div key={tag.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                                    <span className="font-medium text-sm dark:text-white">{tag.name}</span>
                                                </div>
                                                <button onClick={() => handleDeleteTag(tag.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded"><Trash2 size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button onClick={() => setIsConfigModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">Cancelar</button>
                        <button onClick={handleSaveAll} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"><Save size={18} /> Salvar Tudo</button>
                    </div>
                </div>
            </div>
        );
    };

    const TagSelector = ({ selectedIds, onChange, entityType }: { selectedIds: string[], onChange: (ids: string[]) => void, entityType: 'lead' | 'contact' | 'company' }) => {
        const [isOpen, setIsOpen] = useState(false);
        const availableTags = tags.filter(t => t.entityType === entityType);

        const toggleTag = (id: string) => {
            if (selectedIds.includes(id)) {
                onChange(selectedIds.filter(tid => tid !== id));
            } else {
                onChange([...selectedIds, id]);
            }
        };

        return (
            <div className="relative">
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Etiquetas</label>
                <div className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-800 rounded-lg min-h-[42px] bg-slate-50 dark:bg-slate-950 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    {selectedIds.map(id => {
                        const tag = tags.find(t => t.id === id);
                        if (!tag) return null;
                        return (
                            <span key={id} className="px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                                <button onClick={(e) => { e.stopPropagation(); toggleTag(id); }} className="hover:text-black/50"><X size={12} /></button>
                            </span>
                        );
                    })}
                    <div className="flex-1 flex justify-end"><ChevronDown size={16} className="text-slate-400" /></div>
                </div>
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto p-2">
                        {availableTags.length === 0 && <p className="text-xs text-slate-400 p-2">Nenhuma etiqueta disponível.</p>}
                        {availableTags.map(tag => (
                            <div key={tag.id} onClick={() => toggleTag(tag.id)} className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedIds.includes(tag.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                    {selectedIds.includes(tag.id) && <Check size={10} className="text-white" />}
                                </div>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                <span className="text-sm dark:text-white">{tag.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const ContactFormModal = () => {
        const [formData, setFormData] = useState<CRMContact>(editingContact ? JSON.parse(JSON.stringify(editingContact)) : {
            id: '', firstName: '', lastName: '', emails: [''],
            phones: [{ number: '', type: 'Móvel' }], // Ensures at least one phone
            type: 'Lead', createdAt: new Date().toISOString(), customValues: {}, tags: []
        });

        // Ensure at least one phone if editing data was corrupted or empty
        useEffect(() => {
            if (formData.phones.length === 0) {
                setFormData(prev => ({ ...prev, phones: [{ number: '', type: 'Móvel' }] }));
            }
        }, []);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!formData.firstName) return alert("Nome é obrigatório");
            handleSaveContact(formData);
        };

        const updatePhone = (index: number, field: keyof CRMPhone, value: string) => {
            const newPhones = [...formData.phones];
            newPhones[index] = { ...newPhones[index], [field]: value };
            setFormData({ ...formData, phones: newPhones });
        };

        const addPhone = () => {
            setFormData(prev => ({ ...prev, phones: [...prev.phones, { number: '', type: 'Móvel' }] }));
        };

        const removePhone = (index: number) => {
            setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
        };

        const updateEmail = (index: number, value: string) => { const newEmails = [...formData.emails]; newEmails[index] = value; setFormData({ ...formData, emails: newEmails }); };
        const contactFields = customFields.filter(f => f.entityType === 'contact');

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingContact ? 'Editar Contato' : 'Novo Contato'}</h3>
                        <button onClick={() => setIsContactModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nome</label><input required type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Sobrenome</label><input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>
                        </div>

                        {/* EMAIL */}
                        <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label><input type="email" value={formData.emails[0]} onChange={e => updateEmail(0, e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>

                        {/* PHONES - REPEATER */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Telefones</label>
                            <div className="space-y-3">
                                {formData.phones.map((phone, idx) => (
                                    <div key={idx} className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="tel"
                                                value={phone.number}
                                                onChange={e => updatePhone(idx, 'number', e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white placeholder-slate-400"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <select
                                                value={phone.type}
                                                onChange={e => updatePhone(idx, 'type', e.target.value as any)}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"
                                            >
                                                <option>Móvel</option><option>Fixo</option><option>Trabalho</option>
                                            </select>
                                        </div>
                                        {formData.phones.length > 1 && (
                                            <button type="button" onClick={() => removePhone(idx)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Remover telefone">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addPhone} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1">
                                    <Plus size={14} /> Adicionar outro telefone
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Classificação</label><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as any })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"><option>Lead</option><option>Cliente</option></select></div>
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Empresa</label><select value={formData.companyId || ''} onChange={e => setFormData({ ...formData, companyId: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"><option value="">Nenhuma</option>{crmCompanies.map(c => <option key={c.id} value={c.id}>{c.tradeName}</option>)}</select></div>
                        </div>

                        {/* Tags */}
                        <TagSelector selectedIds={formData.tags || []} onChange={(ids) => setFormData({ ...formData, tags: ids })} entityType="contact" />

                        {contactFields.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                                <h4 className="font-bold text-slate-800 dark:text-white">Campos Personalizados</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {contactFields.map(field => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">{field.label}</label>
                                            {field.type === 'select' ? (
                                                <select value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"><option value="">Selecione</option>{field.options?.map(opt => <option key={opt.id} value={opt.value}>{opt.label}</option>)}</select>
                                            ) : (<input type={field.type === 'number' ? 'number' : (field.type === 'date' ? 'date' : 'text')} value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsContactModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Salvar Contato</button></div>
                    </form>
                </div>
            </div>
        );
    };

    const CompanyFormModal = () => {
        const [formData, setFormData] = useState<CRMCompany>(editingCompany ? JSON.parse(JSON.stringify(editingCompany)) : {
            id: '', name: '', tradeName: '', emails: [''],
            phones: [{ number: '', type: 'Fixo' }],
            types: ['Cliente'], contactIds: [], createdAt: new Date().toISOString(), customValues: {}, tags: []
        });

        // Ensure at least one phone
        useEffect(() => {
            if (formData.phones.length === 0) {
                setFormData(prev => ({ ...prev, phones: [{ number: '', type: 'Fixo' }] }));
            }
        }, []);

        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.tradeName) return alert("Nome Fantasia é obrigatório"); handleSaveCompany(formData); };

        const updatePhone = (index: number, field: keyof CRMPhone, value: string) => {
            const newPhones = [...formData.phones];
            newPhones[index] = { ...newPhones[index], [field]: value };
            setFormData({ ...formData, phones: newPhones });
        };

        const addPhone = () => {
            setFormData(prev => ({ ...prev, phones: [...prev.phones, { number: '', type: 'Fixo' }] }));
        };

        const removePhone = (index: number) => {
            setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
        };

        const updateEmail = (index: number, value: string) => { const newEmails = [...formData.emails]; newEmails[index] = value; setFormData({ ...formData, emails: newEmails }); };
        const toggleType = (t: CompanyType) => { const current = formData.types; if (current.includes(t)) setFormData({ ...formData, types: current.filter(type => type !== t) }); else setFormData({ ...formData, types: [...current, t] }); };
        const companyFields = customFields.filter(f => f.entityType === 'company');

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingCompany ? 'Editar Empresa' : 'Nova Empresa'}</h3>
                        <button onClick={() => setIsCompanyModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nome Fantasia</label><input required type="text" value={formData.tradeName} onChange={e => setFormData({ ...formData, tradeName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div><div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Razão Social</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div></div>
                        <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label><input type="email" value={formData.emails[0]} onChange={e => updateEmail(0, e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>

                        {/* PHONES - REPEATER */}
                        <div>
                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Telefones</label>
                            <div className="space-y-3">
                                {formData.phones.map((phone, idx) => (
                                    <div key={idx} className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="tel"
                                                value={phone.number}
                                                onChange={e => updatePhone(idx, 'number', e.target.value)}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white placeholder-slate-400"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <select
                                                value={phone.type}
                                                onChange={e => updatePhone(idx, 'type', e.target.value as any)}
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"
                                            >
                                                <option>Fixo</option><option>Móvel</option><option>Trabalho</option>
                                            </select>
                                        </div>
                                        {formData.phones.length > 1 && (
                                            <button type="button" onClick={() => removePhone(idx)} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Remover telefone">
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addPhone} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1">
                                    <Plus size={14} /> Adicionar outro telefone
                                </button>
                            </div>
                        </div>

                        <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Classificação (Múltiplos)</label><div className="flex gap-2 flex-wrap">{COMPANY_TYPES.map(t => (<button type="button" key={t} onClick={() => toggleType(t)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${formData.types.includes(t) ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800'}`}>{t}</button>))}</div></div>

                        {/* Tags */}
                        <TagSelector selectedIds={formData.tags || []} onChange={(ids) => setFormData({ ...formData, tags: ids })} entityType="company" />

                        {companyFields.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                                <h4 className="font-bold text-slate-800 dark:text-white">Campos Personalizados</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {companyFields.map(field => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">{field.label}</label>
                                            {field.type === 'select' ? (<select value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"><option value="">Selecione</option>{field.options?.map(opt => <option key={opt.id} value={opt.value}>{opt.label}</option>)}</select>) : (<input type={field.type === 'number' ? 'number' : (field.type === 'date' ? 'date' : 'text')} value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsCompanyModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Salvar Empresa</button></div>
                    </form>
                </div>
            </div>
        );
    };

    const LeadFormModal = () => {
        const [formData, setFormData] = useState<Lead>(editingLead ? JSON.parse(JSON.stringify(editingLead)) : {
            id: '', name: '', email: '', phone: '', estimatedValue: 0, pipelineId: selectedPipelineId, stageId: selectedPipeline.stages[0]?.id || '', createdAt: new Date().toISOString(), customValues: {}, tags: []
        });

        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.name) return alert("Nome é obrigatório"); handleSaveLead(formData); };
        const leadFields = customFields.filter(f => f.entityType === 'lead');

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingLead ? 'Editar Oportunidade' : 'Nova Oportunidade'}</h3>
                        <button onClick={() => setIsLeadModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Nome do Lead</label><input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>
                            <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Telefone</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>
                        </div>
                        <div><label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Valor Estimado (R$)</label><input type="number" value={formData.estimatedValue} onChange={e => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" /></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">Etapa</label>
                                <select value={formData.stageId} onChange={e => setFormData({ ...formData, stageId: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white">
                                    {selectedPipeline.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Tags */}
                        <TagSelector selectedIds={formData.tags || []} onChange={(ids) => setFormData({ ...formData, tags: ids })} entityType="lead" />

                        {leadFields.length > 0 && (
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                                <h4 className="font-bold text-slate-800 dark:text-white">Campos Personalizados</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {leadFields.map(field => (
                                        <div key={field.id}>
                                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">{field.label}</label>
                                            {field.type === 'select' ? (<select value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white"><option value="">Selecione</option>{field.options?.map(opt => <option key={opt.id} value={opt.value}>{opt.label}</option>)}</select>) : (<input type={field.type === 'number' ? 'number' : (field.type === 'date' ? 'date' : 'text')} value={formData.customValues?.[field.id] || ''} onChange={e => setFormData({ ...formData, customValues: { ...formData.customValues, [field.id]: e.target.value } })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none dark:text-white" />)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsLeadModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Salvar Oportunidade</button></div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-6 flex flex-col h-full overflow-hidden">

            {/* --- TOP PILL NAVIGATION --- */}
            <div className="bg-white dark:bg-[#1A1D23] rounded-full p-1.5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] border border-slate-100 dark:border-white/5 w-fit mx-auto flex-shrink-0 animate-in fade-in slide-in-from-top-2">
                <div className="flex">
                    {[
                        { id: 'oportunidades', label: 'Oportunidades', icon: <Briefcase size={16} /> },
                        { id: 'contatos', label: 'Contatos', icon: <Users size={16} /> },
                        { id: 'empresas', label: 'Empresas', icon: <Building2 size={16} /> },
                        { id: 'automacoes', label: 'Automações', icon: <Zap size={16} /> }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- SUB-HEADER: TITLE, FILTERS & ACTIONS --- */}
            <div className="bg-white dark:bg-[#1A1D23] rounded-[32px] p-6 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 flex-shrink-0">

                {/* Title and Pipeline Selector */}
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize">
                        {activeTab}
                    </h2>

                    {activeTab === 'oportunidades' && (
                        <div className="relative group">
                            <select
                                value={selectedPipelineId}
                                onChange={(e) => setSelectedPipelineId(e.target.value)}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none cursor-pointer min-w-[200px]"
                            >
                                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    )}
                </div>

                {/* Filters, View Toggle, Settings and Multi-Action Button */}
                <div className="flex items-center gap-3">

                    {activeTab === 'oportunidades' && (
                        <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/5">
                            <button onClick={() => setViewMode('board')} className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-white' : 'text-slate-400'}`}><ListIcon size={18} /></button>
                        </div>
                    )}

                    {/* Search Expansion */}
                    <div className={`relative transition-all duration-300 ${isSearchOpen ? 'w-48 md:w-64' : 'w-10'}`}>
                        <button
                            onClick={() => { setIsSearchOpen(!isSearchOpen); if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100); }}
                            className={`absolute left-0 top-0 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-slate-700 dark:hover:text-white transition-colors ${isSearchOpen ? 'z-0' : 'z-10'}`}
                        >
                            <Search size={18} />
                        </button>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-white/5 border border-transparent rounded-xl text-sm outline-none transition-all ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        />
                    </div>

                    {/* Quick Config */}
                    <button
                        onClick={() => setIsConfigModalOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                        title="Configurações"
                    >
                        <Settings size={18} />
                    </button>

                    {/* Contextual Action Button */}
                    <button
                        onClick={() => {
                            if (activeTab === 'oportunidades') { setEditingLead(null); setIsLeadModalOpen(true); }
                            else if (activeTab === 'contatos') { setEditingContact(null); setIsContactModalOpen(true); }
                            else if (activeTab === 'empresas') { setEditingCompany(null); setIsCompanyModalOpen(true); }
                        }}
                        className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">
                            {activeTab === 'oportunidades' ? 'Novo Lead' : (activeTab === 'contatos' ? 'Novo Contato' : (activeTab === 'empresas' ? 'Nova Empresa' : 'Ação'))}
                        </span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative">
                {/* ... (Lists/Tables remain unchanged) ... */}
                {/* OPORTUNIDADES (KANBAN / LIST) */}
                {activeTab === 'oportunidades' && selectedPipeline && (
                    <div className="h-full overflow-x-auto overflow-y-hidden pb-4">
                        {viewMode === 'board' ? (
                            <div className="flex h-full gap-4 min-w-max px-2">
                                {selectedPipeline.stages.sort((a, b) => a.order - b.order).map(stage => {
                                    const stageLeads = filteredLeads.filter(l => l.stageId === stage.id);
                                    const stageTotal = stageLeads.reduce((acc, l) => acc + l.estimatedValue, 0);

                                    return (
                                        <div
                                            key={stage.id}
                                            className="w-80 flex flex-col h-full max-h-full rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 backdrop-blur-sm"
                                            onDragOver={(e) => handleDragOver(e, stage.id)}
                                            onDrop={(e) => handleDrop(e, stage.id)}
                                        >
                                            {/* Stage Header */}
                                            <div className={`p-4 border-b-2 border-${stage.color}-500 flex justify-between items-start flex-shrink-0`}>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white uppercase text-xs tracking-wider mb-1 flex items-center gap-2">
                                                        {stage.name}
                                                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{stageLeads.length}</span>
                                                    </h4>
                                                    {selectedPipeline.showTotal && (
                                                        <p className="text-xs text-slate-500 font-mono">{formatCurrency(stageTotal)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Cards Container */}
                                            <div className={`flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar ${dragOverColumn === stage.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                                {stageLeads.map(lead => (
                                                    <div
                                                        key={lead.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                                        onClick={() => toggleRow(lead.id)}
                                                        className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 cursor-pointer transition-all hover:shadow-md group relative
                                                            ${draggedLeadId === lead.id ? 'opacity-50' : 'opacity-100'}
                                                            ${expandedLeadId === lead.id ? 'ring-2 ring-indigo-500' : ''}
                                                        `}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{lead.name}</span>
                                                            {selectedPipeline.showValue && (
                                                                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">{formatCurrency(lead.estimatedValue)}</span>
                                                            )}
                                                        </div>
                                                        {lead.tags && lead.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mb-2">
                                                                {lead.tags.map(tid => {
                                                                    const tag = tags.find(t => t.id === tid);
                                                                    if (!tag) return null;
                                                                    return <div key={tid} className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name}></div>
                                                                })}
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                                            <Calendar size={12} /> {formatDate(lead.createdAt)}
                                                        </div>
                                                        {/* Expanded Quick Actions */}
                                                        {expandedLeadId === lead.id && (
                                                            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-700 flex justify-around animate-in slide-in-from-top-2">
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingLead(lead); setIsLeadModalOpen(true); }} title="Editar" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"><Edit2 size={16} /></button>
                                                                <button title="WhatsApp" className="p-2 hover:bg-green-50 text-green-600 rounded-lg"><MessageCircle size={16} /></button>
                                                                <button title="Email" className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Mail size={16} /></button>
                                                                <button title="Telefone" className="p-2 hover:bg-purple-50 text-purple-600 rounded-lg"><Phone size={16} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {stageLeads.length === 0 && (
                                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 text-xs font-medium">
                                                        Arraste cards aqui
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-[#1A1D23] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 h-full overflow-hidden flex flex-col">
                                {/* List Header */}
                                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 text-xs font-bold text-slate-500 uppercase">
                                    <div className="col-span-3">Nome / Contato</div>
                                    <div className="col-span-2">Estágio</div>
                                    <div className="col-span-2 text-right">Valor</div>
                                    <div className="col-span-2">Data</div>
                                    <div className="col-span-3 text-right">Ações</div>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {filteredLeads.map(lead => {
                                        const stage = selectedPipeline.stages.find(s => s.id === lead.stageId);
                                        return (
                                            <div key={lead.id} className="grid grid-cols-12 gap-4 p-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 items-center transition-colors">
                                                <div className="col-span-3">
                                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        {lead.name}
                                                        {lead.tags && lead.tags.length > 0 && <div className="flex gap-0.5">{lead.tags.map(tid => { const tag = tags.find(t => t.id === tid); return tag ? <div key={tid} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} title={tag.name} /> : null; })}</div>}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{lead.email}</div>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full bg-${stage?.color}-100 text-${stage?.color}-700 border border-${stage?.color}-200`}>
                                                        {stage?.name || 'Desconhecido'}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 text-right font-mono text-sm text-slate-700 dark:text-slate-300">
                                                    {formatCurrency(lead.estimatedValue)}
                                                </div>
                                                <div className="col-span-2 text-sm text-slate-500">
                                                    {formatDate(lead.createdAt)}
                                                </div>
                                                <div className="col-span-3 flex justify-end gap-2">
                                                    <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><MessageCircle size={16} /></button>
                                                    <button onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"><Edit2 size={16} /></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* CONTATOS */}
                {activeTab === 'contatos' && (
                    <div className="bg-white dark:bg-[#1A1D23] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 h-full overflow-hidden flex flex-col animate-in fade-in">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Nome</th>
                                        <th className="px-6 py-4">Contatos</th>
                                        <th className="px-6 py-4">Empresa</th>
                                        <th className="px-6 py-4">Etiquetas</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {contacts.filter(c => c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || c.lastName.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => {
                                        const company = crmCompanies.find(comp => comp.id === contact.companyId);
                                        return (
                                            <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{contact.firstName} {contact.lastName}</div>
                                                    <div className="text-xs text-slate-400">{contact.cpf || '-'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        {contact.emails.map((e, i) => <div key={i} className="flex items-center gap-1 text-xs text-slate-500"><Mail size={10} /> {e}</div>)}
                                                        {contact.phones.map((p, i) => <div key={i} className="flex items-center gap-1 text-xs text-slate-500"><Phone size={10} /> {p.number}</div>)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                    {company ? (
                                                        <div className="flex items-center gap-2"><Building2 size={14} className="text-slate-400" /> {company.tradeName}</div>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {contact.tags && contact.tags.map(tid => {
                                                            const tag = tags.find(t => t.id === tid);
                                                            if (!tag) return null;
                                                            return <span key={tid} className="px-2 py-0.5 rounded-full text-[10px] text-white font-bold" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => { setEditingContact(contact); setIsContactModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 mr-1"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteContact(contact.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* EMPRESAS */}
                {activeTab === 'empresas' && (
                    <div className="bg-white dark:bg-[#1A1D23] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 h-full overflow-hidden flex flex-col animate-in fade-in">
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 font-bold uppercase sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Empresa / Razão Social</th>
                                        <th className="px-6 py-4">Contatos</th>
                                        <th className="px-6 py-4">Etiquetas</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {crmCompanies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.tradeName.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
                                        <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{company.tradeName}</div>
                                                <div className="text-xs text-slate-400">{company.name}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {company.emails.map((e, i) => <div key={i} className="flex items-center gap-1 text-xs text-slate-500"><Mail size={10} /> {e}</div>)}
                                                    {company.phones.map((p, i) => <div key={i} className="flex items-center gap-1 text-xs text-slate-500"><Phone size={10} /> {p.number}</div>)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {company.tags && company.tags.map(tid => {
                                                        const tag = tags.find(t => t.id === tid);
                                                        if (!tag) return null;
                                                        return <span key={tid} className="px-2 py-0.5 rounded-full text-[10px] text-white font-bold" style={{ backgroundColor: tag.color }}>{tag.name}</span>
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setEditingCompany(company); setIsCompanyModalOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 mr-1"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteCompany(company.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Render Modals */}
            {isConfigModalOpen && <UnifiedConfigModal />}
            {isContactModalOpen && <ContactFormModal />}
            {isCompanyModalOpen && <CompanyFormModal />}
            {isLeadModalOpen && <LeadFormModal />}
        </div>
    );
};