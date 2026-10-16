const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* Larguras geradas por tools/gerar-imagens.py. 400 cobre card em celular,
   800 cobre card em totem e telas 2x. */
const LARGURAS = [400, 800];

const el = {
  telas: {
    hero: document.querySelector("#tela-hero"),
    categorias: document.querySelector("#tela-categorias"),
    itens: document.querySelector("#tela-itens"),
  },
  gradeCategorias: document.querySelector("#grade-categorias"),
  gradeItens: document.querySelector("#grade-itens"),
  rolagemItens: document.querySelector("#rolagem-itens"),
  tituloCategoria: document.querySelector("#titulo-categoria"),
  busca: document.querySelector("#busca"),
  campoBusca: document.querySelector("#campo-busca"),
  chips: document.querySelector("#chips"),
  resultados: document.querySelector("#resultados"),
  detalhe: document.querySelector("#detalhe"),
  detalheCaixa: document.querySelector("#detalhe-caixa"),
};

const state = { dados: null, tela: "hero", categoria: null, indice: [] };

/* Totem: forçado por ?totem=1, ou deduzido de tela grande sem mouse. */
if (
  new URLSearchParams(location.search).get("totem") === "1" ||
  (matchMedia("(hover: none)").matches && innerWidth >= 1024)
) {
  document.body.classList.add("totem");
}

iniciar();

async function iniciar() {
  const res = await fetch("./src/data/cardapio.json");
  state.dados = await res.json();
  construirIndice();
  montarCategorias();

  document.querySelector("#abrir-cardapio").addEventListener("click", () => irPara("categorias"));
  document.querySelector("#voltar-hero").addEventListener("click", () => irPara("hero", true));
  document.querySelector("#voltar-categorias").addEventListener("click", () => irPara("categorias", true));

  for (const b of document.querySelectorAll("[data-abrir-busca]")) {
    b.addEventListener("click", abrirBusca);
  }
  document.querySelector("#fechar-busca").addEventListener("click", fecharBusca);
  el.campoBusca.addEventListener("input", () => renderResultados(el.campoBusca.value));

  el.detalhe.addEventListener("click", (e) => {
    if (e.target === el.detalhe) fecharDetalhe();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (el.detalhe.hasAttribute("data-aberto")) fecharDetalhe();
    else if (el.busca.hasAttribute("data-aberta")) fecharBusca();
    else if (state.tela === "itens") irPara("categorias", true);
    else if (state.tela === "categorias") irPara("hero", true);
  });
}

/* ==========================================================================
   Navegação entre telas
   ========================================================================== */

function irPara(nome, voltando = false) {
  if (nome === state.tela) return;
  const saindo = el.telas[state.tela];
  const entrando = el.telas[nome];

  saindo.removeAttribute("data-ativa");
  saindo.setAttribute("data-saindo", "");
  saindo.addEventListener("animationend", () => saindo.removeAttribute("data-saindo"), { once: true });

  entrando.toggleAttribute("data-volta", voltando);
  entrando.setAttribute("data-ativa", "");

  state.tela = nome;
}

function abrirCategoria(aba) {
  state.categoria = aba;
  el.tituloCategoria.textContent = aba.nome;
  montarItens(aba.itens);
  el.rolagemItens.scrollTop = 0;
  irPara("itens");
}

/* ==========================================================================
   Categorias
   ========================================================================== */

/* Cada aba tem um acento próprio, dentro da paleta da marca. Serve para a
   pessoa reconhecer a seção pela cor antes de ler o nome — e é o que separa
   uma grade de onze retângulos iguais de um menu que tem ritmo. */
const ACENTOS = {
  latas: "#00FFFF",
  outros: "#AA33FF",
  comidas: "#FF3399",
  "sem-alcool": "#00FF80",
  classicos: "#FF3399",
  "vodkas-gins": "#00FFFF",
  caipirinhas: "#00FF80",
  tropicais: "#FF3399",
  whisky: "#AA33FF",
  "vinhos-espumantes": "#AA33FF",
  doses: "#00FFFF",
};

function montarCategorias() {
  el.gradeCategorias.replaceChildren(
    ...state.dados.abas.map((aba, i) => {
      const disponiveis = aba.itens.filter((it) => !it.fora_de_linha);
      const b = document.createElement("button");
      b.className = "categoria";
      b.type = "button";
      b.style.setProperty("--i", i);
      b.style.setProperty("--acento", ACENTOS[aba.id] ?? "#FF3399");
      b.innerHTML = `
        <span class="categoria__indice" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <span class="categoria__nome">${esc(aba.nome)}</span>
        <span class="categoria__seta" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6"></path>
          </svg>
        </span>`;
      b.addEventListener("click", () => abrirCategoria({ ...aba, itens: disponiveis }));
      return b;
    })
  );
}

