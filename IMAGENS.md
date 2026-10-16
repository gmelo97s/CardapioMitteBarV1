# Imagens dos itens — especificação

## O caminho curto

Você **não** vai gerar imagem a imagem no Gemini. O caminho é:

1. Salve fotos cruas em `assets/itens/_brutas/` — **como vierem do Google**:
   qualquer tamanho, qualquer fundo, nome livre.
2. Rode `python tools/preparar-fotos.py`
3. Rode `python tools/gerar-imagens.py`

O primeiro script recorta o fundo, centraliza o produto e monta um quadrado de
1024px com fundo preto. O segundo gera os `.webp` que o site usa. Nenhuma etapa
manual no meio.

### O que isso resolve do seu problema

**Combos.** Você não precisa achar "4 Coronas" no Google — e não existe mesmo.
Salve **uma** lata de Corona como `corona.jpg`. O script lê o slug
`combo-4-corona-lata-350ml`, entende o `4`, e compõe as quatro latas sozinho,
com sobreposição e escadinha, como numa foto de bandeja. Vale para todo combo
do cardápio (`combo-3-beats-lata`, `combo-3-lambe-lambe`, etc.).

**Fundo ruim, foto torta, resolução baixa.** O recorte isola o produto e
descarta o fundo inteiro, então foto tirada em cima de uma mesa, com gente
atrás, ou com fundo branco de e-commerce, todas acabam iguais: produto
centralizado sobre preto. O que não dá para consertar é resolução: foto com o
produto ocupando menos de ~400px fica macia depois de ampliada.

**Quantidade de arquivos.** São ~100 itens, mas bem menos produtos. Uma foto de
Corona serve o combo; uma de caipirinha serve as quatro variações; uma Red Bull
só muda de sabor. Na prática são **40 a 50 fotos cruas** para cobrir o cardápio.

### Quanto isso custa de setup

```
pip install pillow "rembg[cpu]"
```

Na primeira execução ele baixa um modelo de recorte de 176 MB, uma vez só.
Depois roda offline, cerca de 1–2 segundos por foto.

### Se o casamento sair errado

`python tools/preparar-fotos.py --listar` mostra, sem processar nada, qual foto
crua vai para qual item. Se alguma estiver errada, crie `tools/mapa-fotos.json`:

```json
{
  "combo-3-xeque-mate-lata": { "origem": "xeque-mate", "repetir": 3 },
  "caipirinha-saque": "caipirinha"
}
```

O mapa manual tem prioridade sobre o automático.

### Onde o Gemini ainda ajuda

Só no que não existe como foto: drinks autorais da casa (Tanjuru, Crazy Life,
Zero B). Para esses, ou você fotografa no bar — que fica melhor e é mais rápido
do que parece — ou gera no Gemini e salva em `_brutas/` como qualquer outra; o
script trata igual.

---

## A especificação, para referência

**Um master por item, 1024 × 1024, quadrado, fundo preto.** Não faça três
versões por aparelho: o card é quadrado nos três, muda só o tamanho, e o
`srcset` resolve a resolução sozinho.

Qual é o maior tamanho que a imagem ocupa de verdade:

| Onde | Largura do card na tela | Pixels reais (com a densidade da tela) |
|---|---|---|
| Celular (375px, 3x) | ~165 px | ~495 px |
| Desktop (1920px, 1x) | ~165 px | ~165 px |
| Totem (1080–1920px, 1x) | ~250 px | ~250 px |
| **Detalhe aberto (retina, 2x)** | 416 px | **~832 px** |

O pico é o detalhe aberto num celular retina. Por isso a maior saída é **800
px** — acima disso é peso sem ganho visível. O master a 1024 dá folga para o
corte quadrado.

### Se for gerar no Gemini mesmo assim

Peça 1:1, 1024×1024:

> Produto centralizado, recorte limpo, fundo preto infinito sem textura e sem
> gradiente, iluminação de estúdio com leve reflexo embaixo, sem texto, sem
> marca d'água, sem props, enquadramento quadrado com margem folgada.

Fundo preto puro, margem folgada, e a **mesma luz em todas** — cem imagens com
iluminações diferentes viram colcha de retalhos.

### Não precisa ter as 100 de uma vez

Item sem foto mostra a **inicial em neon rosa**, que é um estado desenhado, não
um buraco. A ordem que rende mais:
**Clássicos → Tropicais → Vodkas e Gins → Caipirinhas → Comidas.** Latas,
Outros e Doses são compra por nome — a foto ajuda pouco.

