# Pesquisa de Equipamentos

Aplicação web para pesquisa de equipamentos empresariais através de chatbot com IA.

## Funcionalidades

- **Upload de ficheiros Excel** (.xlsm ou .xlsx) com catálogo de equipamentos
- **Processamento automático** dos dados para base de dados MySQL
- **Chatbot inteligente** powered by Claude Sonnet 4.5 (Anthropic)
- **Pesquisa avançada** com resultados detalhados:
  - Nome completo do equipamento
  - Preço sem IVA
  - Código SAP
  - Categoria e subcategoria
  - Compatibilidades
  - Garantia

## Tecnologias

### Frontend
- React 19
- Tailwind CSS 4
- Wouter (routing)
- shadcn/ui (componentes)
- tRPC (type-safe API)

### Backend
- Node.js + Express 4
- tRPC 11
- Drizzle ORM
- MySQL/TiDB
- Anthropic Claude Sonnet 4.5

### Processamento
- xlsx (leitura de ficheiros Excel)
- Pesquisa case-insensitive na base de dados

## Instalação

### Pré-requisitos

- Node.js 22+
- pnpm
- MySQL ou TiDB
- Conta Anthropic (para API key)

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/equipment-search-app.git
cd equipment-search-app
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:

Crie um ficheiro `.env` na raiz do projeto com as seguintes variáveis:

```env
# Anthropic API
ANTHROPIC_API_KEY=sua-api-key-aqui

# Base de Dados
DATABASE_URL=mysql://user:password@host:port/database

# JWT Secret
JWT_SECRET=seu-jwt-secret-aqui

# Aplicação
VITE_APP_TITLE=Pesquisa de Equipamentos
VITE_APP_LOGO=/logo.png
```

4. Execute as migrações da base de dados:
```bash
pnpm db:push
```

5. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
```

6. Aceda à aplicação em `http://localhost:3000`

## Uso

1. **Faça upload do ficheiro Excel** com os equipamentos na secção "Upload de Ficheiro"
2. **Aguarde o processamento** - a aplicação irá importar automaticamente os dados
3. **Use o chatbot** para pesquisar equipamentos:
   - "Preciso de um monitor Dell"
   - "Quero um teclado"
   - "Mostrar-me portáteis Lenovo"

## Estrutura do Ficheiro Excel

O ficheiro Excel deve conter as seguintes colunas:

- **Nome**: Nome completo do equipamento
- **Categoria**: Categoria principal
- **Subcategoria**: Subcategoria do produto
- **Código SAP**: Código único SAP
- **Preço sem IVA**: Preço sem IVA em euros
- **Compatibilidades**: Especificações técnicas
- **Garantia**: Período de garantia

## Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Build para produção
pnpm start        # Inicia servidor de produção
pnpm db:push      # Aplica schema à base de dados
pnpm db:studio    # Abre interface visual da BD
```

## Estrutura do Projeto

```
equipment-search-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Configuração tRPC
├── server/                # Backend Express
│   ├── _core/            # Core do servidor
│   │   └── llm.ts        # Integração Anthropic
│   ├── db.ts             # Queries da base de dados
│   └── routers.ts        # Routers tRPC
├── drizzle/              # Schema da base de dados
│   └── schema.ts
└── shared/               # Tipos partilhados
```

## Configuração da API Anthropic

A aplicação usa o modelo **Claude Sonnet 4.5** (`claude-sonnet-4-20250514`) da Anthropic.

Para obter uma API key:
1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com)
2. Navegue para "API Keys"
3. Crie uma nova chave
4. Adicione ao ficheiro `.env`

## Segurança

⚠️ **Importante:**
- Nunca faça commit do ficheiro `.env` para o repositório
- O ficheiro `.gitignore` já está configurado para proteger credenciais
- Use variáveis de ambiente em produção

## Licença

MIT

## Autor

Desenvolvido com ❤️ usando Manus AI
