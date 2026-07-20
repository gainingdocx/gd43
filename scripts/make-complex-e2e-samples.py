"""Create a realistic, multi-page shipment set for local end-to-end tests."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)
BLUE = colors.HexColor("#003BB3")
RED = colors.HexColor("#D40511")
PALE = colors.HexColor("#EAF1FF")
GRID = colors.HexColor("#B8C8E8")
styles = getSampleStyleSheet()
small = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=7.3, leading=9)
small_right = ParagraphStyle("SmallRight", parent=small, alignment=TA_RIGHT)


def p(value, style=small):
    return Paragraph(str(value).replace("&", "&amp;").replace("\n", "<br/>"), style)


def header(canvas, doc, title):
    canvas.saveState()
    canvas.setFillColor(BLUE)
    canvas.rect(0, A4[1] - 25 * mm, A4[0], 25 * mm, fill=1, stroke=0)
    canvas.setFillColor(RED)
    canvas.rect(0, A4[1] - 27 * mm, A4[0], 2 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 15)
    canvas.drawString(16 * mm, A4[1] - 16 * mm, title)
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(A4[0] - 16 * mm, A4[1] - 16 * mm, f"E2E FIXTURE | Page {doc.page}")
    canvas.setFillColor(colors.HexColor("#52637A"))
    canvas.drawString(16 * mm, 9 * mm, "Synthetic test document - not valid for carriage, customs or payment")
    canvas.restoreState()


def table(rows, widths, header_row=True, font_size=7.3):
    cooked = [[p(cell) for cell in row] for row in rows]
    result = Table(cooked, colWidths=widths, repeatRows=1 if header_row else 0)
    commands = [
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
    ]
    if header_row:
        commands += [
            ("BACKGROUND", (0, 0), (-1, 0), BLUE),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ]
    result.setStyle(TableStyle(commands))
    return result


SHIPPER = "Blue Harbor Exports Pvt Ltd\n18 Marine Trade Park\nMumbai 400001, India\nGSTIN 27AABCB1234F1Z5"
BUYER = "Northstar Imports Pte Ltd\n88 Harbour Front Avenue\nSingapore 098585\nUEN 201912345N"
NOTIFY = "Northstar Logistics Hub Pte Ltd\n12 Keppel Distribution Road\nSingapore 089056"
LINES = [
    ("Marine-grade stainless-steel elbow fittings, 316L", "730723", 480, 48, 2160, 2400, "100 x 80 x 30", 11.520, 18.75, 9000),
    ("Flanged industrial valve assemblies, DN50", "848180", 320, 32, 1440, 1600, "100 x 80 x 30", 7.680, 28.125, 9000),
    ("Pressure gauge kits with brass connectors", "902620", 200, 20, 900, 1000, "100 x 80 x 30", 4.800, 15.00, 3000),
    ("Food-grade PTFE gasket sets", "392690", 600, 30, 540, 600, "80 x 60 x 25", 3.600, 5.00, 3000),
    ("Stainless mounting brackets and fasteners", "732690", 400, 20, 720, 800, "80 x 60 x 25", 2.400, 7.50, 3000),
    ("Replacement actuator seal and repair kits", "848190", 240, 12, 540, 600, "80 x 60 x 25", 1.440, 12.50, 3000),
]


def build_bl():
    path = OUT / "complex-bill-of-lading.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=34 * mm, bottomMargin=16 * mm)
    story = [p("MULTIMODAL BILL OF LADING - COPY / NON-NEGOTIABLE", styles["Heading2"]), Spacer(1, 2 * mm)]
    story += [table([
        ["B/L Number", "Carrier / SCAC", "Booking Number", "Service Contract"],
        ["GDXCPLX20260720", "Ocean Meridian Lines / OMLU", "BKG-SIN-260714-88", "SC-2026-4418"],
        ["Vessel / Voyage", "IMO Number", "Freight Terms", "B/L Type"],
        ["MV Meridian Star / 026E", "IMO 9074729", "PREPAID", "Sea waybill / express release"],
    ], [44.5 * mm] * 4), Spacer(1, 3 * mm)]
    story += [table([
        ["SHIPPER", "CONSIGNEE", "NOTIFY PARTY"],
        [SHIPPER, BUYER, NOTIFY],
    ], [59.3 * mm] * 3), Spacer(1, 3 * mm)]
    story += [table([
        ["Place of receipt", "Port of loading", "Port of discharge", "Place of delivery"],
        ["Nhava Sheva CFS, India", "Nhava Sheva (INNSA)", "Singapore (SGSIN)", "Jurong Logistics Hub, Singapore"],
        ["Pre-carriage", "Ocean vessel", "Shipped on board", "Issue date / place"],
        ["Truck / merchant haulage", "MV Meridian Star / 026E", "18 July 2026", "19 July 2026 / Mumbai"],
    ], [44.5 * mm] * 4), Spacer(1, 3 * mm)]
    story += [p("PARTICULARS DECLARED BY SHIPPER", styles["Heading3"]), table([
        ["Container / Seal", "ISO type", "Packages", "Description", "Gross kg", "CBM"],
        ["MSCU6639870 / SL908771", "40HC", "100 cartons", "Industrial valves, fittings and gauges\nHS 730723 / 848180 / 902620", "5,000.000", "24.000"],
        ["CSQU3054383 / SL908772", "40HC", "82 cartons", "Gaskets, mounting hardware and repair kits\nHS 392690 / 732690 / 848190", "2,000.000", "7.440"],
    ], [38 * mm, 18 * mm, 24 * mm, 62 * mm, 20 * mm, 16 * mm]), Spacer(1, 3 * mm)]
    story += [table([
        ["TOTAL PACKAGES", "TOTAL GROSS WEIGHT", "TOTAL VOLUME", "ORIGINALS"],
        ["182 CARTONS", "7,000.000 KG", "31.440 CBM", "0 - EXPRESS RELEASE"],
    ], [44.5 * mm] * 4), PageBreak()]
    story += [p("CARGO DETAIL AND SHIPPING MARKS", styles["Heading2"]), table([[
        "Marks and numbers", "Cargo description", "Packages", "Gross kg"
    ]] + [
        [f"NSI/PO-8821/{i:02d}\nMADE IN INDIA", line[0], f"{line[3]} cartons", f"{line[5]:,.3f}"]
        for i, line in enumerate(LINES, 1)
    ], [40 * mm, 91 * mm, 23 * mm, 24 * mm]), Spacer(1, 4 * mm)]
    clauses = [
        "SHIPPER'S LOAD, STOW, COUNT AND SEALED.",
        "FREIGHT PREPAID. CLEAN ON BOARD.",
        "CARGO TO BE KEPT DRY AND PROTECTED FROM CONDENSATION.",
        "EXPRESS RELEASE: NO ORIGINAL BILL OF LADING REQUIRED AT DESTINATION.",
        "14 CALENDAR DAYS COMBINED DEMURRAGE AND DETENTION AT DESTINATION, SUBJECT TO TARIFF.",
    ]
    story += [p("CARRIER CLAUSES", styles["Heading3"]), table([["No.", "Clause"]] + [[str(i), clause] for i, clause in enumerate(clauses, 1)], [15 * mm, 163 * mm]), Spacer(1, 8 * mm)]
    story += [table([["Signed for the carrier", "Ocean Meridian Lines authorized agent"], ["Place and date", "Mumbai, India - 19 July 2026"]], [55 * mm, 123 * mm], header_row=False)]
    doc.build(story, onFirstPage=lambda c, d: header(c, d, "BILL OF LADING"), onLaterPages=lambda c, d: header(c, d, "BILL OF LADING - CONTINUATION"))
    return path


def build_invoice():
    path = OUT / "complex-commercial-invoice.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=34 * mm, bottomMargin=16 * mm)
    story = [table([
        ["Invoice number", "Invoice date", "Purchase order", "Currency"],
        ["INV-GDX-2026-0715-C", "15 July 2026", "PO-NSI-8821", "USD"],
        ["Incoterm", "Country of origin", "Payment terms", "L/C number"],
        ["FOB Nhava Sheva - Incoterms 2020", "India", "30 days from B/L date", "LC-DBS-260611-42"],
    ], [44.5 * mm] * 4), Spacer(1, 3 * mm), table([["SELLER", "BUYER"], [SHIPPER, BUYER]], [89 * mm, 89 * mm]), Spacer(1, 4 * mm)]
    line_rows = [["Line", "Description / HS", "Qty", "Net kg", "Gross kg", "Unit USD", "Amount USD"]]
    for i, line in enumerate(LINES, 1):
        line_rows.append([str(i), f"{line[0]}\nHS {line[1]}", str(line[2]), f"{line[4]:,.3f}", f"{line[5]:,.3f}", f"{line[8]:,.3f}", f"{line[9]:,.2f}"])
    story += [table(line_rows, [10 * mm, 72 * mm, 16 * mm, 19 * mm, 19 * mm, 20 * mm, 22 * mm]), Spacer(1, 4 * mm)]
    story += [table([
        ["Subtotal", "USD 33,000.00"], ["Ocean freight", "USD 0.00"], ["Insurance", "USD 0.00"], ["TOTAL INVOICE VALUE", "USD 33,000.00"],
    ], [130 * mm, 48 * mm], header_row=False), PageBreak()]
    story += [p("DECLARATION, BANK AND COMPLIANCE DETAILS", styles["Heading2"]), table([
        ["Bank", "DBS Bank Ltd, Singapore"], ["Account name", "Blue Harbor Exports Pvt Ltd"], ["SWIFT", "DBSSSGSG"], ["Beneficiary account", "USD 003-881122-4"],
        ["Declaration", "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct."],
        ["Origin statement", "Goods are of Indian origin. No preferential origin claimed."],
    ], [42 * mm, 136 * mm], header_row=False), Spacer(1, 8 * mm)]
    story += [table([["Authorized signatory", "Anita Rao - Export Documentation Manager"], ["Date", "15 July 2026"]], [55 * mm, 123 * mm], header_row=False)]
    doc.build(story, onFirstPage=lambda c, d: header(c, d, "COMMERCIAL INVOICE"), onLaterPages=lambda c, d: header(c, d, "COMMERCIAL INVOICE - CONTINUATION"))
    return path


def build_packing():
    path = OUT / "complex-packing-list.pdf"
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm, topMargin=34 * mm, bottomMargin=16 * mm)
    story = [table([
        ["Packing list", "Date", "Invoice reference", "Purchase order"],
        ["PL-GDX-2026-0715-C", "15 July 2026", "INV-GDX-2026-0715-C", "PO-NSI-8821"],
    ], [44.5 * mm] * 4), Spacer(1, 3 * mm), table([["SELLER", "BUYER"], [SHIPPER, BUYER]], [89 * mm, 89 * mm]), Spacer(1, 4 * mm)]
    rows = [["Line", "Description / HS", "Cartons", "Net kg", "Gross kg", "Dimensions cm", "CBM"]]
    for i, line in enumerate(LINES, 1):
        rows.append([str(i), f"{line[0]}\nHS {line[1]}", str(line[3]), f"{line[4]:,.3f}", f"{line[5]:,.3f}", line[6], f"{line[7]:.3f}"])
    story += [table(rows, [10 * mm, 70 * mm, 18 * mm, 19 * mm, 19 * mm, 25 * mm, 17 * mm]), Spacer(1, 4 * mm)]
    story += [table([
        ["TOTAL CARTONS", "TOTAL NET WEIGHT", "TOTAL GROSS WEIGHT", "TOTAL VOLUME"],
        ["182", "6,300.000 KG", "7,000.000 KG", "31.440 CBM"],
    ], [44.5 * mm] * 4), PageBreak()]
    story += [p("CONTAINER LOADING AND CARTON RANGES", styles["Heading2"]), table([
        ["Container", "Seal", "ISO type", "Carton marks / ranges", "Cartons", "Gross kg", "CBM"],
        ["MSCU6639870", "SL908771", "40HC", "NSI/PO-8821/01-03\nCartons 001-100", "100", "5,000.000", "24.000"],
        ["CSQU3054383", "SL908772", "40HC", "NSI/PO-8821/04-06\nCartons 101-182", "82", "2,000.000", "7.440"],
    ], [31 * mm, 23 * mm, 17 * mm, 48 * mm, 18 * mm, 23 * mm, 18 * mm]), Spacer(1, 4 * mm)]
    story += [table([
        ["Packing method", "Export cartons on heat-treated ISPM 15 pallets; moisture barrier and desiccant fitted."],
        ["Handling", "Keep dry. Do not stack more than three pallets high. Forklift from marked sides only."],
        ["Verification", "All cartons counted, weighed and sealed under warehouse supervision on 16 July 2026."],
    ], [38 * mm, 140 * mm], header_row=False)]
    doc.build(story, onFirstPage=lambda c, d: header(c, d, "PACKING LIST"), onLaterPages=lambda c, d: header(c, d, "PACKING LIST - CONTAINER DETAIL"))
    return path


if __name__ == "__main__":
    for generated in (build_bl(), build_invoice(), build_packing()):
        print(generated)
