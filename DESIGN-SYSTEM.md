# Mitte Bar — Design System

Base extraída de duas fontes reais da marca:

- **`assets/logo-mitte.png`** (`Logotipo_MITTE-22.png`) — lettering em bloco, face ciano com sombra sólida magenta deslocada para a direita/baixo.
- **`https://mittebar.vercel.app/`** — o site de agendamento de aniversário, de onde vieram os tokens de cor, raio e tipografia já em uso pela marca.

Todos os valores vivem em [`src/tokens.css`](src/tokens.css). Nada de cor solta no CSS.

---

## 1. Cor

### Superfícies

| Token | Valor | Uso |
|---|---|---|
| `--mitte-bg` | `#09090B` | Fundo da página. É o `body` do site institucional (`rgb(9,9,11)`, tema `dark`). |
| `--mitte-bg-elev-1` | `#121215` | Linha de item em hover, campo de busca, etiqueta de aba. |
| `--mitte-bg-elev-2` | `#1A1A1F` | Segundo nível de elevação. |
| `--mitte-overlay` | `rgba(9,9,11,.82)` | Barra fixa com `backdrop-filter: blur(12px)`. |

### Texto

| Token | Valor | Uso |
|---|---|---|
| `--mitte-fg` | `#FAFAFA` | Texto principal, nome do item. |
| `--mitte-fg-muted` | `#A1A1AA` | Descrições, subtítulo de seção. |
| `--mitte-fg-subtle` | `#71717A` | Placeholder, microcópia, rodapé técnico. |

### Neon da marca

Os quatro neons vêm literalmente das variáveis do site (`--neon-pink`, `--neon-cyan`, `--neon-green`, `--neon-purple`):

| Token | HSL original | Hex | Papel |
|---|---|---|---|
| `--mitte-pink` | `330 100% 60%` | `#FF3399` | **Primária.** Títulos de seção, aba ativa, destaque de promoção. |
| `--mitte-cyan` | `180 100% 50%` | `#00FFFF` | **Secundária.** Preços, eyebrow, face do logo, e o halo frio que sustenta a base da tela. |
| `--mitte-green` | `150 100% 50%` | `#00FF80` | Acento de categoria (Sem Álcool, Vodkas e Gins, Doses). |
| `--mitte-purple` | `280 100% 60%` | `#AA33FF` | Acento de categoria (Outros, Caipirinhas, Vinhos). Também o contorno do botão de reserva na hero. |

O logo tem tokens próprios, medidos pixel a pixel no arquivo original: a face
**não** é o ciano puro do site, é um ciano dessaturado, e a sombra é um magenta
mais fechado que o pink neon.
`--mitte-logo-face: #62C3D5` · `--mitte-logo-shadow: #E72989`.

### Regra de uso do par rosa/ciano

O cardápio inteiro é lido num salão escuro, muitas vezes no celular. A divisão é fixa:

- **Rosa = navegação e hierarquia.** Onde a pessoa está (aba ativa, título da seção).
- **Ciano = dado.** O preço, sempre. Nunca invertê-los — é o que torna a varredura de preço instantânea.
- **Verde e roxo só existem como acento de categoria.** Cada aba recebe um dos
  quatro neons em `--acento` (ver `ACENTOS` em `src/app.js`), que pinta a borda
  da pílula, o sublinhado do nome e a lavagem de cor no toque. Fora da tela de
  categorias eles aparecem em dois lugares só: nos dois botões de contorno da
  hero e no `.atalho-aba` dos resultados. Dentro de uma aba volta a valer só
  rosa e ciano, senão o preço perde a leitura imediata.

### Contraste

Sobre `#09090B`: `--mitte-fg` 18.9:1, `--mitte-fg-muted` 7.6:1, `--mitte-cyan` 15.8:1, `--mitte-pink` 6.4:1 — todos acima de AA. `--mitte-fg-subtle` (4.9:1) só em texto de apoio, nunca em informação essencial. A aba ativa usa texto branco sobre rosa (3.0:1), compensada pelo tamanho em caixa alta com peso 600 e pelo glow — mas o estado também é anunciado por `aria-selected`, não só pela cor.

---

## 2. Glow

O glow é a assinatura visual do Mitte — o salão é iluminado por neon, e o site já carregava `--glow-pink` / `--glow-cyan`. Foi mantido, com uma variante de texto mais contida:

