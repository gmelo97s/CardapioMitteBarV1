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
