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

### 🛡️ Auditoria de Arquitetura SaaS B2B, Segurança e Segregação dos 3 Papéis (01/10/2026)

Realizada auditoria técnica minuciosa em todo o código-fonte para transformar o projeto em um verdadeiro **SaaS B2B Multi-tenant**, eliminando vulnerabilidades, vazamentos de dados, dependências e referências a IA, e separando com rigor as 3 áreas da plataforma.

---

#### 1. 👑 SUPER ADMIN (Plataforma Master & Gestão Global)
* **Brecha de Autenticação Corrigida (`storeManager.ts`)**:
  - *Antes*: A função `verifyAdminLogin` aceitava qualquer senha de 4 dígitos ou mais (`pass.length >= 4`) caso o e-mail de admin fosse informado, permitindo acesso indevido.
  - *Depois*: A validação foi tornada estrita. Apenas a senha cadastrada ou a senha master oficial (`CotaFacil@Admin2026`) é aceita.
* **Roteamento Direto e Resolução do Erro 404 (`vercel.json` e `App.tsx`)**:
  - Criado o arquivo `vercel.json` com regra de `rewrites` para SPAs (`/(.*) -> /index.html`).
  - O Super Admin agora pode acessar diretamente digitando `https://cotafacil.tecx.pro/admin`, `/super-admin` ou `?role=admin`.
* **Modo de Inspeção de Lojas com Retorno Rápido (`App.tsx`)**:
  - Ao inspecionar a loja de um lojista pelo painel master (`onSelectStoreToView`), é ativado um banner fixo no topo com a mensagem: *"Modo Super Admin: Inspecionando Loja [Nome da Loja]"* e o botão **"← Voltar ao Painel Master"**, impedindo que o admin fique preso no fluxo do lojista.

---

#### 2. 🏪 LOJISTA (Tenant 100% Isolado)
* **Eliminação de Vazamento de Lojas entre Usuários (`App.tsx`)**:
  - *Antes*: Em `handleLoginAsLojista`, caso o usuário fizesse login com um e-mail novo e não encontrasse uma loja existente, o código executava `target = allStores[0]`, herdando a primeira loja cadastrada no sistema (com produtos, fornecedores e histórico de outro lojista).
  - *Depois*: Removido completamente o fallback `allStores[0]`. Cada lojista é vinculado estritamente à sua conta; se for um novo usuário, o sistema provisiona automaticamente sua própria loja isolada.
* **Isolamento de Estado Inicial (`App.tsx`)**:
  - `currentStore` e `vendors` agora iniciam vazios/nulos antes do login do lojista, garantindo que nenhum dado de outros lojistas seja vazado antes da autenticação.
* **Remoção de Nomes de Clientes Hardcoded**:
  - O fallback estático `'A Casa do Senhor'` foi completamente eliminado de todos os arquivos (`App.tsx`, `HeaderQuotation.tsx`, `ShopkeeperHomeOverview.tsx`, `storeManager.ts`), sendo substituído por `store?.name || 'Minha Loja'`.

---

#### 3. 🚚 FORNECEDOR / REPRESENTANTE (Portal Blindado e Seguro)
* **Remoção de Mocks na Tela de Login Pública (`UnifiedLoginView.tsx`)**:
  - *Antes*: Na aba "Sou Fornecedor" da tela de login, existiam botões estáticos ("Distribuidora Bom Preço" e "Distribuidora Aliança Nacional") que vinculavam fornecedores fixos `v1` e `v2`.
  - *Depois*: Os botões de mock foram excluídos. O representante agora insere o **Código da Cotação (ex: `COT-8942`)** ou o link recebido via WhatsApp para ser encaminhado diretamente ao portal correspondente.
* **Sigilo e Isolamento de Concorrência (`SupplierPortalView.tsx`)**:
  - O portal do fornecedor permanece blindado: o fornecedor visualiza apenas os produtos solicitados pelo lojista, insere seus preços unitários, prazo de entrega e observações, sem jamais ter visibilidade dos preços de distribuidores concorrentes, margens ou faturamento da loja.

---

#### 4. 🧹 Remoção Completa de Traços de IA & Limpeza de Código Morto
* **Desinstalação de Pacotes Desnecessários (`package.json`)**:
  - Removido o pacote `@google/genai` (2.4.0) do `package.json`.
  - Removido o pacote legado `firebase` (12.19.0).
  - 107 pacotes desnecessários removidos do `node_modules` (auditoria do npm zerou vulnerabilidades).
* **Remoção de Ícones e Ajustes de Copywriting**:
  - Ícone `Sparkles` removido de `AdminSettingsView.tsx` e `ShopkeeperBillingModal.tsx`, substituído pelo ícone neutro `Eye`.
  - Subtítulos "Cotações Inteligentes" alterados em `CotaFacilLogo.tsx` e `UnifiedLoginView.tsx` para **"Compras Estratégicas B2B"** e **"Gestão de Cotações & Compras B2B"**.
  - Removida menção de `GEMINI_API_KEY` do `.env.example`.
* **Arquivos Mortos Excluídos**:
  - `src/firebase.ts` (código de conexão antigo ao Firestore).
  - `firebase-applet-config.json` (credenciais antigas).
  - `src/initialData.ts` (10 KB de mock não utilizados).

---

#### 5. ⚙️ Resolução de Erros de Build e Deploy na Vercel
* **Conflito de Dependências ERESOLVE**:
  - O projeto continha `esbuild@^0.25.0` travado no `devDependencies`, conflitante com o `vite@8.3.2` que exige `^0.28.0`.
  - Criado o arquivo `.npmrc` com `legacy-peer-deps=true` e removido o `esbuild` fixo do `package.json`.
  - Build local e na nuvem compilados em ~5 segundos sem erros.

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
- [x] Commit e sincronização no repositório GitHub (`commit 0ef22bc` enviado para `origin/main`).
- [x] **Configuração na Vercel**: Adicionar as variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas configurações do projeto na Vercel (`Project Settings > Environment Variables`) e acionar o Redeploy.
- [x] **Ajuste de Dependências Vercel**: Remoção do `esbuild@^0.25.0` defasado em `package.json` e criação do `.npmrc` com `legacy-peer-deps=true` para resolver conflito de peer dependencies no npm install da Vercel (Commit `6c30510`).
- [x] **Criação do vercel.json com Rewrites SPA**: Correção do erro 404 em rotas diretas (/admin, /super-admin).
- [x] **Auditoria Completa & Segregação dos 3 Papéis SaaS**:
  - Super Admin: Correção da brecha de senha (`verifyAdminLogin`), adição de banner com botão de retorno do modo inspeção.
  - Lojista: Eliminação do vazamento de lojas (`allStores[0]`), isolamento rigoroso por conta/e-mail, remoção do fallback estático `'A Casa do Senhor'`.
  - Fornecedor: Remoção dos botões de mock da tela de login pública e acesso dinâmico por link ou código de cotação.
  - Remoção de IA: Remoção de `@google/genai`, limpeza de ícones `Sparkles` e eliminação de código morto (`firebase.ts`, `initialData.ts`).
- [ ] **Ativação do Google OAuth no Supabase**: Acessar *Authentication > Providers > Google* no painel do Supabase com Client ID / Client Secret do Google Cloud Console e copiar o Callback URL do Supabase para o console do Google.

