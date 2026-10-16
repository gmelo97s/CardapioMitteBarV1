"""
Transforma fotos cruas em masters padronizados do cardápio.

Faz o caminho inteiro: recorta o fundo, centraliza, encaixa num quadrado de
fundo preto e — nos combos — repete a garrafa/lata o número de vezes certo.
Assim não é preciso achar na internet uma foto de "4 Coronas": basta ter
*uma* Corona.

Entrada : assets/itens/_brutas/<nome>.(jpg|png|webp)   fotos como vieram
Saída   : assets/itens/_masters/<slug>.png             1024×1024, fundo preto

Depois rode tools/gerar-imagens.py para gerar os .webp do site.

Uso:
    python tools/preparar-fotos.py              # processa tudo
    python tools/preparar-fotos.py --listar     # só mostra o mapeamento

Requer:
    pip install pillow rembg[cpu]
"""

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow não instalado. Rode: pip install pillow")

RAIZ = Path(__file__).resolve().parent.parent
BRUTAS = RAIZ / "assets" / "itens" / "_brutas"
MASTERS = RAIZ / "assets" / "itens" / "_masters"
CARDAPIO = RAIZ / "src" / "data" / "cardapio.json"
MAPA = Path(__file__).resolve().parent / "mapa-fotos.json"

LADO = 1024
MARGEM = 0.10          # respiro em volta do produto, em fração do lado
EXTENSOES = (".jpg", ".jpeg", ".png", ".webp")


# --------------------------------------------------------------------------
# catálogo
# --------------------------------------------------------------------------

def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-")


def itens_do_cardapio() -> dict[str, str]:
    dados = json.loads(CARDAPIO.read_text(encoding="utf-8"))
    return {
        item["slug"]: item["nome"]
        for aba in dados["abas"]
        for item in aba["itens"]
        if "slug" in item
    }


def combo(slug: str) -> tuple[int, str] | None:
    """"combo-4-corona-lata-350ml" -> (4, "corona-lata-350ml")."""
    m = re.match(r"^combo-(\d+)-(.+)$", slug)
    return (int(m.group(1)), m.group(2)) if m else None


def achar_bruta(alvo: str, brutas: dict[str, Path]) -> Path | None:
    """Casa o slug com o arquivo cru pelo maior prefixo de palavras em comum."""
    if alvo in brutas:
        return brutas[alvo]
    palavras_alvo = set(alvo.split("-"))
    melhor, nota = None, 0
    for nome, caminho in brutas.items():
        palavras = set(nome.split("-"))
        comum = palavras_alvo & palavras
        # "corona.jpg" precisa casar com "corona-lata-350ml": basta que todas
        # as palavras do arquivo apareçam no slug. Fora isso, exijo duas
        # palavras em comum para não casar por acaso.
        pontos = len(palavras) if palavras <= palavras_alvo else (len(comum) if len(comum) >= 2 else 0)
        if pontos > nota:
            melhor, nota = caminho, pontos
    return melhor if nota else None


def montar_mapa(catalogo: dict[str, str], brutas: dict[str, Path]) -> dict:
    """Decide, para cada item, de qual foto crua ele sai e quantas cópias usa.

    O mapa gravado em tools/mapa-fotos.json tem prioridade: é lá que se
    corrige à mão qualquer casamento que o automático errou.
    """
    manual = json.loads(MAPA.read_text(encoding="utf-8")) if MAPA.exists() else {}
    mapa = {}

    for slug in catalogo:
        if slug in manual:
            entrada = manual[slug]
            if isinstance(entrada, str):
                entrada = {"origem": entrada, "repetir": 1}
            origem = brutas.get(entrada["origem"]) or achar_bruta(entrada["origem"], brutas)
            if origem:
                mapa[slug] = (origem, int(entrada.get("repetir", 1)))
            continue

        c = combo(slug)
        if c:
            quantidade, base = c
            origem = achar_bruta(base, brutas)
            if origem:
                mapa[slug] = (origem, quantidade)
        else:
            origem = achar_bruta(slug, brutas)
            if origem:
                mapa[slug] = (origem, 1)

    return mapa


