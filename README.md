# Sistema de Análise Probabilística de Ações

Uma aplicação web completa para análise probabilística de mercado de ações, permitindo simulação de estratégias de compra e venda baseadas em dados históricos.

## 🚀 Funcionalidades

### Frontend
- **Interface Interativa**: Painel intuitivo para configuração de estratégias
- **Análise Probabilística**: Simulação de operações com dados históricos
- **Visualização de Dados**: Gráficos interativos com Chart.js
- **Relatórios Detalhados**: Tabelas com métricas completas de performance
- **Exportação**: Download de relatórios em CSV
- **Design Responsivo**: Interface otimizada para todos os dispositivos

### Backend
- **Atualização Automática**: Script Python para coleta diária de dados
- **Web Scraping**: Integração com APIs de mercado financeiro
- **Agendamento**: Sistema automatizado para execução em horários específicos
- **Logs Detalhados**: Monitoramento completo das operações

### Banco de Dados
- **SupaBase**: Banco PostgreSQL na nuvem
- **Estrutura Otimizada**: Tabelas separadas por ativo
- **Segurança**: Row Level Security (RLS) configurado
- **Performance**: Índices otimizados para consultas rápidas

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS + Chart.js
- **Backend**: Python + SupaBase
- **Banco**: PostgreSQL (SupaBase)
- **Deploy**: Vite + Netlify
- **Automação**: Schedule + Cron

## 📊 Métricas Calculadas

- **Total de Operações**: Contagem de gatilhos acionados
- **Taxa de Acerto**: Percentual de operações lucrativas
- **Ganho Máximo**: Melhor resultado individual
- **Ganho Médio**: Média dos resultados positivos
- **Max Drawdown**: Maior perda potencial
- **Resultado Acumulado**: Soma de todos os resultados
- **Volume Médio**: Média do volume nas operações

## 🚀 Como Começar

### 1. Configuração do SupaBase

1. Clique em "Connect to Supabase" no canto superior direito
2. Crie um novo projeto ou use um existente
3. As tabelas serão criadas automaticamente

### 2. Configuração do Backend (Opcional)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configure suas credenciais do SupaBase no .env
python stock_updater.py  # Execução manual
python scheduler.py      # Execução automática
```

### 3. Uso da Interface

1. **Configure os Parâmetros**:
   - Selecione os ativos (ou deixe vazio para todos)
   - Escolha o tipo de operação
   - Defina a porcentagem de gatilho
   - Configure as referências de entrada e saída

2. **Execute a Análise**:
   - Clique em "Executar Análise"
   - Visualize os resultados nos gráficos
   - Analise a tabela detalhada

3. **Exporte os Resultados**:
   - Use o botão "Exportar CSV" para salvar os dados

## 📈 Estratégias Suportadas

### Tipos de Operação
- **Compra**: Detecta oportunidades de alta
- **Venda**: Detecta oportunidades de baixa

### Referências de Entrada
- Fechamento do dia anterior
- Máxima do dia anterior
- Mínima do dia anterior
- Abertura do dia anterior
- Abertura de hoje

### Referências de Saída
- Máxima do dia
- Fechamento do dia

## 🔧 Configuração Avançada

### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Estrutura do Banco
```sql
-- Tabela de configuração
ativos_config (id, codigo, nome, ativo, created_at)

-- Tabelas de dados (uma por ativo)
ativo_PETR4 (data, abertura, maxima, minima, fechamento, volume)
ativo_VALE3 (data, abertura, maxima, minima, fechamento, volume)
```

## 📱 Responsividade

- **Mobile**: Layout otimizado para smartphones
- **Tablet**: Interface adaptada para tablets
- **Desktop**: Experiência completa em telas grandes

## 🔒 Segurança

- **RLS Habilitado**: Row Level Security em todas as tabelas
- **Políticas de Acesso**: Controle granular de permissões
- **Variáveis Seguras**: Credenciais via variáveis de ambiente

## 📊 Dashboard

O sistema inclui um dashboard completo com:
- Resumo geral das análises
- Gráficos comparativos
- Métricas de performance
- Histórico de operações

## 🚀 Deploy

A aplicação está configurada para deploy automático no Netlify via Vite build.

## 📝 Logs e Monitoramento

O backend inclui sistema completo de logs:
- Logs de atualização diária
- Logs do agendador
- Tratamento de erros
- Métricas de sucesso

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é licenciado sob a MIT License.

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato.

---

**Desenvolvido com ❤️ para análise profissional de ações**