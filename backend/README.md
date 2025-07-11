# Backend - Atualizador Automático de Ações

Este módulo é responsável pela coleta e atualização automática dos dados de ações no SupaBase.

## Configuração

1. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

2. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais do SupaBase
```

3. **Configure as credenciais do SupaBase:**
- `SUPABASE_URL`: URL do seu projeto SupaBase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role (com permissões de escrita)

## Uso

### Execução Manual
Para executar uma atualização única:
```bash
python stock_updater.py
```

### Execução Automática
Para manter o sistema rodando com atualizações automáticas:
```bash
python scheduler.py
```

O agendador está configurado para executar:
- Todos os dias às 18:30
- De segunda a sexta às 19:00 (backup)

## Funcionalidades

### StockUpdater
- Conecta ao SupaBase
- Obtém lista de ativos ativos
- Coleta dados via web scraping/API
- Atualiza tabelas no banco

### Scheduler
- Agendamento automático das atualizações
- Logs detalhados
- Tratamento de erros

## Estrutura dos Dados

Cada ativo tem sua tabela (`ativo_PETR4`, `ativo_VALE3`, etc.) com:
- `data` (DATE) - Data do pregão
- `abertura` (NUMERIC) - Preço de abertura
- `maxima` (NUMERIC) - Preço máximo
- `minima` (NUMERIC) - Preço mínimo
- `fechamento` (NUMERIC) - Preço de fechamento
- `volume` (NUMERIC) - Volume negociado

## Logs

Os logs são salvos em:
- `stock_updater.log` - Logs da atualização
- `scheduler.log` - Logs do agendador

## Produção

Para usar em produção:

1. **Substitua a geração de dados fictícios por uma API real:**
   - Yahoo Finance API
   - Alpha Vantage
   - IEX Cloud
   - Quandl

2. **Configure um serviço de sistema (systemd):**
```bash
sudo cp stock_scheduler.service /etc/systemd/system/
sudo systemctl enable stock_scheduler
sudo systemctl start stock_scheduler
```

3. **Configure monitoramento e alertas para falhas**

## Troubleshooting

- Verifique as credenciais do SupaBase
- Confirme que as tabelas existem no banco
- Verifique os logs para detalhes dos erros
- Teste a conectividade com a API de dados