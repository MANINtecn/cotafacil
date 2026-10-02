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

## 📅 Registro - 02/10/2026

### 📜 Regra de Ouro TECX: Registro Rigoroso no Diário de Bordo
* **Diretriz Absoluta**: Toda melhoria, refatoração, ajuste de fluxo, correção de bugs, alterações de links/rotas e novas funcionalidades **DEVEM** ser registradas detalhadamente e de forma clara neste documento (`cotafacil.md`).
* **Objetivo**: Garantir rastreabilidade técnica total, transparência das decisões de arquitetura e histórico contínuo para manutenção e escalabilidade da plataforma.

---

### 🛡️ 1. Termos de Uso de Dados dos Fornecedores, Privacidade e LGPD
* **Contexto**: Para futuras parcerias comerciais, match regional de cotações e indicação de novos lojistas parceiros aos fornecedores cadastrados na plataforma.
* **Implementação**:
  - Adicionado checkbox de consentimento expresso e obrigatório no portal do fornecedor (`SupplierPortalView.tsx`).
  - Criado o modal `DataTermsModal` com explicação transparente, didática e em conformidade com a LGPD sobre a finalidade da coleta de dados (nome, empresa, telefone, histórico de atendimento).
  - O fornecedor tem clareza de que seus dados de contato podem ser promovidos para novos lojistas da sua região, impulsionando suas vendas.

---

### 🍪 2. Banner e Modal de Gestão de Cookies e Armazenamento Local
* **Implementação**:
  - Desenvolvido o componente `CookieConsentModal.tsx` integrado no rodapé da aplicação.
  - Explicação 100% amigável de que a plataforma utiliza armazenamento local seguro (`localStorage`) e cookies essenciais para manter o lojista conectado, preservar rascunhos de cotação e garantir máxima velocidade em conexões móveis fracas.
  - Opções claras de "Entendido / Aceitar" e link para consultar os detalhes de privacidade.

---

### 💾 3. Rascunhos Persistentes de Cotação (Auto-Save & Recuperação Automática)
* **Problema Resolvido**: Lojistas perdiam listas longas caso o celular descarregasse, o navegador fosse fechado acidentalmente ou houvesse oscilação de sinal.
* **Implementação**:
  - Criadas as funções `saveQuotationDraft`, `getQuotationDraft` e `clearQuotationDraft` em `storeManager.ts`.
  - Salvamento contínuo e silencioso a cada produto adicionado ou editado no `LaunchQuotationView.tsx`.
  - Ao reabrir a tela de lançamento, se houver um rascunho salvo, o app exibe um card de alerta destacado: *"Rascunho recuperado automaticamente"*, com botão para continuar de onde parou ou descartar com 1 clique.

---

### 📱 4. Visualização Responsiva de Produtos no Mobile
* **Problema Resolvido**: Em telas de smartphones (360px - 414px), os nomes dos produtos eram cortados ou esmagavam os campos de quantidade e botões de ação.
* **Implementação**:
  - Reestruturação do layout dos itens na lista de lançamento em `LaunchQuotationView.tsx`.
  - O título e descrição do produto agora ocupam uma linha inteira destacada no topo do card, sem corte de texto (`break-words`).
  - Os seletores de quantidade, unidade e o botão de exclusão foram organizados em uma sub-barra inferior compacta e ergonômica para toque com o polegar.

---

### 💵 5. Higienização de Valores Monetários (Ponto virando vírgula)
* **Problema Resolvido**: No teclado numérico de vários celulares Android/iOS, o usuário digitava ponto em vez de vírgula (ex: `10.50`), o que em alguns parsers inflacionava o número (ex: virava `1050` ou milhão), distorcendo totalmente a proposta.
* **Implementação**:
  - Criadas as funções utilitárias `sanitizeCurrencyInput` e `parseCurrencyValue` em `storeManager.ts`.
  - Se o fornecedor ou lojista digitar ponto, o caractere é instantaneamente convertido em vírgula no campo.
  - O cálculo do total e do pedido mínimo calcula os decimais com precisão matemática em centavos.

---

### 📦 6. Catálogo Fixo de Produtos da Loja (Persistência & Combobox)
* **Problema Resolvido**: Toda cotação obrigava o lojista a digitar os nomes dos mesmos produtos repetidamente (arroz, feijão, óleo, etc.).
* **Implementação**:
  - Criado o componente `ManageProductsModal.tsx` acessível pelo menu superior do lojista.
  - Implementado combobox com auto-complete no campo de nome do produto no lançamento de cotação.
  - Adicionado toggle: *"Salvar novos produtos automaticamente no catálogo fixo da loja"*.
  - Exibição de métrica de "Itens no Catálogo" no card de resumo da loja.

---

