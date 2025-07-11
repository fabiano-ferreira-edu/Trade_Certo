import React, { useState } from 'react';
import { TrendingUp, Activity, AlertCircle, HelpCircle } from 'lucide-react';
import { SimulationPanel } from './components/SimulationPanel';
import { ResultsChart } from './components/ResultsChart';
import { ResultsTable } from './components/ResultsTable';
import { CSVUploader } from './components/CSVUploader';
import { DatabaseManager } from './components/DatabaseManager';
import { HelpModal } from './components/HelpModal';
import { AnalysisService } from './services/analysisService';
import { AnalysisParams, AnalysisResult } from './lib/supabase';

function App() {
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [analysisParams, setAnalysisParams] = useState<AnalysisParams | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'upload' | 'manage'>('analysis');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const analysisService = new AnalysisService();

  const handleExecuteAnalysis = async (params: AnalysisParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const analysisResults = await analysisService.executeAnalysis(params);
      setResults(analysisResults);
      setAnalysisParams(params);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao executar análise';
      setError(errorMessage);
      console.error('Erro na análise:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    // Refresh available stocks or show success message
    setActiveTab('analysis');
  };

  const handleCleanupComplete = () => {
    // Clear current results and reset state
    setResults([]);
    setAnalysisParams(null);
    setError(null);
    // Switch to upload tab to encourage adding new data
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Análise Probabilística de Ações
                </h1>
                <p className="text-gray-600 text-lg">
                  Simule estratégias de trading com dados históricos
                </p>
              </div>
            </div>
            
            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-300 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Ajuda
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="text-red-800 font-semibold">Erro na Análise</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  {error.includes('Faça upload') && (
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                    >
                      Ir para aba "Adicionar Ativos"
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Setup Instructions */}
          {!import.meta.env.VITE_SUPABASE_URL && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <h3 className="text-yellow-800 font-semibold text-lg mb-2">Configuração Necessária</h3>
                  <p className="text-yellow-700 mb-4">
                    Para usar esta aplicação, você precisa configurar o SupaBase:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-yellow-700">
                    <li>Clique no botão "Connect to Supabase" no canto superior direito</li>
                    <li>Crie um novo projeto no SupaBase ou use um existente</li>
                    <li>As tabelas serão criadas automaticamente quando você conectar</li>
                    <li>Execute uma análise para ver os resultados</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Análise de Ativos
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'upload'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📁 Adicionar Ativos
                </button>
                <button
                  onClick={() => setActiveTab('manage')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'manage'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🗑️ Gerenciar Base
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'analysis' ? (
                <div className="space-y-8">
                  {/* Simulation Panel */}
                  <SimulationPanel 
                    onExecuteAnalysis={handleExecuteAnalysis}
                    isLoading={isLoading}
                  />

                  {/* Results Section */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <ResultsChart results={results} />
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Resumo Geral</h3>
                      </div>
                      
                      {results.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {results.reduce((sum, r) => sum + r.totalOp, 0).toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-800">Total de Operações</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {((results.reduce((sum, r) => sum + r.totalGain, 0) / results.reduce((sum, r) => sum + r.totalOp, 0)) * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-green-800">Taxa de Acerto Média</div>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {results.length}
                            </div>
                            <div className="text-sm text-purple-800">Ativos Analisados</div>
                          </div>
                          <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className={`text-2xl font-bold ${
                              results.reduce((sum, r) => sum + r.resultAcum, 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {results.reduce((sum, r) => sum + r.resultAcum, 0).toFixed(1)}%
                            </div>
                            <div className="text-sm text-orange-800">Resultado Acumulado</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          Execute uma análise para ver o resumo geral
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results Table */}
                  <ResultsTable results={results} analysisParams={analysisParams} />
                </div>
              ) : activeTab === 'upload' ? (
                <CSVUploader onUploadSuccess={handleUploadSuccess} />
              ) : (
                <DatabaseManager onCleanupComplete={handleCleanupComplete} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>Sistema de Análise Probabilística de Ações - Desenvolvido com React, SupaBase e Chart.js</p>
          </div>
        </div>
      </footer>

      {/* Help Modal */}
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}

export default App;