# Pendências de revisão

**100 itens** em **11 abas**, sendo 5 marcados como fora de linha.
Os itens com pendência estão marcados com `"confirmar": true` no
`src/data/cardapio.json` — é uma anotação interna, não aparece na tela.

---

## 1. Itens que podem estar faltando

Os prints são recortes de rolagem do painel. Em três pontos a lista foi cortada:

| # | Onde | O que falta |
|---|---|---|
| 1 | **Início da aba Latas** | O primeiro print já começa em *Combo 4 Corona Lata 350ml*. Tudo que vinha antes ficou de fora — provavelmente as cervejas avulsas (Corona, Stella, Heineken, Budweiser…) e chopps. **Esta é a lacuna maior.** |
| 2 | **Aba Doses** | Entre *Chivas Dose 45ml* (último do print 20) e *Jambuzera Dose 45ml* (primeiro do print 21) pode haver linhas não capturadas. |
| 3 | **Aba Vinhos e Espumantes** | Abaixo de *Garrafa Vinho Branco Sauvignon Chilano* aparecia outra garrafa Chilano cortada — provavelmente um tinto. Não foi inventado nada; falta o print. |

Me manda os prints desses três trechos e eu completo o `cardapio.json`.

---

## 2. Descrições inferidas (18)

Para os clássicos usei a receita padrão — Negroni, Mojito, Paloma, Espresso Martini etc. estão corretos. Os drinks autorais da casa eu deduzi pelo nome e pela foto do painel, então **precisam passar pelo bar antes de publicar**:

| Aba | Item | Descrição proposta |
|---|---|---|
| Latas | Chopp Vinho Draft 600ml | *Garrafa 600ml gelada.* — o nome está ambíguo: a foto é de garrafa de cerveja, mas o nome diz "vinho". Qual é o produto? |
| Sem Álcool | Tropical Coconut | Água de coco, abacaxi e limão. |
| Sem Álcool | Grape Basil | Uva, manjericão e limão. |
| Sem Álcool | Pineapple Collin's | Abacaxi, limão, xarope e água com gás. |
| Sem Álcool | Strawberry Mule | Morango, gengibre, limão e ginger beer. |
| Vodkas e Gins | Raspberri | Vodca, framboesa e limão. |
| Vodkas e Gins | Green Island | Gin, hortelã, limão e xarope. |
| Vodkas e Gins | Pink Energy | Vodca, frutas vermelhas e energético. |
| Vodkas e Gins | Vai Tomando | Vodca com cítricos e maracujá. |
| Caipirinhas | Blue Coconut | Vodca, curaçau blue e coco. |
| Caipirinhas | Tanjuru | Saquê com tangerina e limão. |
| Tropicais | Jambu Verão | Cachaça de jambu, cítricos e espumante. |
| Tropicais | Crazy Life | Vodca com laranja e maracujá. |
| Tropicais | Hungarian Poison | Destilado com frutas vermelhas e cítricos. |
| Whisky | Balla Jam Amora | Whisky Ballantine's, amora e limão. |
| Whisky | Honey Nights | Whisky, mel, maracujá e limão. |
| Whisky | Sunshine Citrus | Ballantine's Sunshine, abacaxi e cítricos. |
| Whisky | Zero B | Whisky com cola zero e limão. |

No JSON esses itens têm `"confirmar": true`. Quando o bar validar, é só apagar
essa chave. Enquanto isso a descrição **aparece normalmente para o cliente** —
então vale conferir antes de publicar, não depois.

---

## 3. Itens riscados no painel

Riscado foi lido como **fora de linha**: o item fica no JSON com
`"fora_de_linha": true`, não aparece em nenhuma tela e não entra na contagem
da categoria. Basta remover a chave se voltar ao cardápio.

**Dentro das abas (5):**

- Comidas — Porção Mini Bolinha de Queijo (R$ 32,00)
- Sem Álcool — Grape Basil (R$ 28,00)
- Clássicos — Cosmopolitan (R$ 37,00)
- Clássicos — New York Sour (R$ 36,00)
- Caipirinhas — Caipivinho Branco (R$ 32,00)

**Fora de qualquer aba (3)** — ficaram no final do painel, todos riscados, e os áudios não os citaram. Estão guardados em `fora_do_cardapio` no JSON, com um palpite de aba caso voltem:

- Café Coado (R$ 9,00)
- Café Expresso (R$ 12,00)
- Spritzer Verão (R$ 32,00)

---

## 4. Decisões que tomei e você pode querer mudar

- **Nomes normalizados.** O painel está em caixa alta com erros de digitação; corrigi para escrita normal e deixei a caixa alta por CSS. Ajustes feitos: `GUARANÁ ANTÁRITCA` → Guaraná Antarctica · `SCHWEEPES` → Schweppes · `CHOOP` → Chopp · `CAIPIRINHA VODKA ABSOLUT` → Caipirinha Vodca Absolut · `REDBULL` → Red Bull. Os preços não foram tocados.
- **Empanadas** ganharam o nome do recheio na frente e o nome próprio depois (*Empanada Cebola e Queijo — Campestre*), porque "Campestre" sozinho não diz nada para quem lê.
- **A promoção dos gins** (*Compre 2 gins tônicas e ganhe a terceira*, R$ 68,00) está marcada com `"destaque": true` e ganha tratamento visual diferenciado dentro de Vodkas e Gins.
- **Leque e Eco Bag** ficaram em *Outros*, como o áudio indicou. Se virarem uma linha de produtos, vale uma aba "Loja".

---

## 5. Transcrição dos áudios

Transcrito localmente com Whisper (modelo `small`), então há ruído nos nomes próprios — a interpretação cruzou cada trecho com a ordem dos prints.

> **1.** "A gente separou esses itens por abas. Os primeiros estão na aba Latas…"
>
> **2.** "Até a gin tônica Schweppes tudo é lata. As águas, Coca-Cola, energético, Halls e o leque até a eco bag está na aba Outros. A partir dessa aba Outros a gente vem com as comidas, da empanada até a esfirra, na aba Comidas. E aí por fim a gente entra com Tropical Coconut até o Strawberry Mule — são itens sem álcool. Abaixo dos itens sem álcool entram os clássicos, o Aperol até o New York Sour. Os itens Basil Smash até o item Vai Tomando são vodcas e gins."
>
> **3.** "Depois do item Vai Tomando, da aba vodcas e gins, entram as caipirinhas, que entra a batida de café até a caipirinha de jambu. E aí por fim entram uns tropicais, que é da Jambu Verão até a Hungarian Poison."
>
> **4.** "Depois tem uma aba chamada Whisky, Balla Jam até o Zero B."
>
> **5.** "E por fim vêm os itens vinho e espumante, que é da garrafa de espumante até a taça de vinho."
>
> **6.** "Os outros itens são todos doses."

A ordem das abas no cardápio segue exatamente essa narração.
