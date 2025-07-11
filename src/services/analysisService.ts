import { supabase, StockData, AnalysisParams, AnalysisResult } from '../lib/supabase';

export class AnalysisService {
  async getAvailableStocks(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ativos_config')
        .select('codigo')
        .eq('ativo', true);

      if (error) throw error;
      return data?.map(item => item.codigo) || [];
    } catch (error) {
      console.error('Erro ao buscar ativos:', error);
      return []; // Return empty array instead of fallback
    }
  }

  async checkTableExists(stockCode: string): Promise<boolean> {
    try {
      const tableName = `ativo_${stockCode.toLowerCase()}`;
      
      // Try to query the table with a limit of 1 to check if it exists
      const { error } = await supabase
        .from(tableName)
        .select('data')
        .limit(1);

      // If no error, table exists
      return !error;
    } catch (error) {
      // If there's an error, assume table doesn't exist
      return false;
    }
  }

  async getStockData(stockCode: string, startDate?: string, endDate?: string): Promise<StockData[]> {
    try {
      // First check if table exists
      const tableExists = await this.checkTableExists(stockCode);
      if (!tableExists) {
        console.warn(`Tabela para ${stockCode} não existe. Faça upload do arquivo CSV primeiro.`);
        return [];
      }

      let query = supabase
        .from(`ativo_${stockCode.toLowerCase()}`)
        .select('*')
        .order('data', { ascending: true });

      if (startDate) {
        query = query.gte('data', startDate);
      }
      if (endDate) {
        query = query.lte('data', endDate);
      }

      const { data, error } = await query;
      if (error) {
        // Check if it's a "relation does not exist" error
        if (error.code === '42P01') {
          console.warn(`Tabela para ${stockCode} não existe. Faça upload do arquivo CSV primeiro.`);
          return [];
        }
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error(`Erro ao buscar dados para ${stockCode}:`, error);
      return [];
    }
  }

  async executeAnalysis(params: AnalysisParams): Promise<AnalysisResult[]> {
    try {
      // Determinar quais ativos analisar
      let stocksToAnalyze: string[];
      if (params.ativos.length > 0) {
        stocksToAnalyze = params.ativos;
      } else {
        stocksToAnalyze = await this.getAvailableStocks();
      }

      // If no stocks available, return empty results with helpful message
      if (stocksToAnalyze.length === 0) {
        throw new Error('Nenhum ativo disponível para análise. Faça upload de arquivos CSV primeiro na aba "Adicionar Ativos".');
      }

      const results: AnalysisResult[] = [];
      const missingTables: string[] = [];

      // Analisar cada ativo
      for (const stockCode of stocksToAnalyze) {
        // Check if table exists before trying to get data
        const tableExists = await this.checkTableExists(stockCode);
        if (!tableExists) {
          missingTables.push(stockCode);
          continue;
        }

        const stockData = await this.getStockData(stockCode, params.dataInicial, params.dataFinal);
        
        if (stockData.length < 2) {
          console.warn(`Dados insuficientes para ${stockCode}`);
          continue;
        }

        const result = this.analyzeStock(stockCode, stockData, params);
        results.push(result);
      }

      // If no results and there are missing tables, throw informative error
      if (results.length === 0 && missingTables.length > 0) {
        throw new Error(`Nenhuma tabela encontrada para os ativos: ${missingTables.join(', ')}. Faça upload dos arquivos CSV correspondentes na aba "Adicionar Ativos".`);
      }

      // If no results but tables exist, throw different error
      if (results.length === 0) {
        throw new Error('Nenhum resultado gerado. Verifique os parâmetros da análise e se há dados suficientes no período selecionado.');
      }

      return results;
    } catch (error) {
      console.error('Erro na análise:', error);
      throw error;
    }
  }

  private analyzeStock(stockCode: string, data: StockData[], params: AnalysisParams): AnalysisResult {
    const operations: Array<{
      triggered: boolean;
      result: number;
      drawdown: number;
      volume: number;
    }> = [];

    // Analisar cada dia (a partir do segundo dia para ter referência anterior)
    for (let i = 1; i < data.length; i++) {
      const currentDay = data[i];
      const previousDay = data[i - 1];

      // Filtro de volume mínimo
      if (params.volumeMinimo && currentDay.volume < params.volumeMinimo) {
        continue;
      }

      // Calcular preço de gatilho baseado na referência de entrada
      const triggerPrice = this.calculateTriggerPrice(
        currentDay,
        previousDay,
        params.referenciaEntrada,
        params.porcentagem,
        params.tipoOperacao
      );

      // Verificar se a operação foi acionada
      const wasTriggered = this.checkIfTriggered(currentDay, triggerPrice, params.tipoOperacao);

      if (wasTriggered) {
        // Calcular resultado da operação
        const result = this.calculateOperationResult(
          currentDay,
          triggerPrice,
          params.referenciaSaida,
          params.tipoOperacao
        );

        // Calcular drawdown
        const drawdown = this.calculateDrawdown(
          currentDay,
          triggerPrice,
          params.tipoOperacao
        );

        operations.push({
          triggered: true,
          result,
          drawdown,
          volume: currentDay.volume
        });
      }
    }

    // Calcular métricas finais
    return this.calculateFinalMetrics(stockCode, operations, params.tipoOperacao);
  }

  private calculateTriggerPrice(
    currentDay: StockData,
    previousDay: StockData,
    referencia: string,
    porcentagem: number,
    tipoOperacao: string
  ): number {
    let basePrice: number;

    switch (referencia) {
      case 'fechamento_anterior':
        basePrice = previousDay.fechamento;
        break;
      case 'maxima_anterior':
        basePrice = previousDay.maxima;
        break;
      case 'minima_anterior':
        basePrice = previousDay.minima;
        break;
      case 'abertura_anterior':
        basePrice = previousDay.abertura;
        break;
      case 'abertura_hoje':
        basePrice = currentDay.abertura;
        break;
      default:
        basePrice = previousDay.fechamento;
    }

    // Para compra: preço base + porcentagem
    // Para venda: preço base - porcentagem
    const multiplier = tipoOperacao === 'compra' ? (1 + porcentagem / 100) : (1 - porcentagem / 100);
    return basePrice * multiplier;
  }

  private checkIfTriggered(currentDay: StockData, triggerPrice: number, tipoOperacao: string): boolean {
    if (tipoOperacao === 'compra') {
      // Para compra: se o preço subiu até o gatilho
      return currentDay.maxima >= triggerPrice;
    } else {
      // Para venda: se o preço desceu até o gatilho
      return currentDay.minima <= triggerPrice;
    }
  }

  private calculateOperationResult(
    currentDay: StockData,
    triggerPrice: number,
    referenciaSaida: string,
    tipoOperacao: string
  ): number {
    const exitPrice = referenciaSaida === 'maxima_dia' ? currentDay.maxima : currentDay.fechamento;

    if (tipoOperacao === 'compra') {
      // Resultado da compra: (preço de saída - preço de entrada) / preço de entrada
      return ((exitPrice - triggerPrice) / triggerPrice) * 100;
    } else {
      // Resultado da venda: (preço de entrada - preço de saída) / preço de entrada
      return ((triggerPrice - exitPrice) / triggerPrice) * 100;
    }
  }

  private calculateDrawdown(currentDay: StockData, triggerPrice: number, tipoOperacao: string): number {
    if (tipoOperacao === 'compra') {
      // Para compra: (mínima do dia - preço de gatilho) / preço de gatilho
      return ((currentDay.minima - triggerPrice) / triggerPrice) * 100;
    } else {
      // Para venda: (preço de gatilho - máxima do dia) / preço de gatilho
      return ((triggerPrice - currentDay.maxima) / triggerPrice) * 100;
    }
  }

  private calculateFinalMetrics(stockCode: string, operations: any[], tipoOperacao: string): AnalysisResult {
    const totalOp = operations.length;
    
    if (totalOp === 0) {
      return {
        nome: stockCode,
        tipoOperacao,
        totalOp: 0,
        totalGain: 0,
        percentGain: 0,
        totalLoss: 0,
        percentLoss: 0,
        ganhoMax: 0,
        ganhoMed: 0,
        maxDrawdown: 0,
        drawdownMed: 0,
        volMedio: 0,
        resultAcum: 0
      };
    }

    const gains = operations.filter(op => op.result > 0);
    const losses = operations.filter(op => op.result <= 0);
    
    const totalGain = gains.length;
    const totalLoss = losses.length;
    const percentGain = (totalGain / totalOp) * 100;
    const percentLoss = (totalLoss / totalOp) * 100;
    
    const ganhoMax = gains.length > 0 ? Math.max(...gains.map(g => g.result)) : 0;
    const ganhoMed = gains.length > 0 ? gains.reduce((sum, g) => sum + g.result, 0) / gains.length : 0;
    
    const maxDrawdown = Math.min(...operations.map(op => op.drawdown));
    const drawdownMed = operations.reduce((sum, op) => sum + op.drawdown, 0) / operations.length;
    
    const volMedio = operations.reduce((sum, op) => sum + op.volume, 0) / operations.length;
    const resultAcum = operations.reduce((sum, op) => sum + op.result, 0);

    return {
      nome: stockCode,
      tipoOperacao,
      totalOp,
      totalGain,
      percentGain,
      totalLoss,
      percentLoss,
      ganhoMax,
      ganhoMed,
      maxDrawdown,
      drawdownMed,
      volMedio,
      resultAcum
    };
  }
}