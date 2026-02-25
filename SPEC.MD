# Technical Specification Document (SPEC) - Portal LexOnline

## 1. Visão Geral da Arquitetura
O sistema adota uma arquitetura do tipo SPA (Single Page Application) com Backend for Frontend (BFF).
*   **Repositório:** Monorepo abrigando Frontend (React) e Backend (Node.js).
*   **Modelo de Implantação:** Serverless + Cloud Functions + Banco de Dados Geograficamente Distribuído (Edge).

## 2. Pilha Tecnológica (Tech Stack)

### 2.1. Frontend
*   **Framework Principal:** React 19 (via ESM imports map e Vite 6).
*   **Linguagem:** TypeScript.
*   **Estilização:** Tailwind CSS (Utilitário), Fontes Inter.
*   **Ícones:** Lucide React e Ionicons.
*   **Gráficos:** Recharts.
*   **Apoio a Documentos:** jsPDF, html2canvas, QRCode.
*   **Roteamento:** Estado via React State (app view state).
*   **Hospedagem:** Firebase Hosting (Google Cloud CDN).

### 2.2. Backend
*   **Plataforma Base:** Node.js (Ambiente Serverless Firebase Cloud Functions 2nd Gen / Cloud Run).
*   **Framework Web:** Express.js.
*   **Linguagem:** TypeScript (compilado via `tsc`).
*   **Protocolo:** RESTful API acessada via túnel de rewrite (`/api/**`).
*   **Envio de Emails:** Resend API.
*   **Autenticação:** JSON Web Token (JWT) + Gerenciamento de Sessão por Cookies HTTP Only + SameSite (Secure).
*   **Gerenciador de Segredos:** Google Secret Manager (via integração Firebase API).

### 2.3. Banco de Dados
*   **Sistema Relacional:** PostgreSQL.
*   **Infraestrutura:** Neon.tech (Banco de dados escalável e nativo para serverless - SaaS).
*   **Cliente SQL:** `pg` (com Node.js connection pooling).
*   **Migração de Esquema:** Scripts manuais iterados durante a inicialização (`CREATE TABLE IF NOT EXISTS`).

## 3. Modelo de Dados (Database Schema principal)
1.  **`users`**: Contém o acesso do usuário, senhas (bcrypt hashes), links com perfis, token de plano.
2.  **`company_profiles`**: Identidade do advogado, logotipo, endereço, para geração das calculadoras personalizadas.
3.  **`leads`**: Pessoas que usaram a ferramenta na ponta (clientes do advogado). Contém dados de contato e valor calculado estimado.
4.  **`pipelines` & `pipeline_stages`**: Estrutura de Kanban que segmenta os leads. Etapas (novo, em andamento, ganho, perdido).
5.  **`banners` & `cards`**: Metadados de artes gráficas baseadas no perfil do cliente.

## 4. Segurança e Privacidade
*   O back-end define políticas rígidas de CORS e usa `helmet` para proteção de cabeçalhos.
*   Cookies JWT (`lexonline_session`) com as flags `httpOnly: true`, `secure: true`, e `sameSite: 'none'` ativam roteamento seguro Cross-Domain caso invocado externamente, porém configurado hoje como Same-Origin via Rewrites (`/api`).
*   Injeção de variáveis de banco e senhas (`DATABASE_URL`, `JWT_SECRET`) feitas estritamente pelo ambiente de nuvem e não em código-fonte.
*   Senhas armazenadas com salt dinâmico via bcrypt.

## 5. Deployment Flow (CI/CD)
*   **Build Frontend:** `npm run build` cria bundle minimizado com Vite na pasta `/dist`.
*   **Build Backend:** `tsc` transpila código para JavaScript em `/server/dist`.
*   **Integração de Rota (Rewrite):** Firebase CLI intercepta a URL `/api/*` da SPA e repassa a requisição HTTP local (Serverless Function ID `api` no Cloud Run).
*   **Comando de Deploy Final:** `npx firebase-tools deploy` ou por módulos segregados (hosting, functions).

## 6. Endpoints Críticos (API)
*   `POST /api/auth/login`: Autenticação e definição de cookie.
*   `GET /api/auth/me`: Verificação rápida (Healthcheck) do escopo do cookie e perfil.
*   `GET/POST/PUT /api/leads`: CRUD central da máquina de leads.
*   `GET/POST/PUT /api/pipelines`: CRUD das colunas do Kanban.
*   `GET /api/calculator/config`: Retorna parâmetros legais/tabelas para o cálculo do ano corrente.

## 7. Diretrizes de Arquitetura Limpa
O app é dividido separando a lógica de negócios da interface. Os arquivos no frontend em `/services` atuam como o contrato exclusivo de chamadas para a API (e o fechamento de estado via Promises encapsuladas como `export const dealsApi`), impedindo importações e buscas aleatórias dentro dos componentes de interface React em `/components`.
No Node, os `controllers` conversam com a camada global de acesso `db.ts` enquanto o `index.ts` manipula puramente os middlewares de rede (CORS, Express, Helmet, BodyParser).
