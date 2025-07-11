import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StockData {
  data: string;
  abertura: number;
  maxima: number;
  minima: number;
  fechamento: number;
  volume: number;
}

export interface AnalysisParams {
  ativos: string[];
  tipoOperacao: 'compra' | 'venda';
  porcentagem: number;
  volumeMinimo?: number;
  referenciaEntrada: 'fechamento_anterior' | 'maxima_anterior' | 'minima_anterior' | 'abertura_anterior' | 'abertura_hoje';
  referenciaSaida: 'maxima_dia' | 'fechamento_dia';
  dataInicial?: string;
  dataFinal?: string;
}

export interface AnalysisResult {
  nome: string;
  tipoOperacao: string;
  totalOp: number;
  totalGain: number;
  percentGain: number;
  totalLoss: number;
  percentLoss: number;
  ganhoMax: number;
  ganhoMed: number;
  maxDrawdown: number;
  drawdownMed: number;
  volMedio: number;
  resultAcum: number;
}