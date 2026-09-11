import os
from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

PAGE_WIDTH = 960.0   # 13.333 inches (16:9 widescreen)
PAGE_HEIGHT = 540.0  # 7.5 inches
PAGE_SIZE = (PAGE_WIDTH, PAGE_HEIGHT)

def draw_header_footer(c, slide_num, title, team_name="data_miners"):
    # Header background strip
    c.setFillColor(colors.HexColor("#0f172a")) # Slate-900
    c.rect(0, PAGE_HEIGHT - 65, PAGE_WIDTH, 65, fill=1, stroke=0)
    
    # Title Text
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 17)
    c.drawString(35, PAGE_HEIGHT - 40, title)
    
    # Team Name Badge in Header
    badge_x = PAGE_WIDTH - 360
    badge_y = PAGE_HEIGHT - 48
    c.setFillColor(colors.HexColor("#1e3a8a")) # Blue-900
    c.setStrokeColor(colors.HexColor("#3b82f6")) # Blue-500
    c.setLineWidth(1.5)
    c.roundRect(badge_x, badge_y, 140, 30, 6, fill=1, stroke=1)
    c.setFillColor(colors.HexColor("#93c5fd"))
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(badge_x + 70, badge_y + 9, f"Team: {team_name}")
    
    # SIH Logo on top right
    logo_path = "/home/sankar/Desktop/sih/screenshots/extracted_Picture 1.png"
    if os.path.exists(logo_path):
        c.drawImage(logo_path, PAGE_WIDTH - 190, PAGE_HEIGHT - 58, width=160, height=50, preserveAspectRatio=True, mask='auto')

    # Footer strip
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, PAGE_WIDTH, 28, fill=1, stroke=0)
    
    c.setFillColor(colors.HexColor("#94a3b8"))
    c.setFont("Helvetica", 9.5)
    c.drawString(35, 9, "@SIH Idea submission- Template • GeoIntel Core")
    c.drawCentredString(PAGE_WIDTH / 2, 9, f"Team {team_name} • Ministry of Coal / CMPDI Solution")
    c.drawRightString(PAGE_WIDTH - 35, 9, f"Slide {slide_num} of 6")

def draw_bullet_column(c, x, y_start, width, sections):
    curr_y = y_start
    for heading, bullets in sections:
        c.setFillColor(colors.HexColor("#1e3a8a"))
        c.setFont("Helvetica-Bold", 11)
        c.drawString(x, curr_y, heading)
        curr_y -= 16
        
        for bullet in bullets:
            is_github = "https://github.com/Sankar7567/data_miners" in bullet
            c.setFillColor(colors.HexColor("#0e7490") if is_github else colors.HexColor("#1e293b"))
            c.setFont("Helvetica-Bold" if is_github else "Helvetica", 9)
            
            # Simple text wrap
            words = bullet.split()
            lines = []
            curr = []
            for w in words:
                curr.append(w)
                if len(" ".join(curr)) > 62:
                    lines.append(" ".join(curr))
                    curr = []
            if curr:
                lines.append(" ".join(curr))
            
            for l_idx, line in enumerate(lines):
                bullet_mark = "• " if l_idx == 0 else "   "
                c.drawString(x + 10, curr_y, f"{bullet_mark}{line}")
                curr_y -= 12
            curr_y -= 3
        curr_y -= 6