/* ==========================================================================
   Itens
   ========================================================================== */

function montarItens(itens) {
  el.gradeItens.replaceChildren(...itens.map((item, i) => cardDoItem(item, i)));
}

/* `aba` só vem na busca: ali os resultados atravessam o cardápio inteiro e o
   card precisa dizer de onde saiu. Dentro de uma categoria seria redundante. */
function cardDoItem(item, i, aba = null) {
  const b = document.createElement("button");
  b.className = "card" + (item.destaque ? " card--destaque" : "");
  b.type = "button";
  b.style.setProperty("--i", i);
  b.innerHTML = `
    <span class="card__figura">
      <span class="card__inicial" aria-hidden="true">${esc(iniciais(item.nome))}</span>
      ${figura(item, "(max-width: 48rem) 44vw, 16rem")}
      <span class="card__preco">${BRL.format(item.preco)}</span>
    </span>
    <span class="card__corpo">
      ${aba ? `<span class="card__aba">${esc(aba)}</span>` : ""}
      <span class="card__nome">${esc(item.nome)}</span>
      ${item.descricao ? `<span class="card__desc">${esc(item.descricao)}</span>` : ""}
    </span>`;
  b.addEventListener("click", () => abrirDetalhe(item));
  return b;
}

/* A foto fica por cima da inicial. Só é pedida quando gerar-imagens.py marcou
   "imagem": true — sem isso, cem cards disparariam cem 404 em toda abertura.
   O onerror fica como rede de segurança se um arquivo for apagado à mão. */
function figura(item, sizes) {
  if (!item.slug || !item.imagem) return "";
  const base = `assets/itens/${item.slug}`;
  const srcset = LARGURAS.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
  return `<img src="${base}-400.webp" srcset="${srcset}" sizes="${sizes}"
               alt="" loading="lazy" decoding="async"
               onerror="this.remove()">`;
}

function iniciais(nome) {
  return nome
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase() || nome[0].toUpperCase();
}

/* ==========================================================================
   Detalhe
   ========================================================================== */

function abrirDetalhe(item) {
  const entrada = state.indice.find((e) => e.item === item);
  const acompanha = sugerir(item);

  el.detalheCaixa.innerHTML = `
    <button class="detalhe__fechar icone" type="button" aria-label="Fechar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"></path></svg>
    </button>
    <span class="detalhe__figura">
      <span class="card__inicial" aria-hidden="true">${esc(iniciais(item.nome))}</span>
      ${figura(item, "(max-width: 30rem) 100vw, 26rem")}
    </span>
    <div class="detalhe__corpo">
      ${entrada ? `<span class="card__aba">${esc(entrada.aba)}</span>` : ""}
      <h2 class="detalhe__nome">${esc(item.nome)}</h2>
      <span class="detalhe__preco">${BRL.format(item.preco)}</span>
      ${item.descricao ? `<p class="detalhe__desc">${esc(item.descricao)}</p>` : ""}
    </div>
    ${acompanha.length ? `
    <div class="acompanha">
      <p class="acompanha__titulo">${esc(rotuloSugestao(item))}</p>
      <div class="acompanha__linha"></div>
    </div>` : ""}`;

  el.detalheCaixa.querySelector(".detalhe__fechar").addEventListener("click", fecharDetalhe);

  const linha = el.detalheCaixa.querySelector(".acompanha__linha");
  if (linha) {
    linha.append(
      ...acompanha.map(({ item: sugerido }, i) => {
        const b = document.createElement("button");
        b.className = "acompanha__item";
        b.type = "button";
        b.style.setProperty("--i", i);
        b.innerHTML = `
          <span class="acompanha__figura">
            <span class="card__inicial" aria-hidden="true">${esc(iniciais(sugerido.nome))}</span>
            ${figura(sugerido, "6rem")}
          </span>
          <span class="acompanha__nome">${esc(sugerido.nome)}</span>
          <span class="acompanha__preco">${BRL.format(sugerido.preco)}</span>`;
        /* Trocar o conteúdo em vez de empilhar diálogos: a pessoa navega
           de sugestão em sugestão e um só "fechar" encerra tudo. */
        b.addEventListener("click", () => {
          abrirDetalhe(sugerido);
          el.detalheCaixa.scrollTop = 0;
        });
        return b;
      })
    );
  }

  el.detalhe.setAttribute("data-aberto", "");
  el.detalheCaixa.scrollTop = 0;
}

