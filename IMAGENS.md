# Imagens dos itens — como são feitas

**50 dos 115 itens têm foto.** A lista do que falta está em
[REVISAR.md § 2](REVISAR.md). Item sem foto mostra a **inicial em neon rosa**
— é um estado desenhado, não um buraco.

Existem dois caminhos, porque existem dois tipos de foto.

---

## Caminho A — fotos do bar (as 46 do Drive)

A pasta **NOVOS DRINKS** do Drive traz o copo no balcão, com a prateleira
desfocada atrás. Essas fotos **não** devem perder o fundo: o fundo *é* a
identidade do lugar, e é o que faz os cards parecerem um bar e não um
e-commerce.

```bash
# 1. baixe a pasta inteira do Drive para cá, sem renomear nada
#    https://drive.google.com/drive/folders/1mSI1PvnfAaAAxo1-AzQfmh3U9OEWADWj
assets/itens/_brutas/

# 2. aponte cada arquivo para o slug do item
tools/fotos-drive.json

# 3. gere
python tools/fotos-drive.py     # → masters 1024×1024
python tools/gerar-imagens.py   # → os .webp que o site serve
```

`tools/fotos-drive.py --listar` mostra o mapeamento sem processar nada.

### O que o script faz com cada foto

O copo quase sempre é mais alto do que a foto é larga. Um corte quadrado
comum decapitaria a borda ou comeria a base — justamente o que se olha num
drink. Então:

1. Um **passa-alta** separa o que está em foco (o copo) do que está
   desfocado (o balcão e a prateleira). Não precisa de modelo nenhum: o
   bokeh quase não tem alta frequência.
2. A região do copo é recortada com 10% de folga e **entra inteira** no
   quadrado.
3. As sobras laterais recebem a própria foto desfocada e escurecida, em vez
   de uma tarja preta — o fundo continua sendo o bar.

### A fileira de latas

`latas_bebidas prontas.png` traz oito latas numa fileira só, encostadas umas
nas outras — o alfa é contínuo, então não dá para separar por buraco. As
bordas de cada lata estão medidas em `tools/fotos-drive.json`, em
`fileira_de_latas.faixas` (x0, x1 em pixels do arquivo original).

Metade das latas está parcialmente atrás da vizinha, então o corte cai no
meio do cilindro. Um corte reto vira aresta de adesivo; o script dissolve
essa borda num degradê de alfa, que lê como sombra lateral.

Os combos (`combo-3-beats-lata` e companhia) são **montados**: as mesmas
latas em leque, com sobreposição e escadinha. Não é preciso achar uma foto
de "3 Beats" — basta dizer quais latas entram, em `fileira_de_latas.itens`.

### Fundo que briga com o cardápio

Cinco fotos do totem foram tiradas contra o painel pintado do salão —
verde-limão, amarelo e pink, todos saturados. Como foto do bar estão certas;
como card, ao lado de outros cinquenta sobre preto, liam como se viessem de
outro site.

Para essas, o fundo é trocado: o produto é recortado com `rembg` e recolocado
sobre o mesmo degradê escuro das outras latas, com a mesma sombra elíptica. A
foto continua sendo a do bar — só o fundo passa a ser o do cardápio.

```json
"fundo_para_trocar": {
  "heineken-lata-350ml": "2424.png"
}
```

Precisa do modelo, que baixa sozinho na primeira vez (~179 MB):

```bash
pip install "rembg[cpu]"
```

### Ajustes item a item

O **enquadramento** não entra aqui: ele é um só para os 113 cards, e é
justamente isso que faz o grid ler como série. O que `ajustes` afrouxa é o
**recorte** — o que o modelo precisa ver, e com qual modelo.

```json
"ajustes": {
  "jambuzera-dose-45ml":            { "limiar": 224, "desvio": 20 },
  "jack-daniel-s-dose-45ml":        { "recorte": [0.0, 0.0, 0.66, 1.0] },
  "porcao-esfirra-de-carne-fechada": { "modelo": "birefnet-general-lite",
                                       "recorte": [0.0, 0.45, 0.93, 1.0] }
}
```

| Chave | Para que serve |
|---|---|
| `recorte` | `[x0, y0, x1, y1]` em fração da foto, aplicado **antes** do recorte de fundo. Serve para tirar da cena o que o modelo não dá conta: o copo de dose vazio em vidro transparente, a mão que segura a bandeja, a ponta da bandeira de arco-íris |
| `modelo` | qual modelo de recorte usar. O padrão (`isnet-general-use`) resolve 104 dos 113 |
| `limiar`, `desvio` | o que conta como fundo branco nas fotos de catálogo. Afrouxar resolve véu de scanner e tarja de rodapé — e come topo prateado de lata, então é item a item |

