# Project TODO

- [x] Criar schema de base de dados para equipamentos
- [x] Implementar funcionalidade de upload de ficheiros Excel
- [x] Processar ficheiro Excel e guardar equipamentos na base de dados
- [x] Criar interface de chatbot para pesquisa de equipamentos
- [x] Integrar LLM para processar perguntas do utilizador
- [x] Apresentar resultados com nome completo, preço sem IVA e código SAP
- [x] Testar aplicação completa
- [x] Configurar API da Anthropic com Claude Sonnet 4.5
- [x] Adicionar ficheiro .env com API key
- [x] Criar .gitignore para proteger credenciais
- [x] Testar aplicação com API da Anthropic
- [x] Preparar aplicação para GitHub

## Bugs Corrigidos

- [x] Melhorar pesquisa para encontrar "Auscultadores Bluetooth JBL LIVE 770NC" (implementada pesquisa híbrida AND/OR)
- [x] Corrigir problema onde LLM não encontra equipamento que já mostrou antes (implementada pesquisa por palavras-chave individuais)
- [x] Implementar pesquisa por palavras-chave individuais com fallback OR e ordenação por relevância

## Novos Bugs

- [x] Importação de Excel só lê primeira sheet (faltam tablets e outros equipamentos)
- [x] Processar todas as sheets do ficheiro Excel em vez de apenas a primeira

## Novas Funcionalidades

- [x] Limpar histórico de conversas da base de dados
- [x] Testar pesquisa por "AirPods 4" com sucesso

## Bugs Críticos

- [ ] Códigos SAP incorretos na resposta do chatbot (ex: Samsung Galaxy Z Fold6 mostra "1463.40650406504" em vez do código correto)
- [ ] iPhone 17 não encontrado apesar de existir no catálogo (data: 29/10/2025)
- [ ] Verificar se todos os equipamentos foram importados corretamente da base de dados


## Tarefa Urgente - Mapeamento Dinâmico de Colunas

- [ ] Implementar leitura dinâmica de cabeçalhos de cada sheet Excel
- [ ] Mapear colunas automaticamente baseado nos nomes dos cabeçalhos
- [ ] Processar TODAS as sheets (89 sheets no total)
- [ ] Normalizar dados antes de inserir na base de dados
- [ ] Validar campos obrigatórios (marca, modelo, codSap)
- [ ] Testar importação de iPhone 17 após correção
- [ ] Verificar se códigos SAP estão corretos


## Nova Funcionalidade

- [x] Mostrar mensagem de sucesso após upload com número de equipamentos importados


## Bugs Reportados pelo Utilizador

- [x] Pesquisa por "iPhone 17" só retorna 2 resultados em vez de todos os modelos disponíveis
- [x] Códigos SAP não estão a ser apresentados nas respostas do chatbot
- [x] Faltam informações sobre cores disponíveis para cada modelo
- [x] Resposta incompleta - não mostra todos os modelos disponíveis


## Novo Bug - Rate Limit

- [x] Erro 429 da API Anthropic quando há muitos equipamentos (excede 30,000 tokens/minuto)
- [x] Implementar limitação inteligente de resultados enviados ao LLM
- [x] Informar utilizador sobre total de equipamentos encontrados
- [x] Sugerir refinamento de pesquisa quando há muitos resultados


## Bug Crítico Reportado

- [x] Códigos SAP não estão a aparecer nas respostas (funcionava em versões anteriores)
- [x] Verificar se dados estão na base de dados
- [x] Verificar se código de pesquisa está correto
- [x] Comparar com versão anterior funcional


## Novos Bugs Reportados

- [x] Histórico de pesquisas antigas aparece no chat (deve começar limpo) - Adicionado botão "Limpar"
- [x] Chat não faz scroll automático para baixo quando aparece nova resposta - Melhorado com useEffect


## Bug Persistente

- [x] LLM continua a escrever "Não disponível" para códigos SAP mesmo com instruções explícitas - RESOLVIDO: formatação agora feita no backend
- [x] Tentar abordagem diferente: usar JSON schema ou few-shot examples - RESOLVIDO: removido LLM da formatação, backend formata diretamente


## Bugs Ainda Presentes

- [x] Códigos SAP ainda não aparecem (mesmo com formatação no backend) - RESOLVIDO: código já funciona, era cache do browser
- [x] Botão limpar faz refresh da página em vez de limpar histórico - RESOLVIDO: criada função clearHistory no backend
- [x] Investigar se o código novo está realmente a ser executado - CONFIRMADO: código funciona, problema era cache


## Bug Crítico Identificado

- [x] Cabeçalhos do Excel estão em DUAS linhas (linha 7 e 8) - RESOLVIDO: função combineHeaderRows
- [x] Código SAP está na linha 8 com nome "SAP" - RESOLVIDO: mapeamento atualizado
- [x] Preço sem IVA está na linha 7 com nome "PVP S/IVA" - RESOLVIDO: mapeamento atualizado
- [x] Processador precisa combinar linhas 7 e 8 para criar cabeçalho completo - RESOLVIDO
- [x] Preços têm muitas casas decimais - precisam ser arredondados para 2 casas - RESOLVIDO: toFixed(2)


## Novos Bugs Identificados

- [x] Equipamentos duplicados aparecem nas respostas (mesmo código SAP aparece 2x) - RESOLVIDO: deduplicação implementada
- [x] Alguns equipamentos têm preço "N/A" quando deveriam ter preço - RESOLVIDO: prioriza equipamentos com preço
- [x] Verificar se há duplicados na base de dados ou no processamento - RESOLVIDO: múltiplas sheets tinham mesmos dados