### 🚨 7. Correção Crítica: Recebimento de Propostas de Múltiplos Fornecedores Simultâneos
* **Diagnóstico Profundo do Problema**:
  - Quando 2 fornecedores recebiam a mesma cotação e enviavam suas propostas, apenas o 1º chegava para o lojista.
  - Motivo 1: O payload codificado no link (`dParam`) continha apenas os dados daquele fornecedor isolado, sobrescrevendo a lista de `vendors` para apenas 1 elemento e resetando o objeto `prices`.
  - Motivo 2: `handleSupplierSubmitProposal` dependia de um `selectedVendorId` solto no estado em vez de receber o fornecedor concreto.
  - Motivo 3: Na persistência, o sistema fazia `.map` na lista existente; se o segundo fornecedor não constasse no array inicial do cliente, ele era descartado.
  - Motivo 4: A tabela `quotations` no Supabase não continha a coluna `bundle jsonb` e regras RLS bloqueavam inserções de usuários anônimos.
* **Solução Completa Implementada**:
  - **Preservação de Múltiplos Fornecedores**: O payload da cotação agora transporta o array `allV` com todos os fornecedores convidados.
  - **Identificação Estrita**: O envio da proposta transmite explicitamente o objeto do fornecedor submetente (`vendor`).
  - **Merge Aditivo**: Se o fornecedor submetente não estiver na lista base do receptor, ele é anexado dinamicamente (`[...baseVendors, submittingVendor]`).
  - **Sincronização Mágica via WhatsApp (1-Tap Sync)**: A mensagem gerada ao fornecedor no botão *"Avisar o Lojista no WhatsApp Agora"* inclui link com payload instantâneo (`?importProp=...`). Ao tocar no link, o lojista tem os preços daquele fornecedor injetados na hora mesmo sem internet prévia.
  - **Polling Fallback**: Adicionado ciclo de polling a cada 7 segundos para garantir atualização em tempo real caso WebSockets sejam bloqueados em conexões móveis.
  - **Script DDL Supabase**: Criado `supabase_fix_multi_vendor.sql` com adição de `bundle jsonb`, remoção de bloqueio de RLS e publicação Realtime.

---

### 🔗 8. Links Curtos, Limpos e Elegantes (Slug de Loja + Slug de Fornecedor + Código da Lista)
* **Problema Identificado**:
  - Os links de cotação enviados aos fornecedores no WhatsApp continham strings base64 enormes (`?d=...`) e múltiplos parâmetros de query string, gerando mensagens poluídas e links com mais de 1.000 caracteres.
  - O lojista gera múltiplas cotações e precisa de diferenciação por lista para o mesmo fornecedor.
* **Formato Arquitetado e Implementado**:
  ```text
  cotafacil.tecx.pro/[slug-da-loja]/[slug-do-fornecedor]/[codigo-da-cotação]
  ```
  - **Exemplo Real**: `cotafacil.tecx.pro/thtecx/ferrrominas/cot9345`
  - Tamanho médio do link: ~50 caracteres (redução de 95% no comprimento!).
* **Detalhes Técnicos da Implementação**:
  1. **Utilitário `slugify` (`storeManager.ts`)**:
     - Converte nomes como *"Distribuidora Bom Preço"* para `distribuidora-bom-preco` e nomes de lojas para slugs amigáveis.
  2. **Gerador `buildSupplierQuotationLink` (`storeManager.ts`)**:
     - Retorna `${origin}/${storeSlug}/${vendorSlug}/${codeSlug}` sem nenhuma query string desnecessária.
     - O código da lista é sanitizado para minúsculas sem pontuação (ex: `COT-9345` ➔ `cot9345`).
  3. **Roteamento SPA em 3 Níveis (`App.tsx`)**:
     - Extrai `segments[0]` (loja), `segments[1]` (fornecedor) e `segments[2]` (código da cotação).
     - Identifica e pré-seleciona o fornecedor ativo pelo slug da distribuidora (`slugify(company)`).
     - Carrega a tela do portal do fornecedor já apontando para a cotação e distribuidora corretas.
  4. **Busca Flexível e Resiliente no Supabase & LocalStorage (`supabase.ts` e `storeManager.ts`)**:
     - `getQuotationFromSupabase`: Realiza busca inteligente comparando tanto o formato limpo (`cot9345`) quanto as variações com traço (`COT-9345` e `COT9345`), garantindo carregamento instantâneo em qualquer navegador.
     - `subscribeToQuotationRealtime`: Normaliza o canal Realtime para escutar atualizações da cotação independente da formatação do código.
     - `getActiveQuotationBundle`: Faz cache local duplo (com código original e slug limpo), garantindo abertura imediata.

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
- [x] **Features & Melhorias Estratégicas B2B (02/10/2026)**:
  - **Termos de Uso de Dados dos Fornecedores & LGPD**: Adicionado consentimento obrigatório e modal explicativo de privacidade para armazenamento e futura indicação/match regional com novos lojistas parceiros.
  - **Banner e Modal de Cookies**: Exibição elegante e explicação 100% didática sobre como cookies e localStorage mantêm autenticação, performance e rascunhos persistentes sem perda de dados.
  - **Rascunhos Persistentes de Cotação (Auto-save)**: Salvamento contínuo em tempo real. Se o app for fechado ou o celular desligar, ao retornar os produtos e detalhes são recuperados automaticamente com opção de descarte.
  - **Visualização Responsiva de Produtos no Mobile**: Reestruturação dos itens de cotação em telas móveis, garantindo que o nome do produto apareça 100% completo, sem corte ou compressão visual, com controles compactos de quantidade e exclusão.
  - **Higienização de Valores Monetários (Ponto virando vírgula)**: Implementadas funções `sanitizeCurrencyInput` e `parseCurrencyValue`, convertendo qualquer ponto digitado para vírgula e impedindo cálculos inflacionados (ex: 100.50 virando milhão).
  - **Catálogo Permanente de Produtos do Lojista**: Criado `ManageProductsModal`, seletor rápido (combobox) no lançamento de cotação, opção de salvar produtos automaticamente no catálogo fixo da loja e métricas no painel.