function fecharDetalhe() {
  el.detalhe.removeAttribute("data-aberto");
}

/* ==========================================================================
   Sugestões de acompanhamento
   ========================================================================== */

/* De qual aba sai a sugestão, para cada aba de origem. Drink puxa comida,
   comida puxa drink, e dose puxa o que se mistura com ela. */
const ACOMPANHA = {
  comidas: ["classicos", "tropicais", "caipirinhas", "vodkas-gins", "latas"],
  doses: ["outros", "latas"],
  outros: ["comidas"],
  latas: ["comidas"],
};
const ACOMPANHA_PADRAO = ["comidas"];

function rotuloSugestao(item) {
  const entrada = state.indice.find((e) => e.item === item);
  if (entrada?.abaId === "comidas") return "Para beber junto";
  if (entrada?.abaId === "doses") return "Para misturar";
  return "Vai bem com";
}

/* Embaralha de forma estável: o mesmo item sugere sempre o mesmo trio, mas
   itens diferentes sugerem trios diferentes. Sem isso, ou todo mundo vê as
   três primeiras comidas da lista, ou a tela muda a cada abertura. */
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sugerir(item, quantos = 3) {
  const entrada = state.indice.find((e) => e.item === item);
  if (!entrada) return [];

  const alvos = ACOMPANHA[entrada.abaId] ?? ACOMPANHA_PADRAO;
  const candidatos = state.indice.filter(
    (e) => e.item !== item && alvos.includes(e.abaId)
  );
  if (!candidatos.length) return [];

  const base = semente(item.slug ?? item.nome);
  return candidatos
    .map((e, i) => ({ e, ordem: semente(`${base}-${e.item.slug ?? i}`) }))
    .sort((a, b) => a.ordem - b.ordem)
    .slice(0, quantos)
    .map(({ e }) => e);
}

/* ==========================================================================
   Busca
   ========================================================================== */

/* O índice guarda palavras, não uma string única: comparar por prefixo de
   palavra evita que "sem" case com "sempre" e "gin" com "original".
   O subtítulo da aba fica de fora de propósito — é texto de vitrine, e
   "cervejas geladas" fazia todo item de Latas virar cerveja. */
function construirIndice() {
  state.indice = state.dados.abas.flatMap((aba) =>
    aba.itens
      .filter((it) => !it.fora_de_linha)
      .map((item) => ({
        item,
        aba: aba.nome,
        abaId: aba.id,
        palavras: normalizar(`${item.nome} ${item.descricao ?? ""} ${aba.nome}`)
          .split(/[^a-z0-9]+/)
          .filter(Boolean),
        /* Separadas porque casar no nome vale mais do que casar na descrição
           ou no nome da aba — é o que ordena o resultado por relevância. */
        palavrasNome: normalizar(item.nome).split(/[^a-z0-9]+/).filter(Boolean),
      }))
  );
}

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/* Intenções: a pessoa no balcão não digita "porção", digita "tô com fome".
   Cada intenção é um filtro sobre o índice, disparado por frases soltas.
   É o que faz a barra parecer que entende, sem nenhum modelo por trás. */
const INTENCOES = [
  {
    rotulo: "Tô com fome",
    gatilhos: ["fome", "comer", "comida", "petisco", "beliscar", "salgado", "lanche", "faminto"],
    filtro: (e) => e.abaId === "comidas",
  },
  {
    rotulo: "Pra dividir",
    gatilhos: ["dividir", "compartilhar", "galera", "turma", "mesa", "porcao", "porcoes", "combo", "combos", "varios"],
    filtro: (e) => /^(combo|porcao)/.test(e.item.slug ?? "") || /esfirra|porcao/.test(e.item.slug ?? ""),
  },
  {
    rotulo: "Algo barato",
    gatilhos: ["barato", "baratos", "barata", "economico", "em conta", "mais barato", "pouco", "promocao", "promo"],
    filtro: (e) => e.item.preco <= 25,
    ordenar: "preco",
  },
  {
    rotulo: "Sem álcool",
    gatilhos: ["sem alcool", "nao bebo", "dirigindo", "zero alcool", "nao alcoolico", "sem bebida"],
    filtro: (e) => e.abaId === "sem-alcool" || e.abaId === "outros",
  },
  {
    rotulo: "Algo forte",
    gatilhos: ["forte", "destilado", "destilados", "pesado", "encher a cara", "shot", "shots"],
    filtro: (e) => e.abaId === "doses" || e.abaId === "classicos",
  },
  {
    rotulo: "Refrescante",
    gatilhos: ["refrescante", "refrescar", "gelado", "calor", "verao", "leve"],
    filtro: (e) => ["tropicais", "caipirinhas", "sem-alcool"].includes(e.abaId),
  },
  {
    rotulo: "Algo doce",
    gatilhos: ["doce", "adocicado", "sobremesa", "docinho"],
    filtro: (e) =>
      /moscatel|condensado|mel|morango|framboesa|coco|batida|melancia|manga/.test(
        normalizar(`${e.item.nome} ${e.item.descricao ?? ""}`)
      ),
  },
];