#### Quando trocar o modelo

O padrão erra quando o fundo é **mais saliente que o produto**. Nas fotos de
porção isso acontece duas vezes: a camiseta vermelha atrás do kibe faz ele
furar o papelão escuro da bandeja — o "MITTE" sai rendado — e a bandeira de
arco-íris da esfirra é recortada *no lugar* da comida, devolvendo um card com
bandeira e sem esfirra.

Nesses dois o `birefnet-general-lite` acerta. Não vale trocar o padrão: nos
outros sete ele é **pior** — come a bandeja das empanadas e do enroladinho.
Daí o ajuste ser por item.

### Para ligar uma foto nova a um item

Uma linha em `tools/fotos-drive.json`:

```json
"fotos": {
  "party": "THUG LIFE.png"
}
```

A chave é o `slug` do item (está em `src/data/cardapio.json`), o valor é o
nome do arquivo como ele veio do Drive.

---

## Caminho B — fotos de produto (latas, garrafas, comida)

Para o que falta — águas, refrigerantes, Red Bull, doses, garrafas de vinho,
empanadas, porções — a foto útil é a de catálogo: produto recortado sobre
fundo liso. Aí vale o caminho antigo, que recorta o fundo e monta os combos
sozinho:

```bash
pip install pillow "rembg[cpu]"
python tools/preparar-fotos.py   # recorta o fundo e compõe os combos
python tools/gerar-imagens.py
```

`tools/preparar-fotos.py --listar` mostra qual foto crua vai para qual item;
`tools/mapa-fotos.json` corrige à mão o que o automático errar.

Nesse caminho, **uma** foto de Corona vira o card de "Combo 4 Corona": o
script lê o `4` do slug e compõe as quatro latas.

---

## O corte do card — por que as folgas importam

O master é quadrado, mas o card no celular não é: a altura da linha é fixa
(seis cards por tela) e a largura vem da coluna, então a proporção da figura
muda de aparelho para aparelho. Medindo 63 combinações de celular, ela vai de
**0,59** (tela alta e estreita) a **1,63** (tela baixa, barra do navegador
ocupando espaço). A foto entra com `object-fit: cover`, que corta o que não
couber — nos extremos, 20% de cada lado.

Quanto ele pode cortar sem decepar o produto é exatamente a folga que o
enquadramento deixa. `tools/medir-enquadramento.py` passa a máscara do `rembg`
nos masters publicados e devolve o pior caso de cada lado:

```bash
python tools/medir-enquadramento.py
```

```
109 masters medidos. Pior folga de cada lado:
  lateral    6.9%   (combo-4-heineken-lata-350ml)
  topo      16.9%   (mascate-drinks-melancia-e-framboesa-362ml)
  base       9.5%   (garrafa-espumante-brut-salton-750ml)
```

Disso saem os dois limites de proporção da `.card__figura img` em
`src/styles.css`, e o `object-position`, que divide o corte vertical na
proporção das duas folgas. **Mexeu no enquadramento, rode de novo e confira os
limites** — senão a próxima foto fora do padrão reaparece como garrafa sem
gargalo em algum celular que ninguém tem à mão.

---

## A especificação

**Um master por item, 1024 × 1024, quadrado.** Não faça três versões por
aparelho: o card é quadrado nos três, muda só o tamanho, e o `srcset`
resolve a resolução sozinho.

| Onde | Largura do card | Pixels reais |
|---|---|---|
| Celular (375px, 3x) | ~165 px | ~495 px |
| Desktop (1920px, 1x) | ~165 px | ~165 px |
| Totem (1080–1920px, 1x) | ~250 px | ~250 px |
| **Detalhe aberto (retina, 2x)** | 416 px | **~832 px** |

O pico é o detalhe aberto num celular retina. Por isso a maior saída é
**800 px** — acima disso é peso sem ganho visível. O master a 1024 dá folga.

Se for gerar imagem em vez de fotografar, peça 1:1, 1024×1024, e mande a
**mesma luz em todas** — cem imagens com iluminações diferentes viram colcha
de retalhos:

> Copo de drink sobre balcão escuro de bar, luz de neon azul e rosa
> desfocada ao fundo, foco no copo, enquadramento vertical, sem texto, sem
> marca d'água.

### O que não vai para o repositório

`assets/itens/_brutas/` e `assets/itens/_masters/` estão no `.gitignore`:
são ~140 MB de original. O que vai para o ar são os `.webp` de 400 e 800 px
em `assets/itens/` — 3,7 MB para os 50 itens. A origem de cada um está
registrada em `tools/fotos-drive.json`, então a pasta do Drive reconstrói
tudo a qualquer momento.