# --------------------------------------------------------------------------
# imagem
# --------------------------------------------------------------------------

_sessao = None


def recortar(im: Image.Image) -> Image.Image:
    """Tira o fundo. Imagem que já vem com alfa passa direto."""
    global _sessao
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 250:
        return im

    from rembg import remove, new_session

    if _sessao is None:
        _sessao = new_session("u2net")
    return remove(im.convert("RGBA"), session=_sessao)


def aparar(im: Image.Image) -> Image.Image:
    caixa = im.getchannel("A").getbbox()
    return im.crop(caixa) if caixa else im


def na_tela(pecas: list[Image.Image]) -> Image.Image:
    """Encaixa as peças lado a lado, centralizadas, num quadrado preto."""
    tela = Image.new("RGBA", (LADO, LADO), (0, 0, 0, 255))
    util = int(LADO * (1 - 2 * MARGEM))

    # Combos encostam de leve uma peça na outra, como numa foto de bandeja
    sobreposicao = 0.18 if len(pecas) > 1 else 0
    largura_total = sum(p.width for p in pecas) * (1 - sobreposicao) + pecas[0].width * sobreposicao
    altura_max = max(p.height for p in pecas)

    escala = min(util / largura_total, util / altura_max)
    pecas = [
        p.resize((max(1, int(p.width * escala)), max(1, int(p.height * escala))), Image.LANCZOS)
        for p in pecas
    ]

    passo = int(pecas[0].width * (1 - sobreposicao))
    largura_final = passo * (len(pecas) - 1) + pecas[-1].width
    x = (LADO - largura_final) // 2

    for i, p in enumerate(pecas):
        # leve escadinha vertical, para o combo não parecer carimbo repetido
        desvio = int((i % 2) * LADO * 0.015)
        y = (LADO - p.height) // 2 + desvio
        tela.alpha_composite(p, (x + i * passo, y))

    return tela.convert("RGB")


def processar(origem: Path, repetir: int, destino: Path) -> None:
    with Image.open(origem) as bruta:
        peca = aparar(recortar(bruta))
    na_tela([peca] * repetir).save(destino, "PNG")


# --------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--listar", action="store_true", help="só mostra o mapeamento")
    ap.add_argument("--forcar", action="store_true", help="refaz masters já existentes")
    args = ap.parse_args()

    BRUTAS.mkdir(parents=True, exist_ok=True)
    MASTERS.mkdir(parents=True, exist_ok=True)

    brutas = {
        normalizar(p.stem): p
        for p in sorted(BRUTAS.iterdir())
        if p.suffix.lower() in EXTENSOES
    }
    if not brutas:
        print(f"Nenhuma foto em {BRUTAS.relative_to(RAIZ)}.")
        print("Jogue as fotos lá (nome livre) e rode de novo.")
        return 0

    catalogo = itens_do_cardapio()
    mapa = montar_mapa(catalogo, brutas)

    print(f"{len(brutas)} fotos cruas cobrem {len(mapa)} dos {len(catalogo)} itens.\n")

    for slug, (origem, repetir) in sorted(mapa.items()):
        marca = f" ×{repetir}" if repetir > 1 else ""
        print(f"  {slug:<45} <- {origem.name}{marca}")

    sem_foto = [s for s in catalogo if s not in mapa]
    if sem_foto:
        print(f"\n{len(sem_foto)} itens sem foto (mostram a inicial em neon):")
        for s in sem_foto[:12]:
            print(f"  - {s}")
        if len(sem_foto) > 12:
            print(f"  … e mais {len(sem_foto) - 12}")

    if args.listar:
        print("\nPara corrigir um casamento errado, edite tools/mapa-fotos.json.")
        return 0

    print("\nProcessando…")
    feitos = 0
    for slug, (origem, repetir) in sorted(mapa.items()):
        destino = MASTERS / f"{slug}.png"
        if destino.exists() and not args.forcar:
            continue
        processar(origem, repetir, destino)
        feitos += 1
        print(f"  ok  {slug}")

    print(f"\n{feitos} masters gerados em {MASTERS.relative_to(RAIZ)}.")
    print("Agora rode: python tools/gerar-imagens.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