```css
--mitte-glow-pink:      0 0 30px rgba(255,51,153,.6), 0 0 60px rgba(255,51,153,.3);
--mitte-glow-cyan:      0 0 30px rgba(0,255,255,.6),  0 0 60px rgba(0,255,255,.3);
--mitte-glow-text-pink: 0 0 12px rgba(255,51,153,.75), 0 0 28px rgba(255,51,153,.35);
--mitte-glow-text-cyan: 0 0 12px rgba(0,255,255,.70),  0 0 28px rgba(0,255,255,.30);
```

**Onde aplicar:** `box-shadow` só na aba ativa. `text-shadow` só em título de seção, preço e eyebrow. Glow em texto corrido borra a leitura — descrições nunca recebem.

Além disso, o `body::before` projeta dois halos radiais fixos (rosa no topo-esquerda, ciano no topo-direita) que imitam a luz ambiente do salão sem pesar na rolagem.

---

## 3. Tipografia

| Token | Família | Uso |
|---|---|---|
| `--mitte-font-display` | **Orbitron** 500/600/700/900 | Logo, títulos, nomes de item, preços, abas, microcópia. |
| `--mitte-font-body` | **Inter** 400/500 | Descrições e texto corrido. |

**Por que duas.** O site institucional usa Orbitron em tudo, e funciona lá: são poucas palavras, quase todas em caixa alta. Um cardápio tem ~100 descrições de uma linha; Orbitron em corpo 13px derruba a legibilidade. A decisão foi manter Orbitron em todo o display — que é onde a marca é reconhecida — e passar o texto corrido para Inter. A personalidade fica intacta porque tudo que se lê primeiro (nome e preço) continua em Orbitron.

**Escala**

```
--mitte-size-hero:    clamp(1.75rem, 6vw, 3rem)
--mitte-size-section: clamp(1.1rem, 3.2vw, 1.6rem)
--mitte-size-item:    1rem
--mitte-size-desc:    .8125rem
--mitte-size-price:   1rem
--mitte-size-micro:   .6875rem
```

**Caixa alta sempre com tracking.** `--mitte-track-display: .08em` em títulos e nomes; `--mitte-track-micro: .14em` em eyebrow, abas e selos. Orbitron em caixa alta sem tracking fecha demais.

Preço usa `font-variant-numeric: tabular-nums` para os valores alinharem em coluna.

---

## 4. Forma e espaço

```
--mitte-radius:      .75rem   /* herdado do --radius do site */
--mitte-radius-sm:   .5rem
--mitte-radius-pill: 999px    /* abas e campo de busca */

--mitte-space-1..12: .25rem .5rem .75rem 1rem 1.5rem 2rem 3rem
--mitte-maxw:        56rem
```

Bordas: `--mitte-border` (branco a 10%) para separar itens; `--mitte-border-strong` (rosa a 40%) para foco e destaque.

---

## 5. As três telas

O app é um shell de `100dvh` com as três telas empilhadas na mesma célula de
grid. A página **nunca** rola (`html, body { overflow: hidden }`); quem rola é
só o painel de itens. Isso vale para celular, desktop e totem.

| Tela | Estrutura | Rola? |
|---|---|---|
| **Hero** | logo centralizado, três destinos empilhados embaixo | não |
| **Categorias** | `auto auto 1fr` — cabeçalho + barra de busca + painel | só o painel |
| **Itens** | `auto 1fr` — cabeçalho + grade de cards | só a grade |

A **hero** não tem um botão, tem três, um por linha e todos da mesma largura:
*Programação da semana* e *Reserva de aniversário* saem do cardápio e vão de
contorno (`.botao--fantasma`, com o acento próprio); *Cardápio* fica aqui e é
o único preenchido. Empilhar em vez de alinhar resolve o nome longo — "Reserva
de aniversário" não cabe lado a lado em 375px sem encolher a tipografia abaixo
do legível.

As **categorias** viraram uma coluna de pílulas, uma aba por linha, sem foto.
Uma grade de doze tiles obriga a comparar dois eixos ao mesmo tempo; a coluna
se lê de cima para baixo, como um cardápio de papel. A barra de busca fica
**fora** do painel que rola: digitar não pode empurrar o campo para fora da
tela, e no celular com o teclado aberto sobra pouca tela.

