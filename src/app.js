const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/* Larguras geradas por tools/gerar-imagens.py. 400 cobre o card em tela 1x,
   600 é o degrau do celular retina (DPR 3 pede ~515px para um card de 172) e
   800 cobre o detalhe aberto e a totem. Sem o 600 no meio, todo celular
   moderno baixava o 800 em todos os cards. */
const LARGURAS = [400, 600, 800];

const el = {
  telas: {
    hero: document.querySelector("#tela-hero"),
    categorias: document.querySelector("#tela-categorias"),
    itens: document.querySelector("#tela-itens"),
  },
  coluna: document.querySelector("#grade-categorias"),
  gradeItens: document.querySelector("#grade-itens"),
  rolagemItens: document.querySelector("#rolagem-itens"),
  tituloCategoria: document.querySelector("#titulo-categoria"),
  painel: document.querySelector("#painel-cardapio"),
  campo: document.querySelector(".barra-busca .campo"),
  campoBusca: document.querySelector("#campo-busca"),
  fantasma: document.querySelector("#fantasma-busca"),
  limparBusca: document.querySelector("#limpar-busca"),
  resultados: document.querySelector("#resultados"),
  detalhe: document.querySelector("#detalhe"),
  detalheCaixa: document.querySelector("#detalhe-caixa"),
};

