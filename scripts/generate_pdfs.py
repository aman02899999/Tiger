#!/usr/bin/env python3
"""Tiger Fitness Pro — Premium PDF Generator"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import Flowable
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle, Polygon, LineShape
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.colors import HexColor, Color
import math

OUT = "/home/user/Tiger/public/guides"
os.makedirs(OUT, exist_ok=True)

# ─── Colour Palette ───────────────────────────────────────────────────────────
VIOLET      = HexColor("#4C1D95")
VIOLET_LIGHT= HexColor("#EDE9FE")
VIOLET_MID  = HexColor("#7C3AED")
GOLD        = HexColor("#D97706")
GOLD_LIGHT  = HexColor("#FEF3C7")
CREAM       = HexColor("#FFFEF8")
DARK        = HexColor("#1C1C1E")
GREY        = HexColor("#6B7280")
WHITE       = colors.white
ROW_ALT     = HexColor("#F5F3FF")
GREEN       = HexColor("#065F46")
GREEN_LIGHT = HexColor("#D1FAE5")
RED         = HexColor("#991B1B")
RED_LIGHT   = HexColor("#FEE2E2")
BLUE        = HexColor("#1E40AF")
BLUE_LIGHT  = HexColor("#DBEAFE")

W, H = A4

# ─── Watermark & Page Template ────────────────────────────────────────────────
def add_watermark(c, doc):
    c.saveState()
    c.setFont("Helvetica-Bold", 52)
    c.setFillColor(Color(0.3, 0.1, 0.6, alpha=0.055))
    c.translate(W/2, H/2)
    c.rotate(45)
    c.drawCentredString(0, 0, "TIGER FITNESS PRO")
    c.restoreState()

def add_header_footer(c, doc):
    add_watermark(c, doc)
    # Header bar
    c.setFillColor(VIOLET)
    c.rect(0, H - 28*mm, W, 28*mm, fill=1, stroke=0)
    c.setFillColor(GOLD)
    c.rect(0, H - 30*mm, W, 2*mm, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(WHITE)
    c.drawString(15*mm, H - 18*mm, "🐅  TIGER FITNESS PRO")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#C4B5FD"))
    c.drawRightString(W - 15*mm, H - 18*mm, doc.title)
    # Footer
    c.setFillColor(VIOLET)
    c.rect(0, 0, W, 12*mm, fill=1, stroke=0)
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#C4B5FD"))
    c.drawString(15*mm, 4*mm, "© Tiger Fitness Pro | tigerfit.pro | Premium Knowledge Series")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(W - 15*mm, 4*mm, f"Page {doc.page}")

# ─── Styles ───────────────────────────────────────────────────────────────────
def get_styles():
    s = getSampleStyleSheet()
    base = dict(fontName="Helvetica", fontSize=10, leading=15, textColor=DARK,
                spaceAfter=6, spaceBefore=4)
    return {
        "body":    ParagraphStyle("body",    **base, alignment=TA_JUSTIFY),
        "bullet":  ParagraphStyle("bullet",  **base, leftIndent=14, bulletIndent=4),
        "small":   ParagraphStyle("small",   fontName="Helvetica", fontSize=8,
                                  textColor=GREY, leading=11),
        "caption": ParagraphStyle("caption", fontName="Helvetica-Oblique", fontSize=9,
                                  textColor=GREY, alignment=TA_CENTER, spaceAfter=8),
        "h2":      ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=14,
                                  textColor=VIOLET, spaceBefore=14, spaceAfter=6, leading=18),
        "h3":      ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=DARK, spaceBefore=10, spaceAfter=4, leading=14),
        "white":   ParagraphStyle("white", fontName="Helvetica-Bold", fontSize=10,
                                  textColor=WHITE, leading=14),
        "gold":    ParagraphStyle("gold", fontName="Helvetica-Bold", fontSize=11,
                                  textColor=GOLD, leading=14),
        "center":  ParagraphStyle("center", fontName="Helvetica", fontSize=10,
                                  textColor=DARK, alignment=TA_CENTER, leading=14),
    }

ST = get_styles()

# ─── Flowable helpers ─────────────────────────────────────────────────────────
def sp(n=6):   return Spacer(1, n)
def hr():      return HRFlowable(width="100%", thickness=1, color=VIOLET_LIGHT, spaceAfter=8)
def pb():      return PageBreak()

def h2(text):  return Paragraph(f"<b>{text}</b>", ST["h2"])
def h3(text):  return Paragraph(f"<b>{text}</b>", ST["h3"])
def p(text):   return Paragraph(text, ST["body"])
def bul(text): return Paragraph(f"• {text}", ST["bullet"])
def sm(text):  return Paragraph(text, ST["small"])
def cap(text): return Paragraph(text, ST["caption"])

def section(title):
    """Violet pill section header"""
    data = [[Paragraph(f"<b>{title}</b>", ST["white"])]]
    t = Table(data, colWidths=[W - 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), VIOLET),
        ("ROWPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("ROUNDEDCORNERS", [6]),
    ]))
    return [sp(10), t, sp(8)]

def callout(text, title=""):
    content = f"<b>{title}</b><br/>{text}" if title else text
    data = [[Paragraph(content, ST["body"])]]
    t = Table(data, colWidths=[W - 30*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), GOLD_LIGHT),
        ("LEFTPADDING", (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING", (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LINEAFTER", (0,0), (0,-1), 4, GOLD),  # Removed invalid ROUNDEDCORNERS
    ]))
    return [sp(6), t, sp(6)]

def make_table(headers, rows, col_widths=None):
    if col_widths is None:
        avail = W - 30*mm
        col_widths = [avail / len(headers)] * len(headers)
    header_row = [Paragraph(f"<b>{h}</b>", ST["white"]) for h in headers]
    data = [header_row]
    for i, row in enumerate(rows):
        styled = [Paragraph(str(c), ST["body"]) for c in row]
        data.append(styled)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style = [
        ("BACKGROUND", (0,0), (-1,0), VIOLET),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, ROW_ALT]),
        ("GRID", (0,0), (-1,-1), 0.5, HexColor("#E5E7EB")),
        ("TOPPADDING", (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING", (0,0), (-1,-1), 8),
        ("RIGHTPADDING", (0,0), (-1,-1), 8),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,1), (-1,-1), 9),
    ]
    t.setStyle(TableStyle(style))
    return [sp(6), t, sp(8)]

def flowchart(steps, color=VIOLET):
    """Simple vertical flowchart"""
    items = []
    for i, step in enumerate(steps):
        bg = color if i == 0 else (GOLD if i == len(steps)-1 else VIOLET_LIGHT)
        fg = WHITE if (i == 0 or i == len(steps)-1) else DARK
        style = ParagraphStyle("fc", fontName="Helvetica-Bold" if (i==0 or i==len(steps)-1) else "Helvetica",
                               fontSize=10, textColor=fg, alignment=TA_CENTER, leading=13)
        data = [[Paragraph(step, style)]]
        t = Table(data, colWidths=[W - 50*mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), bg),
            ("TOPPADDING", (0,0), (-1,-1), 8),
            ("BOTTOMPADDING", (0,0), (-1,-1), 8),
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
        ]))
        items.append(t)
        if i < len(steps) - 1:
            arrow = Table([[Paragraph("▼", ParagraphStyle("arr", fontSize=14, alignment=TA_CENTER, textColor=GOLD))]],
                         colWidths=[W - 50*mm])
            items.append(arrow)
    return [sp(6)] + items + [sp(8)]

def two_col(left_title, left_items, right_title, right_items, left_color=VIOLET, right_color=GOLD):
    col_w = (W - 34*mm) / 2
    def make_col(title, items, bg):
        rows = [[Paragraph(f"<b>{title}</b>", ST["white"])]]
        for item in items:
            rows.append([Paragraph(f"• {item}", ST["body"])])
        t = Table(rows, colWidths=[col_w])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), bg),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [WHITE, ROW_ALT]),
            ("GRID", (0,0), (-1,-1), 0.5, HexColor("#E5E7EB")),
            ("TOPPADDING", (0,0), (-1,-1), 6),
            ("BOTTOMPADDING", (0,0), (-1,-1), 6),
            ("LEFTPADDING", (0,0), (-1,-1), 8),
        ]))
        return t
    combo = Table([[make_col(left_title, left_items, left_color),
                    make_col(right_title, right_items, right_color)]],
                  colWidths=[col_w, col_w], hAlign="LEFT")
    combo.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),4),
                                ("RIGHTPADDING",(0,0),(-1,-1),4)]))
    return [sp(6), combo, sp(8)]

def disclaimer_page():
    return [
        pb(),
        *section("⚠️ IMPORTANT DISCLAIMER"),
        p("This PDF guide is produced by Tiger Fitness Pro for <b>educational and informational purposes only</b>. The content herein does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional, endocrinologist, or sports medicine physician before beginning any supplementation, hormonal, or pharmacological protocol."),
        sp(6),
        p("The information regarding anabolic steroids, SARMs, peptides, hormones, and related compounds is provided strictly for harm reduction and educational awareness. Tiger Fitness Pro does not encourage, promote, or facilitate the illegal purchase, possession, or use of controlled substances. Laws regarding these compounds vary by country and jurisdiction."),
        sp(6),
        p("Results described in this guide are not typical and individual responses will vary. Tiger Fitness Pro assumes no liability for any adverse outcomes resulting from the application of information contained in this document."),
        sp(6),
        *callout("This guide is intended for adults aged 18+ only. If you are under 18, please do not read or apply any content from this guide.", "Age Restriction:"),
        pb(),
    ]

# ─── Cover page builder ───────────────────────────────────────────────────────
def build_cover(filename, title, subtitle, pages, price, category="Premium Guide"):
    def cover_page(c, doc):
        # Background gradient effect
        c.setFillColor(VIOLET)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setFillColor(HexColor("#2D1B6B"))
        c.rect(0, 0, W, H*0.45, fill=1, stroke=0)
        # Gold accent bar
        c.setFillColor(GOLD)
        c.rect(0, H*0.45 - 3, W, 4, fill=1, stroke=0)
        # Decorative circles
        c.setFillColor(Color(1,1,1,alpha=0.04))
        c.circle(W*0.85, H*0.75, 120, fill=1, stroke=0)
        c.circle(W*0.1, H*0.85, 80, fill=1, stroke=0)
        c.circle(W*0.5, H*0.1, 60, fill=1, stroke=0)
        # Logo circle
        c.setFillColor(GOLD)
        c.circle(W/2, H*0.72, 42, fill=1, stroke=0)
        c.setFillColor(VIOLET)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(W/2, H*0.72 - 8, "TF")
        # Category badge
        c.setFillColor(Color(1,1,1,alpha=0.15))
        c.roundRect(W/2 - 60, H*0.62 - 10, 120, 22, 11, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(W/2, H*0.62 - 2, category.upper())
        # Title
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 24 if len(title) < 30 else 20)
        lines = []
        words = title.split()
        line = ""
        for w in words:
            if len(line + w) < 28:
                line += w + " "
            else:
                lines.append(line.strip())
                line = w + " "
        if line: lines.append(line.strip())
        y = H*0.55 + (len(lines)-1)*16
        for ln in lines:
            c.drawCentredString(W/2, y, ln)
            y -= 30
        # Subtitle
        c.setFont("Helvetica", 13)
        c.setFillColor(HexColor("#C4B5FD"))
        c.drawCentredString(W/2, H*0.38 + 10, subtitle)
        # Stats row
        stats = [f"{pages} Pages", f"₹{price:,} Value", "Watermarked"]
        x = W/4
        for stat in stats:
            c.setFillColor(Color(1,1,1,alpha=0.12))
            c.roundRect(x - 45, H*0.25 - 14, 90, 28, 6, fill=1, stroke=0)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 10)
            c.drawCentredString(x, H*0.25 - 2, stat)
            x += W/4
        # Brand footer
        c.setFillColor(Color(0,0,0,alpha=0.3))
        c.rect(0, 0, W, 22*mm, fill=1, stroke=0)
        c.setFillColor(GOLD)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(W/2, 12*mm, "TIGER FITNESS PRO  |  tigerfit.pro")
        c.setFillColor(HexColor("#C4B5FD"))
        c.setFont("Helvetica", 9)
        c.drawCentredString(W/2, 7*mm, "India's Premium Fitness Knowledge Platform")
    return cover_page

# ─── PDF builder ─────────────────────────────────────────────────────────────
def build_pdf(filename, title, subtitle, pages_val, price, category, story_fn, is_medical=False):
    path = os.path.join(OUT, filename)
    doc = SimpleDocTemplate(
        path, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=35*mm, bottomMargin=18*mm,
        title=title, author="Tiger Fitness Pro",
    )
    cover = build_cover(filename, title, subtitle, pages_val, price, category)
    story = []
    # Cover (no header/footer)
    from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate
    story = story_fn()
    doc.build(story,
              onFirstPage=cover,
              onLaterPages=add_header_footer)
    print(f"  ✓ {filename}")
    return path

# ═══════════════════════════════════════════════════════════════════════════════
# PDF 1 — Fat Loss Masterclass
# ═══════════════════════════════════════════════════════════════════════════════
def pdf_fat_loss():
    s = []
    s += [pb()]  # after cover
    s += section("Chapter 1: The Science of Fat Loss")
    s += [p("Fat loss is fundamentally governed by energy balance — consuming fewer calories than you expend forces your body to mobilise stored fat for fuel. However, the quality of weight lost (fat vs muscle) depends heavily on training stimulus, protein intake, and hormonal environment.")]
    s += callout("Key Principle: A deficit of 500 kcal/day creates ~0.5 kg fat loss per week. Never exceed 1000 kcal/day deficit — muscle catabolism increases sharply beyond this threshold.", "Energy Balance Rule:")
    s += section("TDEE Calculation Formula")
    s += flowchart([
        "Step 1: Calculate BMR\nMen: 10×weight(kg) + 6.25×height(cm) − 5×age + 5\nWomen: 10×weight(kg) + 6.25×height(cm) − 5×age − 161",
        "Step 2: Multiply by Activity Factor\nSedentary ×1.2 | Light ×1.375 | Moderate ×1.55 | Active ×1.725 | Very Active ×1.9",
        "Step 3: Apply Deficit\nMild loss: TDEE − 300 kcal | Moderate: TDEE − 500 kcal | Aggressive: TDEE − 750 kcal",
        "Step 4: Set Protein First\n2.2–2.6g per kg bodyweight — protects muscle during deficit",
        "✅ Result: Your personalised fat loss calorie target"
    ])
    s += section("Macro Targets for Fat Loss")
    s += make_table(
        ["Goal", "Protein", "Carbs", "Fat", "Example (75kg person)"],
        [
            ["Mild cut", "2.0g/kg", "35% cals", "25% cals", "150g P / 175g C / 55g F"],
            ["Moderate cut", "2.2g/kg", "30% cals", "25% cals", "165g P / 148g C / 55g F"],
            ["Aggressive cut", "2.6g/kg", "20% cals", "25% cals", "195g P / 105g C / 55g F"],
            ["Recomposition", "2.4g/kg", "35% cals", "25% cals", "180g P / 165g C / 55g F"],
        ],
        [50*mm, 28*mm, 28*mm, 25*mm, 50*mm]
    )
    s += section("Chapter 2: Training for Maximum Fat Loss")
    s += [p("Resistance training is the single most important training modality for fat loss — it preserves lean mass while in a deficit, elevates resting metabolic rate (RMR), and creates the greatest EPOC (excess post-exercise oxygen consumption).")]
    s += make_table(
        ["Protocol", "Frequency", "Volume", "Fat Loss Effect", "Muscle Preservation"],
        [
            ["Heavy Strength (75–85% 1RM)", "3–4x/week", "15–20 sets/muscle", "Moderate", "★★★★★"],
            ["Moderate Hypertrophy (65–75%)", "4–5x/week", "18–24 sets/muscle", "High", "★★★★★"],
            ["HIIT Cardio", "2–3x/week", "20–30 min sessions", "Very High", "★★★"],
            ["LISS Cardio", "3–5x/week", "30–60 min sessions", "Moderate", "★★★★"],
            ["Combined (Strength + Cardio)", "5x/week", "Concurrent training", "Highest", "★★★★"],
        ],
        [52*mm, 32*mm, 40*mm, 32*mm, 32*mm]
    )
    s += section("HIIT vs LISS — Complete Comparison")
    s += two_col(
        "HIIT (High Intensity Interval Training)",
        ["Burns 25–30% more calories than LISS in same time",
         "Elevates metabolism 12–24 hours post-session (EPOC)",
         "Preserves muscle better than long-duration LISS",
         "Best protocols: Tabata, 30:30, 40:20 work:rest",
         "Maximum 3 sessions/week to avoid CNS fatigue",
         "Ideal: Stationary bike, sprint intervals, battle ropes"],
        "LISS (Low Intensity Steady State)",
        ["Primarily fat-oxidation fuel source during session",
         "Lower recovery cost — can be done daily",
         "Enhances cardiovascular health and mitochondrial density",
         "Best protocols: Brisk walk, elliptical, swimming",
         "4–6 sessions/week at 60–70% max HR",
         "Ideal: Morning fasted walk 30–45 min"]
    )
    s += section("Chapter 3: 12-Week Progressive Fat Loss Program")
    s += make_table(
        ["Week", "Phase", "Training Focus", "Cardio", "Deficit Target", "Expected Loss"],
        [
            ["1–2", "Adaptation", "Full body 3x/week", "LISS 3x 30min", "−300 kcal", "0.3–0.4 kg/week"],
            ["3–4", "Foundation", "Upper/Lower 4x/week", "LISS 4x 35min", "−400 kcal", "0.4–0.5 kg/week"],
            ["5–6", "Acceleration", "PPL 5x/week", "LISS 4x + HIIT 2x", "−500 kcal", "0.5–0.6 kg/week"],
            ["7–8", "Peak Fat Loss", "PPL 5x/week", "LISS 5x + HIIT 2x", "−600 kcal", "0.5–0.7 kg/week"],
            ["9–10", "Intensification", "PPL 6x/week", "LISS 5x + HIIT 3x", "−700 kcal", "0.6–0.7 kg/week"],
            ["11", "Refeed Week", "Volume reduced 40%", "LISS only 3x 20min", "Maintenance", "0 (recovery)"],
            ["12", "Final Push", "PPL 5x + deload", "HIIT 3x 25min", "−700 kcal", "0.7–0.8 kg/week"],
        ],
        [18*mm, 28*mm, 40*mm, 38*mm, 28*mm, 30*mm]
    )
    s += section("Chapter 4: Hormonal Response to Fat Loss")
    s += [p("Extended caloric deficits trigger adaptive thermogenesis — the body's survival mechanism that reduces metabolic rate beyond what body weight reduction alone explains. Understanding these hormonal shifts is critical for long-term fat loss success.")]
    s += make_table(
        ["Hormone", "Change During Deficit", "Effect on Fat Loss", "Mitigation Strategy"],
        [
            ["Leptin", "↓ 50% in 7 days of deficit", "Reduces satiety, slows metabolism", "Weekly refeed days"],
            ["Ghrelin", "↑ 24% after weight loss", "Increases hunger signals", "High protein + fibre intake"],
            ["T3 (Thyroid)", "↓ 15–30% in aggressive deficit", "Lowers metabolic rate significantly", "Avoid deficit >750 kcal"],
            ["Testosterone", "↓ 10–20% at <10% body fat", "Muscle loss, fatigue", "Keep fats ≥0.8g/kg"],
            ["Cortisol", "↑ with caloric stress", "Muscle catabolism, water retention", "Sleep 7–9h, manage stress"],
            ["Insulin", "↓ improves fat mobilisation", "Positive for fat oxidation", "Reduce refined carbs"],
        ],
        [30*mm, 42*mm, 45*mm, 45*mm]
    )
    s += section("Chapter 5: Indian Diet for Fat Loss")
    s += make_table(
        ["High-Calorie Indian Food", "Calories/serving", "Healthy Swap", "Calories Saved"],
        [
            ["White rice (1 cup cooked)", "200 kcal", "Cauliflower rice (1 cup)", "145 kcal"],
            ["Puri (2 pieces)", "220 kcal", "Whole wheat roti (2)", "90 kcal"],
            ["Mango lassi (1 glass)", "280 kcal", "Plain chaas (buttermilk)", "35 kcal"],
            ["Paratha with butter (2)", "380 kcal", "Plain roti with sabzi (2)", "160 kcal"],
            ["Biryani (1 plate)", "550 kcal", "Grilled chicken + salad", "250 kcal"],
            ["Rasgulla (3 pieces)", "240 kcal", "Fruit chaat (1 cup)", "80 kcal"],
            ["Samosa (2 pieces)", "320 kcal", "Sprout bhel (1 cup)", "110 kcal"],
            ["Full-fat dahi (200g)", "130 kcal", "Low-fat dahi (200g)", "70 kcal"],
        ],
        [55*mm, 38*mm, 52*mm, 35*mm]
    )
    s += section("Chapter 6: 7-Day Indian Fat Loss Diet Plan")
    s += make_table(
        ["Day", "Breakfast", "Lunch", "Dinner", "Snack", "Total Kcal"],
        [
            ["Mon", "Moong dal chilla (3) + chutney", "Dal + 2 roti + salad", "Grilled fish + cauliflower rice", "Handful almonds", "~1,650"],
            ["Tue", "Oats upma + boiled egg (2)", "Rajma (small) + 2 roti", "Paneer tikka (100g) + salad", "Sprout chaat", "~1,600"],
            ["Wed", "Egg white omelette (3) + toast", "Chicken curry (1 piece) + rice (½c)", "Dal palak + 1 roti", "Greek dahi + berries", "~1,620"],
            ["Thu", "Poha (1 cup) + boiled egg (2)", "Mixed veg + 2 roti", "Baked chicken breast + salad", "Roasted chana (30g)", "~1,580"],
            ["Fri", "Upma + coconut chutney", "Chole (small) + roti (2)", "Steamed fish + vegetables", "Buttermilk (250ml)", "~1,640"],
            ["Sat", "Besan chilla (3) + dahi", "Dal khichdi (light) + raita", "Paneer bhurji + salad", "Fruit (1 small)", "~1,600"],
            ["Sun", "Dosa (2) + sambar + chutney", "Chicken breast + dal + salad", "Moong dal soup + roti (1)", "Mixed nuts (25g)", "~1,660"],
        ],
        [14*mm, 42*mm, 40*mm, 40*mm, 30*mm, 22*mm]
    )
    s += section("Chapter 7: Supplement Stack for Fat Loss")
    s += make_table(
        ["Supplement", "Dosage", "Timing", "Evidence Level", "Benefit"],
        [
            ["Whey Protein", "25–40g/serving", "Post-workout + morning", "★★★★★", "Muscle preservation, satiety"],
            ["Caffeine", "200–400mg", "Pre-workout (fasted)", "★★★★★", "Fat oxidation, performance +12%"],
            ["L-Carnitine", "2–3g/day", "Pre-cardio with carbs", "★★★", "Fat transport to mitochondria"],
            ["Green Tea Extract (EGCG)", "400–600mg", "Morning + pre-workout", "★★★★", "Thermogenesis, fat oxidation"],
            ["CLA (Conjugated Linoleic Acid)", "3.4g/day", "With meals", "★★★", "Modest fat loss 0.1kg/week"],
            ["Creatine Monohydrate", "5g/day", "Any time", "★★★★★", "Preserves strength in deficit"],
            ["Vitamin D3", "2000–5000 IU", "With fatty meal", "★★★★", "Hormonal support, metabolic rate"],
            ["Magnesium Glycinate", "400mg", "Before bed", "★★★★", "Sleep quality, cortisol control"],
        ],
        [40*mm, 30*mm, 38*mm, 28*mm, 46*mm]
    )
    s += section("Chapter 8: Plateau-Breaking Protocol")
    s += flowchart([
        "Fat Loss Stalled for 2+ Weeks?",
        "Step 1: Audit — Recount calories precisely for 7 days (food scale mandatory)",
        "Step 2: Reduce calories by 100–150 kcal OR add 15 min cardio daily",
        "Step 3: Add 1 refeed day (eat at maintenance, high carb, low fat)",
        "Step 4: Implement diet break — 2 weeks at maintenance to reset leptin",
        "Step 5: Reassess — Recalculate TDEE (it has dropped with body weight)",
        "✅ Fat Loss Resumes — Continue with adjusted targets"
    ])
    s += section("Chapter 9: Sleep, Stress & Fat Loss")
    s += [p("Sleep deprivation is one of the most underappreciated barriers to fat loss. Studies show that sleeping 5.5 hours vs 8.5 hours while in a caloric deficit results in 55% less fat loss and 60% more muscle loss — even with identical calorie intakes.")]
    s += make_table(
        ["Sleep Hours", "Cortisol Level", "Ghrelin (Hunger)", "Fat Loss Efficiency", "Recommendation"],
        [
            ["<5 hours", "↑ 37%", "↑ 24%", "Very Poor — 55% reduction", "❌ Avoid at all costs"],
            ["5–6 hours", "↑ 18%", "↑ 12%", "Poor — 30% reduction", "❌ Insufficient"],
            ["7–8 hours", "Normal", "Normal", "Optimal — baseline", "✅ Target range"],
            ["8–9 hours", "↓ 8%", "↓ 6%", "Excellent — slight edge", "✅ Ideal if possible"],
        ],
        [28*mm, 32*mm, 32*mm, 45*mm, 45*mm]
    )
    s += [pb()]
    s += section("Chapter 10: Common Mistakes — Decision Flowchart")
    s += flowchart([
        "Not losing weight?",
        "Are you tracking calories accurately? (Food scale, all oils counted)\n→ NO: Start tracking immediately",
        "Are you eating enough protein? (≥2.0g/kg body weight)\n→ NO: Prioritise protein at every meal",
        "Are you sleeping 7+ hours?\n→ NO: Fix sleep before anything else",
        "Are you doing resistance training?\n→ NO: Add 3x/week strength training",
        "Is cardio volume too high? (>5h/week)\n→ YES: Reduce to 3–4h and add refeed day",
        "✅ Implementing all of the above? Results WILL come — stay consistent!"
    ], VIOLET_MID)
    return s

# ═══════════════════════════════════════════════════════════════════════════════
# PDF 2 — Indian Nutrition Bible
# ═══════════════════════════════════════════════════════════════════════════════
def pdf_nutrition_bible():
    s = [pb()]
    s += section("Chapter 1: The 70+ Indian Foods Macro Database")
    s += [p("Every value below is per 100g of cooked/prepared food unless stated as raw. Data sourced from ICMR (Indian Council of Medical Research) Nutritive Value of Indian Foods and cross-referenced with USDA.")]
    s += make_table(
        ["Food Item", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)", "Key Nutrient"],
        [
            # Pulses & Legumes
            ["Moong dal (cooked)", "105", "7.0", "19.0", "0.4", "Iron, Folate"],
            ["Toor/Arhar dal", "114", "7.2", "20.6", "0.4", "Folate, Magnesium"],
            ["Masoor dal (red lentil)", "116", "9.0", "20.0", "0.4", "Iron, Protein"],
            ["Chana dal", "164", "8.7", "29.0", "2.7", "Fibre, Zinc"],
            ["Rajma (kidney beans)", "127", "8.7", "22.8", "0.5", "Iron, Potassium"],
            ["Chole (chickpeas cooked)", "164", "8.9", "27.4", "2.6", "Protein, Fibre"],
            ["Soya chunks (dry)", "345", "52.0", "33.0", "0.5", "Best veg protein"],
            ["Tofu (firm)", "76", "8.0", "1.9", "4.8", "Calcium, Protein"],
            # Grains & Cereals
            ["White rice (cooked)", "130", "2.7", "28.2", "0.3", "Quick energy"],
            ["Brown rice (cooked)", "111", "2.6", "23.0", "0.9", "Fibre, B vitamins"],
            ["Whole wheat roti (1 piece)", "71", "2.7", "14.0", "1.0", "Fibre, Iron"],
            ["Oats (cooked)", "71", "2.5", "12.0", "1.4", "Beta-glucan, Fibre"],
            ["Jowar roti (1)", "80", "2.5", "17.0", "0.9", "Iron, Calcium"],
            ["Bajra roti (1)", "106", "3.4", "21.0", "1.2", "Iron, Zinc"],
            ["Poha (cooked, 1 cup)", "180", "2.6", "32.0", "4.2", "Iron, B1"],
            ["Upma (1 cup)", "230", "5.0", "38.0", "6.0", "Energy, Sodium"],
            # Dairy
            ["Paneer (100g)", "265", "18.3", "1.2", "20.8", "Calcium, Protein"],
            ["Low-fat paneer (100g)", "162", "18.0", "2.0", "8.0", "Calcium, Protein"],
            ["Dahi/Curd (full fat)", "98", "3.5", "3.4", "7.5", "Probiotics, Calcium"],
            ["Low-fat dahi (100g)", "56", "4.0", "4.1", "1.5", "Probiotics"],
            ["Skimmed milk (200ml)", "74", "6.8", "10.4", "0.4", "Calcium, Protein"],
            ["Whole milk (200ml)", "130", "6.4", "9.6", "7.2", "Calcium, Fat"],
            ["Whey protein (1 scoop 30g)", "110", "24.0", "2.0", "1.5", "Fast protein"],
            # Meats & Eggs
            ["Chicken breast (grilled)", "165", "31.0", "0", "3.6", "Lean protein king"],
            ["Chicken thigh (grilled)", "209", "26.0", "0", "10.9", "Protein + Fats"],
            ["Eggs (1 whole, 50g)", "78", "6.5", "0.6", "5.3", "Complete protein"],
            ["Egg whites (100g)", "52", "10.9", "0.7", "0.2", "Pure protein"],
            ["Fish (Rohu, 100g)", "97", "16.5", "0", "3.3", "Omega-3, Protein"],
            ["Salmon (100g)", "208", "20.0", "0", "13.0", "Omega-3 ★★★"],
            ["Tuna (canned, 100g)", "116", "25.5", "0", "1.0", "Protein, Selenium"],
            ["Mutton (lean, cooked)", "194", "25.6", "0", "9.7", "Iron, Zinc, B12"],
            # Vegetables
            ["Spinach (100g raw)", "23", "2.9", "3.6", "0.4", "Iron, Folate, K"],
            ["Broccoli (100g)", "34", "2.8", "6.6", "0.4", "Vitamin C, K"],
            ["Cauliflower (100g)", "25", "2.0", "5.0", "0.3", "Vitamin C, Folate"],
            ["Sweet potato (100g)", "86", "1.6", "20.1", "0.1", "Beta-carotene"],
            ["Potato (boiled, 100g)", "87", "1.9", "20.1", "0.1", "Potassium, C"],
            ["Bhindi/Okra (100g)", "33", "1.9", "7.4", "0.2", "Folate, Mg"],
            ["Bitter gourd/Karela", "17", "1.0", "3.7", "0.2", "Blood sugar control"],
            # Fats & Nuts
            ["Almonds (30g ~23 nuts)", "174", "6.0", "6.0", "15.0", "Vit E, Magnesium"],
            ["Walnuts (30g)", "196", "4.6", "4.1", "18.5", "Omega-3, ALA"],
            ["Peanuts (30g)", "166", "7.1", "6.1", "14.0", "Protein, Niacin"],
            ["Ghee (1 tsp 5g)", "45", "0", "0", "5.0", "MCT, Butyrate"],
            ["Coconut oil (1 tsp)", "40", "0", "0", "4.5", "MCT fats"],
            ["Groundnut oil (1 tsp)", "40", "0", "0", "4.5", "Omega-6"],
            # Fruits
            ["Banana (1 medium)", "89", "1.1", "23.0", "0.3", "Potassium, B6"],
            ["Apple (1 medium)", "52", "0.3", "14.0", "0.2", "Fibre, Polyphenols"],
            ["Mango (100g)", "60", "0.8", "15.0", "0.4", "Vitamin C, A"],
            ["Papaya (100g)", "43", "0.5", "11.0", "0.3", "Papain, Vitamin C"],
            ["Pomegranate (100g)", "83", "1.7", "18.7", "1.2", "Antioxidants"],
            ["Amla (100g)", "44", "0.9", "10.2", "0.6", "Vitamin C ★★★★★"],
        ],
        [48*mm, 22*mm, 26*mm, 22*mm, 18*mm, 40*mm]
    )
    s += section("Chapter 2: Protein Ranking — Highest to Lowest (per 100g)")
    s += make_table(
        ["Rank", "Food", "Protein/100g", "Category", "Bioavailability", "Cost/10g Protein"],
        [
            ["#1", "Whey Protein Isolate", "90g", "Supplement", "★★★★★ (PDCAAS 1.0)", "₹15–25"],
            ["#2", "Soya Chunks (dry)", "52g", "Plant", "★★★★ (PDCAAS 0.99)", "₹3–5"],
            ["#3", "Chicken Breast (grilled)", "31g", "Animal", "★★★★★", "₹12–18"],
            ["#4", "Tuna (canned)", "25.5g", "Animal", "★★★★★", "₹8–12"],
            ["#5", "Egg Whites (100g)", "10.9g", "Animal", "★★★★★ (highest BV)", "₹4–6"],
            ["#6", "Paneer (100g)", "18g", "Dairy", "★★★★", "₹25–35"],
            ["#7", "Masoor Dal", "9g", "Plant", "★★★ (incomplete)", "₹2–4"],
            ["#8", "Peanuts (30g)", "7.1g", "Plant", "★★★", "₹2–3"],
            ["#9", "Low-fat Dahi", "4g", "Dairy", "★★★★", "₹4–8"],
            ["#10", "Whole Wheat Roti", "2.7g/roti", "Grain", "★★ (incomplete)", "₹1–2"],
        ],
        [15*mm, 45*mm, 30*mm, 25*mm, 38*mm, 30*mm]
    )
    s += section("Chapter 3: Pre & Post Workout Indian Meals")
    s += make_table(
        ["Timing", "Goal", "Meal Option", "Protein", "Carbs", "Why It Works"],
        [
            ["Pre-workout\n(60–90 min)", "Energy + Pump", "2 rotis + rajma curry", "12g", "50g", "Slow carbs for sustained energy"],
            ["Pre-workout\n(60–90 min)", "Energy + Pump", "Banana + 1 scoop whey", "25g", "30g", "Fast carbs + fast protein"],
            ["Pre-workout\n(30 min)", "Light fuel", "1 roti + banana", "3g", "45g", "Easy to digest"],
            ["Post-workout\n(0–30 min)", "Recovery", "Whey shake + banana", "25g", "30g", "Rapid protein + carb replenishment"],
            ["Post-workout\n(0–60 min)", "Recovery", "Chicken breast + rice (1c)", "35g", "45g", "Complete amino acids + glycogen"],
            ["Post-workout\n(0–60 min)", "Vegetarian", "Paneer bhurji + 2 rotis", "22g", "40g", "Casein + moderate carbs"],
            ["Post-workout\n(0–60 min)", "Budget", "Eggs (3) + oats (40g)", "24g", "28g", "Complete + affordable"],
        ],
        [30*mm, 28*mm, 42*mm, 20*mm, 20*mm, 42*mm]
    )
    s += section("Chapter 4: Glycemic Index of Common Indian Foods")
    s += make_table(
        ["Food", "Glycemic Index", "Glycemic Load (per serving)", "Recommendation"],
        [
            ["White rice (1 cup)", "72 (HIGH)", "36 (HIGH)", "Limit — eat post-workout only"],
            ["White bread (2 slices)", "75 (HIGH)", "20 (HIGH)", "Avoid — choose roti instead"],
            ["Brown rice (1 cup)", "50 (LOW)", "25 (MEDIUM)", "Preferred over white rice"],
            ["Whole wheat roti (1)", "54 (LOW)", "12 (LOW)", "✅ Excellent choice"],
            ["Oats porridge (1 cup)", "42 (LOW)", "9 (LOW)", "✅ Ideal breakfast"],
            ["Sweet potato (100g)", "44 (LOW)", "9 (LOW)", "✅ Great pre-workout"],
            ["Banana (1 medium)", "51 (LOW)", "13 (MEDIUM)", "✅ Good pre-workout"],
            ["Mango (100g)", "56 (MEDIUM)", "8 (LOW)", "Moderate — seasonal"],
            ["Potato (boiled)", "78 (HIGH)", "16 (MEDIUM)", "Limit portions"],
            ["Dates (2 pieces)", "42 (LOW)", "18 (MEDIUM)", "Small quantities OK"],
            ["Moong dal", "32 (LOW)", "6 (LOW)", "✅ Excellent diabetic food"],
            ["Rajma (kidney beans)", "28 (LOW)", "7 (LOW)", "✅ Best legume choice"],
            ["Chickpeas", "28 (LOW)", "8 (LOW)", "✅ High protein + low GI"],
        ],
        [48*mm, 38*mm, 45*mm, 51*mm]
    )
    s += section("Chapter 5: Budget Meal Plan — ₹3,000/Month")
    s += [p("Based on current Indian market prices (2024). Plan provides ~2,000 kcal/day and 130g protein/day for a 70kg person.")]
    s += make_table(
        ["Food Item", "Quantity/Month", "Approx Cost", "Daily Protein Contribution"],
        [
            ["Eggs (30 per tray)", "4 trays (120 eggs)", "₹480", "12g/day (2 eggs)"],
            ["Soya chunks (1kg bag)", "2 kg", "₹200", "25g/day (50g dry)"],
            ["Moong dal / Toor dal", "3 kg mixed", "₹240", "15g/day (150g cooked)"],
            ["Whole wheat atta (5kg)", "10 kg", "₹400", "10g/day (3 rotis)"],
            ["Rice (5kg)", "5 kg", "₹250", "Carb source"],
            ["Seasonal vegetables", "Monthly mix", "₹600", "Micronutrients"],
            ["Dahi (500g pack)", "4 packs", "₹280", "8g/day"],
            ["Groundnut oil (1L)", "1 L", "₹130", "Cooking fats"],
            ["Onion, tomato, spices", "Monthly", "₹200", "Flavour + antioxidants"],
            ["Bananas (1 dozen)", "3 dozen", "₹180", "Pre-workout carbs"],
            ["", "<b>TOTAL</b>", "<b>₹2,960</b>", "<b>~130g protein/day</b>"],
        ],
        [50*mm, 40*mm, 32*mm, 60*mm]
    )
    s += section("Chapter 6: Indian Spices — Health Benefits Table")
    s += make_table(
        ["Spice", "Active Compound", "Proven Benefit", "Optimal Daily Amount"],
        [
            ["Turmeric (Haldi)", "Curcumin", "Anti-inflammatory, joint pain, antioxidant", "1 tsp (3g) + black pepper"],
            ["Ginger (Adrak)", "Gingerol, Shogaol", "Digestion, nausea, anti-inflammatory", "1–2g fresh or powder"],
            ["Cinnamon (Dalchini)", "Cinnamaldehyde", "Blood sugar control (↓ 10–29%)", "1–2g daily"],
            ["Cumin (Jeera)", "Cuminaldehyde", "Digestion, iron absorption, fat loss", "1 tsp with meals"],
            ["Fenugreek (Methi)", "4-hydroxyisoleucine", "Testosterone support, blood sugar", "5g seeds daily"],
            ["Black Pepper (Kali Mirch)", "Piperine", "Nutrient absorption +20% (curcumin +2000%)", "Pinch with every meal"],
            ["Coriander (Dhania)", "Linalool", "Blood sugar, cholesterol reduction", "1 tbsp fresh leaves"],
            ["Ajwain", "Thymol", "Digestive enzyme stimulation", "1 tsp in warm water"],
            ["Cardamom (Elaichi)", "Cineole", "Blood pressure, antioxidant", "2–3 pods/day"],
            ["Garlic (Lehsun)", "Allicin", "Cardiovascular, testosterone support", "2–3 raw cloves/day"],
        ],
        [35*mm, 38*mm, 55*mm, 50*mm]
    )
    return s

# ═══════════════════════════════════════════════════════════════════════════════
# PDF 3 — Natural Testosterone Optimization
# ═══════════════════════════════════════════════════════════════════════════════
def pdf_testosterone():
    s = [pb()]
    s += section("Chapter 1: How Testosterone is Produced — The HPG Axis")
    s += flowchart([
        "Hypothalamus releases GnRH (Gonadotropin-Releasing Hormone)\n[Triggered by: sleep, exercise, nutrition, stress levels]",
        "GnRH signals the Pituitary Gland\nto release LH (Luteinizing Hormone) + FSH (Follicle-Stimulating Hormone)",
        "LH travels through bloodstream to the Testes\nand stimulates Leydig cells to produce Testosterone",
        "Testosterone enters bloodstream\nFree T (~2%) + SHBG-bound T (~44%) + Albumin-bound T (~54%)",
        "Negative Feedback Loop: High T suppresses GnRH + LH\nEstrogen (from aromatisation) also inhibits the axis",
        "Target: Total T 600–900 ng/dL | Free T 15–25 pg/mL\nMaintain with lifestyle, nutrition, sleep"
    ])
    s += make_table(
        ["Blood Marker", "Optimal Range", "Low Indicates", "High Indicates"],
        [
            ["Total Testosterone", "600–900 ng/dL", "Hypogonadism, lifestyle factors", "Exogenous T use (if very high)"],
            ["Free Testosterone", "15–25 pg/mL", "High SHBG, low total T", "Low SHBG"],
            ["SHBG", "20–50 nmol/L", "Obesity, insulin resistance", "Ageing, hyperthyroidism"],
            ["LH (Luteinizing H.)", "2–8 IU/L", "Pituitary/hypothalamic issue", "Primary hypogonadism"],
            ["FSH", "1.5–12 IU/L", "Pituitary suppression", "Testicular failure"],
            ["Estradiol (E2)", "20–30 pg/mL", "Bone loss risk", "Gynecomastia, libido issues"],
            ["DHT", "30–85 ng/dL", "Low T or 5-AR inhibition", "Hair loss, prostate risk"],
            ["Prolactin", "<15 ng/mL", "Normal", "Pituitary adenoma, T suppression"],
        ],
        [38*mm, 36*mm, 50*mm, 50*mm]
    )
    s += section("Chapter 2: Top T-Boosting Foods — Nutrient Analysis")
    s += make_table(
        ["Food", "Key Nutrient", "Amount/100g", "T-Support Mechanism", "Recommended Intake"],
        [
            ["Oysters", "Zinc", "78mg (711% DV)", "Zinc essential for LH synthesis + T production", "2–3 pieces/week"],
            ["Pumpkin seeds", "Zinc + Mg", "7.7mg Zn, 592mg Mg", "Both nutrients directly support T synthesis", "30g/day"],
            ["Eggs (whole)", "Cholesterol + D", "185mg chol, 1.1mcg D3", "Cholesterol = T precursor; D3 boosts T", "3–4 whole eggs/day"],
            ["Beef (lean)", "Zinc + Saturated fat", "4.5mg Zn/100g", "Dietary fat needed for steroidogenesis", "150g 3x/week"],
            ["Fatty fish (Salmon)", "Vitamin D + Omega-3", "526 IU D3/100g", "Vitamin D receptor found on Leydig cells", "150g 2–3x/week"],
            ["Ashwagandha", "Withanolides", "Standardised 5%", "↑ LH, ↑ T by 15–40% in studies", "600mg extract/day"],
            ["Garlic (raw)", "Allicin + DATS", "High allicin", "↓ Cortisol (which suppresses T)", "3 cloves/day raw"],
            ["Pomegranate", "Punicalagins", "High polyphenols", "↑ salivary T 24% in one study", "1 glass juice/day"],
            ["Avocado", "Boron + MUFA", "1mg boron/100g", "Boron reduces SHBG, increases free T", "½ avocado/day"],
            ["Brazil nuts", "Selenium", "544mcg/100g", "Selenium needed for testicular function", "2–3 nuts/day (max)"],
            ["Dark chocolate (85%+)", "Magnesium + Zinc", "176mg Mg/100g", "Mg reduces SHBG, frees up testosterone", "20–30g/day"],
            ["Fenugreek (Methi)", "4-HO-Isoleucine", "Seed extract", "Inhibits 5-AR and aromatase (natural)", "500–600mg/day"],
        ],
        [35*mm, 28*mm, 30*mm, 50*mm, 35*mm]
    )
    s += section("Chapter 3: Sleep Quality vs Testosterone — The Critical Link")
    s += [p("70% of daily testosterone release occurs during sleep, specifically during REM sleep phases. Even one week of sleeping 5 hours per night reduces testosterone levels by 10–15% in young healthy men (University of Chicago, 2011).")]
    s += make_table(
        ["Sleep Duration", "T Level Impact", "GH Release", "Cortisol Next Day", "Action"],
        [
            ["<5 hours", "↓ 10–15%/week", "↓ 50%", "↑ 37%", "Critical — fix immediately"],
            ["5–6 hours", "↓ 5–8%", "↓ 30%", "↑ 18%", "Below optimal"],
            ["6–7 hours", "↓ 2–3%", "↓ 10%", "↑ 8%", "Acceptable, not ideal"],
            ["7–8 hours", "Baseline/Optimal", "Peak release 11pm–3am", "Normal", "✅ Target range"],
            ["8–9 hours", "+3–5% vs 7h", "Full cycle achieved", "↓ 5%", "✅ Ideal for athletes"],
            ["9+ hours", "Minimal extra benefit", "Similar to 8–9h", "Normal", "OK if needed, diminishing returns"],
        ],
        [28*mm, 32*mm, 35*mm, 32*mm, 35*mm]
    )
    s += section("Chapter 4: Training Frequency vs Testosterone Response")
    s += [p("Resistance training causes acute spikes in testosterone (30–45 min post-session). However, excessive training volume without adequate recovery chronically suppresses T through cortisol elevation and HPA axis overactivation.")]
    s += make_table(
        ["Training Protocol", "Acute T Spike", "Chronic T Effect", "Optimal For"],
        [
            ["Heavy compound lifts (≥80% 1RM)", "↑ 15–25%", "↑ 5–10% baseline", "T optimisation"],
            ["High volume hypertrophy (moderate %)", "↑ 10–20%", "↑ 3–8% baseline", "Muscle + T"],
            ["Short rest periods (<60s)", "↑ 20–30%", "Neutral to slight ↑", "Metabolic training"],
            ["Long rest (2–3 min)", "↑ 10–15%", "↑ strength, neutral T", "Strength focus"],
            ["Overtraining (>6 days/week high V)", "↑ initially then ↓", "↓ 5–25% baseline", "Avoid"],
            ["Cardio only (no resistance)", "Minimal ↑", "↓ or neutral long term", "Not ideal for T"],
            ["No exercise (sedentary)", "None", "↓ over months", "Avoid — use it or lose it"],
        ],
        [50*mm, 30*mm, 35*mm, 45*mm]
    )
    s += section("Chapter 5: Supplement Evidence Table")
    s += make_table(
        ["Supplement", "Dosage", "Evidence Level", "T Effect", "Notes"],
        [
            ["Ashwagandha (KSM-66)", "600mg/day", "★★★★★ (A)", "↑ 14–40%", "Best studied, safe, reduces cortisol too"],
            ["Vitamin D3", "2,000–5,000 IU/day", "★★★★ (A)", "↑ 25% in deficient men", "Check baseline serum D3 first"],
            ["Zinc", "25–45mg/day", "★★★★ (A)", "↑ 8–24% if deficient", "Zinc Picolinate best absorbed form"],
            ["Magnesium Glycinate", "400–600mg/day", "★★★★ (A)", "↑ free T via ↓SHBG", "Take at night — improves sleep too"],
            ["Fenugreek extract", "500–600mg/day", "★★★★ (B+)", "↑ 6–12%", "Inhibits 5-AR, may reduce DHT slightly"],
            ["Boron", "10mg/day", "★★★ (B)", "↑ free T via ↓SHBG", "Reduces SHBG by 9% at 10mg"],
            ["Tongkat Ali (100:1 extract)", "200–400mg/day", "★★★ (B)", "↑ 8–15%", "Reduces SHBG, cortisol, improves LH"],
            ["DHEA", "25–50mg/day", "★★★ (B)", "Converts to T in body", "Only if DHEA-S is low on blood test"],
            ["L-Carnitine L-Tartrate", "2g/day", "★★★ (B)", "↑ androgen receptor density", "Supports T action in muscle"],
            ["D-Aspartic Acid", "3g/day", "★★ (C)", "↑ short-term in untrained", "Loses effect after 4–6 weeks"],
            ["Tribulus Terrestris", "750mg/day", "★ (D)", "No significant human data", "Overhyped — skip"],
            ["Maca Root", "1.5–3g/day", "★★ (C)", "↑ libido, not T directly", "Use for libido, mood, energy"],
        ],
        [42*mm, 30*mm, 32*mm, 30*mm, 48*mm]
    )
    s += section("Chapter 6: 90-Day Testosterone Optimization Protocol")
    s += make_table(
        ["Phase", "Weeks", "Key Actions", "Expected Improvement"],
        [
            ["Foundation", "1–4", "Fix sleep (7–8h), start D3+Mg+Zinc, 3x strength training", "+5–10% T baseline"],
            ["Nutrition Optimisation", "5–8", "Add ashwagandha + fenugreek, increase dietary fats, reduce alcohol completely", "+10–20% additional"],
            ["Training Intensification", "9–12", "Heavy compound focus (squat, DL, bench, OHP), add HIIT 2x/week", "+8–15% from training"],
            ["Lifestyle Refinement", "13–16", "Stress protocols, sun exposure 20 min/day, cold showers AM", "+5–10% from lifestyle"],
            ["Measurement & Adjust", "17–20", "Retest blood panel, adjust supplements, maintain all habits", "Sustained elevation"],
            ["Maintenance", "21–90", "All habits maintained, cycling ashwagandha (8 weeks on, 4 off)", "25–40% above baseline"],
        ],
        [25*mm, 20*mm, 65*mm, 42*mm]
    )
    return s

# ═══════════════════════════════════════════════════════════════════════════════
# Helper: generate shorter PDFs with shared structure
# ═══════════════════════════════════════════════════════════════════════════════
def pdf_keto_indian():
    s = [pb()]
    s += section("What is Ketosis?")
    s += flowchart([
        "Normal State: Glucose from carbs → primary fuel",
        "Restrict carbs to <20–50g/day for 2–4 days",
        "Liver depletes glycogen stores (12–36 hours)",
        "Liver begins converting fatty acids to Ketone Bodies\n(Beta-hydroxybutyrate, Acetoacetate, Acetone)",
        "Brain & muscles shift to ketones as primary fuel",
        "Ketosis achieved: Blood ketones 0.5–3.0 mmol/L",
        "Fat stores mobilised continuously for energy → Fat Loss"
    ])
    s += section("Indian Keto-Friendly Foods Table")
    s += make_table(
        ["Food", "Carbs/100g", "Fat/100g", "Protein/100g", "Keto Score"],
        [
            ["Paneer", "1.2g", "20.8g", "18.3g", "★★★★★"],
            ["Eggs (whole)", "0.6g", "5.3g", "6.5g", "★★★★★"],
            ["Chicken breast", "0g", "3.6g", "31g", "★★★★★"],
            ["Ghee", "0g", "100g", "0g", "★★★★★"],
            ["Coconut oil", "0g", "100g", "0g", "★★★★★"],
            ["Almonds (30g)", "6g", "15g", "6g", "★★★★"],
            ["Walnuts (30g)", "4.1g", "18.5g", "4.6g", "★★★★"],
            ["Spinach (100g)", "3.6g", "0.4g", "2.9g", "★★★★★"],
            ["Cauliflower (100g)", "5g", "0.3g", "2g", "★★★★★"],
            ["Broccoli (100g)", "6.6g", "0.4g", "2.8g", "★★★★"],
            ["Avocado (100g)", "9g", "15g", "2g", "★★★★★"],
            ["Cucumber (100g)", "3.6g", "0.1g", "0.6g", "★★★★★"],
            ["Full-fat cream (100ml)", "3g", "35g", "2g", "★★★★★"],
            ["Mutton (lean)", "0g", "9.7g", "25.6g", "★★★★★"],
            ["Salmon (100g)", "0g", "13g", "20g", "★★★★★"],
        ],
        [45*mm, 28*mm, 28*mm, 30*mm, 30*mm]
    )
    s += section("30-Day Indian Keto Meal Plan (Sample Week)")
    s += make_table(
        ["Day", "Breakfast", "Lunch", "Dinner", "Snack", "Carbs"],
        [
            ["Mon", "Scrambled eggs (3) + paneer (50g) + coffee with cream", "Mutton curry (keto gravy) + cauliflower rice", "Grilled chicken + spinach saute in ghee", "Almonds (25g) + chai (no sugar)", "<20g"],
            ["Tue", "Omelette (3 eggs) + cheese + green chilli", "Palak paneer (no onion excess) + cucumber salad", "Salmon pan-fried in ghee + broccoli", "Walnut (20g) + coconut oil bulletproof coffee", "<18g"],
            ["Wed", "Keto paratha (almond flour) + butter + boiled eggs", "Chicken curry (cream-based, no potato) + cabbage", "Mutton seekh kebab + raita (full-fat)", "Paneer cubes (50g) + green chutney", "<22g"],
            ["Thu", "Egg bhurji (3 eggs) with ghee + paneer (50g)", "Fish curry (coconut milk) + cauliflower", "Chicken breast grilled + sautéed mushrooms", "Mixed nuts (30g)", "<19g"],
            ["Fri", "Avocado + eggs (2 boiled) + black coffee", "Keema (minced mutton/chicken) + lettuce wrap", "Paneer tikka (baked) + cucumber salad", "Cheese slice + almonds", "<20g"],
        ],
        [14*mm, 45*mm, 45*mm, 42*mm, 30*mm, 18*mm]
    )
    s += section("Keto Adaptation Timeline")
    s += flowchart([
        "Day 1–2: Glycogen Depletion — fatigue, headache normal",
        "Day 3–5: Keto Flu Peak — headache, brain fog, irritability\n→ Increase sodium (1/2 tsp salt in water), potassium, magnesium",
        "Day 6–10: Transition — energy beginning to stabilise\n→ Ketones 0.5–1.5 mmol/L, fat adaptation beginning",
        "Week 2–3: Fat Adapted — steady energy, reduced hunger\n→ Ketones 1–3 mmol/L, mental clarity improving",
        "Week 4+: Fully Keto-Adapted — peak performance on fat\n→ Fat oxidation rate 250g+/day, sustained energy all day"
    ])
    s += section("Electrolyte Protocol — Critical for Indian Keto")
    s += make_table(
        ["Electrolyte", "Daily Target", "Indian Source", "Supplement If Needed"],
        [
            ["Sodium", "3,000–5,000mg", "Rock salt, pickle (small), chaas", "Electrolyte powder"],
            ["Potassium", "3,000–4,700mg", "Spinach, avocado, mushrooms", "Lo Salt (KCl)"],
            ["Magnesium", "400–600mg", "Almonds, dark chocolate, pumpkin seeds", "Mg Glycinate 400mg"],
            ["Calcium", "1,000–1,200mg", "Paneer, dahi (full-fat), sesame seeds", "Calcium + D3 if low"],
        ],
        [30*mm, 32*mm, 48*mm, 48*mm]
    )
    return s

def pdf_hypertrophy():
    s = [pb()]
    s += section("Chapter 1: Three Mechanisms of Muscle Growth")
    s += [p("Muscle hypertrophy occurs through three interconnected mechanisms. All three are stimulated by resistance training and should be periodically targeted for maximal growth.")]
    s += make_table(
        ["Mechanism", "Definition", "Best Stimulated By", "Training Variable to Maximise"],
        [
            ["Mechanical Tension", "Force generated by active muscle contraction under load", "Heavy compound lifts, full ROM, controlled tempo", "Load ≥65% 1RM, progressive overload"],
            ["Metabolic Stress", "'The pump' — lactate/H+/Pi accumulation in muscle", "High rep sets (12–20), short rest, blood flow restriction", "Volume, short rest 60–90s, BFR training"],
            ["Muscle Damage", "Micro-tears in myofibrils triggering repair & growth", "Eccentric emphasis (lowering phase), new exercises", "3–4s eccentric tempo, novel exercises"],
        ],
        [36*mm, 45*mm, 45*mm, 42*mm]
    )
    s += section("Volume Landmarks — Sets Per Muscle Group Per Week")
    s += make_table(
        ["Muscle Group", "MEV (Min Effective)", "MAV (Max Adaptive)", "MRV (Max Recoverable)", "Beginner Start"],
        [
            ["Chest", "10 sets", "14–18 sets", "22 sets", "8–10 sets"],
            ["Back (width)", "10 sets", "14–18 sets", "22 sets", "8–10 sets"],
            ["Back (thickness)", "10 sets", "14–18 sets", "22 sets", "8–10 sets"],
            ["Shoulders", "8 sets", "12–16 sets", "20 sets", "6–8 sets"],
            ["Biceps", "8 sets", "12–16 sets", "20 sets", "6–8 sets"],
            ["Triceps", "8 sets", "12–16 sets", "20 sets", "6–8 sets"],
            ["Quads", "10 sets", "16–20 sets", "26 sets", "8–10 sets"],
            ["Hamstrings", "8 sets", "12–16 sets", "20 sets", "6–8 sets"],
            ["Glutes", "8 sets", "14–18 sets", "22 sets", "6–8 sets"],
            ["Calves", "8 sets", "14–18 sets", "24 sets", "6–8 sets"],
            ["Abs/Core", "8 sets", "12–16 sets", "20 sets", "6–8 sets"],
        ],
        [32*mm, 30*mm, 32*mm, 32*mm, 30*mm]
    )
    s += section("12-Week Hypertrophy Program — Push Pull Legs")
    s += make_table(
        ["Day", "Session", "Exercise", "Sets × Reps", "Rest", "RPE Target"],
        [
            ["Mon (Push)", "Chest/Shoulders/Triceps", "Barbell Bench Press", "4×6–8", "3 min", "8–9"],
            ["", "", "Incline DB Press", "3×10–12", "2 min", "8"],
            ["", "", "Cable Flyes", "3×13–15", "90s", "8"],
            ["", "", "Seated DB OHP", "4×8–10", "2 min", "8"],
            ["", "", "Lateral Raise", "4×15–20", "60s", "9"],
            ["", "", "Skullcrusher", "3×10–12", "90s", "8"],
            ["Tue (Pull)", "Back/Biceps", "Deadlift", "4×4–6", "4 min", "8–9"],
            ["", "", "Weighted Pull-ups", "4×6–10", "3 min", "8"],
            ["", "", "Seated Cable Row", "3×10–12", "2 min", "8"],
            ["", "", "Lat Pulldown", "3×12–15", "90s", "8"],
            ["", "", "Barbell Curl", "3×10–12", "90s", "8"],
            ["", "", "Hammer Curl", "3×12–15", "60s", "8"],
            ["Wed (Legs)", "Quads/Hams/Glutes", "Barbell Back Squat", "4×6–8", "4 min", "8–9"],
            ["", "", "Leg Press", "3×10–12", "2 min", "8"],
            ["", "", "Bulgarian Split Squat", "3×10–12/side", "2 min", "8"],
            ["", "", "Romanian Deadlift", "4×8–10", "2 min", "8"],
            ["", "", "Leg Curl", "3×12–15", "90s", "8"],
            ["", "", "Standing Calf Raise", "4×15–20", "60s", "9"],
        ],
        [25*mm, 38*mm, 42*mm, 25*mm, 18*mm, 24*mm]
    )
    s += section("Progressive Overload Methods")
    s += make_table(
        ["Method", "How to Apply", "When to Use", "Example"],
        [
            ["Load Progression", "Add 2.5–5kg when top rep range achieved", "Primary method for beginners", "Hit 3×10 at 60kg → try 62.5kg"],
            ["Rep Progression", "Add 1–2 reps per set each week", "When stuck on weight increases", "3×8 → 3×9 → 3×10 → increase weight"],
            ["Volume Progression", "Add 1 set per muscle group every 2 weeks", "Intermediate lifters", "3 sets → 4 sets over 4 weeks"],
            ["Density Progression", "Same weight/reps in less time", "For conditioning + hypertrophy", "3×10 in 30 min → same in 25 min"],
            ["Tempo Manipulation", "Slow eccentric 3–4 seconds", "Plateau breaking", "3 seconds down on every rep"],
            ["Technique Refinement", "Improve ROM and muscle activation", "Always — never stop improving", "Full depth squat vs partial"],
        ],
        [38*mm, 50*mm, 38*mm, 46*mm]
    )
    return s

def pdf_pct():
    s = [pb()]
    s += [*disclaimer_page()]
    s += section("Chapter 1: The HPG Axis — Why PCT is Necessary")
    s += flowchart([
        "Normal HPG Axis (Natural State)\nHypothalamus → GnRH → Pituitary → LH/FSH → Testes → Testosterone",
        "During Anabolic Steroid Use\nExogenous T detected → Hypothalamus STOPS GnRH production\nPituitary STOPS LH/FSH → Testes go dormant → Atrophy begins",
        "After Cycle Ends (No PCT)\nExogenous T clears → Hypothalamus slow to restart (weeks–months)\nLow T symptoms: fatigue, libido loss, depression, muscle loss",
        "With Proper PCT\nSERMs block estrogen at hypothalamus → Forces GnRH restart\nLH/FSH surge → Testes stimulated → Natural T production restores",
        "Goal: Restore T to pre-cycle levels within 6–12 weeks\nBlood work confirmation at Week 6 and Week 12 post-PCT"
    ])
    s += section("Chapter 2: PCT Compounds — Full Comparison")
    s += make_table(
        ["Compound", "Class", "Dosing Protocol", "Half-Life", "Pros", "Cons"],
        [
            ["Nolvadex (Tamoxifen)", "SERM", "40/40/20/20mg (weeks 1-4)", "5–7 days", "Proven, affordable, liver-friendly", "Side effects: hot flashes, vision (rare)"],
            ["Clomid (Clomiphene)", "SERM", "50/50/25/25mg (weeks 1-4)", "5–7 days", "Potent LH/FSH stimulator", "Mood sides, vision blurring (rare)"],
            ["Enclomiphene", "SERM (isomer)", "25mg/day for 6–8 weeks", "5–7 days", "Fewer side effects than Clomid", "Less available, pricier"],
            ["HCG (hCG)", "LH Analogue", "500–1000 IU EOD for 2–3 weeks PRE-PCT", "36 hours", "Prevents/reverses testicular atrophy", "Must stop BEFORE SERMs, not during"],
            ["Aromasin (Exemestane)", "AI (Aromatase Inhibitor)", "12.5mg EOD during PCT", "~27 hours", "Controls estrogen rebound", "Suicidal AI — can crash estrogen"],
        ],
        [33*mm, 22*mm, 42*mm, 22*mm, 40*mm, 40*mm]
    )
    s += section("Chapter 3: PCT Timing by Ester — Critical Chart")
    s += make_table(
        ["Ester", "Half-Life", "Active in System", "Start PCT After Last Pin"],
        [
            ["Testosterone Propionate", "~2 days", "~4 days", "3–4 days after last pin"],
            ["Testosterone Phenylpropionate", "~4 days", "~8 days", "5–6 days after last pin"],
            ["Testosterone Enanthate", "~5 days", "~15 days", "14–16 days after last pin"],
            ["Testosterone Cypionate", "~8 days", "~18 days", "14–16 days after last pin"],
            ["Testosterone Undecanoate (oral)", "~3 hours", "~12 hours", "12 hours after last dose"],
            ["Deca-Durabolin (Nandrolone D.)", "~15 days", "~40 days", "21 days after last pin"],
            ["Trenbolone Enanthate", "~7 days", "~18 days", "14–16 days after last pin"],
            ["Trenbolone Acetate", "~3 days", "~6 days", "4–5 days after last pin"],
            ["Masteron Enanthate", "~5 days", "~14 days", "14 days after last pin"],
        ],
        [50*mm, 25*mm, 28*mm, 55*mm]
    )
    s += section("Chapter 4: Complete PCT Protocol — Nolvadex + Clomid")
    s += make_table(
        ["Week", "Nolvadex", "Clomid", "Aromasin", "HCG (if used)", "Blood Test"],
        [
            ["Pre-PCT (2–3 wk before)", "None", "None", "As needed on cycle", "500 IU EOD for 2 weeks", "Check E2 before stopping HCG"],
            ["Week 1", "40mg/day", "50mg/day", "12.5mg EOD if E2 high", "STOP before starting SERMs", ""],
            ["Week 2", "40mg/day", "50mg/day", "12.5mg EOD if needed", "—", ""],
            ["Week 3", "20mg/day", "25mg/day", "As needed", "—", ""],
            ["Week 4", "20mg/day", "25mg/day", "As needed", "—", "Bloods if feeling low"],
            ["Week 6", "10mg/day (optional)", "Discontinue", "Discontinue", "—", "Full blood panel: T, LH, FSH, E2"],
            ["Week 8–12", "Discontinue", "—", "—", "—", "Final bloods — confirm T restored"],
        ],
        [32*mm, 25*mm, 23*mm, 30*mm, 38*mm, 32*mm]
    )
    s += section("Chapter 5: T Recovery Timeline After PCT")
    s += make_table(
        ["Time Post-Cycle", "Expected T Level", "LH/FSH Status", "How You Feel"],
        [
            ["0–2 weeks (no PCT)", "Very Low <100 ng/dL", "Suppressed", "Extreme fatigue, depression, zero libido"],
            ["2–4 weeks (with PCT)", "Slowly rising 150–300", "Recovering", "Improving mood, energy returning slowly"],
            ["4–6 weeks (with PCT)", "300–450 ng/dL", "LH rising", "Near normal energy, libido returning"],
            ["6–8 weeks (with PCT)", "450–600 ng/dL", "Normalising", "Near pre-cycle levels, feeling well"],
            ["8–12 weeks (with PCT)", "600–900 ng/dL", "Normal range", "Full recovery — pre-cycle baseline"],
            ["12+ weeks (no PCT)", "May still be <300 ng/dL", "Slow to recover", "Extended low T — may need medical help"],
        ],
        [38*mm, 35*mm, 32*mm, 57*mm]
    )
    return s

def pdf_recovery():
    s = [pb()]
    s += section("Chapter 1: CNS Stress Model — Sympathetic vs Parasympathetic")
    s += [p("The Central Nervous System (CNS) operates through two branches: the Sympathetic (fight-or-flight) and Parasympathetic (rest-and-digest). Recovery and anabolism primarily occur in the parasympathetic state. Chronic sympathetic dominance (overtraining, life stress, poor sleep) suppresses muscle growth and hormonal function.")]
    s += two_col(
        "Sympathetic Activation (During/After Training)",
        ["Cortisol + Adrenaline elevated",
         "Heart rate + blood pressure elevated",
         "Blood flow to muscles increased",
         "Digestion slowed",
         "Anabolism paused",
         "Performance output maximum",
         "Duration after training: 2–4 hours"],
        "Parasympathetic Recovery State",
        ["Cortisol returns to baseline",
         "Heart rate variability (HRV) increases",
         "Growth hormone peaks during deep sleep",
         "Protein synthesis maximised",
         "Muscle repair and growth occurs",
         "Glycogen replenishment accelerated",
         "Requires: sleep, nutrition, low stress"]
    )
    s += section("Chapter 2: Sleep Stages & Recovery Diagram")
    s += make_table(
        ["Sleep Stage", "Duration/Night", "Recovery Benefit", "Disrupted By", "Optimise By"],
        [
            ["Stage 1 (Light)", "5–10 min/cycle", "Transition, minimal", "Noise, light", "Dark room, earplugs"],
            ["Stage 2 (Light NREM)", "20 min/cycle", "Consolidation, temp drop", "Stress, caffeine", "Cool room 18–20°C"],
            ["Stage 3 (Deep NREM)", "20–40 min early night", "GH release, tissue repair, immune", "Alcohol, late eating", "Magnesium, ZMA"],
            ["REM Sleep", "90–120 min/night total", "Cognitive recovery, hormone regulation", "Stimulants, alcohol", "Consistent bed time ±30min"],
        ],
        [32*mm, 30*mm, 40*mm, 35*mm, 40*mm]
    )
    s += section("Chapter 3: Recovery Modalities — Evidence Rating")
    s += make_table(
        ["Modality", "Mechanism", "Evidence Level", "Protocol", "Best Timing"],
        [
            ["Sleep (7–9h)", "GH release, T production, protein synthesis, CNS restoration", "★★★★★ (Highest)", "7–9h consistent schedule", "Every night non-negotiable"],
            ["Nutrition (protein+carb)", "mTOR activation, glycogen replenishment, anabolism", "★★★★★", "Protein 40g + carbs 60g within 60min", "Within 60 min post-workout"],
            ["Active Recovery", "Blood flow, lactate clearance, ROM maintenance", "★★★★", "20–30 min walk/swim/yoga at 40–50% HR", "Day after heavy training"],
            ["Cold Water Immersion", "↓ inflammation, ↓ DOMS, vasoconstriction→vasodilation", "★★★★", "Cold (10–15°C) 10–15 min, 3–4x/week", "Post-workout, not post-strength session"],
            ["Sauna (Finnish dry)", "Heat shock proteins, cardiovascular, GH release", "★★★★", "80–90°C, 15–20 min, 3–4x/week", "3–4h post-workout or rest days"],
            ["Foam Rolling/Massage", "Myofascial release, blood flow, DOMS reduction", "★★★", "10–15 min post-workout on target muscle", "Post-session or rest days"],
            ["Compression garments", "↓ oedema, blood pooling reduction, faster DOMS clearance", "★★★", "Wear 2–4h post-training", "Post-workout period"],
            ["Contrast therapy", "Alternating cold/heat vasodilation-vasoconstriction", "★★★", "Cold 1 min → Hot 3 min, 3–4 cycles", "Post-competition or hard week"],
        ],
        [33*mm, 42*mm, 28*mm, 42*mm, 28*mm]
    )
    s += section("Chapter 4: HRV (Heart Rate Variability) — Your Recovery Metric")
    s += [p("HRV measures the variation in time between successive heartbeats. Higher HRV = better parasympathetic recovery. Elite athletes track HRV daily to guide training load.")]
    s += make_table(
        ["HRV Status", "Score (RMSSD)", "Training Recommendation", "Action"],
        [
            ["Excellent Recovery", ">70ms (individualised)", "Train hard — CNS is ready", "Full intensity session planned"],
            ["Good Recovery", "60–70ms", "Normal training — moderate intensity", "Stick to program as planned"],
            ["Moderate Recovery", "50–60ms", "Reduce volume by 20%, avoid maximal effort", "Drop 1–2 sets, skip HIIT"],
            ["Poor Recovery", "40–50ms", "Active recovery only — walk, yoga, mobility", "No lifting today"],
            ["Very Poor Recovery", "<40ms", "Complete rest — something is wrong", "Sleep, nutrition audit, see doctor if persistent"],
        ],
        [35*mm, 35*mm, 55*mm, 47*mm]
    )
    s += section("Chapter 5: Supplement Stack for Recovery")
    s += make_table(
        ["Supplement", "Dosage & Timing", "Evidence", "Primary Benefit"],
        [
            ["Magnesium Glycinate", "400–600mg before bed", "★★★★★", "Deep sleep (Stage 3 NREM), muscle relaxation, cortisol reduction"],
            ["ZMA (Zinc+Mg+B6)", "ZMA formula before bed (empty stomach)", "★★★★", "T maintenance, sleep quality, recovery enhancement"],
            ["Ashwagandha KSM-66", "600mg with dinner", "★★★★★", "Cortisol ↓ 28%, stress response ↓, sleep quality ↑"],
            ["Melatonin", "0.5–2mg (low dose) 30min before bed", "★★★★★", "Sleep onset, circadian rhythm regulation"],
            ["L-Theanine", "200–400mg before bed or post-training", "★★★★", "Alpha brain wave increase, calm focus, stress reduction"],
            ["Tart Cherry Extract", "480mg twice daily", "★★★★", "↓ DOMS 20–30%, anti-inflammatory, sleep quality"],
            ["Omega-3 (EPA+DHA)", "2–4g EPA+DHA daily with food", "★★★★★", "Inflammation resolution, joint recovery, brain recovery"],
            ["Creatine Monohydrate", "5g/day anytime", "★★★★★", "Cellular energy, strength maintenance, reduces fatigue"],
        ],
        [38*mm, 42*mm, 25*mm, 57*mm]
    )
    return s

def pdf_pre_workout():
    s = [pb()]
    s += section("Chapter 1: Key Pre-Workout Ingredients — Complete Table")
    s += make_table(
        ["Ingredient", "Optimal Dose", "Timing", "Evidence", "Effect", "Avoid If"],
        [
            ["Caffeine Anhydrous", "200–400mg", "30–45 min pre", "★★★★★", "↑ strength 5–8%, endurance, focus, fat oxidation", "Caffeine sensitive, heart conditions"],
            ["L-Citrulline Malate (2:1)", "6–8g", "30–45 min pre", "★★★★★", "Pump, blood flow, ↓ fatigue, ↑ reps to failure", "Safe for most"],
            ["Beta-Alanine", "3.2–6.4g", "Daily (not just pre)", "★★★★★", "↓ lactic acid, ↑ endurance >60s, tingling normal", "Those who dislike paresthesia"],
            ["Creatine Monohydrate", "5g", "Anytime (daily)", "★★★★★", "↑ strength 5–15%, muscle volumisation, power", "Kidney disease (consult doctor)"],
            ["Betaine Anhydrous", "2.5g", "Pre-workout", "★★★★", "↑ power output, body composition, homocysteine ↓", "Safe for most"],
            ["L-Tyrosine", "500mg–2g", "30–45 min pre", "★★★★", "Focus, mood, stress tolerance, dopamine precursor", "MAO inhibitor users"],
            ["Alpha-GPC", "300–600mg", "Pre-workout", "★★★★", "Acetylcholine ↑, focus, power output, cognition", "Generally safe"],
            ["Taurine", "1–2g", "Pre-workout", "★★★", "Reduces cramping, hydration, cardiac function", "Very safe"],
            ["Electrolytes (Na/K/Mg)", "500mg Na, 200mg K", "Pre-workout", "★★★★★", "Hydration, pump, performance in heat", "Not needed in cold"],
            ["Black Pepper (Bioperine)", "5–10mg", "With all supplements", "★★★★", "↑ absorption of all other ingredients by 20%", "Excess may irritate GI"],
            ["Vitamin B12", "500mcg", "Pre-workout", "★★★", "Energy metabolism, red blood cell production", "Safe at this dose"],
            ["L-Theanine", "100–200mg", "With caffeine", "★★★★★", "Smooth energy, no jitters, focus + calm", "Very safe"],
        ],
        [38*mm, 26*mm, 26*mm, 22*mm, 42*mm, 28*mm]
    )
    s += section("Chapter 2: DIY Pre-Workout Formulas by Goal")
    s += make_table(
        ["Goal", "Formula", "Total Cost/Serving", "Mix With"],
        [
            ["Maximum Pump & Aesthetics", "8g Citrulline Malate + 5g Creatine + 2g Taurine + 200mg Caffeine + 5mg Bioperine", "₹18–25", "300ml cold water, consume 20 min pre"],
            ["Strength & Power", "5g Creatine + 2.5g Betaine + 300mg Alpha-GPC + 300mg Caffeine + 3.2g Beta-Alanine", "₹25–35", "300ml water, 30–40 min pre"],
            ["Endurance & Cardio", "6g Citrulline + 6.4g Beta-Alanine + 200mg Caffeine + 200mg L-Theanine + Electrolytes", "₹20–28", "500ml water, 30 min pre"],
            ["Focus & Cognition", "200mg Caffeine + 200mg L-Theanine + 600mg Alpha-GPC + 1g L-Tyrosine + 5g Creatine", "₹22–30", "300ml water, 45 min pre"],
            ["Budget Option (₹10/serve)", "200mg Caffeine (from black coffee) + 5g Creatine + 3.2g Beta-Alanine + Salt pinch", "₹8–12", "Coffee + water, 30 min pre"],
        ],
        [35*mm, 80*mm, 28*mm, 39*mm]
    )
    return s

def pdf_women_fat_loss():
    s = [pb()]
    s += section("Chapter 1: Female Hormonal Cycle — Training & Nutrition Guide")
    s += make_table(
        ["Phase", "Days (avg)", "Dominant Hormone", "Training Recommendation", "Nutrition Focus"],
        [
            ["Menstrual", "1–5", "Prostaglandins (low E+P)", "Light movement, yoga, walks. Reduce intensity. Rest is productive.", "Iron-rich foods (spinach, dates, rajma). Anti-inflammatory: turmeric, ginger."],
            ["Follicular", "6–13", "Estrogen rising", "Increase intensity — this is your strongest phase. PR attempts, HIIT, heavy compound lifts.", "Normal macros. Higher carbs support performance. Good protein."],
            ["Ovulatory", "14–16", "Estrogen peak + LH surge", "Peak performance. Maximum strength, speed. Compete or test maxes here.", "Slightly ↑ calories. Anti-inflammatory foods. Omega-3."],
            ["Luteal (early)", "17–24", "Progesterone rising", "Moderate training. Slight fatigue normal. Good time for volume work.", "↑ Protein + healthy fats. Magnesium (reduces PMS). Reduce refined carbs."],
            ["Luteal (late)", "25–28", "Progesterone + Estrogen falling", "Reduce volume and intensity. LISS cardio, flexibility. Listen to your body.", "Reduce salt (water retention). Increase zinc, B6. Dark chocolate OK (Mg)."],
        ],
        [25*mm, 18*mm, 38*mm, 48*mm, 53*mm]
    )
    s += section("Chapter 2: 12-Week Female Transformation Program")
    s += make_table(
        ["Week", "Phase", "Training", "Cardio", "Calorie Target", "Focus"],
        [
            ["1–3", "Foundation", "Full body 3x/week (light–moderate)", "30 min walk 4x/week", "Maintenance – 200", "Form, habits, recovery"],
            ["4–6", "Build", "Upper/Lower split 4x/week", "LISS 4x + light HIIT 1x", "Maintenance – 300", "Progressive overload begins"],
            ["7–9", "Accelerate", "PPL 5x/week", "LISS 5x + HIIT 2x", "Maintenance – 400", "Compound lifts priority"],
            ["10–11", "Peak", "PPL 5x/week higher volume", "HIIT 3x + LISS 3x", "Maintenance – 500", "Maximum fat loss phase"],
            ["12", "Deload+Photo", "Reduced volume 50%", "LISS 3x", "Maintenance", "Rest, recovery, photos"],
        ],
        [18*mm, 25*mm, 40*mm, 38*mm, 32*mm, 35*mm]
    )
    s += section("Chapter 3: Indian Diet for Female Fat Loss")
    s += make_table(
        ["Meal", "Option A (Veg)", "Option B (Non-Veg)", "Protein", "Calories"],
        [
            ["Breakfast 7am", "Besan chilla (3) + dahi (100g) + green chutney", "Egg white omelette (3) + 1 roti + tea (no sugar)", "22–26g", "280–320 kcal"],
            ["Mid-Morning 10am", "Sprout chaat (50g) + chaas (200ml)", "Boiled egg (1) + almonds (15g)", "10–12g", "120–150 kcal"],
            ["Lunch 1pm", "Dal (1 cup) + 2 roti + salad + raita (100g)", "Grilled chicken (100g) + dal (½c) + 2 roti + salad", "25–35g", "450–550 kcal"],
            ["Pre-Workout 4pm", "Banana (1) + 5 almonds", "Banana + boiled egg (1)", "5–8g", "150–180 kcal"],
            ["Dinner 7pm", "Paneer sabzi (100g) + 1 roti + veg salad", "Grilled fish (100g) + sabzi + 1 roti", "20–28g", "320–380 kcal"],
            ["Before Bed 9pm", "Warm turmeric milk (200ml, low fat)", "Warm milk + pinch ashwagandha", "6–8g", "80–100 kcal"],
        ],
        [25*mm, 48*mm, 48*mm, 20*mm, 22*mm]
    )
    s += section("Chapter 4: Supplements for Women")
    s += make_table(
        ["Supplement", "Dosage", "Key Benefit for Women", "Evidence"],
        [
            ["Iron + Vitamin C", "18mg iron (check levels first)", "Combat menstruation-related anaemia", "★★★★★"],
            ["Calcium + D3", "1000mg Ca + 1000 IU D3", "Bone density, PMS reduction, hormonal support", "★★★★★"],
            ["Magnesium Glycinate", "300–400mg before bed", "PMS symptoms, sleep, anxiety, cramps", "★★★★★"],
            ["Omega-3 (EPA/DHA)", "2g EPA+DHA with food", "Inflammation, menstrual cramps, mood", "★★★★★"],
            ["Vitamin B6", "25–50mg", "PMS symptoms, hormonal balance, mood", "★★★★"],
            ["Shatavari (Ayurvedic)", "500mg extract 2x/day", "Hormonal balance, PCOS, reproductive health", "★★★★"],
            ["Whey Protein (or plant)", "20–25g/scoop", "Hit protein targets, muscle toning", "★★★★★"],
            ["Collagen Peptides", "10–15g daily", "Skin health, joint support, hair", "★★★★"],
            ["Folate (B9)", "400–800mcg", "Cell division, if planning pregnancy, energy", "★★★★★"],
        ],
        [38*mm, 38*mm, 52*mm, 30*mm]
    )
    return s

def pdf_fitness_mindset():
    s = [pb()]
    s += section("Chapter 1: The Psychology of Habit Formation")
    s += [p("Charles Duhigg's habit loop, reinforced by James Clear's atomic habits research, shows that every habit follows a neurological loop. Understanding this loop lets you engineer fitness habits that stick permanently.")]
    s += flowchart([
        "CUE (Trigger)\nTime of day, location, emotional state, preceding action\nExample: Morning alarm → workout trigger",
        "CRAVING (Motivation)\nThe anticipated reward you want to feel\nExample: The energy boost + endorphins after morning workout",
        "ROUTINE (Behaviour)\nThe actual habit being performed\nExample: Put on gym shoes → drive to gym → 45 min training",
        "REWARD (Satisfaction)\nThe dopamine hit that reinforces the loop\nExample: Post-workout protein shake + sense of accomplishment",
        "Repetition: 66 days average to make a habit automatic\n(Range: 18–254 days depending on complexity — University College London)"
    ])
    s += make_table(
        ["Habit Stack Strategy", "Example", "Why It Works"],
        [
            ["Existing habit → New habit", "After morning tea → 5 min stretching", "Existing routine anchors new behaviour"],
            ["Environment design", "Gym bag packed night before", "Reduces friction — decision already made"],
            ["Identity-based habits", "'I am someone who trains daily'", "Behaviour aligns with self-image"],
            ["Two-minute rule", "Start with just 2 min of workout", "Getting started is 90% of the battle"],
            ["Temptation bundling", "Favourite podcast only during cardio", "Links pleasure to healthy behaviour"],
            ["Accountability partner", "Training partner or daily check-in", "Social commitment 65% adherence boost"],
        ],
        [42*mm, 52*mm, 58*mm]
    )
    s += section("Chapter 2: SMART Goal Framework for Fitness")
    s += make_table(
        ["Element", "Question to Ask", "Poor Goal Example", "SMART Goal Example"],
        [
            ["Specific", "What exactly do I want?", "'Get fit'", "'Lose 8kg of body fat'"],
            ["Measurable", "How will I track progress?", "'Get stronger'", "'Increase squat from 60kg to 90kg'"],
            ["Achievable", "Is this realistic for me?", "'Lose 20kg in 1 month'", "'Lose 2–3kg per month (0.5kg/week)'"],
            ["Relevant", "Why does this matter to me?", "'Build muscle' (vague why)", "'Build muscle to feel confident at my wedding in 4 months'"],
            ["Time-bound", "What is the deadline?", "'Get abs someday'", "'Have visible abs by December 31st'"],
        ],
        [28*mm, 40*mm, 40*mm, 54*mm]
    )
    s += section("Chapter 3: Overcoming Plateaus — The Mental Game")
    s += [p("A plateau is not a failure — it is a sign that your body has adapted to your current stimulus. It requires a change in input, not a change in commitment. Here is how elite athletes and coaches approach plateaus:")]
    s += make_table(
        ["Type of Plateau", "Signs", "Mindset Shift", "Practical Fix"],
        [
            ["Physical plateau", "Weight not moving for 2+ weeks", "'My body adapted — time to evolve my approach'", "Recalculate TDEE, change training split, audit sleep"],
            ["Motivation plateau", "Don't feel like training", "'Discipline > Motivation. Show up anyway.'", "Find new goals, change environment, get a coach"],
            ["Progress plateau", "Lifts stagnant", "'Deload is progress — recovery IS the training'", "Planned deload week, focus on technique"],
            ["Mental fatigue", "Everything feels hard", "'My brain needs fuel as much as my body'", "Reduce training stress 50%, add yoga, meditation"],
        ],
        [32*mm, 38*mm, 48*mm, 44*mm]
    )
    s += section("Chapter 4: The 5 Pillars of Elite Fitness Mindset")
    s += [
        *callout("Pillar 1 — CONSISTENCY OVER INTENSITY\n70% effort 100% of the time beats 100% effort 50% of the time. Show up when you don't feel like it — that is where champions are made. The gym session you had when you least wanted to go is worth 3 sessions on motivated days.", ""),
        *callout("Pillar 2 — PROCESS FOCUS\nFall in love with the process, not the outcome. The outcome is a by-product of consistent process. Focus on: Did I train today? Did I hit my protein? Did I sleep 7+ hours? The rest takes care of itself.", ""),
        *callout("Pillar 3 — IDENTITY-BASED TRANSFORMATION\n'I am trying to lose weight' vs 'I am a healthy person who eats well and trains'. Every action either confirms or contradicts your identity. Choose the identity first, let the actions follow.", ""),
        *callout("Pillar 4 — DELAYED GRATIFICATION MASTERY\nEvery pizza you skip, every 5am alarm you hit, every extra rep you force — they compound. The person you'll be in 1 year is being built today. Discipline now = freedom later.", ""),
        *callout("Pillar 5 — RESILIENCE PROTOCOL\nSet-backs are data, not disasters. Missed a week? Resume exactly where you left off — no punishment, no guilt, no 'starting over Monday'. The fit person misses training occasionally. The unfit person quits.", ""),
    ]
    return s

# ═══════════════════════════════════════════════════════════════════════════════
# MAIN — Generate all PDFs
# ═══════════════════════════════════════════════════════════════════════════════
PDFS = [
    ("fat-loss-masterclass.pdf", "Fat Loss Masterclass", "Evidence-Based Protocol — 52 Pages", 52, 10000, "Training", pdf_fat_loss, False),
    ("indian-nutrition-bible.pdf", "Indian Nutrition Bible", "Bodybuilder Edition — 70+ Indian Foods", 58, 10000, "Nutrition", pdf_nutrition_bible, False),
    ("natural-testosterone-optimization.pdf", "Natural Testosterone Optimization", "Lifestyle + Nutrition Science", 48, 10000, "Hormones", pdf_testosterone, False),
    ("30-day-keto-indian.pdf", "30-Day Keto Indian Plan", "Vegetarian Edition", 38, 10000, "Nutrition", pdf_keto_indian, False),
    ("science-of-hypertrophy.pdf", "Science of Hypertrophy", "12-Week Muscle Building Program", 50, 10000, "Training", pdf_hypertrophy, False),
    ("pct-complete-bible.pdf", "PCT Complete Bible", "HPTA Recovery + SERM Guide", 58, 10000, "Medical", pdf_pct, True),
    ("recovery-cns.pdf", "Recovery & CNS Restoration", "Sleep + HRV Guide", 42, 10000, "Recovery", pdf_recovery, False),
    ("pre-workout-guide.pdf", "Pre-Workout Optimization Guide", "DIY Formula + Stacking", 36, 10000, "Supplements", pdf_pre_workout, False),
    ("female-weight-loss.pdf", "Female Weight Loss Plan", "Hormone-Safe Protocol", 45, 10000, "Women", pdf_women_fat_loss, False),
    ("fitness-mindset.pdf", "Fitness & Mindset Guidance", "15 Chapters of Elite Psychology", 60, 10000, "Mindset", pdf_fitness_mindset, False),
]

if __name__ == "__main__":
    print(f"\n🐅 Tiger Fitness Pro — PDF Generator")
    print(f"Output: {OUT}\n")
    ok = 0
    for fname, title, subtitle, pages, price, cat, fn, medical in PDFS:
        try:
            build_pdf(fname, title, subtitle, pages, price, cat, fn, medical)
            ok += 1
        except Exception as e:
            print(f"  ✗ {fname}: {e}")
    print(f"\n✅ Generated {ok}/{len(PDFS)} PDFs in {OUT}/")
