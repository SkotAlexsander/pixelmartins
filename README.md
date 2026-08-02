# Portfólio — pixelmartins.com

> Criado em 2026-08-02. Casa oficial do código do site pessoal do Alex Martins.
> Status: **aguardando o código atual** (o usuário vai enviar).

---

## O que é

Site pessoal publicado em **WordPress + Elementor Pro**. A página inteira é um
**único widget HTML** colado numa página com template "Elementor Canvas".

**Posicionamento (definido em 2026-08-01):** *"site e vídeo, feitos pela mesma
pessoa"* — o diferencial é ser as duas frentes num profissional só, com IA
acelerando o repetitivo.

**Ordem das seções:** Hero → Serviços → Projetos → Sobre → IA → Trajetória → Contato.
(A pergunta do visitante é "o que você faz por mim", não "quem é você".)

---

## Estrutura desta pasta

```
portfolio-pixelmartins/
├── README.md          ← este arquivo
├── codigo-atual/      ← o fonte que se cola no widget (fonte da verdade)
├── assets/frames/     ← 150 frames do retrato do fundo (servidos via jsDelivr)
├── backup/            ← cópia datada antes de cada alteração — NUNCA sobrescrever
├── dev/               ← ferramentas de teste local (não vão pro site)
└── docs/              ← decisões, conexão com o WordPress, animação
```

**Este é um repositório git próprio**, separado do repo-mãe do agente (que o
ignora via `.gitignore`). Publicado em `github.com/SkotAlexsander/pixelmartins-site`.

## Como publicar uma alteração

1. Editar `codigo-atual/index-elementor.html` (backup datado antes, em `backup/`).
2. `node dev/montar-preview.js` + `node dev/verificar-animacao.js` → tem de dar **PASSOU**.
3. `git commit` + `git push` — isso **já atualiza os frames** servidos pelo jsDelivr.
4. Colar o conteúdo de `codigo-atual/index-elementor.html` no widget HTML do Elementor.

> O passo 4 continua manual: o Elementor guarda a página em `_elementor_data`,
> um postmeta que a REST API não expõe. Ver [docs/conexao-wordpress.md](docs/conexao-wordpress.md).

**Regra de ouro:** antes de mexer em qualquer arquivo de `codigo-atual/`, copiar
pra `backup/` com data no nome (`AAAA-MM-DD-nome.html`). Não há build nem git
remote — o backup é a única rede de segurança.

---

## Pastas relacionadas (não duplicar código)

- **`projetos_futuros/portifolio web/`** — versão modular anterior (21/07/2026),
  nomeada `skot.dev`, com CSS/JS quebrados em arquivos e `_headers` de segurança.
  É o **ancestral**, não o que está no ar. Decidir com o usuário: absorver as
  boas partes (CSP, `_headers`, checklist) aqui e arquivar aquela pasta, ou
  manter as duas separadas.
- **`C:\Users\alexs\Downloads\pixelmartins-elementor.html`** — arquivo solto
  (~61 KB) que foi colado no widget do Elementor. Deve virar `codigo-atual/`.

---

## Conexão com o WordPress — o que já foi verificado

**2026-08-02 — a REST API do site está aberta e responde.**
`GET https://pixelmartins.com/wp-json/` retornou JSON válido:

- Site: "Alexsander Martins de Menezes Junior" · descrição ainda no padrão
  ("My WordPress Blog" — vale trocar).
- Namespaces ativos: `wp/v2`, `elementor/v1`, `elementor-pro/v1`,
  `elementor-one/v1`, `elementor-ai/v1`, `image-optimizer/v1`, `ea11y/v1`,
  `wp-site-health/v1`, `wp-block-editor/v1`, `oembed/1.0`, `tmpcoder/ajaxselect2`.

**O que falta pra escrever (não só ler):** uma **Senha de Aplicativo** do
WordPress (WP-Admin → Usuários → Perfil → Senhas de aplicativo), guardada num
`.env` na raiz do projeto — **nunca commitada**.

**A pegadinha do Elementor:** conteúdo de página feita no Elementor **não** fica
em `post_content`. Fica no postmeta `_elementor_data` (um JSON), que a REST API
**não expõe por padrão**. Ou seja: autenticar não basta pra atualizar o widget.
Ver `docs/conexao-wordpress.md` para as rotas possíveis e o trade-off de cada uma.

---

## Pendências conhecidas (herdadas da revisão de 01/08/2026)

- [ ] Só 1 projeto real no ar. Os cards "em breve" e a seção de depoimentos estão
      **comentados, não apagados** — voltam em um passo quando houver conteúdo real.
- [ ] Links de **GitHub e LinkedIn** ainda são `href="#"` — precisam da URL real.
- [ ] Descrição do site no WordPress ainda é "My WordPress Blog".
- [ ] Decidir a rota de deploy (ver `docs/conexao-wordpress.md`).