Tanto o painel de categorias quanto a grade de itens usam
`align-content: safe center`. Lista curta fica centrada verticalmente — o que
resolve a totem em pé, onde doze pílulas alinhadas ao topo deixariam metade da
tela vazia. Lista longa volta a alinhar pelo topo sozinha, sem cortar o
começo. A centragem vem da trilha (`grid-template-columns: minmax(0, 56rem)`
+ `justify-content: center`), não de `margin-inline: auto`: margem automática
em item de grade cancela o `stretch` e a pílula encolhe para o tamanho do
texto.

### Componentes

- **`.categoria`** — pílula de aba: nome em Orbitron centralizado, com
  sublinhado no acento da aba. O sublinhado é o que o cardápio de referência
  tem; em Orbitron ele vira um fio de neon embaixo do nome. A borda também
  carrega o acento, a 40% — parada, a coluna tem o mesmo ritmo de cor que a
  grade antiga tinha; no toque, o acento vai a 100% e uma lavagem de cor
  atravessa a pílula por trás do texto. **Sem contagem de itens**: quem abre o
  cardápio quer escolher o que beber, não saber que Latas tem 24 linhas.
- **`.card`** — item: figura **quadrada**, nome, e o preço como **etiqueta
  sobre a foto** (pílula escura com borda ciano). A descrição some abaixo de
  48rem e volta acima disso. Variante `.card--destaque` para promoção, no
  máximo uma por aba.

  A figura era 4:3 enquanto as fotos eram de produto com margem sobrando em
  cima e embaixo. As fotos do bar são de copo em pé: o 4:3 cortava justamente
  a borda e a base, que é o que se olha num drink. Quadrado custa densidade e
  paga em legibilidade do item:

  | Tela | Card | Cards à vista | Telas para a maior aba (24 itens) |
  |---|---|---|---|
  | Celular 375×812 | 198px | 8 | 3,4 |
  | Desktop 1440×900 | 257px | 24 | 1,1 |
  | Totem 1080×1920 | 409px | 12 | 2,0 |

  O preço fora do corpo e a descrição só em tela larga continuam valendo pela
  mesma razão de antes: densidade. O master é quadrado e o `object-fit: cover`
  não precisa cortar nada.

  A foto leva `position: relative; z-index: 1` e o preço, `z-index: 2`. Sem
  isso a inicial — que é absoluta — pintava por cima da foto, e toda foto
  aparecia com duas letras rosa no meio.
- **`.card__inicial`** — as iniciais do item em rosa a 32% de opacidade, atrás
  da foto. Quando a foto ainda não existe, o `onerror` remove o `<img>` e a
  inicial fica à mostra. **É um estado desenhado, não um buraco** — por isso o
  cardápio pode ir ao ar com 20 fotos em vez de 100.
- **`.campo`** — a barra de busca, fixa no topo da tela de categorias. Não é
  mais uma camada que abre por cima: está sempre ali, e os resultados
  (`.resultados`) tomam o lugar da coluna de abas dentro do mesmo painel. Os
  resultados usam **o mesmo `.card`** da tela de itens, na mesma grade: a
  busca não é uma listinha à parte, é o cardápio refiltrado. Como aqui os
  resultados cruzam abas, o card ganha `.card__aba` — o nome da categoria
  acima do nome do item, em cinza, que dentro de uma categoria seria
  redundante e não aparece. A lupa da tela de itens não abre um segundo
  campo: devolve para este, já com o cursor dentro.
- **`.detalhe`** — diálogo centrado: foto grande (quadrada, com teto de
  `38dvh` para o resto caber sem rolar), categoria, nome, preço, descrição e,
  no rodapé, **três sugestões de acompanhamento**. Abre por cima da busca sem
  fechá-la: quem fecha o detalhe cai de volta nos resultados, não no começo.