def generate_pdf(output_path="/home/sankar/Desktop/sih/SIH2026_GeoIntel_Core_Data_Miners.pdf"):
    c = canvas.Canvas(output_path, pagesize=PAGE_SIZE)

    # -------------------------------------------------------------
    # SLIDE 1: TITLE PAGE
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    
    # Accent background geometric pattern
    c.setFillColor(colors.HexColor("#1e293b"))
    c.rect(0, PAGE_HEIGHT - 120, PAGE_WIDTH, 120, fill=1, stroke=0)
    
    # Main Event Title
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.setFont("Helvetica-Bold", 24)
    c.drawString(45, PAGE_HEIGHT - 52, "SMART INDIA HACKATHON 2026")
    c.setFillColor(colors.HexColor("#38bdf8"))
    c.setFont("Helvetica-Bold", 13)
    c.drawString(45, PAGE_HEIGHT - 80, "GeoIntel Core : Autonomous Geological Intelligence & Spatial Reporting Portal")

    # Logo on top right
    logo_path = "/home/sankar/Desktop/sih/screenshots/extracted_Picture 1.png"
    if os.path.exists(logo_path):
        c.drawImage(logo_path, PAGE_WIDTH - 280, PAGE_HEIGHT - 105, width=240, height=85, preserveAspectRatio=True, mask='auto')

    # Card for Submission Metadata
    c.setFillColor(colors.HexColor("#090d16"))
    c.setStrokeColor(colors.HexColor("#334155"))
    c.setLineWidth(1.5)
    c.roundRect(45, 45, 520, 340, 12, fill=1, stroke=1)

    c.setFillColor(colors.HexColor("#38bdf8"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(70, 350, "OFFICIAL IDEA SUBMISSION DETAILS")
    
    details = [
        ("Problem Statement ID:", "SIH26023 (Ministry of Coal / CMPDI)"),
        ("Problem Statement Title:", "AI-Powered Geological & Mining Reporting Solution"),
        ("Theme:", "Clean & Green Technology / Smart Mining"),
        ("PS Category:", "Software"),
        ("Idea Title:", "GeoIntel Core (Autonomous Mining Intelligence)"),
        ("Team ID:", "SIH2026-DM"),
        ("Team Name:", "data_miners")
    ]

    dy = 315
    for label, val in details:
        c.setFillColor(colors.HexColor("#94a3b8"))
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(70, dy, label)
        
        c.setFillColor(colors.HexColor("#fb923c") if "Team Name" in label else (colors.HexColor("#38bdf8") if "Idea Title" in label else colors.white))
        c.setFont("Helvetica-Bold" if "Team Name" in label or "Idea Title" in label else "Helvetica", 10.5)
        c.drawString(240, dy, val)
        dy -= 38

    # Right Side Graphic
    gfx_path = "/home/sankar/Desktop/sih/screenshots/extracted_Picture 1.png"
    if os.path.exists(gfx_path):
        c.drawImage(gfx_path, PAGE_WIDTH - 360, 140, width=320, height=180, preserveAspectRatio=True, mask='auto')

    c.showPage()

    # -------------------------------------------------------------
    # SLIDE 2: PROPOSED SOLUTION
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_header_footer(c, 2, "IDEA TITLE: GeoIntel Core - Autonomous Mining Intelligence", "data_miners")

    sections_s2 = [
        ("Proposed Solution & Prototype Description:", [
            "Autonomous multimodal intelligence platform for CMPDI borehole logs, Detailed Project Reports (DPRs), and CIL production data.",
            "Functional split-screen prototype with real-time PyMuPDF spatial coordinate auditing."
        ]),
        ("Core Engineering Capabilities:", [
            "Spatial Vector Grounding: Extracts [x0, y0, x1, y1] coordinates per token for 100% auditable citations.",
            "Dynamic View Synchronization: Citation bounding boxes update live on page navigation.",
            "Autonomous Report Studio: Synthesizes executive briefs & DOCX files following custom engineering directives.",
            "Pan-CIL Production Analytics: Benchmarks coal extraction, stripping ratios, and OBR across 8 subsidiaries."
        ]),
        ("Problem Addressed & Innovation:", [
            "Replaces manual multi-week PDF cross-referencing with sub-second verified semantic retrieval.",
            "Zero Hallucination Guarantee: Every assertion is bound to verifiable text in official government documents."
        ])
    ]

    draw_bullet_column(c, 45, PAGE_HEIGHT - 95, 430, sections_s2)

    # Screenshot on right
    img_s2 = "/home/sankar/Desktop/sih/screenshots/feature_chat_split.png"
    if os.path.exists(img_s2):
        c.drawImage(img_s2, PAGE_WIDTH - 465, 90, width=425, height=350, preserveAspectRatio=True)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_WIDTH - 252, 70, "Figure 1: GeoIntel Core Split-Screen Assistant with Dynamic Spatial Bounding Boxes")

    c.showPage()

    # -------------------------------------------------------------
    # SLIDE 3: TECHNICAL APPROACH
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_header_footer(c, 3, "TECHNICAL APPROACH & SYSTEM ARCHITECTURE", "data_miners")

    sections_s3 = [
        ("Technologies to be Used:", [
            "Frontend: React 18, Vite, Tailwind CSS, Lucide Icons, dynamic SVG coordinate overlays.",
            "Backend API: FastAPI, Python 3.12, Uvicorn, asynchronous multipart streaming endpoints.",
            "Spatial Extraction: PyMuPDF (Fitz) token parser preserving geometry & table bounding boxes.",
            "Vector Database: ChromaDB persistent vector store with 384-dim dense embeddings.",
            "Inference Hardware: Groq LPU Hardware Acceleration (LLaMA 3.3 70B & Qwen 2.5 32B).",
            "Multi-Format Synthesis: ReportLab PDF engine, python-docx compiler, Markdown exporter."
        ]),
        ("Methodology & Implementation Pipeline:", [
            "1. Harvester: Ministry of Coal web scraper & instant drag-and-drop document ingestion.",
            "2. Spatial Indexing: Sliding-window chunking retaining exact pixel bounding coordinates.",
            "3. Grounded Retrieval: Hybrid search combining dense vectors with inverted keyword indices.",
            "4. Resilient Synthesis: Dynamic token budgeting with local extractive fallback."
        ])
    ]

    draw_bullet_column(c, 45, PAGE_HEIGHT - 95, 410, sections_s3)

    img_s3 = "/home/sankar/Desktop/sih/screenshots/architecture_diagram.png"
    if os.path.exists(img_s3):
        c.drawImage(img_s3, PAGE_WIDTH - 485, 90, width=445, height=350, preserveAspectRatio=True)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_WIDTH - 262, 70, "Figure 2: GeoIntel Core End-to-End 4-Stage Multimodal Architecture (Team data_miners)")

    c.showPage()

    # -------------------------------------------------------------
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_header_footer(c, 4, "FEASIBILITY, VIABILITY & OPERATIONAL RESILIENCE", "data_miners")

    sections_s4 = [
        ("Feasibility & Operational Viability:", [
            "Validated on 100+ multi-page geological documents, CIL annual reviews, and detailed mine plans.",
            "Sub-second vector indexing: Parses 50-page complex DPRs in under 3.2 seconds.",
            "Enterprise Deployment: Containerized microservices ready for secure on-premises CIL servers.",
            "100% Data Sovereignty: Zero external data exposure of confidential exploration reserves."
        ]),
        ("Operational Challenges & Mitigations:", [
            "API Rate Limiting: Resilient token budgeting (2200 max tokens) with exponential backoff retry.",
            "Network Outage Tolerance: Local extractive fallback ensures zero system downtime.",
            "Heterogeneous Archives: PyMuPDF token normalization adapts to any PDF format or scan geometry."
        ])
    ]

    draw_bullet_column(c, 45, PAGE_HEIGHT - 95, 430, sections_s4)

    img_s4 = "/home/sankar/Desktop/sih/screenshots/feature_document_repository.png"
    if os.path.exists(img_s4):
        c.drawImage(img_s4, PAGE_WIDTH - 465, 90, width=425, height=350, preserveAspectRatio=True)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_WIDTH - 252, 70, "Figure 3: Official Document Repository & Ingestion Hub (ChromaDB Vector Indexing & Live Scraper)")

    c.showPage()

    # -------------------------------------------------------------
    # SLIDE 5: IMPACT AND BENEFITS
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_header_footer(c, 5, "IMPACT, STRATEGIC BENEFITS & COMMERCIALIZATION", "data_miners")

    sections_s5 = [
        ("Direct Impact on Target Stakeholders:", [
            "CMPDI Geologists: Instant lookup of Gondwana stratigraphy, Barakar formations, and regional meterage.",
            "Mine Planning Officers: Real-time tracking of Overburden Removal (OBR), stripping ratios, and productivity.",
            "Ministry of Coal Leadership: Board-level summaries compiled in minutes rather than weeks."
        ]),
        ("Quantifiable Strategic Benefits:", [
            "85% Time Savings: Accelerates technical assessment and Detailed Project Report (DPR) evaluation.",
            "Auditable Provenance: Spatial bounding boxes eliminate regulatory disputes and non-compliance risk.",
            "Pan-CIL Scalability: Turnkey deployment across all 8 Coal India operational subsidiaries.",
            "Zero Cloud Licensing: Fully self-contained stack with zero per-query commercial subscriptions."
        ])
    ]

    draw_bullet_column(c, 45, PAGE_HEIGHT - 95, 430, sections_s5)

    img_s5 = "/home/sankar/Desktop/sih/screenshots/feature_analytics_dashboard.png"
    if os.path.exists(img_s5):
        c.drawImage(img_s5, PAGE_WIDTH - 465, 90, width=425, height=350, preserveAspectRatio=True)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_WIDTH - 252, 70, "Figure 4: Geological Analytics Word Cloud & Subsidiary Production Metrics Dashboard")

    c.showPage()

    # -------------------------------------------------------------
    # SLIDE 6: RESEARCH AND REFERENCES
    # -------------------------------------------------------------
    c.setFillColor(colors.HexColor("#f8fafc"))
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    draw_header_footer(c, 6, "RESEARCH WORK, REFERENCES & REPOSITORY", "data_miners")

    sections_s6 = [
        ("Project Repository & Reference Documentation:", [
            "GitHub Repository: https://github.com/Sankar7567/data_miners (Full source code, API, and setup guide).",
            "Ministry of Coal, GoI: Guidelines for Preparation of Mine Plans & Mine Closure Plans — coal.gov.in",
            "Central Mine Planning & Design Institute (CMPDI): Annual Geological Exploration & Drilling Reports — cmpdi.co.in",
            "Coal India Limited (CIL): Operational Performance Reviews & Business Responsibility Reports — coalindia.in",
            "Directorate General of Mines Safety (DGMS): Statutory Operational Guidelines & Safety Circulars.",
            "PyMuPDF & ChromaDB: Open-source spatial coordinate extraction and high-density vector retrieval."
        ])
    ]

    draw_bullet_column(c, 45, PAGE_HEIGHT - 95, 430, sections_s6)

    img_s6 = "/home/sankar/Desktop/sih/screenshots/feature_report_studio.png"
    if os.path.exists(img_s6):
        c.drawImage(img_s6, PAGE_WIDTH - 465, 90, width=425, height=350, preserveAspectRatio=True)
        c.setFillColor(colors.HexColor("#64748b"))
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(PAGE_WIDTH - 252, 70, "Figure 5: Autonomous Report Studio with Custom Engineering Directives & Multi-Format Synthesis")

    c.save()
    print(f"Widescreen PDF presentation successfully saved at: {output_path}")

if __name__ == "__main__":
    generate_pdf()