const state = { dados: null, tela: "hero", categoria: null, indice: [], abas: [] };

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
  state.abas = state.dados.abas.map((aba) => ({
    ...aba,
    itens: aba.itens.filter((it) => !it.fora_de_linha),
  }));
  construirIndice();
  montarCategorias();

  document.querySelector("#abrir-cardapio").addEventListener("click", () => irPara("categorias"));
  document.querySelector("#voltar-hero").addEventListener("click", () => irPara("hero", true));
  document.querySelector("#voltar-categorias").addEventListener("click", () => irPara("categorias", true));

  /* A lupa da tela de itens não abre um segundo campo: devolve para o único
     que existe, no topo do cardápio, já com o cursor dentro. */
  document.querySelector("#buscar-do-item").addEventListener("click", () => {
    irPara("categorias", true);
    setTimeout(() => el.campoBusca.focus(), 120);
  });

  el.campoBusca.addEventListener("input", () => buscar(el.campoBusca.value));
  demoDigitacao();
  el.limparBusca.addEventListener("click", () => {
    el.campoBusca.value = "";
    buscar("");
    el.campoBusca.focus();
  });

  el.detalhe.addEventListener("click", (e) => {
    if (e.target === el.detalhe) fecharDetalhe();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (el.detalhe.hasAttribute("data-aberto")) fecharDetalhe();
    else if (el.campoBusca.value) { el.campoBusca.value = ""; buscar(""); }
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
   uma coluna de doze pílulas iguais de um menu que tem ritmo. */
const ACENTOS = {
  latas: "#00FFFF",
  outros: "#AA33FF",
  comidas: "#FF3399",
  "sem-alcool": "#00FF80",
  autorais: "#FF3399",
  classicos: "#00FFFF",
  "vodkas-gins": "#00FF80",
  caipirinhas: "#AA33FF",
  tropicais: "#FF3399",
  whisky: "#00FFFF",
  "vinhos-espumantes": "#AA33FF",
  doses: "#00FF80",
};

const acento = (abaId) => ACENTOS[abaId] ?? "#FF3399";

function montarCategorias() {
  el.coluna.replaceChildren(
    ...state.abas.map((aba, i) => {
      const b = document.createElement("button");
      b.className = "categoria";
      b.type = "button";
      b.style.setProperty("--i", i);
      b.style.setProperty("--acento", acento(aba.id));
      b.innerHTML = `<span class="categoria__nome">${esc(aba.nome)}</span>`;
      b.addEventListener("click", () => abrirCategoria(aba));
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
  comidas: ["autorais", "classicos", "tropicais", "caipirinhas", "vodkas-gins", "latas"],
  doses: ["outros", "latas"],
  outros: ["comidas"],
  latas: ["comidas"],
  "vinhos-espumantes": ["comidas"],
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

/* --------------------------------------------------------------------------
   Demonstração de digitação na barra de busca

   O campo vazio não ensina nada. Aqui ele se digita sozinho, em rosa neon,
   alternando entre o que dá para pedir: um nome de bebida, uma categoria,
   um pedido solto. É placeholder animado, não sugestão clicável — some no
   instante em que a pessoa toca no campo.
   -------------------------------------------------------------------------- */

const DEMO = [
  "Gin", "Vodka", "Pra economizar", "Drinks", "Comida",
  "Porções", "Xeque Mate", "Caipirinha",
];

function demoDigitacao() {
  if (!el.fantasma || !el.campo) return;

  const lento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer = null;
  let anterior = -1;

  const agendar = (fn, ms) => { timer = setTimeout(fn, ms); };

  function parar() {
    clearTimeout(timer);
    timer = null;
    el.campo.removeAttribute("data-demo");
    el.fantasma.textContent = "";
  }

  function proxima() {
    /* Sorteia sem repetir a anterior: a mesma palavra duas vezes seguidas
       parece animação travada, não sorteio. */
    let i = Math.floor(Math.random() * DEMO.length);
    if (DEMO.length > 1 && i === anterior) i = (i + 1) % DEMO.length;
    anterior = i;
    const palavra = DEMO[i];

    if (lento) {
      el.fantasma.textContent = palavra;
      return agendar(proxima, 2600);
    }

    let n = 0;
    (function escreve() {
      el.fantasma.textContent = palavra.slice(0, ++n);
      if (n < palavra.length) return agendar(escreve, 58);
      agendar(function apaga() {
        el.fantasma.textContent = palavra.slice(0, --n);
        if (n > 0) return agendar(apaga, 28);
        agendar(proxima, 320);
      }, 1500);
    })();
  }

  function comecar() {
    if (timer || el.campoBusca.value || document.activeElement === el.campoBusca) return;
    el.campo.setAttribute("data-demo", "");
    proxima();
  }

  el.campoBusca.addEventListener("focus", parar);
  el.campoBusca.addEventListener("input", parar);
  /* Se a pessoa desiste e sai do campo vazio, a demonstração volta. */
  el.campoBusca.addEventListener("blur", () => { if (!el.campoBusca.value) comecar(); });
  /* Em aba oculta a animação acordaria o aparelho à toa. */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) parar();
    else if (!el.campoBusca.value) comecar();
  });

  comecar();
}

/* ==========================================================================
   Busca
   ========================================================================== */

function normalizar(texto) {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function palavrasDe(texto) {
  return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
}

/* Plural é o erro de digitação mais comum do balcão: a pessoa escreve
   "caipirinhas", o cardápio diz "Caipirinha". Cortar o "s" (e o "es" de
   "limões" → "limoes" → "limo") resolve antes de gastar distância de edição. */
function raiz(palavra) {
  if (palavra.length > 4 && palavra.endsWith("es")) return palavra.slice(0, -2);
  if (palavra.length > 3 && palavra.endsWith("s")) return palavra.slice(0, -1);
  return palavra;
}

/* O índice guarda palavras, não uma string única: comparar por prefixo de
   palavra evita que "sem" case com "sempre" e "gin" com "original".
   O subtítulo da aba fica de fora de propósito — é texto de vitrine, e
   "cervejas geladas" fazia todo item de Latas virar cerveja. */
function construirIndice() {
  state.indice = state.abas.flatMap((aba) =>
    aba.itens.map((item) => ({
      item,
      aba: aba.nome,
      abaId: aba.id,
      /* Separadas porque casar no nome vale mais do que casar na descrição
         ou no nome da aba — é o que ordena o resultado por relevância. */
      palavrasNome: palavrasDe(item.nome).map(raiz),
      palavrasDesc: palavrasDe(item.descricao ?? "").map(raiz),
      palavrasAba: palavrasDe(aba.nome).map(raiz),
    }))
  );
  for (const e of state.indice) {
    e.palavras = [...e.palavrasNome, ...e.palavrasDesc, ...e.palavrasAba];
  }
}

/* Intenções: a pessoa no balcão não digita "porção", digita "tô com fome".
   Cada intenção é um filtro sobre o índice, disparado por frases soltas.
   É o que faz a barra parecer que entende, sem nenhum modelo por trás. */
const INTENCOES = [
  {
    rotulo: "comida",
    gatilhos: ["fome", "comer", "comida", "petisco", "beliscar", "salgado", "lanche", "faminto", "fritura"],
    filtro: (e) => e.abaId === "comidas",
  },
  {
    rotulo: "pra dividir",
    gatilhos: ["dividir", "compartilhar", "galera", "turma", "mesa", "porcao", "porcoes", "combo", "combos", "varios", "em grupo"],
    filtro: (e) => /^(combo|porcao)/.test(e.item.slug ?? "") || /esfirra/.test(e.item.slug ?? ""),
  },
  {
    rotulo: "barato",
    gatilhos: ["barato", "baratos", "barata", "economico", "em conta", "mais barato", "promocao", "promo", "mais em conta"],
    filtro: (e) => e.item.preco <= 25,
    ordenar: "preco",
  },
  {
    rotulo: "sem álcool",
    gatilhos: ["sem alcool", "nao bebo", "dirigindo", "zero alcool", "nao alcoolico", "sem bebida", "virgem", "mocktail", "nao alcoolica"],
    filtro: (e) => e.abaId === "sem-alcool" || e.abaId === "outros",
  },
  {
    rotulo: "forte",
    gatilhos: ["forte", "destilado", "destilados", "pesado", "encher a cara", "shot", "shots", "puro"],
    filtro: (e) => e.abaId === "doses" || e.abaId === "classicos",
  },
  {
    rotulo: "refrescante",
    gatilhos: ["refrescante", "refrescar", "gelado", "gelada", "calor", "citrico", "leve"],
    filtro: (e) => ["tropicais", "caipirinhas", "sem-alcool"].includes(e.abaId),
  },
  {
    rotulo: "doce",
    gatilhos: ["doce", "adocicado", "sobremesa", "docinho", "cremoso"],
    filtro: (e) =>
      /moscatel|condensado|mel\b|morango|framboesa|coco|batida|melancia|manga|chantilly|chocolate|grenadine|uva/.test(
        normalizar(`${e.item.nome} ${e.item.descricao ?? ""}`)
      ),
  },
  {
    rotulo: "vegano",
    gatilhos: ["vegano", "vegana", "veggie", "vegetariano", "vegetariana", "sem carne"],
    filtro: (e) => /vegana/.test(e.item.slug ?? ""),
  },
  {
    rotulo: "da casa",
    gatilhos: ["autoral", "autorais", "da casa", "exclusivo", "assinatura", "novidade", "novidades", "lancamento"],
    filtro: (e) => e.abaId === "autorais",
  },
  {
    rotulo: "pra brindar",
    gatilhos: ["brindar", "brinde", "comemorar", "comemoracao", "aniversario", "festa"],
    filtro: (e) => e.abaId === "vinhos-espumantes" || /espumante|mimosa/.test(e.item.slug ?? ""),
  },
  {
    rotulo: "sem açúcar",
    gatilhos: ["sem acucar", "zero acucar", "diet", "light"],
    filtro: (e) => /zero/.test(normalizar(e.item.nome)),
  },
];

/* Apelidos do balcão: o que a pessoa digita quase nunca é o que está escrito
   no cardápio. Cada chave vira um grupo de alternativas — basta uma casar.
   As descrições agora trazem a receita inteira, então ingrediente também
   encontra: "hortelã" acha Mojito sem que Mojito precise de apelido. */
const APELIDOS = {
  // bebidas por categoria
  cerveja: ["heineken", "corona", "stella", "chopp", "lager"],
  breja: ["heineken", "corona", "stella", "chopp"],
  gelada: ["heineken", "corona", "stella", "lata"],
  refri: ["refrigerante", "coca", "guarana", "schweppes", "sprite"],
  refrigerante: ["coca", "guarana", "schweppes", "sprite"],
  coca: ["coca", "cola"],
  energetico: ["bull", "energetico"],
  energetica: ["bull", "energetico"],
  drink: ["drink", "coquetel"],
  drinque: ["drink", "coquetel"],
  coquetel: ["drink", "coquetel", "classico"],
  cocktail: ["drink", "coquetel", "classico"],
  shot: ["dose"],
  shots: ["dose"],
  taca: ["taca"],
  garrafa: ["garrafa"],

  // destilados e marcas, como se fala
  vodka: ["vodca", "absolut", "smirnoff"],
  vodca: ["vodca", "absolut", "smirnoff"],
  gim: ["gin", "beefeater", "seagers"],
  gin: ["gin", "beefeater", "seagers"],
  whiskey: ["whisky", "ballantine", "label", "chivas", "jack"],
  whisky: ["whisky", "ballantine", "label", "chivas", "jack"],
  uisque: ["whisky", "ballantine", "label", "chivas"],
  ballantines: ["ballantine"],
  balantines: ["ballantine"],
  johnnie: ["label"],
  johnny: ["label"],
  jack: ["jack", "daniel"],
  tequila: ["tequila", "cuervo", "margarita", "paloma"],
  rum: ["rum", "montilla", "mojito", "cuba"],
  cachaca: ["cachaca", "caipirinha", "batida"],
  pinga: ["cachaca", "caipirinha"],
  sake: ["saque"],
  licor: ["licor", "curacau", "campari", "aperol", "jurupinga"],
  espumante: ["espumante", "mimosa", "prosecco", "salton"],
  prosecco: ["espumante"],
  champagne: ["espumante"],
  vinho: ["vinho", "espumante", "chilano"],

  // frutas e ingredientes com mais de um nome
  limao: ["limao"],
  mexerica: ["tangerina", "mexerica"],
  tangerina: ["tangerina", "mexerica"],
  bergamota: ["tangerina"],
  toranja: ["grapefruit"],
  grapefruit: ["grapefruit", "paloma"],
  menta: ["hortela", "menta"],
  hortela: ["hortela", "menta"],
  manjericao: ["manjericao", "basil"],
  basil: ["manjericao", "basil"],
  cafe: ["cafe", "espresso"],
  expresso: ["espresso", "cafe"],
  gengibre: ["gengibre", "ginger", "mule"],
  ginger: ["gengibre", "ginger"],
  frutas: ["frutas", "tropical", "vermelhas"],
  "frutas vermelhas": ["morango", "framboesa", "amora"],
  amora: ["amora"],

  // comida
  petisco: ["porcao", "empanada", "esfirra", "coxinha", "kibe", "bolinha", "enroladinho", "torta"],
  petiscos: ["porcao", "empanada", "esfirra", "coxinha", "kibe", "bolinha", "enroladinho", "torta"],
  comida: ["porcao", "empanada", "esfirra", "coxinha", "kibe", "bolinha", "enroladinho", "torta"],
  salgadinho: ["coxinha", "kibe", "bolinha", "enroladinho", "esfirra"],
  queijo: ["queijo", "caprese", "bolinha"],
  carne: ["carne", "platense", "kibe"],
  frango: ["frango", "coxinha", "torta"],
  jaca: ["jaca", "vegana"],

  // modos de dizer o mesmo item
  gintonica: ["gin", "tonica"],
  caipira: ["caipirinha"],
  negrone: ["negroni"],
  aperol: ["aperol", "spritz"],
  spritz: ["spritz", "aperol"],
};

function abrirBuscaDaAba(aba) {
  el.campoBusca.value = "";
  buscar("");
  abrirCategoria(aba);
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
  /* O sentido inverso ("empanada" casando com a palavra "empanad") existe
     para quem digita mais do que o cardápio escreve — mas só a partir de 4
     letras. Sem esse piso, o "e" de "Vinhos e Espumantes" casava com toda
     palavra começada em E, e "espumante" devolvia o cardápio inteiro. */
  if (palavra.length >= 4 && termo.startsWith(palavra)) return true;
  if (termo.length < 4) return false;
  const teto = termo.length <= 6 ? 1 : 2;
  return distancia(termo, palavra, teto) <= teto;
}

const casaTermo = (termo, palavras) => palavras.some((p) => parecido(termo, p));

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
  "qual", "quais", "oque", "tipo", "beber", "tomar", "pedir", "ver", "reais",
  "real", "rs", "r", "custa", "preco", "opcao", "opcoes", "sugestao", "aba",
]);

/* Quanto o item responde ao que foi digitado. Nome vale mais que descrição,
   descrição vale mais que nome de aba, e acerto exato vale mais que correção
   de digitação — é isso que põe "Gin Tônica" acima de "Basil Smash" em "gin". */
function relevancia(entrada, grupos) {
  let nota = 0;
  for (const alts of grupos) {
    let melhor = 0;
    for (const [i, t] of alts.entries()) {
      let ponto = 0;
      if (entrada.palavrasNome.includes(t)) ponto = 6;
      else if (entrada.palavrasNome.some((p) => p.startsWith(t))) ponto = 5;
      else if (entrada.palavrasNome.some((p) => parecido(t, p))) ponto = 4;
      else if (entrada.palavrasDesc.some((p) => p.startsWith(t))) ponto = 3;
      else if (entrada.palavrasAba.some((p) => parecido(t, p))) ponto = 2;
      else if (casaTermo(t, entrada.palavrasDesc)) ponto = 1;
      /* A primeira alternativa é a palavra digitada; as outras são apelidos.
         Meio ponto a menos é o que põe o Mojito (tem hortelã escrito) na
         frente do Halls (só tem menta, que é apelido de hortelã). */
      if (ponto && i > 0) ponto -= 0.5;
      melhor = Math.max(melhor, ponto);
    }
    nota += melhor;
  }
  return nota;
}

/* Quanto do nome do item o que foi digitado já cobre. Desempata "gin" entre
   "Gin Tônica" (2 palavras, metade coberta) e "Gin Tônica Pink Schweppes
   Lata 269ml" (6 palavras): o nome curto é o que a pessoa quis dizer. */
function cobertura(entrada, grupos) {
  const casadas = entrada.palavrasNome.filter((p) =>
    grupos.some((alts) => alts.some((t) => parecido(t, p)))
  ).length;
  return casadas / entrada.palavrasNome.length;
}

/* Palpite de correção quando nada casou: o nome mais próximo do que sobrou. */
function maisParecido(termo) {
  let melhor = null;
  for (const e of state.indice) {
    const erro = Math.min(...e.palavrasNome.map((p) => distancia(termo, p, 3)));
    if (erro <= 3 && (!melhor || erro < melhor.erro)) melhor = { erro, nome: e.item.nome };
  }
  return melhor?.nome ?? null;
}

/* Aba cujo nome responde ao que foi digitado — "caipirinha" quase sempre
   quer a lista inteira, não um item solto. */
function abaPedida(termos) {
  if (!termos.length) return null;
  for (const aba of state.abas) {
    const palavras = palavrasDe(aba.nome).map(raiz);
    if (termos.every((t) => palavras.some((p) => parecido(t, p)))) return aba;
  }
  return null;
}

/* Preço dito de todo jeito: "até 30", "menos de 30", "<30", "acima de 50",
   "entre 20 e 40" — e o número solto, que no balcão sempre quer dizer teto. */
function lerPreco(texto) {
  let resto = texto;
  let teto = null;
  let piso = null;

  const faixa = resto.match(/entre\s*(\d{1,3})\s*(?:e|a)\s*(\d{1,3})/);
  if (faixa) {
    piso = Math.min(+faixa[1], +faixa[2]);
    teto = Math.max(+faixa[1], +faixa[2]);
    resto = resto.replace(faixa[0], " ");
  }

  const baixo = resto.match(/(?:ate|menos de|abaixo de|no maximo|max|<)\s*r?\$?\s*(\d{1,3})/);
  if (baixo) { teto = +baixo[1]; resto = resto.replace(baixo[0], " "); }

  const alto = resto.match(/(?:acima de|mais de|a partir de|>)\s*r?\$?\s*(\d{1,3})/);
  if (alto) { piso = +alto[1]; resto = resto.replace(alto[0], " "); }

  if (teto === null && piso === null) {
    const solto = resto.match(/(?:^|\s)r?\$?\s*(\d{1,3})(?:\s|$)/);
    if (solto) { teto = +solto[1]; resto = resto.replace(solto[0], " "); }
  }
  return { resto, teto, piso };
}

function buscar(consulta) {
  const q = normalizar(consulta.trim());
  el.limparBusca.hidden = !consulta;

  if (!q) {
    el.resultados.hidden = true;
    el.resultados.replaceChildren();
    el.coluna.hidden = false;
    el.painel.scrollTop = 0;
    return;
  }

  el.coluna.hidden = true;
  el.resultados.hidden = false;
  renderResultados(q, consulta.trim());
}

function renderResultados(q, original) {
  /* 1. Intenções em linguagem natural, detectadas na frase inteira. */
  const intencoes = INTENCOES.filter((i) => i.gatilhos.some((g) => q.includes(g)));
  let resto = q;
  for (const i of intencoes) {
    for (const g of i.gatilhos) resto = resto.replaceAll(g, " ");
  }

  /* 2. Teto e piso de preço, em qualquer das formas que se diz. */
  const preco = lerPreco(resto);
  resto = preco.resto;

  /* 3. O que sobrou vira termos; cada um com seus apelidos como alternativa. */
  const termos = resto
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !PALAVRAS_VAZIAS.has(t))
    .map(raiz);
  const grupos = termos.map((t) => [t, ...(APELIDOS[t] ?? []).map(raiz)]);

  if (!intencoes.length && preco.teto === null && preco.piso === null && !grupos.length) {
    vazio(`Nada encontrado para “${esc(original)}”.`);
    return;
  }

  let achados = state.indice.filter((e) => {
    if (preco.teto !== null && e.item.preco > preco.teto) return false;
    if (preco.piso !== null && e.item.preco < preco.piso) return false;
    if (!intencoes.every((i) => i.filtro(e))) return false;
    return grupos.every((alts) => alts.some((t) => casaTermo(t, e.palavras)));
  });

  if (intencoes.some((i) => i.ordenar === "preco")) {
    achados = [...achados].sort((a, b) => a.item.preco - b.item.preco);
  } else if (grupos.length) {
    achados = [...achados].sort((a, b) =>
      (relevancia(b, grupos) - relevancia(a, grupos)) ||
      (cobertura(b, grupos) - cobertura(a, grupos)) ||
      (a.item.preco - b.item.preco));
  }

  if (!achados.length) {
    const palpite = maisParecido(termos[termos.length - 1] ?? q);
    vazio(`Nada encontrado para “${esc(original)}”.`, palpite);
    return;
  }

  const partes = [];

  /* Atalho para a aba, quando o que foi digitado é o nome de uma seção. */
  const aba = abaPedida(termos);
  if (aba && !intencoes.length) {
    const b = document.createElement("button");
    b.className = "atalho-aba";
    b.type = "button";
    b.style.setProperty("--acento", acento(aba.id));
    b.innerHTML = `Ver a aba ${esc(aba.nome)} · ${aba.itens.length} itens
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6"></path>
      </svg>`;
    b.addEventListener("click", () => abrirBuscaDaAba(aba));
    partes.push(b);
  }

  const contagem = document.createElement("p");
  contagem.className = "resultados__contagem";
  const rotulos = intencoes.map((i) => i.rotulo);
  if (preco.piso !== null && preco.teto !== null) {
    rotulos.push(`de ${BRL.format(preco.piso)} a ${BRL.format(preco.teto)}`);
  } else if (preco.teto !== null) {
    rotulos.push(`até ${BRL.format(preco.teto)}`);
  } else if (preco.piso !== null) {
    rotulos.push(`a partir de ${BRL.format(preco.piso)}`);
  }
  contagem.textContent =
    `${achados.length} ${achados.length === 1 ? "item" : "itens"}` +
    (rotulos.length ? ` · ${rotulos.join(" + ")}` : "");
  partes.push(contagem);

  const grade = document.createElement("div");
  grade.className = "itens__grade";
  grade.append(...achados.slice(0, 60).map(({ item, aba }, i) => cardDoItem(item, i, aba)));
  partes.push(grade);

  el.resultados.replaceChildren(...partes);
  el.painel.scrollTop = 0;
}

function vazio(mensagem, palpite = null) {
  const p = document.createElement("p");
  p.className = "vazio";
  p.innerHTML = `${mensagem}<br>
    Dá para pedir solto: <em>tô com fome</em>, <em>algo barato</em>,
    <em>sem álcool</em>, <em>pra dividir</em>, <em>até 30</em>.`;

  const partes = [p];
  if (palpite) {
    const linha = document.createElement("p");
    linha.className = "correcao";
    linha.append("Você quis dizer ");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = palpite;
    b.addEventListener("click", () => {
      el.campoBusca.value = palpite;
      buscar(palpite);
      el.campoBusca.focus();
    });
    linha.append(b, "?");
    partes.unshift(linha);
  }
  el.resultados.replaceChildren(...partes);
  el.painel.scrollTop = 0;
}

/* ========================================================================== */

function esc(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}