- **`.acompanha`** — o trio do rodapé. Drink sugere comida, comida sugere
  drink ("Para beber junto"), dose sugere o que se mistura com ela ("Para
  misturar"). O sorteio é semeado pelo slug do item: o mesmo prato sugere
  sempre o mesmo trio, mas pratos diferentes sugerem trios diferentes — sem
  isso, ou todo mundo vê as três primeiras comidas da lista, ou a tela muda a
  cada abertura. Clicar troca o conteúdo do diálogo em vez de empilhar outro.
- **`.atalho-aba`** — primeira linha dos resultados quando o que foi digitado
  é o nome de uma seção: quem escreve "caipirinha" quase sempre quer a lista,
  não um item. Leva o acento da aba.
- **`.correcao`** — o "você quis dizer", em **linha de texto**, só quando a
  busca não achou nada. Os chips fixos embaixo da barra saíram: ocupavam
  altura permanente para ensinar uma sintaxe que o placeholder já ensina, e
  empurravam os resultados para baixo da dobra no celular.

### Texto que cabe em qualquer tela

Nome de aba e nome de item são dimensionados por `clamp()` com o limite do
meio em `min(vw, vh)`, não só em `vw` nem só em `vh`. Numa grade que vai de 2 a
4 colunas e de uma tela baixa a uma totem de 1920 de altura, amarrar numa
dimensão só deixava "Vinhos e Espumantes" grande demais num caso e minúsculo
no outro. Medido: 13,5px no celular, 18,4px na totem.

Junto vão `text-wrap: balance` (reparte as linhas em blocos parecidos em vez de
deixar uma palavra órfã), `overflow-wrap: break-word` e corte em 2 linhas no
celular / 3 em tela larga. Sem isso, "Lambe Lambe Tangerina, Limão e Sal 355ml"
quebrava em pedaços estranhos dentro de um card de 166px.

O logo do cabeçalho usa um arquivo próprio de 640px (`logo-mitte-320.png`), não
o original de 3476px: reduzir o grande a cada repaint fazia a imagem tremer e
embaçar ao passar o cursor. Ele também fica em camada própria
(`transform: translateZ(0)`).

### A busca

Três camadas, nessa ordem, sobre a frase inteira já sem acento:

1. **Intenção** — "tô com fome", "pra dividir", "algo barato", "sem álcool",
   "algo forte", "refrescante", "algo doce", "vegano", "da casa", "pra
   brindar", "sem açúcar". Cada uma é um filtro sobre o índice, disparado por
   frases soltas (`INTENCOES` em `src/app.js`).
2. **Preço** — teto ("até 30", "menos de 30", "<30"), piso ("acima de 50",
   "a partir de 50") e faixa ("entre 20 e 40"). Número solto vira teto: no
   balcão, "30" quer dizer "até 30".
3. **Termos** — o que sobrou, já sem as palavras vazias do português ("tô",
   "com", "pra", "algo", "quero") e já reduzido à raiz, que resolve o plural
   antes de gastar distância de edição. Sem essa limpeza, "tô com fome"
   devolvia um item só: "to" e "com" viravam termos de busca e anulavam a
   intenção. Cada termo leva junto seus **apelidos de balcão** (`APELIDOS`):
   "breja" acha as cervejas, "mexerica" acha a tangerina, "uisque" acha o
   whisky.

Os termos casam por prefixo e, de quatro letras em diante, por distância de
edição — "negrone" acha Negroni, "caipirnha" acha as caipirinhas. Abaixo de
quatro letras a correção fica desligada de propósito: "gin" viraria "vin",
"sim", "fim".

O resultado é ordenado por relevância, com acerto no **nome** valendo mais que
acerto na descrição ou no nome da aba, e acerto exato valendo mais que
correção de digitação. O termo digitado vale meio ponto a mais que um apelido
dele — é o que põe o Mojito (tem *hortelã* escrito) na frente do Halls (só tem
*menta*, que é apelido de hortelã). Empate vai para a **cobertura do nome**:
em "gin", "Gin Tônica" (duas palavras, metade coberta) ganha de "Gin Tônica
Pink Schweppes Lata 269ml" (seis palavras). Só então entra o preço.

Como as descrições agora trazem a receita inteira — vieram do menu do bar —
ingrediente também encontra: "maracujá" acha o Tropical Passion sem que o
Tropical Passion precise de apelido nenhum.

### Modo totem

`body.totem` (via `?totem=1` ou tela ≥1024px sem mouse) sobe o alvo de toque de
3rem para 4,5rem, aumenta a tipografia dos cards e troca as colunas para
`minmax(min(20rem, 27vw), 1fr)` — menos cards por linha, maiores, porque o
cliente está a um braço de distância e não a 30 cm. `@media (hover: none)`
desliga os efeitos de hover, que em tela de toque só causam estado preso.

---

## 6. Movimento

Regra única: **nada se move sem motivo.** Entrada constrói hierarquia,
transição explica para onde a pessoa foi, hover confirma o toque.

Duas curvas e três durações, todas em `tokens.css`:

```
--mitte-ease:      cubic-bezier(.22, 1, .36, 1)     saída suave, padrão
--mitte-ease-back: cubic-bezier(.34, 1.56, .64, 1)  leve overshoot
--mitte-dur:       .22s    microinteração
--mitte-dur-tela:  .55s    troca de tela
--mitte-stagger:   60ms    atraso entre itens de lista
```

### O logo se montando

O PNG original foi separado em duas camadas por cor (`logo-face.png` e
`logo-shadow.png`) e cada camada é recortada nas cinco letras por `<span>` com
`overflow: hidden` — a imagem inteira fica dentro, deslocada em porcentagem.
Nada de sprite em `background-position`: as porcentagens são do próprio span,
então o recorte acompanha qualquer tamanho de tela.

A sequência, por letra, com 95ms de intervalo:

1. a **sombra** entra de `translate(-5%, -14%) scale(.9)` até o lugar — parece
   que o volume está sendo extrudado;
2. a **face** cai de cima com `blur(12px)` que resolve;
3. com as cinco letras no lugar, `logoAcende` dá um pulso de `drop-shadow`
   ciano e magenta;
4. depois o conjunto entra em `logoRespira`, uma oscilação de 0,6% que impede
   a hero de parecer uma imagem estática.

### Troca de tela

`telaEntra` traz a tela de baixo com `scale(1.06)` e desfoque que resolve;
`telaSai` recua a anterior para `scale(.94)` com `blur(14px)`. Voltar troca
para `telaVolta`, que vem de trás em vez de baixo — o eixo invertido é o que
diz "você voltou" sem precisar de texto.

### Listas

`.card` entra com stagger de 60ms via `--i`, saturando no 14º item
(`min(var(--i), 13)`): ninguém percebe a diferença depois disso, e esperar um
segundo pelo último card seria pior que não animar.

`.categoria` usa metade do passo e satura no 10º (`min(var(--i), 9)`). Doze
abas a 60ms seriam 0,72s até a última linha aparecer — com a coluna, isso é
tempo demais para um menu que a pessoa já está lendo de cima para baixo. A
pílula também deixou de entrar em perspectiva (`entraTile`) e passou a subir
(`entraPilula`): a rotação em X funcionava num tile largo e virava tremor numa
pílula de 48px de altura.

### A vida do logo

Depois de montado, o logo não fica parado. A cada **8 segundos** uma onda
atravessa as cinco letras: cada uma salta, gira ~1,6° e assenta com um resto
de overshoot, com 70ms entre uma e outra. A sombra magenta sai um pouco depois
e anda metade — é o volume correndo atrás da face, não uma segunda letra
solta. O brilho pulsa no mesmo compasso.

O movimento inteiro ocupa 16% do ciclo (~1,2s) e os outros 84% são pausa. É a
pausa que faz o salto chamar atenção quando volta; uma animação contínua vira
ruído de fundo em dez segundos.

Na prática são duas animações por fatia: a montagem (uma vez, `both`) e a onda
(`infinite`, atraso de 6s). A onda vem por último na lista `animation`, então é
ela que manda no `transform` depois que a montagem termina.

### Movimento reduzido

`prefers-reduced-motion: reduce` zera duração e repetição de **tudo**, inclusive
a montagem do logo e a respiração da hero.

---

## 7. O que não fazer

- Fundo claro. A marca é um bar noturno; não há variante clara.
- Fazer a página rolar. Só o painel de categorias e a grade de itens rolam.
- Glow em texto corrido.
- Preço em rosa, nome em ciano, ou qualquer inversão do par.
- Mais de um `.card--destaque` por aba.
- Verde ou roxo fora da pílula de categoria, dos dois botões de contorno da
  hero e do atalho de aba nos resultados.
- Cor literal (`#FF3399`) no CSS dos componentes — sempre o token.
- Misturar as duas famílias de foto num mesmo card. Fotos do bar (copo no
  balcão, neon desfocado atrás) e fotos de produto (recorte sobre fundo
  escuro) convivem bem lado a lado porque as duas são escuras; o que quebra
  é foto com fundo claro — por isso o anúncio da Ballantine's, que é diurno,
  ficou de fora.
