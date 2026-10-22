# Prompt universal — fotos de produto no Gemini

Para transformar foto de fundo branco (Google, e-commerce) no padrão do
cardápio: **quadrado 1024×1024, fundo preto infinito, mesma luz em todas**.

O ponto que faz ou quebra o conjunto não é cada imagem isolada: é a
**consistência**. Cem imagens com luzes diferentes viram colcha de retalhos no
grid. Por isso o prompt fixa ângulo, altura da câmera, direção da luz e tamanho
do produto no quadro — e você não muda nada disso entre um item e outro.

---

## O prompt (copie inteiro, em toda geração)

```
Use a imagem anexada como referência exata do produto. Não redesenhe, não
reinterprete e não altere o rótulo, a marca, a cor, o formato nem o conteúdo da
embalagem/copo — tudo deve permanecer idêntico ao original.

Recorte o produto do fundo original e recomponha a cena assim:

ENQUADRAMENTO
- Imagem quadrada, proporção 1:1, 1024×1024 pixels.
- Produto centralizado, vertical, ocupando cerca de 80% da altura do quadro.
- Margem livre e uniforme em volta; nada encostando ou cortando nas bordas.
- Câmera na altura do meio do produto, lente de 85mm, sem distorção de
  perspectiva, sem ângulo de cima nem de baixo.

FUNDO
- Preto infinito absoluto (#000000), liso, sem gradiente, sem textura, sem
  vinheta, sem parede, sem mesa, sem horizonte visível.

LUZ
- Iluminação de estúdio suave e difusa vinda de cima e levemente à frente.
- Realce discreto nas laterais do produto para separá-lo do fundo preto.
- Reflexo sutil no chão, logo abaixo do produto, curto e desfocado.
- Sem sombra dura, sem luz colorida, sem efeito dramático.

PROIBIDO
- Texto, legenda, marca d'água, logotipo adicional, selo, moldura ou borda.
- Props, adereços, gelo solto, frutas espalhadas, canudos, guardanapos, mãos,
  pessoas, plantas, bandejas ou qualquer segundo objeto.
- Blur artístico, bokeh, fumaça, respingos, grão de filme.

Resultado: foto de produto limpa, nítida, pronta para catálogo, sobre preto.
```

---

## Ajustes pontuais

Acrescente **uma** linha ao final, só quando se aplicar:

| Situação | Linha a acrescentar |
|---|---|
| Drink em taça/copo | `Mantenha a guarnição exatamente como na referência.` |
| Lata ou garrafa | `Rótulo de frente, totalmente legível, centralizado.` |
| Comida (empanada, porção) | `Sobre lousa preta fosca, sem prato branco e sem talheres.` |
| Foto de origem torta | `Endireite o produto para ficar perfeitamente vertical.` |
| Foto de origem pequena | `Aumente a nitidez e a definição das bordas e do rótulo.` |

Nada além disso. Cada linha extra que você inventa é uma chance de a imagem
sair com luz diferente das outras.

---

## Depois de gerar

1. Salve em `assets/itens/_brutas/` com **nome livre** — algo que lembre o item
   (`corona.png`, `caipirinha.png`). O script casa pelo nome.
2. Rode:

```bash
python tools/preparar-fotos.py --listar
```

3. Confira o casamento foto → item. Se algum estiver errado, corrija em
   `tools/mapa-fotos.json`.
4. Rode:

```bash
python tools/preparar-fotos.py && python tools/gerar-imagens.py
```

Combos não precisam de foto própria: salve **uma** lata e o script compõe as
quatro.

---

## O que não vale a pena gerar

Doses, águas, refrigerantes e balas são compra por nome — a foto ajuda pouco e
o card sem foto já mostra a inicial em neon rosa, que é um estado desenhado.
A ordem que rende mais é **Clássicos → Tropicais → Vodkas e Gins →
Caipirinhas → Comidas**.


---

## Onde a foto entra no projeto

As fotos novas vão para `assets/itens/_brutas/` **com o nome que tiverem**, e o
casamento foto→item fica em `tools/fotos-drive.json`, na seção certa:

| Seção | Quando usar | O que o script faz |
|---|---|---|
| `fotos` | Foto do bar: copo no balcão, comida na bandeja | Mantém o fundo. Acha o que está nítido e preenche as sobras com a própria foto desfocada e escurecida. |
| `produtos_no_branco` | Foto de catálogo sobre branco | Transforma o branco em alfa e remonta sobre o degradê escuro do card. |
| `fundo_para_trocar` | Produto sobre o painel colorido do salão | Recorta com rembg e devolve sobre o mesmo degradê escuro. Precisa de `pip install rembg`. |

Se a foto gerada no Gemini já sair sobre preto, ela é `fotos` e não precisa de
mais nada. Depois:

```bash
python tools/fotos-drive.py && python tools/gerar-imagens.py
```

Quando um copo ou garrafa aparece com algo ao lado que o recorte não dá conta
— copo de dose vazio, vidro transparente — dá para cortar antes, em `ajustes`:

```json
"jack-daniel-s-dose-45ml": { "recorte": [0.0, 0.0, 0.66, 1.0] }
```

---

## Os 12 itens que ainda faltam (21/10/2026)

### Latas
- [ ] `stella-artois-lata-350ml.png` — Stella Artois Lata 350ml
- [ ] `absolut-sprite-lata-269ml.png` — Absolut Sprite Lata 269ml
- [ ] `gin-tonica-pink-schweppes-lata-269ml.png` — Gin Tônica Pink Schweppes Lata 269ml
- [ ] `spritz-schweppes-lata-269ml.png` — Spritz Schweppes Lata 269ml
- [ ] `gin-tonica-schweppes-lata-269ml.png` — Gin Tônica Schweppes Lata 269ml

### Outros
- [ ] `eco-bag-mitte.png` — Eco Bag Mitte

### Comidas
- [ ] `porcao-vegana-mini-coxinha-de-jaca.png` — Porção Vegana Mini Coxinha de Jaca
- [ ] `porcao-vegana-mini-kibe.png` — Porção Vegana Mini Kibe
- [ ] `porcao-vegana-mini-bolinha-de-queijo.png` — Porção Vegana Mini Bolinha de Queijo

### Autorais
- [ ] `party.png` — Party

### Caipirinhas
- [ ] `caipirinha-saque.png` — Caipirinha Saquê

### Tropicais
- [ ] `porn-martini.png` — Porn Martini

Os quatro Schweppes/Absolut em lata e a Stella avulsa são produto de
prateleira: foto de e-commerce com fundo branco no Google, seção
`produtos_no_branco`, e o prompt acima resolve. As três porções veganas, a
Caipirinha Saquê, o Porn Martini e o Party são da casa — ou fotografa no bar,
ou gera.
