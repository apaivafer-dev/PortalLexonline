import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, FileText, Code, TrendingUp, Calendar, Filter, ArrowRight, ChevronDown } from 'lucide-react';

const DATA_CHART = [
  { name: 'Seg', leads: 4 },
  { name: 'Ter', leads: 3 },
  { name: 'Qua', leads: 7 },
  { name: 'Qui', leads: 5 },
  { name: 'Sex', leads: 8 },
  { name: 'Sáb', leads: 2 },
  { name: 'Dom', leads: 1 },
];

const FILTER_OPTIONS = [
    { id: 'today', label: 'Hoje' },
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: 'month', label: 'Este Mês' },
    { id: 'year', label: 'Este Ano' },
    { id: 'custom', label: 'Personalizado' },
];

export const Dashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState('today');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const startDateInputRef = useRef<HTMLInputElement>(null);

  // Helper to get dates based on filter
  const calculateDateRange = (filterId: string) => {
      const end = new Date();
      const start = new Date();
      
      switch (filterId) {
          case 'today':
              // start is today
              break;
          case '7d':
              start.setDate(end.getDate() - 7);
              break;
          case '30d':
              start.setDate(end.getDate() - 30);
              break;
          case 'month':
              start.setDate(1);
              break;
          case 'year':
              start.setMonth(0, 1);
              break;
          case 'custom':
              return null;
          default:
              return null;
      }
      return {
          start: start.toLocaleDateString('en-CA'), // YYYY-MM-DD format
          end: end.toLocaleDateString('en-CA')
      };
  };

  // Update dates when filter changes
  useEffect(() => {
      if (selectedFilter !== 'custom') {
          const range = calculateDateRange(selectedFilter);
          if (range) setDateRange(range);
      } else {
           // If switched to custom via dropdown, focus start date
           if (startDateInputRef.current) {
              startDateInputRef.current.focus();
           }
      }
  }, [selectedFilter]);

  // Initial set for Today
  useEffect(() => {
     const range = calculateDateRange('today');
     if (range) setDateRange(range);
  }, []);

  const handleManualDateChange = (field: 'start' | 'end', value: string) => {
      setDateRange(prev => ({ ...prev, [field]: value }));
      setSelectedFilter('custom'); // Switch to custom mode
  };

  const getFilterLabel = () => {
      if (selectedFilter === 'custom') return 'Período Personalizado';
      return FILTER_OPTIONS.find(f => f.id === selectedFilter)?.label;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={24} />
                Visão Geral
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Métricas de desempenho: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{getFilterLabel()}</span>
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
            {/* Date Presets Dropdown */}
             <div className="relative w-full sm:w-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={14} className="text-slate-400" />
                </div>
                <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none w-full sm:w-auto dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer h-[38px]"
                >
                    {FILTER_OPTIONS.map((opt) => (
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
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 h-[38px] w-full sm:w-auto justify-center">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leads Capturados', value: selectedFilter === 'today' ? '12' : '128', icon: <Users size={20} className="text-blue-500"/>, change: '+12%' },
          { label: 'Cálculos Gerados', value: selectedFilter === 'today' ? '45' : '345', icon: <FileText size={20} className="text-indigo-500"/>, change: '+24%' },
          { label: 'Taxa Conversão', value: '4.2%', icon: <Filter size={20} className="text-green-500"/>, change: '+0.5%' },
          { label: 'Valor em Potencial', value: selectedFilter === 'today' ? 'R$ 42k' : 'R$ 450k', icon: <Code size={20} className="text-purple-500"/>, change: 'Pipeline' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 animate-in slide-in-from-bottom-2 fade-in duration-300 key-{selectedFilter}">
                    {stat.value}
                </h3>
              </div>
              <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">{stat.icon}</div>
            </div>
            <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 dark:bg-green-900/20 w-fit px-2 py-0.5 rounded-full">
                {stat.change} <span className="text-green-600/70 dark:text-green-400/70 font-normal">vs anterior</span>
            </p>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fluxo de Captura</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Quantidade de leads por dia no período</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA_CHART} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:opacity-10" />
                <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <Tooltip 
                    cursor={{fill: 'rgba(99, 102, 241, 0.1)'}}
                    contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '12px'
                    }}
                />
                <Bar 
                    dataKey="leads" 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    barSize={40}
                    animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

    </div>
  );
};