---

## Lista de arquivos

Nome exato do arquivo que o script espera, por aba:

### Latas

- [ ] `combo-4-corona-lata-350ml.png` — Combo 4 Corona Lata 350ml
- [ ] `combo-4-stella-artois-lata-350ml.png` — Combo 4 Stella Artois Lata 350ml
- [ ] `chopp-vinho-draft-600ml.png` — Chopp Vinho Draft 600ml
- [ ] `xeque-mate-lata-362ml.png` — Xeque Mate Lata 362ml
- [ ] `combo-3-xeque-mate-lata.png` — Combo 3 Xeque Mate Lata
- [ ] `mascate-drinks-melancia-e-framboesa-362ml.png` — Mascate Drinks Melancia e Framboesa 362ml
- [ ] `combo-3-mascate-drinks-lata.png` — Combo 3 Mascate Drinks Lata
- [ ] `lambe-lambe-manga-e-maracuja-355ml.png` — Lambe Lambe Manga e Maracujá 355ml
- [ ] `lambe-lambe-tangerina-limao-e-sal-355ml.png` — Lambe Lambe Tangerina, Limão e Sal 355ml
- [ ] `combo-3-lambe-lambe.png` — Combo 3 Lambe Lambe
- [ ] `skol-beats-red-mix-269ml.png` — Skol Beats Red Mix 269ml
- [ ] `skol-beats-senses-269ml.png` — Skol Beats Senses 269ml
- [ ] `skol-beats-tropical-269ml.png` — Skol Beats Tropical 269ml
- [ ] `combo-3-beats-lata.png` — Combo 3 Beats Lata
- [ ] `absolut-sprite-lata-269ml.png` — Absolut Sprite Lata 269ml
- [ ] `gin-tonica-pink-schweppes-lata-269ml.png` — Gin Tônica Pink Schweppes Lata 269ml
- [ ] `spritz-schweppes-lata-269ml.png` — Spritz Schweppes Lata 269ml
- [ ] `gin-tonica-schweppes-lata-269ml.png` — Gin Tônica Schweppes Lata 269ml

### Outros

- [ ] `agua-sem-gas-lindoya-510ml.png` — Água sem Gás Lindoya 510ml
- [ ] `agua-com-gas-lindoya-510ml.png` — Água com Gás Lindoya 510ml
- [ ] `coca-cola-lata.png` — Coca-Cola Lata
- [ ] `coca-cola-zero-lata.png` — Coca-Cola Zero Lata
- [ ] `guarana-antarctica-lata.png` — Guaraná Antarctica Lata
- [ ] `schweppes-citrus-lata.png` — Schweppes Citrus Lata
- [ ] `agua-tonica-antarctica-lata.png` — Água Tônica Antarctica Lata
- [ ] `agua-tonica-antarctica-zero-lata.png` — Água Tônica Antarctica Zero Lata
- [ ] `energetico-red-bull-tradicional.png` — Energético Red Bull Tradicional
- [ ] `energetico-red-bull-zero-acucar.png` — Energético Red Bull Zero Açúcar
- [ ] `energetico-red-bull-tropical.png` — Energético Red Bull Tropical
- [ ] `energetico-red-bull-morango-e-pessego.png` — Energético Red Bull Morango e Pêssego
- [ ] `energetico-red-bull-melancia.png` — Energético Red Bull Melancia
- [ ] `halls-preto-ou-verde.png` — Halls Preto ou Verde
- [ ] `trident-verde-ou-azul.png` — Trident Verde ou Azul
- [ ] `leque-mitte-bar.png` — Leque Mitte Bar
- [ ] `eco-bag-mitte.png` — Eco Bag Mitte

### Comidas

- [ ] `empanada-cebola-e-queijo-campestre.png` — Empanada Cebola e Queijo — Campestre
- [ ] `empanada-queijo-e-tomate-caprese.png` — Empanada Queijo e Tomate — Caprese
- [ ] `empanada-carne-e-azeitona-platense.png` — Empanada Carne e Azeitona — Platense
- [ ] `porcao-mini-bolinha-de-queijo.png` — Porção Mini Bolinha de Queijo
- [ ] `porcao-mini-coxinha-de-frango-e-requeijao.png` — Porção Mini Coxinha de Frango e Requeijão
- [ ] `porcao-mini-kibe.png` — Porção Mini Kibe
- [ ] `porcao-mini-enroladinho-presunto-e-queijo.png` — Porção Mini Enroladinho Presunto e Queijo
- [ ] `porcao-esfirra-de-carne-fechada.png` — Porção Esfirra de Carne Fechada
- [ ] `porcao-esfirra-de-queijo-fechada.png` — Porção Esfirra de Queijo Fechada

