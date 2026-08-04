# backup/ — a rede de segurança

Cópia datada do site **antes** de cada alteração grande. Nome no formato
`AAAA-MM-DD-o-que-vinha-antes.html`. **Nunca sobrescrever** um arquivo daqui.

## O que ficou

| Arquivo | O que é |
|---|---|
| `2026-08-01-ORIGINAL.html` | o site como estava quando o repositório nasceu |
| `2026-08-03-antes-modularizar.html` | o último monolito, antes de virar `src/` + `dist/` |

## Por que só dois

Em 03/08/2026 havia seis, quase idênticos entre si — quatro estados
intermediários de dois dias de trabalho. Não era risco, era ruído: quem abre
este repositório para te avaliar via seis HTML de 60 KB antes de ver o `src/`.

E ficou redundante. Com o `dist/` commitado, **o histórico do git faz esse
papel melhor** do que a pasta: ele guarda todos os estados, com data, autor e o
motivo de cada mudança escrito no commit.

Os quatro removidos continuam recuperáveis, e não é gambiarra — é como o git
foi feito para funcionar:

```bash
git show 515e5cb:backup/2026-08-02-antes-scroll-animation.html > recuperado.html
```

Os quatro estão todos no commit `515e5cb`. Para ver o que existiu ali:

```bash
git show --stat 515e5cb
```

## Então a pasta ainda serve pra quê?

Para o passo que o git **não** cobre: o que está de fato colado no widget do
Elementor agora. O git guarda o que você commitou; a pasta guarda o que foi
publicado. Enquanto a publicação for copiar-colar à mão, os dois podem
divergir — e é justamente aí que se precisa de um backup.

Por isso a regra continua: antes de mexer em `src/`, copiar o
`dist/index-elementor.html` atual para cá, com data no nome.
