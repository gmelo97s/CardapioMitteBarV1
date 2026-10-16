# Mitte Bar — Cardápio Digital

App de tela cheia para celular, desktop e totem. HTML, CSS e JavaScript puros,
sem build e sem dependência — o conteúdo vem de um único JSON.

```
index.html                    as três telas
assets/logo-mitte.png         logo completo
assets/logo-face.png          só a face ciano   ─┐ camadas separadas
assets/logo-shadow.png        só a sombra magenta┘ para a animação da hero
assets/itens/                 fotos geradas (webp)
assets/itens/_masters/        seus originais 1024×1024 (não vão para o ar)
src/tokens.css                design tokens
src/motion.css                animações
src/styles.css                componentes
src/app.js                    navegação, busca e cards
src/data/cardapio.json        ← todo o conteúdo
assets/itens/_brutas/         fotos como vieram do Google (não vão para o ar)
tools/preparar-fotos.py       recorta o fundo e monta os combos
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
brilho acende. Um botão leva ao menu.
**Categorias** → as 11 abas numa grade que sempre cabe na tela, sem rolagem.
**Itens** → cards com foto, nome e preço. Só esta lista rola, nunca a página.

Toque num card abre o detalhe: foto grande, descrição e **três sugestões de
acompanhamento** — drink sugere comida, comida sugere drink.

A lupa abre a busca, que entende pedido em linguagem solta ("tô com fome",
"algo barato", "pra dividir", "sem álcool"), tolera erro de digitação
("negrone" acha Negroni) e devolve os resultados na mesma grade de cards.

A página nunca rola: `html, body { overflow: hidden }` e o shell tem
`height: 100dvh`. Quem rola é o painel de itens.

## Os três aparelhos

| | Como entra |
|---|---|
| **Celular** | padrão, 2 colunas, alvos de 3rem |
| **Desktop** | mesma tela, 3–4 colunas de categoria |
| **Totem** | `?totem=1` na URL, ou detectado por tela ≥1024px sem mouse |

O modo totem aumenta os alvos de toque para 4,5rem, aumenta a tipografia e
reduz o número de cards por linha. Para fixar a totem nesse modo, aponte o
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

Jogue as fotos cruas em `assets/itens/_brutas/` e rode os dois scripts:

```bash
python tools/preparar-fotos.py && python tools/gerar-imagens.py
```

O primeiro recorta o fundo, centraliza e **monta os combos sozinho** — uma
foto de Corona vira o card de "Combo 4 Corona". O segundo gera os `.webp`.
Passo a passo e lista de nomes em [IMAGENS.md](IMAGENS.md). Item sem foto
mostra a inicial em neon — é um estado previsto, não um erro.

## Publicar

Site estático, qualquer host serve. No Vercel, aponte para a raiz sem comando
de build. O `vercel.json` já cuida de cache (foto cacheada para sempre, JSON
sempre revalidado) e o `.vercelignore` mantém as notas internas fora do ar.

Antes de publicar, passe por [REVISAR.md](REVISAR.md).
