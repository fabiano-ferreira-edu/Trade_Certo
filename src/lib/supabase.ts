import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || 
    supabaseUrl === 'your_supabase_project_url' || 
    supabaseAnonKey === 'your_supabase_anon_key') {
  throw new Error('Por favor, configure as variáveis de ambiente do Supabase no arquivo .env com suas credenciais reais. Clique em "Connect to Supabase" no canto superior direito para configurar.');
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