"""Generate synthetic shipping documents used only for local E2E verification."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "tmp" / "pdfs"
OUT.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()


def build(filename, title, facts, parties, headers, rows, totals):
    path = OUT / filename
    doc = SimpleDocTemplate(str(path), pagesize=A4, leftMargin=16*mm, rightMargin=16*mm, topMargin=8*mm, bottomMargin=8*mm)
    story = [Paragraph("GAININGDOCX E2E SAMPLE - NOT A REAL SHIPPING DOCUMENT", styles["BodyText"]), Spacer(1, 2*mm), Paragraph(title, styles["Title"]), Spacer(1, 2*mm)]
    fact_rows = [[k, v] for k, v in facts]
    ft = Table(fact_rows, colWidths=[45*mm, 115*mm])
    ft.setStyle(TableStyle([("BACKGROUND", (0,0),(0,-1), colors.HexColor("#EAF1FF")), ("TEXTCOLOR",(0,0),(0,-1),colors.HexColor("#003BB3")), ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"), ("GRID",(0,0),(-1,-1),.5,colors.HexColor("#B8C8E8")), ("VALIGN",(0,0),(-1,-1),"TOP"), ("PADDING",(0,0),(-1,-1),4)]))
    story += [ft, Spacer(1, 2*mm)]
    pt = Table([[Paragraph(k, styles["Heading4"]), Paragraph(v.replace("\n", "<br/>"), styles["BodyText"])] for k,v in parties], colWidths=[45*mm,115*mm])
    pt.setStyle(TableStyle([("GRID",(0,0),(-1,-1),.5,colors.HexColor("#B8C8E8")),("VALIGN",(0,0),(-1,-1),"TOP"),("PADDING",(0,0),(-1,-1),4)]))
    story += [pt, Spacer(1, 3*mm)]
    table = Table([headers] + rows, repeatRows=1)
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#003BB3")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("GRID",(0,0),(-1,-1),.5,colors.HexColor("#B8C8E8")),("VALIGN",(0,0),(-1,-1),"TOP"),("PADDING",(0,0),(-1,-1),5)]))
    story += [table, Spacer(1, 4*mm)]
    totals_table = Table([[k, v] for k,v in totals], colWidths=[120*mm,40*mm])
    totals_table.setStyle(TableStyle([("ALIGN",(1,0),(1,-1),"RIGHT"),("FONTNAME",(0,0),(-1,-1),"Helvetica-Bold"),("LINEABOVE",(0,0),(-1,0),1,colors.HexColor("#003BB3")),("PADDING",(0,0),(-1,-1),4)]))
    story += [totals_table, Spacer(1, 6*mm), Paragraph("Synthetic test fixture created for GainingDocx functional verification.", styles["BodyText"])]
    doc.build(story)
    return path


shipper = "Blue Harbor Exports Pvt Ltd\n18 Marine Trade Park\nMumbai 400001, India"
buyer = "Northstar Imports Pte Ltd\n88 Harbour Front Avenue\nSingapore 098585, Singapore"

build("sample-bill-of-lading.pdf", "BILL OF LADING", [
    ("B/L Number", "GDXE2E20260720"), ("Carrier / SCAC", "MAEU - Maersk Line"),
    ("Vessel / Voyage", "MAERSK SENTOSA / 626E"), ("IMO Number", "IMO 9074729"),
    ("Port of Loading", "Shanghai, China (CNSGH)"), ("Port of Discharge", "Singapore (SGSIN)"),
    ("Shipped on Board", "18 July 2026"), ("Issue Date", "19 July 2026"),
    ("Freight Terms", "PREPAID"), ("Incoterm", "FOB"),
], [("Shipper", shipper), ("Consignee", buyer), ("Notify Party", buyer)],
   ["Container", "Seal", "Type", "Packages", "Gross kg", "CBM"],
   [["MSCU6639870", "SL908771", "40HC", "100 cartons", "5000", "24.000"]],
   [("Total packages", "100 cartons"), ("Total gross weight", "5000 kg"), ("Total volume", "24.000 CBM"), ("Originals", "3")])

build("sample-commercial-invoice.pdf", "COMMERCIAL INVOICE", [
    ("Invoice Number", "INV-GDX-2026-0715"), ("Invoice Date", "15 July 2026"),
    ("PO Number", "PO-NSI-8821"), ("Currency", "USD"), ("Incoterm", "FOB"),
    ("Country of Origin", "India"), ("Payment Terms", "30 days from B/L date"),
], [("Seller", shipper), ("Buyer", buyer)],
   ["Description", "HS code", "Qty", "Net kg", "Gross kg", "Unit USD", "Amount USD"],
   [["Marine-grade stainless fittings", "732690", "60 cartons", "2700", "3000", "125", "7500"], ["Industrial valve assemblies", "848180", "40 cartons", "1800", "2000", "187.50", "7500"]],
   [("Subtotal", "USD 15,000.00"), ("Freight", "USD 0.00"), ("Insurance", "USD 0.00"), ("Total amount", "USD 15,000.00")])

build("sample-packing-list.pdf", "PACKING LIST", [
    ("Packing List Number", "PL-GDX-2026-0715"), ("Date", "15 July 2026"),
    ("Invoice Reference", "INV-GDX-2026-0715"), ("PO Number", "PO-NSI-8821"),
    ("Container", "MSCU6639870"),
], [("Seller", shipper), ("Buyer", buyer)],
   ["Description", "Cartons", "Net kg", "Gross kg", "L x W x H cm", "CBM"],
   [["Marine-grade stainless fittings", "60", "2700", "3000", "100 x 80 x 30", "14.400"], ["Industrial valve assemblies", "40", "1800", "2000", "100 x 80 x 30", "9.600"]],
   [("Total cartons", "100"), ("Total net weight", "4500 kg"), ("Total gross weight", "5000 kg"), ("Total volume", "24.000 CBM")])

print(f"Generated samples in {OUT}")
