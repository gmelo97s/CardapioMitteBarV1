"""
Transforma as fotos do Drive do bar em masters quadrados do cardápio.

É o caminho alternativo ao `preparar-fotos.py`: lá a entrada são fotos de
produto com fundo para recortar; aqui são as fotos do próprio bar — copo no
balcão, prateleira desfocada atrás — que não devem perder o fundo, porque o
fundo *é* a identidade.

Entrada : assets/itens/_brutas/<arquivo>        como vieram do Drive
Mapa    : tools/fotos-drive.json                qual arquivo é de qual item
Saída   : assets/itens/_masters/<slug>.webp     1024×1024

Depois rode tools/gerar-imagens.py para gerar os .webp que o site serve.

Uso:
    python tools/fotos-drive.py              # processa tudo
    python tools/fotos-drive.py --listar     # só mostra o que falta

Requer:
    pip install pillow numpy
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
except ImportError:
    sys.exit("Faltam dependências. Rode: pip install pillow numpy")

RAIZ = Path(__file__).resolve().parent.parent
BRUTAS = RAIZ / "assets" / "itens" / "_brutas"
MASTERS = RAIZ / "assets" / "itens" / "_masters"
MAPA = Path(__file__).resolve().parent / "fotos-drive.json"
CARDAPIO = RAIZ / "src" / "data" / "cardapio.json"

LADO = 1024
QUALIDADE = 92

# --- enquadramento, o mesmo para todo card ------------------------------- #
# Medido no Cosmopolitan, que é o card que ficou certo: a taça ocupa 72% da
# altura, fica no centro horizontal e a base encosta a 6% do fundo. O produto
# "pisa no chão" do quadro e sobra ar em cima — é o que faz cinquenta fotos de
# origens diferentes lerem como uma série, e não como um álbum.
#
# A altura manda, menos quando o objeto é largo demais para caber deitado:
# bandeja de esfirra e leque de três latas estouram as laterais antes de
# chegar aos 72% de altura, e aí quem limita é LARGURA_OBJETO.
ALTURA_OBJETO = 0.72
LARGURA_OBJETO = 0.86
# No Cosmopolitan a base está a 6% do fundo, e o card, que é quadrado, mostra
# isso inteiro. O detalhe não: `max-height: 38dvh` corta cerca de 9% em cima e
# 9% embaixo, e 6% de margem vira pé de taça decepado. 11% sobrevive aos dois.
BASE_OBJETO = 0.89

# --- sobras do quadrado nas fotos que mantêm o fundo --------------------- #
DESFOQUE = 26
ESCURECE = 0.42

# --- fundo das fotos recortadas ------------------------------------------ #
FUNDO_TOPO = (26, 26, 31)   # --mitte-bg-elev-2
FUNDO_BASE = (9, 9, 11)     # --mitte-bg


# ========================================================================== #
# Fotos de copo
# ========================================================================== #

def caixa_do_objeto(im: Image.Image, corte: float = 0.02) -> tuple[float, float, float, float]:
    """Onde está o produto na foto.

    Aqui havia um passa-alta: a premissa era que só o copo estava nítido e o
    resto, balcão e prateleira, desfocado. Vale no balcão e erra em tudo mais
    — na foto do Dry Martini ele lia a quina iluminada da parede como parte do
    objeto e devolvia uma caixa da altura inteira da imagem. Como o modelo de
    recorte já está neste arquivo por causa do `fundo_para_trocar`, o mais
    simples é perguntar a ele, que responde exatamente isto.

    Linha ou coluna com menos de `corte` da massa da máscara fica de fora: um
    farelo de máscara de alguns pixels esticava a caixa e, com ela, todo o
    enquadramento.
    """
    from rembg import remove

    p = im.convert("RGBA").copy()
    p.thumbnail((LADO_RECORTE, LADO_RECORTE), Image.LANCZOS)
    alfa = np.array(remove(p, session=_sessao(), post_process_mask=True))[:, :, 3].astype(np.float32)

    linhas, colunas = alfa.sum(axis=1), alfa.sum(axis=0)
    if linhas.max() <= 0:
        return 0.0, 0.0, float(im.width), float(im.height)
    ys = np.where(linhas > linhas.max() * corte)[0]
    xs = np.where(colunas > colunas.max() * corte)[0]

    ex, ey = im.width / p.width, im.height / p.height
    return xs.min() * ex, ys.min() * ey, xs.max() * ex, ys.max() * ey


def enquadrar(caixa: tuple[float, float, float, float]) -> tuple[float, float, float]:
    """O quadrado do padrão em volta da caixa do objeto: (esquerda, topo, lado)."""
    x0, y0, x1, y1 = caixa
    lado = max((y1 - y0) / ALTURA_OBJETO, (x1 - x0) / LARGURA_OBJETO)
    return (x0 + x1) / 2 - lado / 2, y1 - BASE_OBJETO * lado, lado


def quadrado(im: Image.Image, lado: int = LADO) -> Image.Image:
    """A foto enquadrada no padrão, com o fundo dela preservado.

    O quadrado do padrão quase nunca cabe inteiro dentro da foto: pedir 72% de
    altura para um copo que já ocupa 90% dela significa afastar a câmera, e
    não há foto além da borda. As sobras recebem a própria imagem ampliada,
    desfocada e escurecida — o fundo continua sendo o bar, não uma tarja
    preta, e o olho lê como profundidade de campo.
    """
    im = im.convert("RGB")
    esq, topo, L = enquadrar(caixa_do_objeto(im))
    escala = lado / L

    # a foto na escala do enquadramento, e onde o quadrado cai dentro dela
    fw, fh = max(1, round(im.width * escala)), max(1, round(im.height * escala))
    foto = im.resize((fw, fh), Image.LANCZOS)
    ox, oy = round(esq * escala), round(topo * escala)

    # fundo: a mesma foto ampliada até cobrir o quadrado, centrada no objeto
    cobre = max(lado / fw, lado / fh, 1.0)
    bw, bh = max(lado, round(fw * cobre)), max(lado, round(fh * cobre))
    fundo = im.resize((bw, bh), Image.LANCZOS)
    bx = round((ox + lado / 2) * bw / fw - lado / 2)
    by = round((oy + lado / 2) * bh / fh - lado / 2)
    bx, by = max(0, min(bx, bw - lado)), max(0, min(by, bh - lado))
    fundo = fundo.crop((bx, by, bx + lado, by + lado))
    fundo = fundo.filter(ImageFilter.GaussianBlur(DESFOQUE))
    fundo = ImageEnhance.Brightness(fundo).enhance(ESCURECE)

    # frente: o pedaço real da foto que cai dentro do quadrado
    ix0, iy0 = max(0, ox), max(0, oy)
    ix1, iy1 = min(fw, ox + lado), min(fh, oy + lado)
    if ix1 > ix0 and iy1 > iy0:
        fundo.paste(foto.crop((ix0, iy0, ix1, iy1)), (ix0 - ox, iy0 - oy))
    return fundo


# ========================================================================== #
# Fileira de latas
# ========================================================================== #

def _fundo_radial(lado: int) -> Image.Image:
    """Mesmo gradiente do .card__figura, para a lata não flutuar no vazio."""
    y, x = np.mgrid[0:lado, 0:lado].astype(np.float32)
    d = np.sqrt((x - lado / 2) ** 2 + (y - lado * 0.35) ** 2) / (lado * 0.75)
    t = np.clip(d, 0, 1)[..., None]
    topo = np.array(FUNDO_TOPO, dtype=np.float32)
    base = np.array(FUNDO_BASE, dtype=np.float32)
    return Image.fromarray((topo * (1 - t) + base * t).astype(np.uint8), "RGB")


def recortar_lata(origem: Image.Image, faixa: list[int]) -> Image.Image:
    """Uma lata da fileira, com a borda ocluída dissolvida no escuro.

    Metade das latas está parcialmente atrás da vizinha, então o corte cai no
    meio do cilindro. Um corte reto vira aresta de adesivo; o degradê no alfa
    faz a mesma aresta ler como sombra lateral.
    """
    x0, x1 = faixa
    tira = origem.crop((x0, 0, x1, origem.height))
    a = np.array(tira)[:, :, 3]
    linhas = np.where((a > 70).sum(axis=1) > 6)[0]
    colunas = np.where((a > 70).sum(axis=0) > 6)[0]
    if not len(linhas) or not len(colunas):
        return tira
    lata = tira.crop((colunas[0], linhas[0], colunas[-1] + 1, linhas[-1] + 1))

    alfa = np.array(lata)[:, :, 3].astype(np.float32)
    altura = (alfa > 70).sum(axis=0)
    cheio = altura.max() * 0.80
    pena = max(1, int(lata.width * 0.14))
    rampa = np.ones(lata.width, dtype=np.float32)
    if altura[-1] > cheio:
        rampa[-pena:] = np.linspace(1, 0, pena)
    if altura[0] > cheio:
        rampa[:pena] = np.minimum(rampa[:pena], np.linspace(0, 1, pena))
    if (rampa < 1).any():
        lata.putalpha(Image.fromarray((alfa * rampa[None, :]).astype(np.uint8), "L"))
    return lata


def montar_latas(latas: list[Image.Image], lado: int = LADO, altura: float = ALTURA_OBJETO,
                 largura_max: float = LARGURA_OBJETO) -> Image.Image:
    """Uma lata centralizada, ou várias em leque com sobreposição e escadinha.

    Mesma altura e mesma base das fotos que mantêm o fundo: é o que faz um
    card recortado e um card fotografado ficarem lado a lado sem denunciar que
    passaram por caminhos diferentes.

    O leque de três não chega aos 72% de altura — `largura_max` o segura
    antes, senão as latas das pontas encostariam nas bordas do quadro.
    """
    tela = _fundo_radial(lado)
    n = len(latas)
    alvo = int(lado * (altura if n == 1 else altura * 0.88))

    def escalar(alt):
        return [l.resize((max(1, round(l.width * alt / l.height)), alt), Image.LANCZOS) for l in latas]

    escaladas = escalar(alvo)
    passo = escaladas[0].width * (0.72 if n > 1 else 1)
    largura = escaladas[0].width + passo * (n - 1)
    if largura > lado * largura_max:
        alvo = int(alvo * lado * largura_max / largura)
        escaladas = escalar(alvo)
        passo = escaladas[0].width * (0.72 if n > 1 else 1)
        largura = escaladas[0].width + passo * (n - 1)

    esq = (lado - largura) / 2
    base = int(lado * BASE_OBJETO)
    # Escadinha: a do meio sobe, as das pontas ficam na base — fileira, não
    # parede. O `- 1` é o que ancora o leque: antes a do meio é que ficava em
    # BASE_OBJETO e as das pontas desciam 6% abaixo dela, e o leque terminava
    # com a base em 93% do quadro em vez de 89%. Num card de celular, que
    # corta pelas bordas, esses 4% eram a diferença entre a lata inteira e a
    # lata sem o pé.
    degrau = [0.0] if n == 1 else [abs(i - (n - 1) / 2) / ((n - 1) / 2) - 1 for i in range(n)]

    sombra = Image.new("L", (lado, lado), 0)
    ImageDraw.Draw(sombra).ellipse(
        (esq - alvo * .06, base - alvo * .04, esq + largura + alvo * .06, base + alvo * .07),
        fill=150)
    tela.paste((0, 0, 0), (0, 0), sombra.filter(ImageFilter.GaussianBlur(alvo * .03)))

    for i in sorted(range(n), key=lambda i: -abs(i - (n - 1) / 2)):
        tela.paste(escaladas[i], (int(esq + passo * i), int(base - alvo + degrau[i] * alvo * 0.06)), escaladas[i])
    return tela


# ========================================================================== #
# Foto de produto com fundo branco
# ========================================================================== #

def recortar_do_branco(im: Image.Image, limiar: int = 238, desvio: int = 12) -> Image.Image:
    """Transforma o fundo branco de uma foto de catálogo em transparência.

    As fotos do totem vêm em dois sabores: produto sobre o balcão colorido do
    bar, que entra como foto, e produto recortado sobre branco, que é o caso
    daqui. O branco vira alfa, a sobra é aparada, e o resultado segue para a
    mesma montagem das latas — com o mesmo fundo escuro e a mesma sombra, para
    o card não denunciar de qual pasta veio a imagem.
    """
    im = im.convert("RGBA")
    a = np.array(im)
    rgb = a[:, :, :3].astype(np.int16)
    # branco é claro E neutro: sem a segunda condição, o rótulo branco da lata
    # e o reflexo no alumínio saem junto com o fundo.
    #
    # `limiar` e `desvio` são apertados de propósito e só se afrouxam item a
    # item, pelo mapa. O fundo nem sempre é branco puro: a faixa do rodapé da
    # Jambuzera mede (228, 234, 242) e sobrava como tarja branca na base do
    # card. Mas afrouxar para todo mundo come o topo prateado dos Red Bull,
    # que é claro, neutro e encostado no fundo pelo alto.
    claro = rgb.min(axis=2) >= limiar
    neutro = (rgb.max(axis=2) - rgb.min(axis=2)) <= desvio
    fundo = claro & neutro

    # só o branco LIGADO à borda é fundo; branco cercado de produto fica.
    from collections import deque
    h, w = fundo.shape
    visto = np.zeros_like(fundo)
    fila = deque()
    for x in range(w):
        for y in (0, h - 1):
            if fundo[y, x] and not visto[y, x]: visto[y, x] = True; fila.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if fundo[y, x] and not visto[y, x]: visto[y, x] = True; fila.append((y, x))
    while fila:
        y, x = fila.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and fundo[ny, nx] and not visto[ny, nx]:
                visto[ny, nx] = True
                fila.append((ny, nx))

    a[:, :, 3] = np.where(visto, 0, 255)
    corte = Image.fromarray(a, "RGBA")
    caixa = corte.getbbox()
    return corte.crop(caixa) if caixa else corte


# ========================================================================== #
# Foto do bar com fundo que briga com o cardápio
# ========================================================================== #

# O painel pintado do salão é verde-limão, amarelo e pink saturados. Como foto
# do bar está certo; como card, ao lado de 55 cards sobre preto, lê como se
# fosse de outro site. Aqui o produto é recortado do painel e recolocado sobre
# o mesmo degradê escuro das outras latas — a foto continua sendo a do bar,
# só o fundo passa a ser o do cardápio.

MODELO_RECORTE = "isnet-general-use"
# Bandeja de porção é o caso em que o modelo padrão erra: contra a camiseta
# vermelha e a bandeira de arco-íris das fotos de comida ele fura o papelão
# escuro da bandeja — "MITTE" saía rendado — e deixa farelo de bandeira entre
# as esfirras. O birefnet devolve a bandeja inteira nas duas. Fica por item,
# em `ajustes.modelo`, e não como padrão: trocar o modelo de todo mundo
# refaria os cem cards que já estão certos.
MODELO_BANDEJA = "birefnet-general-lite"
LADO_RECORTE = 1600      # acima disso o modelo não melhora e só custa tempo

_sessoes: dict[str, object] = {}


def _sessao(modelo: str = MODELO_RECORTE) -> object:
    """Uma sessão por modelo: carregar cada um custa alguns segundos."""
    if modelo not in _sessoes:
        try:
            from rembg import new_session
        except ImportError:
            sys.exit("Esta seção precisa do rembg. Rode: pip install rembg")
        _sessoes[modelo] = new_session(modelo)
    return _sessoes[modelo]


def recortar_do_fundo(im: Image.Image, modelo: str = MODELO_RECORTE) -> Image.Image:
    """Separa o produto do fundo da foto e devolve só ele, já aparado."""
    from rembg import remove

    im = im.convert("RGBA")
    if max(im.size) > LADO_RECORTE:
        im.thumbnail((LADO_RECORTE, LADO_RECORTE), Image.LANCZOS)
    corte = remove(im, session=_sessao(modelo), post_process_mask=True)
    caixa = corte.getbbox()
    return corte.crop(caixa) if caixa else corte


def slugs_do_cardapio() -> set[str]:
    dados = json.loads(CARDAPIO.read_text(encoding="utf-8"))
    return {item["slug"] for aba in dados["abas"] for item in aba["itens"] if "slug" in item}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--listar", action="store_true", help="só mostra o mapeamento")
    args = ap.parse_args()

    mapa = json.loads(MAPA.read_text(encoding="utf-8"))
    conhecidos = slugs_do_cardapio()
    planejado: dict[str, str] = {}

    for slug, arquivo in mapa["fotos"].items():
        planejado[slug] = arquivo
    for slug, arquivo in mapa.get("produtos_no_branco", {}).items():
        planejado[slug] = arquivo
    for slug, arquivo in mapa.get("fundo_para_trocar", {}).items():
        planejado[slug] = arquivo
    fileira = mapa.get("fileira_de_latas")
    for slug in (fileira or {}).get("itens", {}):
        planejado[slug] = fileira["arquivo"]

    orfaos = sorted(set(planejado) - conhecidos)
    if orfaos:
        print("slug no mapa que não existe no cardápio:")
        for s in orfaos:
            print(f"  {s}")

    print(f"{len(planejado)} itens mapeados de {len(conhecidos)} no cardápio")
    if args.listar:
        for slug in sorted(planejado):
            print(f"  {slug:46} ← {planejado[slug]}")
        print("\nsem foto:")
        for slug in sorted(conhecidos - set(planejado)):
            print(f"  {slug}")
        return 0

    MASTERS.mkdir(parents=True, exist_ok=True)
    feitos = 0

    # Ajuste de recorte item a item. O enquadramento não entra aqui: é o
    # mesmo para todos, por definição — o que o olho lê como série é o
    # produto cair sempre no mesmo lugar do quadro.
    ajustes = mapa.get("ajustes", {})

    def salvar(slug: str, im: Image.Image) -> None:
        im.save(MASTERS / f"{slug}.webp", "WEBP", quality=QUALIDADE, method=6)

    def aparar(im: Image.Image, a: dict) -> Image.Image:
        """Corte na foto crua, antes de qualquer recorte de fundo.

        Serve para tirar da cena o que o recorte não dá conta: o copo de dose
        vazio ao lado da garrafa é vidro transparente sobre o painel verde, e
        o modelo devolve cacos e farelos flutuando. Cortar fora é mais honesto
        do que tentar salvar — o card fica a garrafa, inteira.

        "recorte": [x0, y0, x1, y1] em fração da foto.
        """
        r = a.get("recorte")
        if not r:
            return im
        w, h = im.size
        return im.crop((int(r[0] * w), int(r[1] * h), int(r[2] * w), int(r[3] * h)))

    # Fotos de catálogo recortadas sobre branco, do Drive do bar.
    for slug, arquivo in sorted(mapa.get("produtos_no_branco", {}).items()):
        origem = BRUTAS / arquivo
        if not origem.exists():
            print(f"  faltando: {arquivo}")
            continue
        a = ajustes.get(slug, {})
        with Image.open(origem) as im:
            corte = recortar_do_branco(aparar(im, a), limiar=a.get("limiar", 238),
                                       desvio=a.get("desvio", 12))
        salvar(slug, montar_latas([corte]))
        feitos += 1

    # Produto sobre o painel colorido do salão: recorta e devolve no escuro.
    for slug, arquivo in sorted(mapa.get("fundo_para_trocar", {}).items()):
        origem = BRUTAS / arquivo
        if not origem.exists():
            print(f"  faltando: {arquivo}")
            continue
        a = ajustes.get(slug, {})
        with Image.open(origem) as im:
            salvar(slug, montar_latas([recortar_do_fundo(aparar(im, a), a.get("modelo", MODELO_RECORTE))]))
        feitos += 1

    for slug, arquivo in sorted(mapa["fotos"].items()):
        origem = BRUTAS / arquivo
        if not origem.exists():
            print(f"  faltando: {arquivo}")
            continue
        a = ajustes.get(slug, {})
        with Image.open(origem) as im:
            salvar(slug, quadrado(aparar(im, a)))
        feitos += 1

    if fileira:
        origem = BRUTAS / fileira["arquivo"]
        if origem.exists():
            with Image.open(origem) as im:
                im = im.convert("RGBA")
                cortes = {k: recortar_lata(im, v) for k, v in fileira["faixas"].items()}
            for slug, chaves in sorted(fileira["itens"].items()):
                montar_latas([cortes[k] for k in chaves]).save(
                    MASTERS / f"{slug}.webp", "WEBP", quality=QUALIDADE, method=6)
                feitos += 1
        else:
            print(f"  faltando: {fileira['arquivo']}")

    print(f"{feitos} masters em {MASTERS.relative_to(RAIZ)}")
    print("agora rode: python tools/gerar-imagens.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
