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

# --- recorte das fotos de copo ------------------------------------------- #
MARGEM = 0.10        # folga em volta do copo
DESFOQUE = 26        # preenchimento das sobras do quadrado
ESCURECE = 0.42

# --- montagem da fileira de latas ---------------------------------------- #
FUNDO_TOPO = (26, 26, 31)   # --mitte-bg-elev-2
FUNDO_BASE = (9, 9, 11)     # --mitte-bg
LARGURA_SEGURA = 0.72       # ver montar_latas: o card recorta as laterais


# ========================================================================== #
# Fotos de copo
# ========================================================================== #

def _mapa_foco(im: Image.Image) -> np.ndarray:
    """Onde a foto está nítida. O balcão e a prateleira estão desfocados,
    então um passa-alta separa o copo do resto sem precisar de modelo."""
    p = im.convert("L")
    p.thumbnail((512, 512))
    a = np.asarray(p, dtype=np.float32)
    borrado = np.asarray(p.filter(ImageFilter.GaussianBlur(5)), dtype=np.float32)
    foco = np.abs(a - borrado)
    return (foco >= np.percentile(foco, 92)).astype(np.float32)


def _faixa(peso: np.ndarray, fracao: float) -> tuple[float, float]:
    """Menor intervalo que concentra `fracao` do peso."""
    total = peso.sum()
    if total <= 0:
        return 0.0, float(len(peso))
    acum = np.cumsum(peso)
    alvo = total * fracao
    melhor = (0, len(peso))
    j = 0
    for i in range(len(peso)):
        base = acum[i - 1] if i else 0.0
        while j < len(peso) and acum[j] - base < alvo:
            j += 1
        if j >= len(peso):
            break
        if j - i < melhor[1] - melhor[0]:
            melhor = (i, j)
    return float(melhor[0]), float(melhor[1])


def _regiao_do_copo(im: Image.Image, margem: float = MARGEM) -> tuple[int, int, int, int]:
    m = _mapa_foco(im)
    h, w = m.shape
    fx0, fx1 = _faixa(m.sum(axis=0), 0.84)
    fy0, fy1 = _faixa(m.sum(axis=1), 0.88)

    iw, ih = im.size
    x0, x1 = fx0 / w * iw, fx1 / w * iw
    y0, y1 = fy0 / h * ih, fy1 / h * ih

    mx, my = (x1 - x0) * margem, (y1 - y0) * margem
    x0, x1, y0, y1 = x0 - mx, x1 + mx, y0 - my, y1 + my

    # tenta fechar um quadrado em volta do copo antes de recorrer ao
    # preenchimento: quando cabe, a foto sai inteira, sem sobra desfocada.
    lado = max(x1 - x0, y1 - y0)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    x0, x1, y0, y1 = cx - lado / 2, cx + lado / 2, cy - lado / 2, cy + lado / 2

    # empurra para dentro da foto em vez de encolher o recorte
    if x0 < 0: x1, x0 = x1 - x0, 0
    if x1 > iw: x0, x1 = x0 - (x1 - iw), iw
    if y0 < 0: y1, y0 = y1 - y0, 0
    if y1 > ih: y0, y1 = y0 - (y1 - ih), ih
    return int(max(x0, 0)), int(max(y0, 0)), int(min(x1, iw)), int(min(y1, ih))


def quadrado(im: Image.Image, lado: int = LADO, margem: float = MARGEM) -> Image.Image:
    """Quadrado com o copo inteiro dentro.

    O copo quase sempre é mais alto do que a foto é larga, então um corte
    quadrado comeria a borda ou a base. Aqui a região do copo entra inteira,
    e as sobras laterais recebem a própria foto desfocada e escurecida — o
    fundo continua sendo o bar, não uma tarja preta.
    """
    im = im.convert("RGB")
    corte = im.crop(_regiao_do_copo(im, margem))
    cw, ch = corte.size

    escala = lado / min(cw, ch)
    fundo = corte.resize((max(lado, round(cw * escala)), max(lado, round(ch * escala))), Image.LANCZOS)
    ex, ey = (fundo.width - lado) // 2, (fundo.height - lado) // 2
    fundo = fundo.crop((ex, ey, ex + lado, ey + lado)).filter(ImageFilter.GaussianBlur(DESFOQUE))
    fundo = ImageEnhance.Brightness(fundo).enhance(ESCURECE)

    escala = lado / max(cw, ch)
    frente = corte.resize((max(1, round(cw * escala)), max(1, round(ch * escala))), Image.LANCZOS)
    fundo.paste(frente, ((lado - frente.width) // 2, (lado - frente.height) // 2))
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


def montar_latas(latas: list[Image.Image], lado: int = LADO, altura: float = 0.82,
                 largura_max: float = LARGURA_SEGURA) -> Image.Image:
    """Uma lata centralizada, ou várias em leque com sobreposição e escadinha.

    `largura_max` é a área segura: o master é quadrado, mas o card no celular
    é retrato e a foto entra com `object-fit: cover`, que come até 13% de cada
    lado. Um leque que ocupasse 90% da largura apareceria com as latas das
    pontas fatiadas pela borda do card. Uma lata sozinha é estreita e nunca
    encosta nesse teto — ele só morde nas montagens.
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
    base = int((lado - alvo) * 0.50) + alvo
    # escadinha: a do meio sobe, as das pontas descem — fileira, não parede
    degrau = [0.0] if n == 1 else [abs(i - (n - 1) / 2) / ((n - 1) / 2) for i in range(n)]

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
LADO_RECORTE = 1600      # acima disso o modelo não melhora e só custa tempo

_sessao_recorte = None


def _sessao() -> object:
    """Uma sessão só: carregar o modelo custa alguns segundos."""
    global _sessao_recorte
    if _sessao_recorte is None:
        try:
            from rembg import new_session
        except ImportError:
            sys.exit("Esta seção precisa do rembg. Rode: pip install rembg")
        _sessao_recorte = new_session(MODELO_RECORTE)
    return _sessao_recorte


def recortar_do_fundo(im: Image.Image) -> Image.Image:
    """Separa o produto do fundo da foto e devolve só ele, já aparado."""
    from rembg import remove

    im = im.convert("RGBA")
    if max(im.size) > LADO_RECORTE:
        im.thumbnail((LADO_RECORTE, LADO_RECORTE), Image.LANCZOS)
    corte = remove(im, session=_sessao(), post_process_mask=True)
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

    # Enquadramento fora do padrão, item a item: garrafa fina que sobra
    # margem, copo pequeno que se perde no balcão.
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
        salvar(slug, montar_latas([corte], altura=a.get("altura", 0.82)))
        feitos += 1

    # Produto sobre o painel colorido do salão: recorta e devolve no escuro.
    for slug, arquivo in sorted(mapa.get("fundo_para_trocar", {}).items()):
        origem = BRUTAS / arquivo
        if not origem.exists():
            print(f"  faltando: {arquivo}")
            continue
        a = ajustes.get(slug, {})
        with Image.open(origem) as im:
            salvar(slug, montar_latas([recortar_do_fundo(aparar(im, a))],
                                      altura=a.get("altura", 0.80),
                                      largura_max=a.get("largura_max", 0.90)))
        feitos += 1

    for slug, arquivo in sorted(mapa["fotos"].items()):
        origem = BRUTAS / arquivo
        if not origem.exists():
            print(f"  faltando: {arquivo}")
            continue
        a = ajustes.get(slug, {})
        with Image.open(origem) as im:
            salvar(slug, quadrado(aparar(im, a), margem=a.get("margem", MARGEM)))
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
