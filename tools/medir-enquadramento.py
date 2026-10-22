"""Mede a folga que sobra em volta do produto em cada master publicado.

Para que serve
--------------
O card do celular tem altura fixa — seis por tela — e largura dada pela
coluna, então a proporção da figura muda de aparelho para aparelho. A foto
entra com `object-fit: cover`, que corta o que não couber. Quanto ele pode
cortar sem decepar o produto é exatamente a folga medida aqui, e é dela que
saem os dois limites de proporção em `src/styles.css` (`.card__figura img`).

Sem esta conta os limites viram chute, e chute errado reaparece como garrafa
sem gargalo em algum celular que ninguém tem à mão.

Como lê
-------
A mesma máscara do rembg que o `fotos-drive.py` usa para enquadrar, então o
que sai aqui é comparável com ALTURA_OBJETO / LARGURA_OBJETO / BASE_OBJETO.

Uso:
    python tools/medir-enquadramento.py           # resumo e os piores casos
    python tools/medir-enquadramento.py --json caixas.json
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Faltam dependências. Rode: pip install pillow numpy")

RAIZ = Path(__file__).resolve().parent.parent
ITENS = RAIZ / "assets" / "itens"
CARDAPIO = RAIZ / "src" / "data" / "cardapio.json"

LARGURA_LIDA = 800      # o webp publicado, que é o master reduzido
CORTE_MASSA = 0.02      # linha/coluna com menos que isso da massa é farelo


def caixas() -> dict[str, dict]:
    from rembg import remove, new_session

    sessao = new_session("isnet-general-use")
    dados = json.loads(CARDAPIO.read_text(encoding="utf-8"))
    itens = [(aba["id"], it["slug"]) for aba in dados["abas"] for it in aba["itens"]
             if it.get("imagem") and not it.get("fora_de_linha")]

    out: dict[str, dict] = {}
    for n, (aba, slug) in enumerate(itens, 1):
        arquivo = ITENS / f"{slug}-{LARGURA_LIDA}.webp"
        if not arquivo.exists():
            print(f"  sem arquivo: {slug}")
            continue
        with Image.open(arquivo) as im:
            im = im.convert("RGBA")
            alfa = np.array(remove(im, session=sessao, post_process_mask=True))[:, :, 3]
        linhas, colunas = alfa.sum(axis=1), alfa.sum(axis=0)
        if linhas.max() <= 0:
            continue
        ys = np.where(linhas > linhas.max() * CORTE_MASSA)[0]
        xs = np.where(colunas > colunas.max() * CORTE_MASSA)[0]
        L = float(im.width)
        out[slug] = {
            "aba": aba,
            "lateral": round(min(xs.min(), L - 1 - xs.max()) / L, 4),
            "topo": round(ys.min() / L, 4),
            "base": round((L - 1 - ys.max()) / L, 4),
        }
        if n % 20 == 0:
            print(f"  {n}/{len(itens)}", flush=True)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--json", type=Path, help="grava as caixas medidas neste arquivo")
    args = ap.parse_args()

    medidas = caixas()
    if not medidas:
        sys.exit("nenhum master medido")
    if args.json:
        args.json.write_text(json.dumps(medidas, ensure_ascii=False, indent=1), encoding="utf-8")

    pior = {lado: min(v[lado] for v in medidas.values()) for lado in ("lateral", "topo", "base")}
    print(f"\n{len(medidas)} masters medidos. Pior folga de cada lado:")
    for lado in ("lateral", "topo", "base"):
        dono = min(medidas.items(), key=lambda kv: kv[1][lado])
        print(f"  {lado:8} {100 * pior[lado]:5.1f}%   ({dono[0]})")

    # Os limites que o .card__figura img pode usar sem decepar nada.
    minimo = 1 - 2 * pior["lateral"]
    reparte = pior["topo"] / (pior["topo"] + pior["base"])
    maximo = 1 / (1 - (pior["topo"] + pior["base"]))
    print("\nLimites de proporção para src/styles.css (.card__figura img):")
    print(f"  proporção ≥ {minimo:.3f}   → height: min(100cqh, {100 / minimo:.1f}cqw)")
    print(f"  proporção ≤ {maximo:.3f}   → width:  min(100cqw, {100 * maximo:.0f}cqh)")
    print(f"  object-position: 50% {100 * reparte:.0f}%")
    print("\nUse alguns pontos mais apertado que isso: a máscara erra uns pixels,")
    print("e o navegador arredonda a altura da linha do card.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