- [x] **Correção Crítica: Chegada de Propostas de Múltiplos Fornecedores (02/10/2026)**:
  - **Diagnóstico do Problema**: Quando 2 ou mais fornecedores recebiam a lista e enviavam suas propostas, apenas o 1º chegava para o lojista porque:
    1. O link do fornecedor (`dParam`) continha apenas os dados daquele fornecedor isolado, e ao abrir o link o sistema recriava a lista sobrescrevendo o array `vendors` para conter apenas 1 fornecedor e zerava `prices: {}`.
    2. A função `handleSupplierSubmitProposal` não recebia o objeto `vendor` do formulário, dependendo do estado solto `selectedVendorId`.
    3. Ao salvar a proposta, o código fazia `.map` sobre os fornecedores existentes, nunca adicionando o 2º fornecedor caso ele não estivesse no array base.
    4. A tabela `quotations` no Supabase não continha a coluna `bundle jsonb` e tinha regras RLS bloqueando inserts anônimos de lojistas/fornecedores sem autenticação Google prévia.
  - **Solução Implementada**:
    1. **Preservação de Múltiplos Fornecedores no Link**: Atualizado `QuotingLinkPayload` para incluir `allV` (todos os fornecedores convidados na cotação). Ao abrir o link em qualquer dispositivo, o sistema conhece todos os fornecedores participantes e preserva preços já cadastrados.
    2. **Identificação Estrita no Envio**: `SupplierPortalView` e `handleSupplierSubmitProposal` agora transmitem o objeto do fornecedor submetente (`vendor`), garantindo que o ID exato seja atualizado sem desvios.
    3. **Merge Aditivo de Fornecedores e Preços**: Se um fornecedor submete e não está na lista base, o sistema agora anexa o fornecedor automaticamente (`[...baseVendors, submittingVendor]`) em memória, no localStorage e no Supabase.
    4. **Sincronização Mágica via WhatsApp (1-Tap Import)**: Ao clicar no botão *"Avisar o Lojista no WhatsApp Agora"*, a mensagem enviada ao lojista já inclui um link direto de importação (`?importProp=...`). Ao tocar no link, a proposta daquele fornecedor é imediatamente mesclada e ativada no painel da loja, mesmo se os dispositivos estiverem desconectados do banco.
    5. **Polling Fallback em Tempo Real**: Adicionado polling a cada 7 segundos para complementar o Supabase Realtime no painel do lojista, garantindo que propostas remotas apareçam instantaneamente na tela.
    6. **Script DDL Supabase**: Criado `supabase_fix_multi_vendor.sql` para adicionar a coluna `bundle jsonb` e permitir sincronização completa em nuvem.
- [x] **Links Curtos e Ultra-Limpos com Slugs e Código da Lista (02/10/2026)**:
  - **Formato Final Perfeito**: Eliminados todos os parâmetros gigantes de query string (`?d=...`, `?cot=...`, `?vn=...`). O link agora é 100% limpo, legível e direto:
    `cotafacil.tecx.pro/[slug-da-loja]/[slug-do-fornecedor]/[codigo-da-cotação]`
    (ex: `cotafacil.tecx.pro/thtecx/ferrrominas/cot9345`).
  - **Identificação e Resolução Automática**: Ao abrir o link em qualquer celular ou navegador, o sistema extrai os 3 segmentos da rota, busca a cotação no Supabase e no cache local aceitando variações (com e sem traço), vincula o fornecedor automaticamente pelo slug e abre direto o portal de preenchimento.
  - **Função Utilitária `slugify`**: Sanitiza nomes de lojas e fornecedores removendo acentos e caracteres especiais para formar URLs perfeitas.
- [ ] **Ativação do Google OAuth no Supabase**: Acessar *Authentication > Providers > Google* no painel do Supabase com Client ID / Client Secret do Google Cloud Console e copiar o Callback URL do Supabase para o console do Google.