### Sem Álcool

- [ ] `tropical-coconut.png` — Tropical Coconut
- [ ] `grape-basil.png` — Grape Basil
- [ ] `pineapple-collin-s.png` — Pineapple Collin's
- [ ] `strawberry-mule.png` — Strawberry Mule

### Clássicos

- [ ] `aperol-spritz.png` — Aperol Spritz
- [ ] `black-russian.png` — Black Russian
- [ ] `cosmopolitan.png` — Cosmopolitan
- [ ] `cuba-libre.png` — Cuba Libre
- [ ] `dry-martini.png` — Dry Martini
- [ ] `espresso-martini.png` — Espresso Martini
- [ ] `fitzgerald.png` — Fitzgerald
- [ ] `garibaldi.png` — Garibaldi
- [ ] `mojito.png` — Mojito
- [ ] `moscow-mule.png` — Moscow Mule
- [ ] `negroni-rosso.png` — Negroni Rosso
- [ ] `new-york-sour.png` — New York Sour

### Vodkas e Gins

- [ ] `basil-smash.png` — Basil Smash
- [ ] `gin-tonica.png` — Gin Tônica
- [ ] `compre-2-gins-tonicas-e-ganhe-a-terceira.png` — Compre 2 Gins Tônicas e Ganhe a Terceira
- [ ] `raspberri.png` — Raspberri
- [ ] `green-island.png` — Green Island
- [ ] `pink-energy.png` — Pink Energy
- [ ] `vai-tomando.png` — Vai Tomando

### Caipirinhas

- [ ] `batida-de-cafe.png` — Batida de Café
- [ ] `caipirita.png` — Caipirita
- [ ] `blue-coconut.png` — Blue Coconut
- [ ] `tanjuru.png` — Tanjuru
- [ ] `caipivinho-branco.png` — Caipivinho Branco
- [ ] `caipirinha-vodca-absolut.png` — Caipirinha Vodca Absolut
- [ ] `caipirinha-cachaca.png` — Caipirinha Cachaça
- [ ] `caipirinha-saque.png` — Caipirinha Saquê
- [ ] `caipirinha-jambu.png` — Caipirinha Jambu

### Tropicais

- [ ] `jambu-verao.png` — Jambu Verão
- [ ] `margarita-picante-de-tangerina.png` — Margarita Picante de Tangerina
- [ ] `mojito-vinho-branco.png` — Mojito Vinho Branco
- [ ] `paloma.png` — Paloma
- [ ] `porn-martini.png` — Porn Martini
- [ ] `crazy-life.png` — Crazy Life
- [ ] `tinto-de-verano.png` — Tinto de Verano
- [ ] `taca-mimosa.png` — Taça Mimosa
- [ ] `hungarian-poison.png` — Hungarian Poison

### Whisky

- [ ] `balla-jam-amora.png` — Balla Jam Amora
- [ ] `honey-nights.png` — Honey Nights
- [ ] `sunshine-citrus.png` — Sunshine Citrus
- [ ] `zero-b.png` — Zero B

### Vinhos e Espumantes

- [ ] `garrafa-espumante-brut-salton-750ml.png` — Garrafa Espumante Brut Salton 750ml
- [ ] `garrafa-espumante-moscatel-salton-750ml.png` — Garrafa Espumante Moscatel Salton 750ml
- [ ] `taca-de-espumante.png` — Taça de Espumante
- [ ] `garrafa-vinho-branco-sauvignon-chilano.png` — Garrafa Vinho Branco Sauvignon Chilano
- [ ] `taca-de-vinho.png` — Taça de Vinho

### Doses

- [ ] `absolut-dose-45ml.png` — Absolut — Dose 45ml
- [ ] `ballantine-s-sunshine-dose-45ml.png` — Ballantine's Sunshine — Dose 45ml
- [ ] `black-label-dose-45ml.png` — Black Label — Dose 45ml
- [ ] `chivas-dose-45ml.png` — Chivas — Dose 45ml
- [ ] `jambuzera-dose-45ml.png` — Jambuzera — Dose 45ml
- [ ] `jose-cuervo-ouro-dose-45ml.png` — José Cuervo Ouro — Dose 45ml
