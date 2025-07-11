import React, { useState } from 'react';
import { Play, RotateCcw, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalysisParams } from '../lib/supabase';

interface SimulationPanelProps {
  onExecuteAnalysis: (params: AnalysisParams) => void;
  isLoading: boolean;
}

export function SimulationPanel({ onExecuteAnalysis, isLoading }: SimulationPanelProps) {
  const [params, setParams] = useState<AnalysisParams>({
    ativos: [],
    tipoOperacao: 'compra',
    porcentagem: 2,
    volumeMinimo: undefined,
    referenciaEntrada: 'fechamento_anterior',
    referenciaSaida: 'maxima_dia',
    dataInicial: '2024-01-01',
    dataFinal: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteAnalysis(params);
  };

  const handleClear = () => {
    setParams({
      ativos: [],
      tipoOperacao: 'compra',
      porcentagem: 2,
      volumeMinimo: undefined,
      referenciaEntrada: 'fechamento_anterior',
      referenciaSaida: 'maxima_dia',
      dataInicial: '2024-01-01',
      dataFinal: new Date().toISOString().split('T')[0]
    });
  };

  const handleAtivosChange = (value: string) => {
    const ativosList = value ? value.split(',').map(s => s.trim().toUpperCase()) : [];
    setParams(prev => ({ ...prev, ativos: ativosList }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Painel de Simulação</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Ativos
            </label>
            <input
              type="text"
              placeholder="PETR4, VALE3 (deixe vazio para todos)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              onChange={(e) => handleAtivosChange(e.target.value)}
            />
            <p className="text-xs text-gray-500">Separe múltiplos ativos por vírgula</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Tipo de Operação
            </label>
            <select
              value={params.tipoOperacao}
              onChange={(e) => setParams(prev => ({ ...prev, tipoOperacao: e.target.value as 'compra' | 'venda' }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="compra">📈 Compra</option>
              <option value="venda">📉 Venda</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Porcentagem de Gatilho (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={params.porcentagem}
              onChange={(e) => setParams(prev => ({ ...prev, porcentagem: parseFloat(e.target.value) }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Volume Mínimo (opcional)
            </label>
            <input
              type="number"
              placeholder="Ex: 1000000"
              value={params.volumeMinimo || ''}
              onChange={(e) => setParams(prev => ({ ...prev, volumeMinimo: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Referência de Entrada
            </label>
            <select
              value={params.referenciaEntrada}
              onChange={(e) => setParams(prev => ({ ...prev, referenciaEntrada: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="fechamento_anterior">Fechamento do dia anterior</option>
              <option value="maxima_anterior">Máxima do dia anterior</option>
              <option value="minima_anterior">Mínima do dia anterior</option>
              <option value="abertura_anterior">Abertura do dia anterior</option>
              <option value="abertura_hoje">Abertura de hoje</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Referência de Saída
            </label>
            <select
              value={params.referenciaSaida}
              onChange={(e) => setParams(prev => ({ ...prev, referenciaSaida: e.target.value as any }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="maxima_dia">Máxima do dia</option>
              <option value="fechamento_dia">Fechamento do dia</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Inicial
            </label>
            <input
              type="date"
              value={params.dataInicial || ''}
              onChange={(e) => setParams(prev => ({ ...prev, dataInicial: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Final
            </label>
            <input
              type="date"
              value={params.dataFinal || ''}
              onChange={(e) => setParams(prev => ({ ...prev, dataFinal: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="w-5 h-5" />
            {isLoading ? 'Executando...' : 'Executar Análise'}
          </button>
          
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Limpar Campos
          </button>
        </div>
      </form>
    </div>
  );
}