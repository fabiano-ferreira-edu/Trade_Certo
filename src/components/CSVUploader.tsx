import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, X, File } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

interface CSVData {
  data: string;
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  volume: number;
}

interface CSVUploaderProps {
  onUploadSuccess: () => void;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message: string;
  assetCode: string;
}

interface UploadSummary {
  totalFiles: number;
  successCount: number;
  errorCount: number;
  processedAssets: string[];
}

export function CSVUploader({ onUploadSuccess }: CSVUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileUploadStatus[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);

  const extractAssetCodeFromFilename = (filename: string): string => {
    // Remove a extensão .csv
    const nameWithoutExtension = filename.replace(/\.csv$/i, '');
    
    // Padrões para extrair o código do ativo
    const patterns = [
      // Padrão: "BBAS3 Dados Históricos" -> BBAS3
      /^([A-Z]{4}\d+)\s+Dados\s+Históricos/i,
      // Padrão: "PETR4_Historico" -> PETR4
      /^([A-Z]{4}\d+)_/i,
      // Padrão: "VALE3-dados" -> VALE3
      /^([A-Z]{4}\d+)-/i,
      // Padrão: "ITUB4 Historical Data" -> ITUB4
      /^([A-Z]{4}\d+)\s+Historical/i,
      // Padrão: "MGLU3.SA" -> MGLU3
      /^([A-Z]{4}\d+)\.SA/i,
      // Padrão: apenas o código no início "BBAS3" -> BBAS3
      /^([A-Z]{4}\d+)/i
    ];
    
    // Tentar cada padrão
    for (const pattern of patterns) {
      const match = nameWithoutExtension.match(pattern);
      if (match) {
        return match[1].toUpperCase();
      }
    }
    
    // Se nenhum padrão funcionar, usar o nome completo em maiúsculas
    // removendo espaços e caracteres especiais
    return nameWithoutExtension
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6); // Limitar a 6 caracteres
  };

  const validateAndFilterCSVData = (data: any[]): { validData: any[]; errors: string[]; excludedRows: number } => {
    const errors: string[] = [];
    const validData: any[] = [];
    let excludedRows = 0;
    
    // Campos obrigatórios - apenas estes são verificados para exclusão de linhas
    const requiredColumns = ['Data', 'Último', 'Abertura', 'Máxima', 'Mínima'];
    // Campos opcionais - se vazios, serão preenchidos com zero
    const optionalColumns = ['Vol.'];
    
    if (data.length === 0) {
      errors.push('Arquivo CSV está vazio');
      return { validData: [], errors, excludedRows: 0 };
    }

    // Check if all required columns exist
    const firstRow = data[0];
    const columns = Object.keys(firstRow);
    
    for (const required of requiredColumns) {
      if (!columns.includes(required)) {
        errors.push(`Coluna obrigatória '${required}' não encontrada`);
      }
    }

    // Se há erros de estrutura, retorna imediatamente
    if (errors.length > 0) {
      return { validData: [], errors, excludedRows: 0 };
    }

    // Processar cada linha
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      let shouldExcludeRow = false;
      
      // Verificar apenas campos obrigatórios para exclusão
      for (const required of requiredColumns) {
        const value = row[required];
        if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
          shouldExcludeRow = true;
          break;
        }
      }
      
      // Se a linha tem dados obrigatórios faltando, excluir
      if (shouldExcludeRow) {
        excludedRows++;
        continue;
      }
      
      // Validar formato da data
      const dateValue = row['Data'];
      if (!isValidDateFormat(dateValue)) {
        errors.push(`Data inválida na linha ${i + 1}: ${dateValue}. Use o formato DD.MM.YYYY`);
        continue;
      }

      // Validar valores numéricos obrigatórios
      const numericFields = [
        { csv: 'Último', db: 'fechamento' },
        { csv: 'Abertura', db: 'abertura' },
        { csv: 'Máxima', db: 'maxima' },
        { csv: 'Mínima', db: 'minima' }
      ];
      
      let hasInvalidNumeric = false;
      for (const field of numericFields) {
        const value = row[field.csv];
        if (!isValidNumericValue(value)) {
          errors.push(`Valor numérico inválido para '${field.csv}' na linha ${i + 1}: ${value}`);
          hasInvalidNumeric = true;
        }
      }
      
      if (hasInvalidNumeric) {
        continue;
      }

      // Validar volume (opcional) - se inválido, será definido como 0
      const volumeValue = row['Vol.'];
      if (volumeValue && volumeValue.toString().trim() !== '' && !isValidVolumeValue(volumeValue)) {
        errors.push(`Volume inválido na linha ${i + 1}: ${volumeValue}. Será definido como 0.`);
      }

      // Se chegou até aqui, a linha é válida
      validData.push(row);
    }

    return { validData, errors, excludedRows };
  };

  const isValidDateFormat = (dateString: string): boolean => {
    // Check DD.MM.YYYY format
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const [day, month, year] = dateString.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
  };

  const isValidNumericValue = (value: string): boolean => {
    // Accept values with comma as decimal separator
    const normalizedValue = value.toString().replace(',', '.');
    return !isNaN(parseFloat(normalizedValue));
  };

  const isValidVolumeValue = (value: string): boolean => {
    // Accept formats like "21,83M" or plain numbers
    const volumeRegex = /^\d+([,\.]\d+)?[M]?$/;
    return volumeRegex.test(value.toString());
  };

  const normalizeCSVData = (data: any[]): CSVData[] => {
    return data.map(row => ({
      data: formatDate(row['Data']),
      abertura: parseNumericValue(row['Abertura']),
      maxima: parseNumericValue(row['Máxima']),
      minima: parseNumericValue(row['Mínima']),
      fechamento: parseNumericValue(row['Último']), // Mapear "Último" para "fechamento"
      volume: parseVolume(row['Vol.']) // Se vazio ou inválido, retornará 0
    }));
  };

  const formatDate = (dateString: string): string => {
    // Convert DD.MM.YYYY to YYYY-MM-DD
    const [day, month, year] = dateString.split('.');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const parseNumericValue = (value: string | number): number => {
    // Convert comma decimal separator to dot and parse
    const stringValue = value.toString().replace(',', '.');
    return parseFloat(stringValue);
  };

  const parseVolume = (value: string | null | undefined): number => {
    // Se valor está vazio, nulo ou indefinido, retorna 0
    if (!value || value.toString().trim() === '') {
      return 0;
    }
    
    // Handle formats like "21,83M" or plain numbers
    const stringValue = value.toString().trim();
    
    // Se não é um valor válido, retorna 0
    if (!isValidVolumeValue(stringValue)) {
      return 0;
    }
    
    if (stringValue.endsWith('M')) {
      // Remove 'M' and convert comma to dot
      const numericPart = stringValue.slice(0, -1).replace(',', '.');
      return parseFloat(numericPart) * 1000000;
    } else {
      // Plain number, just convert comma to dot
      return parseFloat(stringValue.replace(',', '.'));
    }
  };

  const ensureAtivosConfigTableExists = async (): Promise<boolean> => {
    try {
      console.log('🔧 Verificando/criando tabela ativos_config...');
      
      // Create ativos_config table if it doesn't exist
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ativos_config (
          codigo text PRIMARY KEY,
          nome text NOT NULL,
          ativo boolean NOT NULL DEFAULT true,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('❌ Erro ao criar tabela ativos_config:', createError);
        return false;
      }
      console.log('✅ Tabela ativos_config verificada/criada com sucesso');

      // Enable RLS
      const enableRLSSQL = `ALTER TABLE ativos_config ENABLE ROW LEVEL SECURITY;`;
      const { error: rlsError } = await supabase.rpc('exec_sql', { 
        sql: enableRLSSQL 
      });

      if (rlsError) {
        console.error('⚠️ Erro ao habilitar RLS na ativos_config:', rlsError);
      }

      // Create policies for SELECT, INSERT, and UPDATE
      const createPoliciesSQL = `
        DO $$
        BEGIN
          -- SELECT policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'ativos_config' 
            AND policyname = 'Leitura pública ativos_config'
          ) THEN
            CREATE POLICY "Leitura pública ativos_config"
              ON ativos_config
              FOR SELECT
              TO anon, authenticated
              USING (true);
          END IF;

          -- INSERT policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'ativos_config' 
            AND policyname = 'Inserção pública ativos_config'
          ) THEN
            CREATE POLICY "Inserção pública ativos_config"
              ON ativos_config
              FOR INSERT
              TO anon, authenticated
              WITH CHECK (true);
          END IF;

          -- UPDATE policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'ativos_config' 
            AND policyname = 'Atualização pública ativos_config'
          ) THEN
            CREATE POLICY "Atualização pública ativos_config"
              ON ativos_config
              FOR UPDATE
              TO anon, authenticated
              USING (true)
              WITH CHECK (true);
          END IF;
        END $$;
      `;

      const { error: policyError } = await supabase.rpc('exec_sql', { 
        sql: createPoliciesSQL 
      });

      if (policyError) {
        console.error('⚠️ Erro ao criar políticas para ativos_config:', policyError);
      } else {
        console.log('✅ Políticas da tabela ativos_config configuradas');
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao configurar tabela ativos_config:', error);
      return false;
    }
  };

  const createAssetTable = async (assetCode: string): Promise<boolean> => {
    try {
      console.log(`🔧 Criando tabela para ${assetCode}...`);
      const tableName = `ativo_${assetCode.toLowerCase()}`;
      
      // Create table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          data date PRIMARY KEY,
          abertura numeric NOT NULL,
          maxima numeric NOT NULL,
          minima numeric NOT NULL,
          fechamento numeric NOT NULL,
          volume numeric NOT NULL DEFAULT 0,
          created_at timestamptz DEFAULT now()
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: createTableSQL 
      });

      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError);
        return false;
      }
      console.log(`✅ Tabela ${tableName} criada com sucesso`);

      // Enable RLS
      const enableRLSSQL = `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`;
      const { error: rlsError } = await supabase.rpc('exec_sql', { 
        sql: enableRLSSQL 
      });

      if (rlsError) {
        console.error('⚠️ Erro ao habilitar RLS:', rlsError);
      }

      // Create policies for SELECT, INSERT, and UPDATE
      const createPoliciesSQL = `
        DO $$
        BEGIN
          -- SELECT policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = '${tableName}' 
            AND policyname = 'Leitura pública ${assetCode}'
          ) THEN
            CREATE POLICY "Leitura pública ${assetCode}"
              ON ${tableName}
              FOR SELECT
              TO anon, authenticated
              USING (true);
          END IF;

          -- INSERT policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = '${tableName}' 
            AND policyname = 'Inserção pública ${assetCode}'
          ) THEN
            CREATE POLICY "Inserção pública ${assetCode}"
              ON ${tableName}
              FOR INSERT
              TO anon, authenticated
              WITH CHECK (true);
          END IF;

          -- UPDATE policy
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = '${tableName}' 
            AND policyname = 'Atualização pública ${assetCode}'
          ) THEN
            CREATE POLICY "Atualização pública ${assetCode}"
              ON ${tableName}
              FOR UPDATE
              TO anon, authenticated
              USING (true)
              WITH CHECK (true);
          END IF;
        END $$;
      `;

      const { error: policyError } = await supabase.rpc('exec_sql', { 
        sql: createPoliciesSQL 
      });

      if (policyError) {
        console.error('⚠️ Erro ao criar políticas:', policyError);
      }

      // Add to ativos_config if not exists
      console.log(`📝 Adicionando ${assetCode} à configuração...`);
      const { error: configError } = await supabase
        .from('ativos_config')
        .upsert({
          codigo: assetCode,
          nome: assetCode,
          ativo: true
        }, {
          onConflict: 'codigo'
        });

      if (configError) {
        console.error('⚠️ Erro ao adicionar à configuração:', configError);
      } else {
        console.log(`✅ ${assetCode} adicionado à configuração`);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao criar tabela do ativo:', error);
      return false;
    }
  };

  const insertCSVData = async (assetCode: string, csvData: CSVData[]): Promise<boolean> => {
    try {
      console.log(`📊 Inserindo ${csvData.length} registros para ${assetCode}...`);
      const tableName = `ativo_${assetCode.toLowerCase()}`;
      
      // Insert data in batches
      const batchSize = 100;
      let totalInserted = 0;
      
      for (let i = 0; i < csvData.length; i += batchSize) {
        const batch = csvData.slice(i, i + batchSize);
        console.log(`📦 Inserindo lote ${Math.floor(i / batchSize) + 1} (${batch.length} registros)...`);
        
        const { error, count } = await supabase
          .from(tableName)
          .upsert(batch, {
            onConflict: 'data'
          });

        if (error) {
          console.error(`❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error);
          return false;
        }
        
        totalInserted += batch.length;
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido com sucesso`);
      }

      console.log(`🎉 Total de ${totalInserted} registros inseridos para ${assetCode}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao inserir dados:', error);
      return false;
    }
  };

  const updateFileStatus = (fileIndex: number, status: 'pending' | 'processing' | 'success' | 'error', message: string) => {
    console.log(`📝 Atualizando status do arquivo ${fileIndex}: ${status} - ${message}`);
    setSelectedFiles(prev => prev.map((f, i) => 
      i === fileIndex 
        ? { ...f, status, message }
        : f
    ));
  };

  const processFile = async (file: File, fileIndex: number) => {
    try {
      console.log(`🚀 Iniciando processamento do arquivo: ${file.name}`);
      
      // Extract asset code from filename using the new flexible function
      const assetCode = extractAssetCodeFromFilename(file.name);
      console.log(`🏷️ Código do ativo extraído: ${assetCode}`);

      // Update file status to processing
      updateFileStatus(fileIndex, 'processing', 'Processando arquivo...');

      // Parse CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            console.log(`📋 CSV parseado: ${results.data.length} linhas encontradas`);
            
            // Validate and filter CSV data
            const { validData, errors, excludedRows } = validateAndFilterCSVData(results.data);
            console.log(`✅ Dados válidos: ${validData.length}, Linhas excluídas: ${excludedRows}`);
            
            // Se há erros críticos (estrutura), para o processo
            const criticalErrors = errors.filter(error => 
              error.includes('não encontrada') || 
              error.includes('está vazio') ||
              error.includes('Data inválida') ||
              error.includes('Valor numérico inválido')
            );
            
            if (criticalErrors.length > 0) {
              console.error(`❌ Erros críticos encontrados:`, criticalErrors);
              updateFileStatus(fileIndex, 'error', `Erro na validação: ${criticalErrors.join(', ')}`);
              return;
            }

            // Se não há dados válidos após filtrar
            if (validData.length === 0) {
              console.error('❌ Nenhuma linha válida encontrada');
              updateFileStatus(fileIndex, 'error', 'Nenhuma linha válida encontrada no arquivo');
              return;
            }

            // Normalize data
            console.log('🔄 Normalizando dados...');
            const normalizedData = normalizeCSVData(validData);

            // Create table if not exists
            console.log('🏗️ Criando/verificando tabela...');
            updateFileStatus(fileIndex, 'processing', 'Criando tabela no banco...');
            const tableCreated = await createAssetTable(assetCode);
            if (!tableCreated) {
              console.error('❌ Falha ao criar tabela');
              updateFileStatus(fileIndex, 'error', 'Erro ao criar tabela no banco de dados');
              return;
            }

            // Insert data
            console.log('💾 Inserindo dados...');
            updateFileStatus(fileIndex, 'processing', 'Inserindo dados no banco...');
            const dataInserted = await insertCSVData(assetCode, normalizedData);
            if (!dataInserted) {
              console.error('❌ Falha ao inserir dados');
              updateFileStatus(fileIndex, 'error', 'Erro ao inserir dados no banco');
              return;
            }

            // Mensagem de sucesso com informações sobre linhas processadas
            let successMessage = `${normalizedData.length} registros inseridos`;
            
            if (excludedRows > 0) {
              successMessage += ` (${excludedRows} linhas excluídas)`;
            }
            
            // Avisos sobre volumes inválidos (não críticos)
            const volumeWarnings = errors.filter(error => error.includes('Volume inválido'));
            if (volumeWarnings.length > 0) {
              successMessage += ` - Alguns volumes definidos como 0`;
            }

            console.log(`🎉 Processamento concluído com sucesso: ${successMessage}`);
            updateFileStatus(fileIndex, 'success', successMessage);

          } catch (error) {
            console.error('❌ Erro durante processamento:', error);
            updateFileStatus(fileIndex, 'error', `Erro ao processar: ${error}`);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao ler CSV:', error);
          updateFileStatus(fileIndex, 'error', `Erro ao ler CSV: ${error.message}`);
        }
      });
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      updateFileStatus(fileIndex, 'error', `Erro inesperado: ${error}`);
    }
  };

  const processAllFiles = async () => {
    console.log('🚀 Iniciando processamento de todos os arquivos...');
    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    // Ensure ativos_config table exists before processing any files
    console.log('🔧 Verificando tabela ativos_config...');
    const configTableReady = await ensureAtivosConfigTableExists();
    if (!configTableReady) {
      setUploadStatus({
        type: 'error',
        message: 'Erro ao configurar tabela de configuração dos ativos'
      });
      setIsUploading(false);
      return;
    }

    // Process all files sequentially to avoid overwhelming the database
    for (let i = 0; i < selectedFiles.length; i++) {
      if (selectedFiles[i].status === 'pending') {
        console.log(`📁 Processando arquivo ${i + 1}/${selectedFiles.length}: ${selectedFiles[i].file.name}`);
        await processFile(selectedFiles[i].file, i);
        // Small delay between files to prevent rate limiting
        console.log('⏳ Aguardando 500ms antes do próximo arquivo...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('⏳ Aguardando 1 segundo para verificar resultados finais...');
    // Wait a bit for all state updates to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check results after all processing is complete
    console.log('📊 Verificando resultados finais...');
    
    // Force a state update to get the latest file statuses
    setSelectedFiles(prev => {
      const successCount = prev.filter(f => f.status === 'success').length;
      const errorCount = prev.filter(f => f.status === 'error').length;
      const processingCount = prev.filter(f => f.status === 'processing').length;
      const pendingCount = prev.filter(f => f.status === 'pending').length;
      const processedAssets = prev
        .filter(f => f.status === 'success')
        .map(f => f.assetCode);
      
      console.log(`📈 Status final: ${successCount} sucessos, ${errorCount} erros, ${processingCount} processando, ${pendingCount} pendentes`);
      console.log(`📋 Ativos processados:`, processedAssets);
      
      // Set final status based on results
      setTimeout(() => {
        setIsUploading(false);
        
        if (successCount > 0) {
          // Show success modal
          const summary = {
            totalFiles: prev.length,
            successCount,
            errorCount,
            processedAssets
          };
          
          console.log('🎉 Exibindo modal de sucesso:', summary);
          setUploadSummary(summary);
          setShowSuccessModal(true);
          onUploadSuccess();
        } else if (errorCount > 0) {
          setUploadStatus({
            type: 'error',
            message: 'Nenhum arquivo foi processado com sucesso. Verifique os erros acima.'
          });
        } else if (processingCount > 0 || pendingCount > 0) {
          setUploadStatus({
            type: 'error',
            message: 'Alguns arquivos ainda estão sendo processados. Aguarde ou tente novamente.'
          });
        } else {
          setUploadStatus({
            type: 'error',
            message: 'Status indefinido. Tente fazer o upload novamente.'
          });
        }
      }, 100);
      
      return prev;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      
      if (files.length > 0) {
        addFiles(files);
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Por favor, selecione apenas arquivos CSV'
        });
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file => 
        file.type === 'text/csv' || file.name.endsWith('.csv')
      );
      
      if (files.length > 0) {
        addFiles(files);
      } else {
        setUploadStatus({
          type: 'error',
          message: 'Por favor, selecione apenas arquivos CSV'
        });
      }
    }
  };

  const addFiles = (files: File[]) => {
    const newFiles: FileUploadStatus[] = files.map(file => ({
      file,
      status: 'pending',
      message: 'Aguardando processamento',
      assetCode: extractAssetCodeFromFilename(file.name)
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setUploadStatus({ type: null, message: '' });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setUploadStatus({ type: null, message: '' });
  };

  const closeSuccessModal = () => {
    console.log('🔄 Fechando modal de sucesso e limpando estado...');
    setShowSuccessModal(false);
    setUploadSummary(null);
    // Clear the file list after successful upload
    setSelectedFiles([]);
    setUploadStatus({ type: null, message: '' });
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Upload className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Adicionar Novos Ativos</h3>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Faça upload dos arquivos CSV
              </h4>
              <p className="text-gray-600 mb-4">
                Arraste e solte múltiplos arquivos aqui ou clique para selecionar
              </p>
              
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
                disabled={isUploading}
              />
              
              <label
                htmlFor="csv-upload"
                className={`inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 transition-colors cursor-pointer ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Upload className="w-5 h-5" />
                Selecionar Arquivos
              </label>
            </div>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                Arquivos Selecionados ({selectedFiles.length})
              </h4>
              <div className="flex gap-2">
                {!isUploading && (
                  <>
                    <button
                      onClick={processAllFiles}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Processar Todos
                    </button>
                    <button
                      onClick={clearAllFiles}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Limpar Lista
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {selectedFiles.map((fileStatus, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    fileStatus.status === 'success' ? 'bg-green-50 border-green-200' :
                    fileStatus.status === 'error' ? 'bg-red-50 border-red-200' :
                    fileStatus.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      fileStatus.status === 'success' ? 'bg-green-100' :
                      fileStatus.status === 'error' ? 'bg-red-100' :
                      fileStatus.status === 'processing' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {fileStatus.status === 'processing' ? (
                        <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : fileStatus.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : fileStatus.status === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <File className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {fileStatus.assetCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {fileStatus.file.name}
                      </div>
                      <div className={`text-xs ${
                        fileStatus.status === 'success' ? 'text-green-600' :
                        fileStatus.status === 'error' ? 'text-red-600' :
                        fileStatus.status === 'processing' ? 'text-blue-600' :
                        'text-gray-500'
                      }`}>
                        {fileStatus.message}
                      </div>
                    </div>
                  </div>
                  
                  {!isUploading && fileStatus.status === 'pending' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Format Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-900 mb-2">Formato do Arquivo CSV:</h5>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>Nome do arquivo:</strong> Aceita vários formatos:</p>
            <div className="ml-4 space-y-1">
              <p>- <code>BBAS3.csv</code> (formato simples)</p>
              <p>- <code>BBAS3 Dados Históricos.csv</code> (formato padrão do download)</p>
              <p>- <code>PETR4_Historico.csv</code> (com underscore)</p>
              <p>- <code>VALE3-dados.csv</code> (com hífen)</p>
              <p>- <code>ITUB4 Historical Data.csv</code> (em inglês)</p>
              <p>- <code>MGLU3.SA.csv</code> (com sufixo .SA)</p>
            </div>
            <p>• <strong>Colunas obrigatórias:</strong> Data, Último, Abertura, Máxima, Mínima</p>
            <p>• <strong>Colunas opcionais:</strong> Vol. (se vazio, será definido como 0)</p>
            <p>• <strong>Formato da data:</strong> DD.MM.YYYY (ex: 01.07.2025)</p>
            <p>• <strong>Formato dos preços:</strong> Use vírgula como separador decimal (ex: 53,36)</p>
            <p>• <strong>Formato do volume:</strong> Aceita 'M' para milhões (ex: 21,83M) ou números completos</p>
            <p>• <strong>Separador:</strong> vírgula (,)</p>
            <p>• <strong>Linhas com dados obrigatórios faltantes serão automaticamente excluídas</strong></p>
            <p>• <strong>Upload múltiplo:</strong> Selecione vários arquivos CSV de uma vez para economizar tempo</p>
          </div>
        </div>

        {/* Status Messages */}
        {uploadStatus.type && (
          <div className={`mt-4 p-4 rounded-lg border ${
            uploadStatus.type === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              {uploadStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <h4 className={`font-semibold ${
                  uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {uploadStatus.type === 'success' ? 'Processamento Concluído!' : 'Erro no Processamento'}
                </h4>
                <p className={`text-sm ${
                  uploadStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {uploadStatus.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal - Fixed positioning and z-index */}
      {showSuccessModal && uploadSummary && (
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
                Importação Concluída!
              </h3>
              
              <div className="text-gray-600 mb-6 space-y-2">
                <p>
                  <span className="font-semibold text-green-600">{uploadSummary.successCount}</span> de{' '}
                  <span className="font-semibold">{uploadSummary.totalFiles}</span> arquivos processados com sucesso
                </p>
                
                {uploadSummary.errorCount > 0 && (
                  <p className="text-red-600">
                    {uploadSummary.errorCount} arquivo(s) com erro
                  </p>
                )}
                
                <div className="mt-4">
                  <p className="font-semibold text-gray-700 mb-2">Ativos adicionados:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {uploadSummary.processedAssets.map((asset, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <button
                onClick={closeSuccessModal}
                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}