"""
Gera as imagens responsivas do cardápio a partir de um master por item.

Entrada : assets/itens/_masters/<slug>.(png|jpg|jpeg|webp)  — 1024x1024
Saída   : assets/itens/<slug>-400.webp e <slug>-800.webp

Uso:
    python tools/gerar-imagens.py

Requer Pillow:
    pip install pillow
"""

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow não instalado. Rode: pip install pillow")

RAIZ = Path(__file__).resolve().parent.parent
MASTERS = RAIZ / "assets" / "itens" / "_masters"
SAIDA = RAIZ / "assets" / "itens"
CARDAPIO = RAIZ / "src" / "data" / "cardapio.json"

# Precisa bater com LARGURAS em src/app.js.
# O degrau de 600 existe por causa do celular: com 400 e 800 só, um aparelho
# de DPR 3 precisa de ~515px para um card de 172 e sobe direto para o 800,
# baixando quase o dobro do necessario em toda aba.
LARGURAS = [400, 600, 800]
QUALIDADE = 82
EXTENSOES = (".png", ".jpg", ".jpeg", ".webp")


def carregar_cardapio() -> dict:
    return json.loads(CARDAPIO.read_text(encoding="utf-8"))


def slugs_do_cardapio(dados: dict) -> dict[str, str]:
    return {
        item["slug"]: item["nome"]
        for aba in dados["abas"]
        for item in aba["itens"]
        if "slug" in item
    }


def marcar_quem_tem_foto(dados: dict, prontos: set[str]) -> int:
    """Grava "imagem": true nos itens que já têm webp.

    Sem isso o app pediria a foto de todo item e levaria um 404 por card em
    cada abertura — barulho no console e requisição desperdiçada na totem.
    """
    mudou = 0
    for aba in dados["abas"]:
        for item in aba["itens"]:
            tem = item.get("slug") in prontos
            if tem and not item.get("imagem"):
                item["imagem"] = True
                mudou += 1
            elif not tem and "imagem" in item:
                del item["imagem"]
                mudou += 1
    if mudou:
        CARDAPIO.write_text(
            json.dumps(dados, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
    return mudou


def quadrado(im: Image.Image) -> Image.Image:
    """Corta pelo centro para 1:1 — é o formato do card e do detalhe."""
    lado = min(im.size)
    esq = (im.width - lado) // 2
    topo = (im.height - lado) // 2
    return im.crop((esq, topo, esq + lado, topo + lado))


def main() -> int:
    if not MASTERS.is_dir():
        MASTERS.mkdir(parents=True, exist_ok=True)
        print(f"Criei {MASTERS.relative_to(RAIZ)}. Coloque os masters lá e rode de novo.")
        return 0

    dados = carregar_cardapio()
    catalogo = slugs_do_cardapio(dados)
    SAIDA.mkdir(parents=True, exist_ok=True)

    arquivos = [p for p in sorted(MASTERS.iterdir()) if p.suffix.lower() in EXTENSOES]
    if not arquivos:
        print(f"Nenhum master em {MASTERS.relative_to(RAIZ)}.")
        marcar_quem_tem_foto(dados, set())
        return 0

    gerados, orfaos = 0, []

    for origem in arquivos:
        slug = origem.stem
        if slug not in catalogo:
            orfaos.append(slug)

        with Image.open(origem) as im:
            im = quadrado(im.convert("RGB"))
            if min(im.size) < max(LARGURAS):
                print(f"  aviso: {origem.name} tem {im.width}px, menor que {max(LARGURAS)}px")
            for largura in LARGURAS:
                destino = SAIDA / f"{slug}-{largura}.webp"
                copia = im.resize((largura, largura), Image.LANCZOS)
                copia.save(destino, "WEBP", quality=QUALIDADE, method=6)
                gerados += 1

        print(f"  {slug}: {' '.join(f'{w}px' for w in LARGURAS)}")

    print(f"\n{gerados} arquivos gerados a partir de {len(arquivos)} masters.")

    prontos = {p.stem for p in MASTERS.iterdir() if p.suffix.lower() in EXTENSOES}
    mudou = marcar_quem_tem_foto(dados, prontos & catalogo.keys())
    if mudou:
        print(f"cardapio.json atualizado: {mudou} itens mudaram de estado de foto.")

    if orfaos:
        print("\nMasters sem item correspondente no cardápio (confira o nome):")
        for s in orfaos:
            print(f"  - {s}")

    feitos = {p.stem for p in MASTERS.iterdir() if p.suffix.lower() in EXTENSOES}
    faltando = [(s, n) for s, n in catalogo.items() if s not in feitos]
    if faltando:
        print(f"\nFaltam {len(faltando)} de {len(catalogo)} itens (mostram a inicial em neon):")
        for s, n in faltando[:15]:
            print(f"  - {s}.png  ({n})")
        if len(faltando) > 15:
            print(f"  … e mais {len(faltando) - 15}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