/* Apelidos do balcão: o que a pessoa digita nem sempre é o que está escrito
   no cardápio. */
const APELIDOS = {
  cerveja: ["corona", "stella", "chopp"],
  cervejas: ["corona", "stella", "chopp"],
  breja: ["corona", "stella", "chopp"],
  refri: ["refrigerante", "coca", "guarana", "schweppes"],
  refrigerante: ["coca", "guarana", "schweppes"],
  energetico: ["bull"],
  petisco: ["porcao", "empanada", "esfirra", "coxinha", "kibe"],
  petiscos: ["porcao", "empanada", "esfirra", "coxinha", "kibe"],
  comida: ["porcao", "empanada", "esfirra", "coxinha", "kibe"],
  comidas: ["porcao", "empanada", "esfirra", "coxinha", "kibe"],
  shot: ["dose"],
  shots: ["dose"],
  doce: ["moscatel", "condensado"],
  vinho: ["espumante"],
};

function abrirBusca() {
  el.busca.setAttribute("data-aberta", "");
  el.campoBusca.value = "";
  renderResultados("");
  setTimeout(() => el.campoBusca.focus(), 60);
}

function fecharBusca() {
  el.busca.removeAttribute("data-aberta");
  el.campoBusca.blur();
}

/* Distância de edição com teto: para assim que passa do limite, então custa
   quase nada mesmo rodando contra todas as palavras do cardápio. */
function distancia(a, b, teto) {
  if (Math.abs(a.length - b.length) > teto) return teto + 1;
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let melhor = i;
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(atual[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
      melhor = Math.min(melhor, atual[j]);
    }
    if (melhor > teto) return teto + 1;
    anterior = atual;
  }
  return anterior[b.length];
}

/* Prefixo resolve a maioria ("neg" → negroni). O erro de digitação só é
   tolerado de 4 letras em diante: abaixo disso "gin" viraria "vin", "sim",
   "fim", e a busca passaria a devolver qualquer coisa. */
function parecido(termo, palavra) {
  if (palavra.startsWith(termo)) return true;
  if (termo.length < 4) return false;
  const teto = termo.length <= 6 ? 1 : 2;
  return distancia(termo, palavra, teto) <= teto;
}

function casaTermo(termo, palavras) {
  return palavras.some((p) => parecido(termo, p));
}

/* Ninguém digita só substantivo: "tô com fome", "pra dividir", "quero algo
   barato". Sem tirar essas palavras, "to" e "com" viram termos de busca e
   zeram o resultado que a intenção já tinha acertado. */
const PALAVRAS_VAZIAS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos",
  "em", "no", "na", "nos", "nas", "por", "pra", "para", "pro", "com", "sem", "que",
  "e", "ou", "me", "eu", "to", "tou", "estou", "ta", "tar", "esta", "tem", "ter",
  "quero", "queria", "gostaria", "vou", "vai", "algo", "alguma", "algum", "coisa",
  "mais", "menos", "muito", "bem", "ai", "la", "aqui", "voce", "voces", "nos",
  "seu", "sua", "meu", "minha", "esse", "essa", "isso", "aquele", "aquela",
]);

/* Quanto o item responde ao que foi digitado. Nome vale mais que descrição,
   e acerto exato vale mais que correção de digitação. */
function relevancia(entrada, grupos) {
  let nota = 0;
  for (const alts of grupos) {
    let melhor = 0;
    for (const t of alts) {
      if (entrada.palavrasNome.some((p) => p.startsWith(t))) melhor = Math.max(melhor, 4);
      else if (entrada.palavrasNome.some((p) => parecido(t, p))) melhor = Math.max(melhor, 3);
      else if (entrada.palavras.some((p) => p.startsWith(t))) melhor = Math.max(melhor, 2);
      else if (casaTermo(t, entrada.palavras)) melhor = Math.max(melhor, 1);
    }
    nota += melhor;
  }
  return nota;
}

