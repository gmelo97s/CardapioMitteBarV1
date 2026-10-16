# Mitte Bar — Cardápio Digital

App de tela cheia para celular, desktop e totem. HTML, CSS e JavaScript puros,
sem build e sem dependência — o conteúdo vem de um único JSON.

```
index.html                    as três telas
assets/logo-mitte.png         logo completo
assets/logo-face.png          só a face ciano   ─┐ camadas separadas
assets/logo-shadow.png        só a sombra magenta┘ para a animação da hero
assets/itens/                 fotos geradas (webp) — vão para o ar
assets/itens/_brutas/         fotos como vieram do Drive  ─┐ fora do git,
assets/itens/_masters/        originais 1024×1024          ┘ ~140 MB
src/tokens.css                design tokens
src/motion.css                animações
src/styles.css                componentes
src/app.js                    navegação, busca e cards
src/data/cardapio.json        ← todo o conteúdo
tools/fotos-drive.json        qual foto do Drive é de qual item
tools/fotos-drive.py          recorta as fotos do bar e monta as latas
tools/preparar-fotos.py       recorta o fundo de fotos de produto
tools/gerar-imagens.py        gera as versões responsivas
DESIGN-SYSTEM.md              o sistema visual e suas regras
IMAGENS.md                    como produzir as fotos dos itens
REVISAR.md                    pendências de conteúdo
```

## Rodar

```bash
python -m http.server 5173
```

Depois abra `http://localhost:5173`. Precisa de servidor porque o cardápio é
carregado via `fetch` — abrir o `index.html` direto do disco não funciona.

## Como navega

**Hero** → o logo se monta letra a letra, a sombra magenta extruda por trás, o
brilho acende. Embaixo, três destinos empilhados: *Programação da semana* (vai
para `mittesp.com.br/agenda`), *Cardápio* (fica aqui) e *Reserva de
aniversário* (vai para `mittebar.vercel.app`). Os três são neon: os dois que
saem do cardápio no azul da marca, o do meio no rosa — e só o do meio pulsa.

**Categorias** → a barra de busca no topo, fixa, e as 12 abas numa coluna de
pílulas, uma por linha, sem foto. Cada aba traz seu acento de cor na borda e
no sublinhado.

**Itens** → cards com foto quadrada, nome e preço. Só esta lista rola.

Toque num card abre o detalhe: foto grande, descrição e **três sugestões de
acompanhamento** — drink sugere comida, comida sugere drink.

A página nunca rola: `html, body { overflow: hidden }` e o shell tem
`height: 100dvh`. Quem rola é o painel.

## A busca

Mora no topo da tela de categorias e fica visível o tempo todo. Enquanto o
campo está vazio, embaixo dele fica a coluna de abas; ao digitar, os
resultados ocupam o lugar da coluna. Não há chips de sugestão: o que a barra
entende está no exemplo do placeholder, e o resto ela deduz.

| A pessoa digita | O que acontece |
|---|---|
| `gin`, `maracujá`, `hortelã` | nome **e** ingrediente — as descrições trazem a receita inteira |
| `tô com fome`, `pra dividir`, `sem álcool`, `vegano`, `da casa`, `pra brindar` | intenção em linguagem solta, filtra a lista |
| `até 30`, `menos de 30`, `acima de 50`, `entre 20 e 40`, `30` | teto, piso e faixa de preço |
| `negrone`, `gim`, `caipirinhas` | erro de digitação, grafia alternativa e plural |
| `breja`, `refri`, `shot`, `mexerica`, `uisque` | apelido de balcão |
| `caipirinha`, `doses`, `espumante` | além dos itens, oferece **ir para a aba inteira** |

Quando nada casa, a barra propõe a correção mais próxima numa linha de texto
— não num botão fixo.

## Os três aparelhos

| | Como entra |
|---|---|
| **Celular** | padrão, 2 colunas de card, alvos de 3rem |
| **Desktop** | mesma tela, a coluna de abas cabe inteira sem rolar |
| **Totem** | `?totem=1` na URL, ou detectado por tela ≥1024px sem mouse |

O modo totem aumenta os alvos de toque para 4,5rem, aumenta a tipografia e
reduz o número de cards por linha. A coluna de abas se centra sozinha quando
cabe na tela, em vez de ficar amontoada no topo. Para fixar a totem nesse modo, aponte o
navegador dela para `…/?totem=1`.

## Editar o cardápio

Tudo em `src/data/cardapio.json`. Nada está escrito no HTML.

```json
{
  "nome": "Negroni Rosso",
  "slug": "negroni-rosso",
  "preco": 38.00,
  "descricao": "Gin, Campari e vermute tinto.",
  "fora_de_linha": false,
  "destaque": false
}
```

| Campo | Efeito |
|---|---|
| `preco` | Número, não string. Formata em `R$` sozinho. |
| `slug` | Nome do arquivo da foto. Veja [IMAGENS.md](IMAGENS.md). |
| `fora_de_linha` | Esconde o item e tira da contagem da categoria. |
| `destaque` | Realça o card. No máximo um por aba. |
| `confirmar` | Só anotação interna, não aparece na tela. |

A ordem das abas no arquivo é a ordem na tela.

## Fotos dos itens

**50 dos 115 itens têm foto.** As fotos do bar vêm da pasta *NOVOS DRINKS*
do Drive; `tools/fotos-drive.json` guarda qual arquivo é de qual item, então
a pasta reconstrói tudo:

```bash
# baixe a pasta do Drive para assets/itens/_brutas/
python tools/fotos-drive.py && python tools/gerar-imagens.py
```

Para fotos de produto (latas, garrafas, comida), o caminho é
`tools/preparar-fotos.py`, que recorta o fundo e **monta os combos sozinho**
— uma foto de Corona vira o card de "Combo 4 Corona". Os dois caminhos e a
especificação estão em [IMAGENS.md](IMAGENS.md); o que falta fotografar
está em [REVISAR.md](REVISAR.md). Item sem foto mostra a inicial em neon —
é um estado previsto, não um erro.

## Publicar

Site estático, qualquer host serve. No Vercel, aponte para a raiz sem comando
de build. O `vercel.json` já cuida de cache (foto cacheada para sempre, JSON
sempre revalidado) e o `.vercelignore` mantém as notas internas fora do ar.

Antes de publicar, passe por [REVISAR.md](REVISAR.md).
