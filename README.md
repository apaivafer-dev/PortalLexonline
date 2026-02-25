# LexOnline - Portal

Plataforma SaaS para advogados trabalhistas com calculadora de rescisão, CRM, criador de banners e cartões digitais.

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ instalado
- npm

### Opção 1 — Script Automático (Recomendado)
Dê dois cliques no arquivo **`start.bat`** na raiz do projeto.

Ele irá abrir duas janelas de terminal:
- Backend na porta **3001**
- Frontend na porta **3000**

### Opção 2 — Manualmente

**Terminal 1 — Backend:**
```bash
cd server
npx ts-node src/index.ts
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

## 🌐 URLs

| Serviço | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend API** | http://localhost:3001 |
| **API Health** | http://localhost:3001/api/health |

## 🔑 Credenciais de Acesso (Admin)

| Campo | Valor |
|-------|-------|
| Email | `apaivafer@gmail.com` |
| Senha | `admin123` |

## 🏗️ Estrutura do Projeto

```
PortalLexonline/
├── components/        # Componentes React (Frontend)
├── services/          # Camada de API (Frontend ↔ Backend)
│   └── api.ts         # Módulo central de comunicação HTTP
├── server/            # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── database/      # SQLite + Schema + Seed
│   │   ├── middleware/     # Auth JWT, Error Handler
│   │   ├── routes/        # Rotas da API
│   │   ├── types/         # Tipos TypeScript
│   │   ├── utils/         # JWT utils
│   │   └── index.ts       # Entry point
│   ├── .env               # Variáveis de ambiente do servidor
│   └── package.json
├── .env               # Variáveis de ambiente do frontend
├── App.tsx            # Componente principal (conectado à API)
├── types.ts           # Tipos compartilhados
├── start.bat          # Script de inicialização
└── package.json
```

## 🔐 Segurança Implementada

- ✅ Senhas hasheadas com **bcrypt** (custo 12)
- ✅ Autenticação via **JWT** (7 dias)
- ✅ Middleware de autenticação em todas rotas protegidas
- ✅ Middleware de autorização admin (`requireAdmin`)
- ✅ Isolamento de dados por usuário (`user_id` em todas queries)
- ✅ CORS configurado para origens específicas
- ✅ Foreign keys e WAL mode no SQLite
- ✅ Pipelines do sistema protegidos contra exclusão
- ✅ Admin não pode desativar própria conta

## 📡 API Endpoints

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET /api/auth/me` — Dados do usuário logado

### Leads (autenticado)
- `GET /api/leads` — Listar leads
- `POST /api/leads` — Criar lead
- `PUT /api/leads/:id` — Atualizar lead
- `DELETE /api/leads/:id` — Excluir lead

### Pipelines (autenticado)
- `GET /api/pipelines` — Listar pipelines
- `POST /api/pipelines` — Criar pipeline
- `PUT /api/pipelines/:id` — Atualizar pipeline
- `DELETE /api/pipelines/:id` — Excluir pipeline

### Usuário (autenticado)
- `GET /api/users/profile` — Perfil do usuário
- `PUT /api/users/profile` — Atualizar perfil
- `GET /api/users/company` — Perfil da empresa
- `PUT /api/users/company` — Atualizar empresa

### Admin (autenticado + admin)
- `GET /api/admin/users` — Listar todos usuários
- `GET /api/admin/stats` — Estatísticas da plataforma
- `PATCH /api/admin/users/:id/toggle-status` — Ativar/Desativar usuário
- `PATCH /api/admin/users/:id/plan` — Alterar plano do usuário
