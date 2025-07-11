import React from 'react';
import { Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { AnalysisResult } from '../lib/supabase';
import Papa from 'papaparse';

interface ResultsTableProps {
  results: AnalysisResult[];
  analysisParams: any;
}

export function ResultsTable({ results, analysisParams }: ResultsTableProps) {
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatNumber = (value: number) => value.toLocaleString('pt-BR');

  const exportToCSV = () => {
    const csvData = results.map(result => ({
      'Nome': result.nome,
      'Tipo Operação': result.tipoOperacao,
      'Total Op.': result.totalOp,
      'Total Gain': result.totalGain,
      '% Gain': result.percentGain.toFixed(2),
      'Total Loss': result.totalLoss,
      '% Loss': result.percentLoss.toFixed(2),
      'Ganho Máx. (%)': result.ganhoMax.toFixed(2),
      'Ganho Méd. (%)': result.ganhoMed.toFixed(2),
      'Max Drawdown (%)': result.maxDrawdown.toFixed(2),
      'Drawd. Méd. (%)': result.drawdownMed.toFixed(2),
      'Vol. Médio': result.volMedio.toFixed(0),
      'Result. Acum. (%)': result.resultAcum.toFixed(2)
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analise_acoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Relatório Detalhado</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-gray-500">
          Execute uma análise para visualizar o relatório detalhado
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo dos Parâmetros */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Parâmetros da Simulação</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Ativos:</span>
            <p className="text-gray-600">{analysisParams?.ativos?.length > 0 ? analysisParams.ativos.join(', ') : 'Todos'}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Operação:</span>
            <p className="text-gray-600 capitalize">{analysisParams?.tipoOperacao}</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Gatilho:</span>
            <p className="text-gray-600">{analysisParams?.porcentagem}%</p>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Período:</span>
            <p className="text-gray-600">{analysisParams?.dataInicial} a {analysisParams?.dataFinal}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Relatório Detalhado</h3>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo Op.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total Op.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total Gain</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">% Gain</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total Loss</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">% Loss</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Ganho Máx.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Ganho Méd.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Max Drawdown</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Drawd. Méd.</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Vol. Médio</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Result. Acum.</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{result.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      result.tipoOperacao === 'compra' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.tipoOperacao === 'compra' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {result.tipoOperacao}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-gray-900">
                    {formatNumber(result.totalOp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">
                    {formatNumber(result.totalGain)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">
                    {formatPercent(result.percentGain)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 font-semibold">
                    {formatNumber(result.totalLoss)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 font-semibold">
                    {formatPercent(result.percentLoss)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">
                    {formatPercent(result.ganhoMax)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">
                    {formatPercent(result.ganhoMed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 font-semibold">
                    {formatPercent(result.maxDrawdown)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-red-600 font-semibold">
                    {formatPercent(result.drawdownMed)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-900 font-semibold">
                    {formatNumber(result.volMedio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center font-bold">
                    <span className={result.resultAcum >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatPercent(result.resultAcum)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}