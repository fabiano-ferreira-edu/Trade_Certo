import React, { useState } from 'react';
import { Trash2, AlertTriangle, Database, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DatabaseManagerProps {
  onCleanupComplete: () => void;
}

interface CleanupSummary {
  droppedTables: number;
  clearedConfig: boolean;
}

export function DatabaseManager({ onCleanupComplete }: DatabaseManagerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cleanupSummary, setCleanupSummary] = useState<CleanupSummary | null>(null);

  const getAllAssetTables = async (): Promise<string[]> => {
    try {
      console.log('🔍 Buscando todas as tabelas de ativos...');
      
      // Get from ativos_config to ensure we have all assets
      const { data: configData, error: configError } = await supabase
        .from('ativos_config')
        .select('codigo');

      if (!configError && configData) {
        const configTables = configData.map(item => `ativo_${item.codigo.toLowerCase()}`);
        console.log('📋 Tabelas encontradas na configuração:', configTables);
        return configTables;
      }

      return [];
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar tabelas:', error);
      return [];
    }
  };

  const clearDatabase = async () => {
    try {
      setIsClearing(true);
      setStatus({ type: null, message: '' });
      console.log('🧹 Iniciando limpeza completa da base de dados...');

      // Step 1: Get all asset tables
      const assetTables = await getAllAssetTables();
      console.log(`📊 Encontradas ${assetTables.length} tabelas de ativos para limpar`);

      // Step 2: Drop all asset tables
      let droppedTables = 0;
      for (const tableName of assetTables) {
        try {
          console.log(`🗑️ Removendo tabela: ${tableName}`);
          
          const { error } = await supabase.rpc('exec_sql', {
            sql: `DROP TABLE IF EXISTS ${tableName} CASCADE;`
          });

          if (error) {
            console.error(`❌ Erro ao remover tabela ${tableName}:`, error);
          } else {
            console.log(`✅ Tabela ${tableName} removida com sucesso`);
            droppedTables++;
          }
        } catch (error) {
          console.error(`❌ Erro inesperado ao remover ${tableName}:`, error);
        }
      }

      // Step 3: Clear ativos_config table COMPLETELY using SQL TRUNCATE
      console.log('🧹 Limpando COMPLETAMENTE a tabela de configuração...');
      
      let clearedConfig = false;
      
      // Use TRUNCATE directly via SQL for complete cleanup
      const { error: truncateError } = await supabase.rpc('exec_sql', {
        sql: 'TRUNCATE TABLE ativos_config RESTART IDENTITY CASCADE;'
      });

      if (truncateError) {
        console.error('❌ Erro no TRUNCATE:', truncateError);
        
        // Fallback: Try DELETE with a condition that should match all rows
        const { error: deleteError } = await supabase.rpc('exec_sql', {
          sql: 'DELETE FROM ativos_config WHERE TRUE;'
        });
        
        if (deleteError) {
          console.error('❌ Erro no DELETE também:', deleteError);
          throw new Error(`Falha ao limpar ativos_config: ${deleteError.message}`);
        } else {
          console.log('✅ Tabela ativos_config limpa com DELETE');
          clearedConfig = true;
        }
      } else {
        console.log('✅ Tabela ativos_config limpa com TRUNCATE');
        clearedConfig = true;
      }

      // Step 4: Verify the cleanup
      console.log('🔍 Verificando limpeza...');
      const { data: remainingData, error: verifyError } = await supabase
        .from('ativos_config')
        .select('codigo');

      if (!verifyError) {
        if (remainingData && remainingData.length > 0) {
          console.warn(`⚠️ Ainda restam ${remainingData.length} registros na configuração:`, remainingData);
          // Force another cleanup attempt
          const { error: forceDeleteError } = await supabase.rpc('exec_sql', {
            sql: 'DELETE FROM ativos_config;'
          });
          if (!forceDeleteError) {
            console.log('✅ Limpeza forçada bem-sucedida');
          }
        } else {
          console.log('✅ Verificação confirmada: tabela ativos_config está vazia');
        }
      }

      console.log('🎉 Limpeza completa da base de dados concluída!');
      
      // Show success modal
      const summary: CleanupSummary = {
        droppedTables,
        clearedConfig
      };
      
      console.log('🎉 Exibindo modal de sucesso da limpeza:', summary);
      setCleanupSummary(summary);
      setShowSuccessModal(true);

      // Notify parent component
      onCleanupComplete();

    } catch (error) {
      console.error('❌ Erro durante limpeza da base:', error);
      setStatus({
        type: 'error',
        message: `Erro durante a limpeza: ${error}`
      });
    } finally {
      setIsClearing(false);
      setShowConfirmation(false);
      setConfirmationText('');
    }
  };

  const handleConfirmClear = () => {
    if (confirmationText === 'LIMPAR TUDO') {
      clearDatabase();
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setConfirmationText('');
    setStatus({ type: null, message: '' });
  };

  const closeSuccessModal = () => {
    console.log('🔄 Fechando modal de sucesso da limpeza...');
    setShowSuccessModal(false);
    setCleanupSummary(null);
    setStatus({ type: null, message: '' });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Database className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Gerenciamento da Base de Dados</h3>
        </div>

        {!showConfirmation ? (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800 mb-2">Zona de Perigo</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    Esta ação irá <strong>remover permanentemente</strong> todos os dados da aplicação:
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1 mb-4">
                    <li>• <strong>Todas as tabelas de ativos</strong> (ativo_PETR4, ativo_VALE3, etc.)</li>
                    <li>• <strong>Toda a configuração de ativos</strong> (tabela ativos_config)</li>
                    <li>• <strong>Todos os dados históricos</strong> importados</li>
                    <li>• A aplicação voltará ao <strong>estado inicial zerado</strong></li>
                  </ul>
                  <p className="text-yellow-700 text-sm font-semibold">
                    ⚠️ Esta ação não pode ser desfeita!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmation(true)}
              disabled={isClearing}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Base de Dados
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 text-lg mb-3">Confirmação Necessária</h4>
                  <p className="text-red-700 mb-4">
                    Você está prestes a <strong>apagar permanentemente</strong> toda a base de dados.
                    Esta ação removerá:
                  </p>
                  <ul className="text-red-700 text-sm space-y-1 mb-4 ml-4">
                    <li>• Todas as tabelas de ativos e seus dados</li>
                    <li>• Toda a configuração (ativos_config)</li>
                    <li>• Deixará a base completamente zerada</li>
                  </ul>
                  <p className="text-red-700 font-semibold mb-4">
                    Para confirmar, digite exatamente: <code className="bg-red-100 px-2 py-1 rounded">LIMPAR TUDO</code>
                  </p>
                  
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Digite: LIMPAR TUDO"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors mb-4"
                    disabled={isClearing}
                  />
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirmClear}
                      disabled={confirmationText !== 'LIMPAR TUDO' || isClearing}
                      className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isClearing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Limpando...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Confirmar Limpeza
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleCancel}
                      disabled={isClearing}
                      className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status.type && (
          <div className={`mt-4 p-4 rounded-lg border ${
            status.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {status.type === 'success' ? (
                <Database className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h4 className={`font-semibold ${
                  status.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {status.type === 'success' ? 'Limpeza Concluída!' : 'Erro na Limpeza'}
                </h4>
                <p className={`text-sm ${
                  status.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal - Fixed positioning and z-index */}
      {showSuccessModal && cleanupSummary && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              closeSuccessModal();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Limpeza Concluída!
              </h3>
              
              <div className="text-gray-600 mb-6 space-y-3">
                <p>
                  A base de dados foi <span className="font-semibold text-green-600">completamente limpa</span> e está pronta para uso.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tabelas de ativos removidas:</span>
                      <span className="font-semibold text-green-600">{cleanupSummary.droppedTables}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Configuração limpa:</span>
                      <span className="font-semibold text-green-600">
                        {cleanupSummary.clearedConfig ? 'Sim' : 'Não'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500">
                  Você pode agora adicionar novos ativos na aba "Adicionar Ativos".
                </p>
              </div>
              
              <button
                onClick={closeSuccessModal}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
              >
                OK, Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}