function maisParecidos(termo, quantos) {
  return state.indice
    .map((e) => ({
      nome: e.item.nome,
      erro: Math.min(...e.palavras.map((p) => distancia(termo, p, 3))),
    }))
    .filter((x) => x.erro <= 3)
    .sort((a, b) => a.erro - b.erro)
    .slice(0, quantos)
    .map((x) => x.nome);
}

function renderResultados(consulta) {
  const q = normalizar(consulta.trim());

  /* 1. Intenções em linguagem natural, detectadas na frase inteira. */
  const intencoes = INTENCOES.filter((i) => i.gatilhos.some((g) => q.includes(g)));
  let resto = q;
  for (const i of intencoes) {
    for (const g of i.gatilhos) resto = resto.replaceAll(g, " ");
  }

  /* 2. Teto de preço: "até 30", "menos de 30", "<30". */
  const limite = resto.match(/(?:ate|menos de|abaixo de|max|<)\s*(\d+)/);
  const teto = limite ? Number(limite[1]) : null;
  if (limite) resto = resto.replace(limite[0], " ");

  /* 3. O que sobrou vira termos; cada um com seus apelidos como alternativa. */
  const grupos = resto
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !PALAVRAS_VAZIAS.has(t))
    .map((t) => [t, ...(APELIDOS[t] ?? [])]);

  const vazio = !intencoes.length && teto === null && !grupos.length;
  if (vazio) {
    el.resultados.innerHTML = `<p class="vazio">Procure por um drink, uma categoria ou um valor.<br>
      Também entende pedido solto: <em>tô com fome</em>, <em>algo barato</em>, <em>pra dividir</em>.</p>`;
    montarChips(q, []);
    return;
  }

  let achados = state.indice.filter((e) => {
    if (teto !== null && e.item.preco > teto) return false;
    if (!intencoes.every((i) => i.filtro(e))) return false;
    return grupos.every((alts) => alts.some((t) => casaTermo(t, e.palavras)));
  });

  if (intencoes.some((i) => i.ordenar === "preco")) {
    achados = [...achados].sort((a, b) => a.item.preco - b.item.preco);
  } else if (grupos.length) {
    achados = [...achados].sort(
      (a, b) => relevancia(b, grupos) - relevancia(a, grupos)
    );
  }

  montarChips(q, achados);

  if (!achados.length) {
    el.resultados.innerHTML = `<p class="vazio">Nada encontrado para “${esc(consulta.trim())}”.</p>`;
    return;
  }

  const grade = document.createElement("div");
  grade.className = "itens__grade";
  grade.append(...achados.slice(0, 60).map(({ item, aba }, i) => cardDoItem(item, i, aba)));

  const contagem = document.createElement("p");
  contagem.className = "busca__contagem";
  const rotulos = intencoes.map((i) => i.rotulo.toLowerCase());
  contagem.textContent =
    `${achados.length} ${achados.length === 1 ? "item" : "itens"}` +
    (rotulos.length ? ` · ${rotulos.join(" + ")}` : "");

  el.resultados.replaceChildren(contagem, grade);
}

/* Os chips são o atalho e o conserto: com o campo vazio mostram o que dá para
   pedir em linguagem solta; sem resultado, oferecem a correção. */
function montarChips(q, achados) {
  let chips = [];

  if (q.length < 2) {
    chips = INTENCOES.map((i) => ({ texto: i.rotulo, valor: i.rotulo }));
  } else if (!achados.length) {
    const ultimo = q.split(/[^a-z0-9]+/).filter(Boolean).pop() ?? q;
    chips = maisParecidos(ultimo, 4).map((nome) => ({
      texto: nome,
      valor: nome,
      correcao: true,
    }));
  } else {
    chips = INTENCOES.filter((i) => i.gatilhos.some((g) => g.startsWith(q) || q.includes(g)))
      .map((i) => ({ texto: i.rotulo, valor: i.rotulo }));
  }

  el.chips.replaceChildren(
    ...chips.slice(0, 7).map(({ texto, valor, correcao }) => {
      const b = document.createElement("button");
      b.className = "chip" + (correcao ? " chip--correcao" : "");
      b.type = "button";
      b.textContent = correcao ? `Você quis dizer ${texto}?` : texto;
      b.addEventListener("click", () => {
        el.campoBusca.value = valor;
        el.campoBusca.focus();
        renderResultados(valor);
      });
      return b;
    })
  );
}

/* ========================================================================== */

function esc(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}
