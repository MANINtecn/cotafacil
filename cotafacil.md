# 📋 COTA FÁCIL - DIÁRIO DE DESENVOLVIMENTO & ARQUITETURA
**TECX SOFTHOUSE**

---

## 📌 1. Visão Geral do Projeto
* **Nome**: Cota Fácil (SaaS B2B de Gestão de Cotações e Otimização de Compras)
* **Repositório**: `https://github.com/MANINtecn/cotafacil.git`
* **Stack**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Motion
* **Deploy**: Vercel

---

## 📅 Registro - 01/10/2026

### 🔄 Decisão Estratégica de Arquitetura: Migração do Firebase para Supabase

#### 1. Contexto e Problema Identificado
* O projeto originalmente continha configurações vinculadas ao Firebase no projeto `papaleguastoc` (`firebase-applet-config.json`).
* Ao realizar o deploy na Vercel, o login Google disparou o erro de segurança `auth/unauthorized-domain` pela ausência de autorização do domínio da Vercel.
* Foi realizada uma análise técnica e financeira do modelo de negócios SaaS B2B para o Cota Fácil.

#### 2. Motivos da Migração para o Supabase
* **Risco de Custos no Firebase (Firestore)**: O Firestore cobra por operações unitárias de leitura e escrita (Read/Write). Em um fluxo de cotações simultâneas com dezenas de produtos e fornecedores cotando com atualização em tempo real (`onSnapshot`), o limite de 50.000 leituras/dia do plano gratuito do Firebase seria atingido rapidamente com poucos lojistas ativos, gerando faturas variáveis e imprevisíveis.
* **Previsibilidade e Economia no Supabase**:
  * O Supabase oferece um banco relacional **PostgreSQL dedicado de 500 MB** no plano gratuito.
  * Por ser um sistema de dados textuais e numéricos (produtos, preços, cotações, faturas), 500 MB suporta centenas de milhares de registros sem custo.
  * **Consultas ilimitadas**: Não há cobrança por `SELECT` individual.
  * Suporta até 50.000 usuários ativos mensais (MAU) e conexões Realtime nativas gratuitas.
* **Poder Relacional (PostgreSQL)**:
  * Agregações, ranking do menor preço por fornecedor e relatórios de economia gerada para o lojista são facilmente executados via queries SQL (`JOIN`, `GROUP BY`), enquanto no NoSQL do Firestore exigiriam estruturas complexas ou funções em nuvem adicionais.
* **Isolamento de Infraestrutura**:
  * Desacoplamento total do Cota Fácil em relação à infraestrutura de outros projetos da software house (como o Papaléguas), garantindo independência técnica, faturas separadas e conformidade.

#### 3. Dados de Acesso & Infraestrutura Supabase
* **E-mail da Conta Supabase**: `thtecx@gmail.com`
* **Project ID**: `yidgipbzxsknauvolhre`
* **API URL**: `https://yidgipbzxsknauvolhre.supabase.co`
* **Domínios configurados**: `https://cotafacil.tecx.pro` e `https://cotafacil.tecx.pro/**`
* **Status**: Script DDL/SQL executado com sucesso no Supabase. Integração completa do SDK `@supabase/supabase-js`, variáveis `.env`, rotinas de autenticação, tempo real e persistência finalizadas e validadas em build de produção.

---

## 🎯 Próximos Passos (Roadmap)
- [x] Clone e configuração local do repositório `MANINtecn/cotafacil`.
- [x] Diagnóstico do erro de autenticação e análise de viabilidade de custos.
- [x] Criação do Diário de Bordo (`cotafacil.md`) e registro da mudança de arquitetura.
- [x] Execução do script DDL/SQL no painel do Supabase sob a conta `thtecx@gmail.com`.
- [x] Configuração de URLs e redirecionamentos (`cotafacil.tecx.pro`) no Supabase Auth.
- [x] Configuração do client `@supabase/supabase-js`, variáveis `.env` e `.env.example`.
- [x] Adaptação completa dos fluxos de login com Google e telas de cotação/pedidos para o Supabase.
- [x] Teste de build de produção (`npm run build`) validado com sucesso sem erros.
- [ ] Ativação do Google OAuth em *Sign In / Providers* no painel do Supabase com Client ID / Secret.

