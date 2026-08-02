# Conectar ao WordPress do pixelmartins.com — o que dá e o que não dá

> Levantado em 2026-08-02. Revisar se o site trocar de host ou de page builder.

---

## Resposta curta

**Sim, dá pra conectar** — mas não por um "conector" pronto. Não existe MCP de
WordPress instalado nesta máquina (os conectores disponíveis são Canva, Gmail,
Google Agenda, Google Drive e Meta/Facebook; Cloudflare e HyperFrames estão
pendentes de autorização). A conexão é pela **REST API do próprio WordPress**,
que já está aberta e respondendo.

**O obstáculo real não é o login — é o Elementor.**

---

## O que já foi verificado (evidência, não suposição)

`GET https://pixelmartins.com/wp-json/` → JSON válido. Confirma:

- WordPress no ar, REST API **não bloqueada** pelo host.
- Elementor **Pro** instalado (`elementor/v1`, `elementor-pro/v1`,
  `elementor-ai/v1`, `elementor-one/v1`).
- Endpoints core disponíveis em `wp/v2` (posts, pages, media, users…).

Leitura pública já funciona hoje, sem credencial nenhuma:

```
https://pixelmartins.com/wp-json/wp/v2/pages          → lista as páginas + IDs
https://pixelmartins.com/wp-json/wp/v2/pages/<ID>     → conteúdo de uma página
```

---

## A pegadinha do Elementor (o ponto que decide tudo)

Página feita no Elementor **não guarda o conteúdo em `post_content`**. Guarda no
postmeta **`_elementor_data`**, um JSON com a árvore de seções/colunas/widgets —
e o HTML do site está *dentro* desse JSON, no widget `html`.

Consequências:

1. `GET /wp/v2/pages/<ID>` devolve `content.rendered` com o HTML **renderizado**,
   mas escrever ali **não muda nada** — o Elementor sobrescreve na renderização.
2. `_elementor_data` **não é exposto na REST API por padrão** (postmeta precisa
   ser registrado com `show_in_rest`).
3. Mesmo gravando o meta certo, o Elementor guarda um **CSS compilado em cache**
   (`_elementor_css` + arquivos em `uploads/elementor/css/`) que precisa ser
   invalidado, senão o visual sai errado.

---

## As 4 rotas possíveis

### Rota A — Colar à mão no widget (é o que já se faz hoje)
Eu edito o HTML aqui no repo, valido renderizando no Chromium do Playwright, e
você cola no widget do Elementor.

- **Risco:** zero. Nada meu toca o site no ar.
- **Custo:** um copiar-colar por alteração.
- **Precisa de:** nada.
- **Veredito:** é a rota padrão até haver motivo forte pra sair dela.

### Rota B — REST API + Senha de Aplicativo (leitura completa, escrita limitada)
Você gera uma Senha de Aplicativo (WP-Admin → Usuários → Perfil → Senhas de
aplicativo) e eu guardo em `.env` na raiz.

- **Libera:** ler qualquer página/post/mídia autenticado, subir imagem
  (`/wp/v2/media`), criar/editar post e página **normal** (não-Elementor),
  ajustar título/descrição/SEO, diagnosticar o site.
- **Não libera:** editar o widget HTML do Elementor (ver pegadinha acima).
- **Precisa de:** URL + usuário + senha de aplicativo. Host não pode filtrar o
  header `Authorization` (alguns filtram; testa-se em 1 requisição).
- **Veredito:** vale a pena mesmo com a limitação — resolve mídia, SEO e
  diagnóstico. É o passo 1 natural.

### Rota C — mu-plugin que expõe `_elementor_data` (deploy de verdade)
Um arquivo pequeno em `wp-content/mu-plugins/` registrando o meta com
`show_in_rest` + limpando o cache CSS do Elementor no save.

- **Libera:** atualizar o widget HTML por script, com rollback. Deploy real.
- **Risco:** médio. Escreve num JSON que, malformado, **quebra a página no
  editor do Elementor**. Exige backup do `_elementor_data` antes de cada escrita
  (vai pra `backup/`).
- **Precisa de:** acesso a arquivo no servidor (FTP/SFTP, painel do host ou
  editor de plugin) + Rota B funcionando.
- **Veredito:** só se a edição virar rotina. Pra alteração eventual, não paga o
  risco.

### Rota D — tirar o site do Elementor
Virar um template de tema-filho (ou página estática servida pelo WP) e versionar
de verdade, com deploy por SFTP/git.

- **Libera:** tudo. Fim do copiar-colar, fim do JSON frágil.
- **Custo:** migração — e você perde a edição visual pelo Elementor.
- **Veredito:** é a resposta certa se o site for crescer. Decisão do usuário,
  não minha.

---

## Recomendação

**B agora, C só se virar rotina, D se o site crescer.** Rota A continua sendo o
caminho seguro de publicação enquanto isso.

## Segurança (não negociável)

- Senha de aplicativo **só** no `.env` da raiz, que já está fora do git.
- Senha de aplicativo é **revogável a qualquer momento** no perfil do WP — se
  algo cheirar mal, revoga e gera outra. Não é a senha da conta.
- Backup do estado anterior **antes** de qualquer escrita, em `backup/` com data.
- Nunca escrever no site no ar sem confirmação explícita do usuário na hora.
