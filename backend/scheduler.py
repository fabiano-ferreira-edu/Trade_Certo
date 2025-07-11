#!/usr/bin/env python3
"""
Agendador para execução automática do atualizador de ações.
Execute este script para manter a atualização automática rodando.
"""

import schedule
import time
import logging
from stock_updater import StockUpdater

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)

def scheduled_update():
    """Função que será executada no agendamento."""
    try:
        logging.info("Executando atualização agendada...")
        updater = StockUpdater()
        success, total = updater.run_daily_update()
        logging.info(f"Atualização agendada concluída: {success}/{total}")
    except Exception as e:
        logging.error(f"Erro na atualização agendada: {e}")

def main():
    """Configurar e executar o agendador."""
    # Agendar para executar todos os dias às 18:30 (após fechamento do mercado)
    schedule.every().day.at("18:30").do(scheduled_update)
    
    # Agendar também para executar de segunda a sexta às 19:00 como backup
    schedule.every().monday.at("19:00").do(scheduled_update)
    schedule.every().tuesday.at("19:00").do(scheduled_update)
    schedule.every().wednesday.at("19:00").do(scheduled_update)
    schedule.every().thursday.at("19:00").do(scheduled_update)
    schedule.every().friday.at("19:00").do(scheduled_update)
    
    logging.info("Agendador iniciado. Pressione Ctrl+C para parar.")
    logging.info("Próximas execuções agendadas:")
    for job in schedule.jobs:
        logging.info(f"  - {job}")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Verificar a cada minuto
    except KeyboardInterrupt:
        logging.info("Agendador interrompido pelo usuário")

if __name__ == "__main__":
    main()