import React from 'react';
import { X, HelpCircle, Calendar, TrendingUp, Upload, Database } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Central de Ajuda</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* App Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Versão:</span>
                <p className="text-gray-600">v2.1.0</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Última Atualização:</span>
                <p className="text-gray-600">02 de Janeiro, 2025</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Tecnologia:</span>
                <p className="text-gray-600">React + SupaBase + Chart.js</p>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Como Começar</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Primeira Configuração</h4>
                <ol className="list-decimal list-inside space-y-2 text-green-700 text-sm">
                  <li>Se ainda não conectou, clique em "Connect to Supabase" no canto superior direito</li>
                  <li>Crie um novo projeto no SupaBase ou use um existente</li>
                  <li>As tabelas serão criadas automaticamente quando você conectar</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Adicionando Dados</h4>
                <ol className="list-decimal list-inside space-y-2 text-blue-700 text-sm">
                  <li>Vá para a aba "Adicionar Ativos"</li>
                  <li>Faça upload de arquivos CSV com dados históricos (ex: PETR4.csv, VALE3.csv)</li>
                  <li>Os arquivos serão processados automaticamente</li>
                  <li>Retorne para a aba "Análise de Ativos" e execute sua primeira análise</li>
                </ol>
              </div>
            </div>
          </div>

          {/* CSV Format */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Formato dos Arquivos CSV</h3>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h5 className="font-semibold text-purple-900 mb-2">Nomes de Arquivo Aceitos:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-purple-800">
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">BBAS3.csv</code></div>
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">BBAS3 Dados Históricos.csv</code></div>
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">PETR4_Historico.csv</code></div>
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">VALE3-dados.csv</code></div>
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">ITUB4 Historical Data.csv</code></div>
                    <div>• <code className="bg-purple-100 px-2 py-1 rounded">MGLU3.SA.csv</code></div>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-purple-900 mb-2">Estrutura Obrigatória:</h5>
                  <div className="space-y-1 text-purple-800">
                    <p>• <strong>Colunas obrigatórias:</strong> Data, Último, Abertura, Máxima, Mínima</p>
                    <p>• <strong>Colunas opcionais:</strong> Vol. (se vazio, será definido como 0)</p>
                    <p>• <strong>Formato da data:</strong> DD.MM.YYYY (ex: 01.07.2025)</p>
                    <p>• <strong>Formato dos preços:</strong> Use vírgula como separador decimal (ex: 53,36)</p>
                    <p>• <strong>Formato do volume:</strong> Aceita 'M' para milhões (ex: 21,83M) ou números completos</p>
                    <p>• <strong>Separador:</strong> vírgula (,)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Features */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Funcionalidades de Análise</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Tipos de Operação</h4>
                <ul className="space-y-1 text-orange-700 text-sm">
                  <li>• <strong>Compra:</strong> Detecta oportunidades de alta</li>
                  <li>• <strong>Venda:</strong> Detecta oportunidades de baixa</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Referências de Entrada</h4>
                <ul className="space-y-1 text-orange-700 text-sm">
                  <li>• Fechamento do dia anterior</li>
                  <li>• Máxima do dia anterior</li>
                  <li>• Mínima do dia anterior</li>
                  <li>• Abertura do dia anterior</li>
                  <li>• Abertura de hoje</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Referências de Saída</h4>
                <ul className="space-y-1 text-orange-700 text-sm">
                  <li>• Máxima do dia</li>
                  <li>• Fechamento do dia</li>
                </ul>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Métricas Calculadas</h4>
                <ul className="space-y-1 text-orange-700 text-sm">
                  <li>• Taxa de acerto</li>
                  <li>• Ganho máximo e médio</li>
                  <li>• Max drawdown</li>
                  <li>• Resultado acumulado</li>
                  <li>• Volume médio</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Database Management */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Database className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Gerenciamento da Base</h3>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <p className="text-red-700">
                  A aba "Gerenciar Base" permite limpar completamente todos os dados:
                </p>
                <ul className="space-y-1 text-red-700 ml-4">
                  <li>• Remove todas as tabelas de ativos</li>
                  <li>• Limpa a configuração de ativos</li>
                  <li>• Deixa a aplicação no estado inicial</li>
                </ul>
                <p className="text-red-800 font-semibold">
                  ⚠️ Esta ação é irreversível! Use com cuidado.
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Dicas Importantes</h3>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>• <strong>Upload múltiplo:</strong> Selecione vários arquivos CSV de uma vez para economizar tempo</li>
              <li>• <strong>Linhas inválidas:</strong> Linhas com dados obrigatórios faltantes são automaticamente excluídas</li>
              <li>• <strong>Exportação:</strong> Use o botão "Exportar CSV" para salvar os resultados das análises</li>
              <li>• <strong>Filtros:</strong> Deixe o campo "Ativos" vazio para analisar todos os ativos disponíveis</li>
              <li>• <strong>Performance:</strong> Para análises com muitos dados, seja paciente durante o processamento</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}