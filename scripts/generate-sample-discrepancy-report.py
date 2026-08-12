from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "sample-discrepancy-report.pdf"
PUBLIC = ROOT / "public" / "sample-discrepancy-report.pdf"

NAVY = colors.HexColor("#071B4E")
BLUE = colors.HexColor("#013BB3")
RED = colors.HexColor("#D40505")
YELLOW = colors.HexColor("#F4C400")
PALE_YELLOW = colors.HexColor("#FFF8DB")
PALE_BLUE = colors.HexColor("#EDF3FF")
GREEN = colors.HexColor("#166534")
TEXT = colors.HexColor("#1B2740")
MUTED = colors.HexColor("#667085")
LINE = colors.HexColor("#D8DEE9")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="ReportTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=colors.white, alignment=TA_LEFT, spaceAfter=5 * mm))
styles.add(ParagraphStyle(name="Eyebrow", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=YELLOW, uppercase=True, spaceAfter=3 * mm))
styles.add(ParagraphStyle(name="H1Navy", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=NAVY, spaceBefore=2 * mm, spaceAfter=4 * mm))
styles.add(ParagraphStyle(name="H2Navy", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=NAVY, spaceBefore=1 * mm, spaceAfter=2 * mm))
styles.add(ParagraphStyle(name="BodySmall", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.5, leading=12.5, textColor=TEXT))
styles.add(ParagraphStyle(name="BodyMuted", parent=styles["BodyText"], fontName="Helvetica", fontSize=8, leading=11.5, textColor=MUTED))
styles.add(ParagraphStyle(name="Label", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7, leading=9, textColor=MUTED, uppercase=True))
styles.add(ParagraphStyle(name="Value", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9.5, leading=12, textColor=NAVY))
styles.add(ParagraphStyle(name="Evidence", parent=styles["Normal"], fontName="Courier", fontSize=7.5, leading=11, textColor=TEXT, leftIndent=2 * mm, rightIndent=2 * mm))
styles.add(ParagraphStyle(name="Foot", parent=styles["Normal"], fontName="Helvetica", fontSize=7, leading=9, textColor=MUTED, alignment=TA_CENTER))


FINDINGS = [
    {
        "severity": "CRITICAL",
        "field": "Container number",
        "expected": "MSCU 663987 0",
        "observed": "MSCU 663987 1",
        "reason": "The carrier draft differs from both upstream documents, and the draft value fails the ISO 6346 check-digit calculation.",
        "evidence": [("Shipping instructions - page 2", "Container No. MSCU 663987 0"), ("Draft Bill of Lading - page 1", "Container: MSCU 663987 1")],
        "owner": "Documentation team",
        "resolution": "Open - carrier correction required",
    },
    {
        "severity": "CRITICAL",
        "field": "Freight terms",
        "expected": "Freight prepaid",
        "observed": "Freight collect",
        "reason": "The draft B/L reverses the payment instruction stated in the booking confirmation and shipping instructions.",
        "evidence": [("Booking confirmation - page 1", "Payment terms: PREPAID"), ("Draft Bill of Lading - page 1", "Freight payable at destination / COLLECT")],
        "owner": "Commercial reviewer",
        "resolution": "Open - verify service contract",
    },
    {
        "severity": "WARNING",
        "field": "Total gross weight",
        "expected": "18,420 kg",
        "observed": "18,240 kg",
        "reason": "The draft is 180 kg below the instructed total. The sample tolerance is 25 kg or 0.5 percent, whichever is greater.",
        "evidence": [("Shipping instructions - page 2", "Gross weight: 18,420.00 KGS"), ("Draft Bill of Lading - page 1", "Gross weight 18,240 KGS")],
        "owner": "Export operations",
        "resolution": "Open - confirm final packing total",
    },
    {
        "severity": "WARNING",
        "field": "Notify party",
        "expected": "Delta Imports B.V.",
        "observed": "Same as consignee",
        "reason": "The instructions name a separate notify party, while the carrier draft substitutes the consignee.",
        "evidence": [("Shipping instructions - page 1", "Notify: Delta Imports B.V., Rotterdam"), ("Draft Bill of Lading - page 1", "Notify party: SAME AS CONSIGNEE")],
        "owner": "Documentation team",
        "resolution": "Open - customer confirmation requested",
    },
    {
        "severity": "INFORMATION",
        "field": "Port normalization",
        "expected": "CNSGH to NLRTM",
        "observed": "Shanghai to Rotterdam",
        "reason": "Printed port names were normalized to UN/LOCODE values for comparison. No route conflict was found.",
        "evidence": [("Booking confirmation - page 1", "POL SHANGHAI / POD ROTTERDAM"), ("Draft Bill of Lading - page 1", "Port of Loading: Shanghai; Port of Discharge: Rotterdam")],
        "owner": "System check",
        "resolution": "Passed - no action required",
    },
]


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, height - 19 * mm, width, 19 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.setFillColor(colors.white)
        canvas.drawString(18 * mm, height - 12 * mm, "GainingDocx - Sample Discrepancy Report")
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(YELLOW)
        canvas.drawRightString(width - 18 * mm, height - 12 * mm, "FICTIONAL DEMONSTRATION")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9 * mm, "Not an authentication, legal, customs, carrier or dangerous-goods approval.")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def metric(label, value, color=NAVY):
    return Table(
        [[Paragraph(label, styles["Label"])], [Paragraph(value, ParagraphStyle(name=f"metric-{label}", parent=styles["Value"], textColor=color, fontSize=13, leading=15))]],
        colWidths=[38 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE_BLUE),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("ROUNDEDCORNERS", [4]),
            ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ]),
    )


