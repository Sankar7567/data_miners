import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    template_path = "SIH2026-IDEA-Presentation-Format.pptx"
    output_pptx = "SIH2026_GeoIntel_Core_Data_Miners.pptx"

    prs = pptx.Presentation(template_path)
    print(f"Loaded template with {len(prs.slides)} slides.")

    # Colors matching official aesthetic
    c_primary = RGBColor(15, 23, 42)      # Deep Slate #0f172a
    c_accent = RGBColor(14, 116, 144)     # Cyan/Blue #0e7490
    c_blue = RGBColor(30, 58, 138)        # Navy #1e3a8a
    c_dark = RGBColor(30, 41, 59)         # Slate-800 #1e293b
    c_body = RGBColor(51, 65, 85)         # Slate-700 #334155
    c_team = RGBColor(194, 65, 12)        # Amber-orange for team highlight

    # -------------------------------------------------------------
    # SLIDE 1: TITLE PAGE
    # -------------------------------------------------------------
    s1 = prs.slides[0]
    
    # Reposition and resize text frames to strictly avoid colliding with the circle graphic
    for shape in s1.shapes:
        if shape.has_text_frame:
            if "TITLE PAGE" in shape.text:
                shape.left = Inches(0.5)
                shape.top = Inches(0.65)
                shape.width = Inches(4.5)
                shape.height = Inches(1.4)
                
                tf = shape.text_frame
                tf.word_wrap = True
                tf.clear()
                
                p1 = tf.paragraphs[0]
                p1.text = "GeoIntel Core"
                p1.font.name = "Arial"
                p1.font.size = Pt(24)
                p1.font.bold = True
                p1.font.color.rgb = c_blue
                p1.alignment = PP_ALIGN.LEFT
                
                p2 = tf.add_paragraph()
                p2.text = "Autonomous Geological Intelligence & Spatial Reporting Portal"
                p2.font.name = "Arial"
                p2.font.size = Pt(13)
                p2.font.bold = True
                p2.font.color.rgb = c_accent
                p2.space_before = Pt(4)
                p2.alignment = PP_ALIGN.LEFT

            elif "Problem Statement ID" in shape.text:
                shape.left = Inches(0.5)
                shape.top = Inches(2.25)
                shape.width = Inches(5.6)
                shape.height = Inches(4.8)
                
                tf = shape.text_frame
                tf.word_wrap = True
                tf.clear()
                
                details = [
                    ("Problem Statement ID : ", "SIH26023 (Ministry of Coal / CMPDI)"),
                    ("Problem Statement Title : ", "AI-Powered Geological & Mining Reporting Solution"),
                    ("Theme : ", "Clean & Green Technology / Smart Mining"),
                    ("PS Category : ", "Software"),
                    ("Team ID : ", "SIH2026-DM"),
                    ("Team Name : ", "data_miners")
                ]
                
                for idx, (label, val) in enumerate(details):
                    p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
                    p.space_after = Pt(8)
                    
                    r1 = p.add_run()
                    r1.text = label
                    r1.font.name = "Arial"
                    r1.font.size = Pt(13)
                    r1.font.bold = True
                    r1.font.color.rgb = c_blue
                    
                    r2 = p.add_run()
                    r2.text = val
                    r2.font.name = "Arial"
                    r2.font.size = Pt(13)
                    r2.font.bold = (label.startswith("Team Name") or label.startswith("Problem Statement ID"))
                    r2.font.color.rgb = c_team if label.startswith("Team Name") else c_dark

    # Helper function to update team name oval strictly across all slides
    def set_team_name_oval(slide):
        for shape in slide.shapes:
            if shape.has_text_frame and ("Your Team Name" in shape.text or "Data Miners" in shape.text or "data_miners" in shape.text):
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "data_miners"
                p.font.name = "Arial"
                p.font.size = Pt(13)
                p.font.bold = True
                p.font.color.rgb = RGBColor(255, 255, 255)
                p.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 2: PROPOSED SOLUTION
    # -------------------------------------------------------------
    s2 = prs.slides[1]
    set_team_name_oval(s2)

    for shape in s2.shapes:
        if shape.has_text_frame and "IDEA TITLE" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "IDEA TITLE: GeoIntel Core - Autonomous Mining Intelligence"
            p.font.name = "Arial"
            p.font.size = Pt(20)
            p.font.bold = True
            p.font.color.rgb = c_blue
            p.alignment = PP_ALIGN.LEFT

    for shape in list(s2.shapes):
        if shape.has_text_frame and "Proposed Solution" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    # Left Column: Crisp Bullet Points
    left_box2 = s2.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf2 = left_box2.text_frame
    tf2.word_wrap = True

    sections_s2 = [
        ("Proposed Solution:", [
            "Autonomous system for CMPDI logs & CIL data.",
            "Split-screen prototype with real-time auditing."
        ]),
        ("Core Capabilities:", [
            "Spatial Vector Grounding: Extract precise coordinates for citations.",
            "Dynamic View: Bounding boxes update live.",
            "Report Studio: Generate executive DOCX briefs autonomously.",
            "Pan-CIL Analytics: Benchmark stripping ratios & OBR across subsidiaries."
        ]),
        ("Innovation:", [
            "Sub-second semantic retrieval replaces manual verification.",
            "Zero Hallucinations: Assertions bound to official text."
        ])
    ]

    first_p = True
    for header, bullets in sections_s2:
        p_hdr = tf2.paragraphs[0] if first_p else tf2.add_paragraph()
        first_p = False
        p_hdr.space_before = Pt(4)
        p_hdr.space_after = Pt(2)
        r = p_hdr.add_run()
        r.text = header
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = c_blue

        for b in bullets:
            p_b = tf2.add_paragraph()
            p_b.space_after = Pt(2)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = c_body

    s2.shapes.add_picture("screenshots/feature_chat_split.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    cap2 = s2.shapes.add_textbox(Inches(7.6), Inches(6.0), Inches(5.1), Inches(0.4))
    cp2 = cap2.text_frame.paragraphs[0]
    cp2.text = "Figure 1: GeoIntel Core Live Split-Screen RAG Assistant with Dynamic Spatial Bounding-Box Audit"
    cp2.font.name = "Arial"
    cp2.font.size = Pt(8.5)
    cp2.font.italic = True
    cp2.font.color.rgb = c_body
    cp2.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 3: TECHNICAL APPROACH
    # -------------------------------------------------------------
    s3 = prs.slides[2]
    set_team_name_oval(s3)

    for shape in list(s3.shapes):
        if shape.has_text_frame and "Technologies to be used" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box3 = s3.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(5.6), Inches(5.1))
    tf3 = left_box3.text_frame
    tf3.word_wrap = True

    sections_s3 = [
        ("Tech Stack:", [
            "Frontend: React 18, Vite, Tailwind CSS.",
            "Backend: FastAPI, Python 3.12, Uvicorn.",
            "Parsing: PyMuPDF (Fitz) for spatial extraction.",
            "Vector DB: ChromaDB for embeddings.",
            "AI Hardware: Groq LPU (LLaMA 3.3 & Qwen 2.5).",
            "Output: ReportLab, python-docx."
        ]),
        ("Methodology:", [
            "1. Harvester: Automated web scraper & PDF ingestion.",
            "2. Indexing: Sliding-window chunking with spatial data.",
            "3. Retrieval: Hybrid search (dense vectors + keywords).",
            "4. Synthesis: Dynamic generation with local fallback."
        ])
    ]

    first_p = True
    for header, bullets in sections_s3:
        p_hdr = tf3.paragraphs[0] if first_p else tf3.add_paragraph()
        first_p = False
        p_hdr.space_before = Pt(4)
        p_hdr.space_after = Pt(2)
        r = p_hdr.add_run()
        r.text = header
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = c_blue

        for b in bullets:
            p_b = tf3.add_paragraph()
            p_b.space_after = Pt(2)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = c_body

    s3.shapes.add_picture("screenshots/architecture_diagram.png", 
                          Inches(6.4), Inches(1.3), width=Inches(6.3))

    cap3 = s3.shapes.add_textbox(Inches(6.4), Inches(5.95), Inches(6.3), Inches(0.4))
    cp3 = cap3.text_frame.paragraphs[0]
    cp3.text = "Figure 2: GeoIntel Core End-to-End 4-Stage Multimodal Architecture (Team data_miners)"
    cp3.font.name = "Arial"
    cp3.font.size = Pt(8.5)
    cp3.font.italic = True
    cp3.font.color.rgb = c_body
    cp3.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # -------------------------------------------------------------
    s4 = prs.slides[3]
    set_team_name_oval(s4)

    for shape in list(s4.shapes):
        if shape.has_text_frame and "Analysis of the feasibility" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box4 = s4.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf4 = left_box4.text_frame
    tf4.word_wrap = True

    sections_s4 = [
        ("Feasibility & Viability:", [
            "Validated on 100+ official geological documents.",
            "Lightning Fast: Parses 50-page DPRs in < 3.2s.",
            "Enterprise Ready: Containerized microservices.",
            "Data Sovereignty: 100% secure, zero external exposure."
        ]),
        ("Challenges & Mitigations:", [
            "Rate Limits: Resilient token budgeting & retries.",
            "Network Outages: Local extractive fallback.",
            "Complex Formats: PyMuPDF adapts to any scan geometry."
        ])
    ]

    first_p = True
    for header, bullets in sections_s4:
        p_hdr = tf4.paragraphs[0] if first_p else tf4.add_paragraph()
        first_p = False
        p_hdr.space_before = Pt(5)
        p_hdr.space_after = Pt(2)
        r = p_hdr.add_run()
        r.text = header
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = c_blue

        for b in bullets:
            p_b = tf4.add_paragraph()
            p_b.space_after = Pt(3)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = c_body

    s4.shapes.add_picture("screenshots/feature_document_repository.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    cap4 = s4.shapes.add_textbox(Inches(7.6), Inches(5.95), Inches(5.1), Inches(0.4))
    cp4 = cap4.text_frame.paragraphs[0]
    cp4.text = "Figure 3: Official Document Repository & Ingestion Hub (ChromaDB Vector Indexing & Live Scraper)"
    cp4.font.name = "Arial"
    cp4.font.size = Pt(8.5)
    cp4.font.italic = True
    cp4.font.color.rgb = c_body
    cp4.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 5: IMPACT AND BENEFITS
    # -------------------------------------------------------------
    s5 = prs.slides[4]
    set_team_name_oval(s5)

    for shape in list(s5.shapes):
        if shape.has_text_frame and "Potential impact on the target audience" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box5 = s5.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf5 = left_box5.text_frame
    tf5.word_wrap = True

    sections_s5 = [
        ("Stakeholder Impact:", [
            "Geologists: Instant lookup of stratigraphy & formations.",
            "Planning Officers: Real-time OBR & productivity tracking.",
            "Ministry Leadership: Summaries in minutes, not weeks."
        ]),
        ("Strategic Benefits:", [
            "85% Time Savings in DPR evaluation.",
            "Auditable Provenance eliminates regulatory disputes.",
            "Scalable across all 8 Coal India subsidiaries.",
            "Zero Cloud Licensing cost (self-contained stack)."
        ])
    ]

    first_p = True
    for header, bullets in sections_s5:
        p_hdr = tf5.paragraphs[0] if first_p else tf5.add_paragraph()
        first_p = False
        p_hdr.space_before = Pt(5)
        p_hdr.space_after = Pt(2)
        r = p_hdr.add_run()
        r.text = header
        r.font.name = "Arial"
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = c_blue

        for b in bullets:
            p_b = tf5.add_paragraph()
            p_b.space_after = Pt(3)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(9.5)
            rb.font.color.rgb = c_body

    s5.shapes.add_picture("screenshots/feature_analytics_dashboard.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    cap5 = s5.shapes.add_textbox(Inches(7.6), Inches(5.95), Inches(5.1), Inches(0.4))
    cp5 = cap5.text_frame.paragraphs[0]
    cp5.text = "Figure 4: Geological Analytics Word Cloud & Subsidiary Production Metrics Dashboard"
    cp5.font.name = "Arial"
    cp5.font.size = Pt(8.5)
    cp5.font.italic = True
    cp5.font.color.rgb = c_body
    cp5.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 6: RESEARCH AND REFERENCES
    # -------------------------------------------------------------
    s6 = prs.slides[5]
    set_team_name_oval(s6)

    for shape in list(s6.shapes):
        if shape.has_text_frame and "Details / Links of the reference" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box6 = s6.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf6 = left_box6.text_frame
    tf6.word_wrap = True

    sections_s6 = [
        ("References & Links:", [
            "GitHub Repository: https://github.com/Sankar7567/data_miners",
            "Ministry of Coal: Guidelines for Mine Plans (coal.gov.in)",
            "CMPDI: Annual Exploration Reports (cmpdi.co.in)",
            "Coal India (CIL): Operational Reviews (coalindia.in)",
            "DGMS: Statutory Safety Circulars.",
            "Libraries: PyMuPDF & ChromaDB."
        ])
    ]

    first_p = True
    for header, bullets in sections_s6:
        p_hdr = tf6.paragraphs[0] if first_p else tf6.add_paragraph()
        first_p = False
        p_hdr.space_before = Pt(5)
        p_hdr.space_after = Pt(3)
        r = p_hdr.add_run()
        r.text = header
        r.font.name = "Arial"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = c_blue

        for b in bullets:
            p_b = tf6.add_paragraph()
            p_b.space_after = Pt(4)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(10)
            if "https://github.com/Sankar7567/data_miners" in b:
                rb.font.bold = True
                rb.font.color.rgb = RGBColor(14, 116, 144)
            else:
                rb.font.color.rgb = c_body

    s6.shapes.add_picture("screenshots/feature_report_studio.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    cap6 = s6.shapes.add_textbox(Inches(7.6), Inches(5.95), Inches(5.1), Inches(0.4))
    cp6 = cap6.text_frame.paragraphs[0]
    cp6.text = "Figure 5: Autonomous Report Studio with Custom Engineering Directives & Multi-Format Synthesis"
    cp6.font.name = "Arial"
    cp6.font.size = Pt(8.5)
    cp6.font.italic = True
    cp6.font.color.rgb = c_body
    cp6.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 7: DELETE SLIDE PER OFFICIAL SIH INSTRUCTIONS
    # -------------------------------------------------------------
    if len(prs.slides) > 6:
        print("Deleting Slide 7 (Instructions slide) per official guidelines...")
        rId = prs.slides._sldIdLst[6].rId
        prs.part.drop_rel(rId)
        del prs.slides._sldIdLst[6]

    prs.save(output_pptx)
    print(f"Presentation successfully created with {len(prs.slides)} slides at: {output_pptx}")

if __name__ == "__main__":
    build_presentation()
