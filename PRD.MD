# Product Requirements Document (PRD) - Portal LexOnline

## 1. Visão Geral do Produto
O **Portal LexOnline** é uma plataforma SaaS (Software as a Service) desenvolvida especificamente para advogados trabalhistas no Brasil. O objetivo principal é fornecer ferramentas de atração, captação e gestão de clientes (leads) através de recursos interativos, como uma Calculadora de Rescisão Trabalhista, combinada com um CRM integrado e ferramentas de marketing digital.

## 2. Público-Alvo
*   Advogados trabalhistas (autônomos ou escritórios).
*   Profissionais de RH que buscam ferramentas rápidas de cálculo e consulta.

## 3. Proposta de Valor
Facilitar a captação de clientes qualificados na área trabalhista oferecendo ferramentas úteis para o público final (que deseja saber seus direitos/cálculos), convertendo essas consultas em leads estruturados para o advogado.

## 4. Principais Funcionalidades (Features)

### 4.1. Autenticação e Gestão de Contas
*   Cadastro de novos usuários (Advogados/Escritórios).
*   Login seguro.
*   Recuperação de senha e confirmação de e-mail.
*   Gestão de perfis (Dados do usuário e dados do escritório).
*   Controle de planos de assinatura (Gerenciado pelo Admin).

### 4.2. Calculadora de Rescisão (Lead Magnet)
*   Calculadora trabalhista configurável pelo advogado.
*   Funciona como uma isca digital para capturar dados de contato do reclamante em potencial.
*   Geração de relatórios em PDF.

### 4.3. CRM e Gestão de Leads (Pipelines)
*   Visualização de leads capturados através da calculadora ou inseridos manualmente.
*   Gestão baseada em Kanban (Pipelines e Estágios).
*   Acompanhamento de status, valores estimados e anotações.

### 4.4. Ferramentas de Marketing
*   **Criador de Banners (Banner Creator):** Ferramenta para gerar artes padronizadas para redes sociais visando atrair tráfego para a calculadora.
*   **Cartão Interativo (Interactive Card):** Geração de cartão de visitas digital com links e QR Code.

### 4.5. Painel Administrativo (Admin Dashboard)
*   Visão global da plataforma exclusiva para administradores.
*   Gestão de usuários (bloqueio, ativação).
*   Alteração de planos de assinatura (Trial, Pro, Enterprise).
*   Métricas globais de uso.

## 5. Casos de Uso
1.  **Captação:** O advogado cria um link da sua calculadora personalizada, divulga no Instagram (usando banners gerados na plataforma), um trabalhador acessa, faz o cálculo, e os dados dele viram um "Lead" no painel do advogado.
2.  **Gestão:** O advogado acessa o portal, vê o novo lead, entra em contato e move o card no pipeline de "Novo Lead" para "Em Negociação".

## 6. Requisitos de Negócio
*   O sistema deve operar no modelo SaaS multiplataforma (Multi-tenant).
*   O sistema deve focar na experiência do usuário, priorizando carregamento rápido e design profissional (Tailwind css).
*   Deve possuir camadas de segurança robustas para os dados armazenados (LGPD).