def finding_block(item):
    sev_color = RED if item["severity"] == "CRITICAL" else colors.HexColor("#8A5A00") if item["severity"] == "WARNING" else BLUE
    sev_bg = colors.HexColor("#FFF1F1") if item["severity"] == "CRITICAL" else PALE_YELLOW if item["severity"] == "WARNING" else PALE_BLUE
    head = Table(
        [[Paragraph(item["severity"], ParagraphStyle(name=f"sev-{item['field']}", parent=styles["Label"], textColor=sev_color)), Paragraph(item["field"], styles["H2Navy"]), Paragraph(item["resolution"], styles["BodyMuted"])]],
        colWidths=[25 * mm, 62 * mm, 76 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), sev_bg),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ]),
    )
    compare = Table(
        [[Paragraph("EXPECTED", styles["Label"]), Paragraph("OBSERVED", styles["Label"])], [Paragraph(item["expected"], styles["Value"]), Paragraph(item["observed"], styles["Value"])]],
        colWidths=[81.5 * mm, 81.5 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, LINE),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ]),
    )
    evidence_rows = []
    for label, quote in item["evidence"]:
        evidence_rows.append([Paragraph(label, styles["BodyMuted"]), Paragraph(quote, styles["Evidence"])])
    evidence = Table(
        evidence_rows,
        colWidths=[48 * mm, 115 * mm],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF2")),
            ("BOX", (0, 0), (-1, -1), 0.5, YELLOW),
            ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2 * mm),
        ]),
    )
    return KeepTogether([
        Table([[head]], colWidths=[169 * mm], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.7, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)])),
        compare,
        Spacer(1, 1.5 * mm),
        Paragraph(f"<b>Why flagged:</b> {item['reason']}", styles["BodySmall"]),
        Spacer(1, 1.5 * mm),
        evidence,
        Spacer(1, 1.2 * mm),
        Paragraph(f"Assigned to: <b>{item['owner']}</b>", styles["BodyMuted"]),
        Spacer(1, 5 * mm),
    ])


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(str(OUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=25 * mm, bottomMargin=19 * mm, title="GainingDocx Sample Ocean Freight Discrepancy Report", author="GainingDocx")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="report", frames=[frame], onPage=header_footer)])

    story = []
    story.append(Table([[Paragraph("FICTIONAL DEMONSTRATION SHIPMENT", styles["Eyebrow"]), ""], [Paragraph("Ocean freight discrepancy report", styles["ReportTitle"]), ""], [Paragraph("Booking confirmation - shipping instructions - draft Bill of Lading", ParagraphStyle(name="cover-sub", parent=styles["BodySmall"], textColor=colors.white, fontSize=10, leading=14)), ""]], colWidths=[135 * mm, 34 * mm], style=TableStyle([("SPAN", (0, 0), (1, 0)), ("SPAN", (0, 1), (1, 1)), ("SPAN", (0, 2), (1, 2)), ("BACKGROUND", (0, 0), (-1, -1), NAVY), ("LEFTPADDING", (0, 0), (-1, -1), 8 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 8 * mm), ("TOPPADDING", (0, 0), (-1, -1), 4 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm)])))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Executive review", styles["H1Navy"]))
    story.append(Paragraph("Shipment SEA-2026-041 requires correction before the carrier draft is approved. Two critical conflicts and two warnings are open. Every finding below records the expected value, observed value, source page, extracted text, rule rationale, assigned reviewer and resolution state.", styles["BodySmall"]))
    story.append(Spacer(1, 5 * mm))
    story.append(Table([[metric("DECISION", "REVIEW REQUIRED", RED), metric("SCORE", "76 / 100"), metric("CRITICAL", "2", RED), metric("WARNINGS", "2", colors.HexColor("#8A5A00"))]], colWidths=[42.25 * mm] * 4, style=TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 1 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 1 * mm)])))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Connected documents", styles["H1Navy"]))
    docs = [["DOCUMENT", "FILE", "SOURCE", "STATE"], ["Booking confirmation", "booking-confirmation.pdf", "Page 1", "Parsed"], ["Shipping instructions", "shipping-instructions.pdf", "Pages 1-2", "Parsed"], ["Draft Bill of Lading", "carrier-draft-bl.pdf", "Page 1", "Parsed"]]
    docs = [[Paragraph(cell, styles["BodySmall"] if row else styles["Label"]) for cell in line] for row, line in enumerate(docs)]
    story.append(Table(docs, colWidths=[48 * mm, 64 * mm, 27 * mm, 30 * mm], repeatRows=1, style=TableStyle([("BACKGROUND", (0, 0), (-1, 0), PALE_BLUE), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm), ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm), ("TEXTCOLOR", (3, 1), (3, -1), GREEN)])))
    story.append(Spacer(1, 7 * mm))
    story.append(KeepTogether([
        Paragraph("Route and control basis", styles["H1Navy"]),
        Paragraph("Shanghai (CNSGH) to Rotterdam (NLRTM). Container values use an ISO 6346 check-digit calculation. Port values are normalized to the current UN/LOCODE dataset for comparison. Weight tolerance in this fictional sample is 25 kg or 0.5 percent, whichever is greater. Contract terms and carrier acceptance still require human confirmation.", styles["BodySmall"]),
    ]))
    story.append(Spacer(1, 6 * mm))
    story.append(KeepTogether([Paragraph("Detailed findings", styles["H1Navy"]), finding_block(FINDINGS[0])]))
    for item in FINDINGS[1:]:
        story.append(finding_block(item))
    story.append(Paragraph("Reviewer checklist", styles["H1Navy"]))
    checklist = ["Confirm the booking and service-contract freight basis.", "Send corrected container, freight terms and notify-party instructions to the carrier.", "Confirm final gross weight against the packing list or verified gross-mass source.", "Re-run the shipment check after the revised draft arrives.", "Record the final reviewer and approval decision before export."]
    story.append(Table([[Paragraph(str(i + 1), ParagraphStyle(name=f"check-{i}", parent=styles["Value"], textColor=BLUE)), Paragraph(item, styles["BodySmall"])] for i, item in enumerate(checklist)], colWidths=[12 * mm, 157 * mm], style=TableStyle([("GRID", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (0, -1), PALE_BLUE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm), ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm), ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm)])))
    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Important limitations", styles["H1Navy"]))
    story.append(Paragraph("This demonstration does not authenticate document issuers, establish title, confirm cargo condition, make customs or sanctions determinations, approve dangerous goods, apply every carrier tariff, or replace qualified operational, legal, banking, insurance or regulatory review. Source images and values are fictional.", styles["BodySmall"]))
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("gainingdocx.com/sample-discrepancy-report", ParagraphStyle(name="url", parent=styles["BodySmall"], textColor=BLUE, alignment=TA_CENTER)))

    doc.build(story)
    PUBLIC.write_bytes(OUT.read_bytes())
    print(OUT)


if __name__ == "__main__":
    build()
