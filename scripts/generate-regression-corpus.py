"""Generate deterministic, de-identified PDF fixtures from the versioned corpus manifest."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "regression" / "corpus" / "v1" / "manifest.json"
OUTPUT = ROOT / "tmp" / "pdfs" / "regression-corpus-v1"


def register_unicode_font() -> str:
    candidates = [
        ROOT / "node_modules" / "@fontpkg" / "unifont" / "fonts" / "unifont.otf",
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            pdfmetrics.registerFont(TTFont("CorpusUnicode", str(candidate)))
            return "CorpusUnicode"
    raise RuntimeError("No Unicode TTF font found; refusing to generate lossy PDF fixtures")


def display_path(path: str) -> str:
    return path.removeprefix("fields.").replace(".0.", " [row 1] ").replace("_", " ").upper()


def display_value(value: Any) -> str:
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))
    return str(value)


def build_case(case: dict[str, Any], font: str) -> None:
    path = OUTPUT / f"{case['id']}.pdf"
    doc = SimpleDocTemplate(
        str(path), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm,
        topMargin=15 * mm, bottomMargin=16 * mm,
        title=case["title"], author="GainingDocx regression tooling",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="CorpusTitle", parent=styles["Title"], fontName=font,
        fontSize=18, leading=22, textColor=colors.HexColor("#123047"), spaceAfter=5 * mm,
    ))
    styles.add(ParagraphStyle(
        name="CorpusNotice", parent=styles["BodyText"], fontName=font,
        fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#8A2C0D"),
        backColor=colors.HexColor("#FFF1E8"), borderPadding=7, spaceAfter=6 * mm,
    ))
    styles.add(ParagraphStyle(name="CorpusBody", parent=styles["BodyText"], fontName=font, fontSize=9, leading=12))

    rows: list[list[Any]] = [["FIELD", "PRINTED VALUE", "ACCURACY CLASS"]]
    for category, labels in case["labels"].items():
        for label in labels:
            rows.append([display_path(label["path"]), display_value(label["value"]), category.replace("_", " ").upper()])

    table = Table(rows, colWidths=[58 * mm, 74 * mm, 42 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), font),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#123047")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F7FAFC")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#AAB7C4")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story = [
        Paragraph(case["title"], styles["CorpusTitle"]),
        Paragraph("DE-IDENTIFIED REGRESSION CORPUS — NOT VALID FOR SHIPMENT", styles["CorpusNotice"]),
        Paragraph(f"Fixture ID: {case['id']} &nbsp;&nbsp; Declared document type: {case['doc_type']}", styles["CorpusBody"]),
        Spacer(1, 4 * mm),
        table,
        Spacer(1, 6 * mm),
        Paragraph("All names, references, dates, values and routing details in this document are fictional and exist only for controlled software verification.", styles["CorpusBody"]),
    ]
    doc.build(story)


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    font = register_unicode_font()
    for case in manifest["cases"]:
        build_case(case, font)
    print(json.dumps({"output": str(OUTPUT), "generated": len(manifest["cases"]), "font": font}))


if __name__ == "__main__":
    main()
