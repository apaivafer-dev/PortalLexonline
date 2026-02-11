import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, Save, CheckCircle, MapPin, Phone, Globe, Mail, Search, Loader2 } from 'lucide-react';

interface CompanySettingsProps {
  company: CompanyProfile;
  onUpdate: (company: CompanyProfile) => void;
}

export const CompanySettings = ({ company, onUpdate }: CompanySettingsProps) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleChange = (field: keyof CompanyProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleAddressChange = (field: keyof CompanyProfile['address'], value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
    setIsSaved(false);
  };

  const handleCepSearch = async () => {
    const cep = formData.address.cep.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      setCepError('CEP inválido. Digite 8 números.');
      return;
    }

    setIsLoadingCep(true);
    setCepError('');

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError('CEP não encontrado.');
      } else {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            cep: data.cep // Ensures formatting
          }
        }));
      }
    } catch (error) {
      setCepError('Erro ao buscar CEP. Tente novamente.');
      console.error(error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
                <Building2 size={32} />
            </div>
            <div>
                <h2 className="text-3xl font-bold">Dados da Empresa</h2>
                <p className="text-blue-100 mt-1">Configure as informações do seu escritório para exibição nos relatórios e contratos.</p>
            </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8 w-full">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Building2 size={18} className="text-indigo-500" /> 
                Informações Básicas
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Nome do Escritório / Razão Social</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Ex: Silva & Souza Advogados"
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Telefone Comercial</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="(00) 0000-0000"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email de Contato</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Site</label>
                     <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                            placeholder="https://..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                        />
                    </div>
                </div>
             </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <MapPin size={18} className="text-indigo-500" /> 
                Endereço
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                 {/* CEP Search */}
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">CEP</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formData.address.cep}
                            onChange={(e) => handleAddressChange('cep', e.target.value)}
                            onBlur={handleCepSearch}
                            placeholder="00000-000"
                            maxLength={9}
                            className={`w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border rounded-lg focus:ring-2 outline-none dark:text-white transition-all
                                ${cepError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-500'}
                            `}
                        />
                        <button 
                            type="button"
                            onClick={handleCepSearch}
                            disabled={isLoadingCep}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Buscar CEP"
                        >
                            {isLoadingCep ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                        </button>
                    </div>
                    {cepError && <p className="text-xs text-red-500">{cepError}</p>}
                </div>

                <div className="md:col-span-3 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Logradouro (Rua, Av...)</label>
                    <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleAddressChange('street', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="md:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Número</label>
                    <input
                        type="text"
                        value={formData.address.number}
                        onChange={(e) => handleAddressChange('number', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Bairro</label>
                    <input
                        type="text"
                        value={formData.address.neighborhood}
                        onChange={(e) => handleAddressChange('neighborhood', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Cidade</label>
                    <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>

                <div className="md:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Estado</label>
                    <input
                        type="text"
                        value={formData.address.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        maxLength={2}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white uppercase"
                    />
                </div>

                 <div className="md:col-span-1 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Complemento</label>
                    <input
                        type="text"
                        value={formData.address.complement}
                        onChange={(e) => handleAddressChange('complement', e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                </div>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:scale-105"
            >
              {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
              {isSaved ? 'Dados Salvos!' : 'Salvar Informações'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};