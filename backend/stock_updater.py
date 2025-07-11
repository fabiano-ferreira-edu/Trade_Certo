#!/usr/bin/env python3
"""
Script para atualização automática de dados de ações no SupaBase.
Este script deve ser executado diariamente após o fechamento do mercado.

Funcionalidades:
- Conecta ao banco SupaBase
- Obtém lista de ativos configurados
- Faz web scraping dos dados mais recentes
- Atualiza as tabelas correspondentes
"""

import os
import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import time
import logging
from supabase import create_client, Client

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_updater.log'),
        logging.StreamHandler()
    ]
)

class StockUpdater:
    def __init__(self):
        """Inicializar o atualizador de ações."""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias")
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        logging.info("Cliente SupaBase inicializado com sucesso")

    def get_active_stocks(self) -> List[str]:
        """Obter lista de ativos ativos do banco."""
        try:
            response = self.supabase.table('ativos_config').select('codigo').eq('ativo', True).execute()
            stocks = [item['codigo'] for item in response.data]
            logging.info(f"Encontrados {len(stocks)} ativos ativos: {stocks}")
            return stocks
        except Exception as e:
            logging.error(f"Erro ao obter lista de ativos: {e}")
            return ['PETR4', 'VALE3']  # Fallback

    def get_stock_data_from_api(self, stock_code: str) -> Optional[Dict]:
        """
        Obter dados de ação via API (exemplo usando Yahoo Finance alternative).
        Em produção, você deve usar uma API confiável como Alpha Vantage, IEX Cloud, etc.
        """
        try:
            # Exemplo usando uma API fictícia - substitua por uma API real
            # Para fins de demonstração, vamos gerar dados fictícios
            today = datetime.now().date()
            
            # Simular dados (em produção, use uma API real)
            import random
            base_price = 40.0 if stock_code == 'PETR4' else 70.0
            variation = random.uniform(-0.05, 0.05)  # ±5%
            
            open_price = base_price * (1 + variation)
            close_price = open_price * (1 + random.uniform(-0.03, 0.03))
            high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.02))
            low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.02))
            volume = random.randint(30000000, 60000000)
            
            stock_data = {
                'data': today.isoformat(),
                'abertura': round(open_price, 2),
                'maxima': round(high_price, 2),
                'minima': round(low_price, 2),
                'fechamento': round(close_price, 2),
                'volume': volume
            }
            
            logging.info(f"Dados obtidos para {stock_code}: {stock_data}")
            return stock_data
            
        except Exception as e:
            logging.error(f"Erro ao obter dados para {stock_code}: {e}")
            return None

    def update_stock_data(self, stock_code: str, stock_data: Dict) -> bool:
        """Atualizar dados de uma ação no banco."""
        try:
            table_name = f'ativo_{stock_code}'
            
            # Verificar se já existe registro para hoje
            existing = self.supabase.table(table_name).select('data').eq('data', stock_data['data']).execute()
            
            if existing.data:
                # Atualizar registro existente
                response = self.supabase.table(table_name).update(stock_data).eq('data', stock_data['data']).execute()
                logging.info(f"Dados atualizados para {stock_code} em {stock_data['data']}")
            else:
                # Inserir novo registro
                response = self.supabase.table(table_name).insert(stock_data).execute()
                logging.info(f"Novos dados inseridos para {stock_code} em {stock_data['data']}")
            
            return True
            
        except Exception as e:
            logging.error(f"Erro ao atualizar dados para {stock_code}: {e}")
            return False

    def run_daily_update(self):
        """Executar atualização diária de todos os ativos."""
        logging.info("Iniciando atualização diária de ações")
        
        # Obter lista de ativos
        stocks = self.get_active_stocks()
        
        success_count = 0
        total_count = len(stocks)
        
        for stock_code in stocks:
            try:
                logging.info(f"Processando {stock_code}...")
                
                # Obter dados da API
                stock_data = self.get_stock_data_from_api(stock_code)
                
                if stock_data:
                    # Atualizar no banco
                    if self.update_stock_data(stock_code, stock_data):
                        success_count += 1
                    
                # Aguardar entre requisições para evitar rate limiting
                time.sleep(1)
                
            except Exception as e:
                logging.error(f"Erro ao processar {stock_code}: {e}")
        
        logging.info(f"Atualização concluída: {success_count}/{total_count} ativos atualizados com sucesso")
        return success_count, total_count

def main():
    """Função principal."""
    try:
        updater = StockUpdater()
        success, total = updater.run_daily_update()
        
        if success == total:
            logging.info("Todos os ativos foram atualizados com sucesso!")
        else:
            logging.warning(f"Apenas {success} de {total} ativos foram atualizados")
            
    except Exception as e:
        logging.error(f"Erro fatal na execução: {e}")
        raise

if __name__ == "__main__":
    main()