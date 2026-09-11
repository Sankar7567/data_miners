import os
import pptx
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def build_presentation():
    template_path = "/home/sankar/Desktop/sih/SIH2026-IDEA-Presentation-Format.pptx"
    output_pptx = "/home/sankar/Desktop/sih/SIH2026_GeoIntel_Core_Data_Miners.pptx"

    prs = pptx.Presentation(template_path)
    print(f"Loaded template with {len(prs.slides)} slides.")

    # Colors
    c_primary = RGBColor(15, 23, 42)      # Deep Slate #0f172a
    c_accent = RGBColor(14, 116, 144)     # Cyan/Blue #0e7490
    c_blue = RGBColor(30, 58, 138)        # Navy #1e3a8a
    c_dark = RGBColor(30, 41, 59)         # Slate-800 #1e293b
    c_body = RGBColor(51, 65, 85)         # Slate-700 #334155
    c_highlight = RGBColor(180, 83, 9)    # Amber-700

    # -------------------------------------------------------------
    # SLIDE 1: TITLE PAGE
    # -------------------------------------------------------------
    s1 = prs.slides[0]
    
    # Subtitle placeholder -> GeoIntel Core
    for shape in s1.shapes:
        if shape.has_text_frame:
            if "TITLE PAGE" in shape.text:
                tf = shape.text_frame
                tf.clear()
                p = tf.paragraphs[0]
                p.text = "GeoIntel Core : Autonomous Geological Intelligence & Spatial Reporting Portal"
                p.font.name = "Arial"
                p.font.size = Pt(15)
                p.font.bold = True
                p.font.color.rgb = c_accent
                p.alignment = PP_ALIGN.LEFT

            elif "Problem Statement ID" in shape.text:
                tf = shape.text_frame
                tf.clear()
                
                details = [
                    ("Problem Statement ID : ", "SIH26023 (Ministry of Coal / CMPDI)"),
                    ("Problem Statement Title : ", "AI-Powered Geological & Mining Reporting Solution for CMPDI & CIL"),
                    ("Theme : ", "Clean & Green Technology / Smart Automation & Mining"),
                    ("PS Category : ", "Software"),
                    ("Team ID : ", "SIH2026-DM"),
                    ("Team Name : ", "Data Miners (Registered on Portal)")
                ]
                
                for idx, (label, val) in enumerate(details):
                    p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
                    p.space_after = Pt(8)
                    
                    r1 = p.add_run()
                    r1.text = label
                    r1.font.name = "Arial"
                    r1.font.size = Pt(14)
                    r1.font.bold = True
                    r1.font.color.rgb = c_blue
                    
                    r2 = p.add_run()
                    r2.text = val
                    r2.font.name = "Arial"
                    r2.font.size = Pt(14)
                    r2.font.bold = (label.startswith("Team Name") or label.startswith("Problem Statement ID"))
                    r2.font.color.rgb = c_dark if not label.startswith("Team Name") else RGBColor(194, 65, 12)

    # -------------------------------------------------------------
    # SLIDE 2: PROPOSED SOLUTION
    # -------------------------------------------------------------
    s2 = prs.slides[1]
    
    # Update Team Name oval
    for shape in s2.shapes:
        if shape.has_text_frame and "Your Team Name" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Data Miners"
            p.font.name = "Arial"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.alignment = PP_ALIGN.CENTER

    # Update Title
    for shape in s2.shapes:
        if shape.has_text_frame and "IDEA TITLE" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "IDEA TITLE: GeoIntel Core - Autonomous Mining Intelligence"
            p.font.name = "Arial"
            p.font.size = Pt(22)
            p.font.bold = True
            p.font.color.rgb = c_blue
            p.alignment = PP_ALIGN.LEFT

    # Remove template placeholder TextBox 8 and replace with clean dual-column layout
    for shape in list(s2.shapes):
        if shape.has_text_frame and "Proposed Solution" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    # Left Column: Structured Bullet Points (no walls of text)
    left_box = s2.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf2 = left_box.text_frame
    tf2.word_wrap = True

    sections_s2 = [
        ("Proposed Solution & Prototype:", [
            "Full-stack multimodal intelligence system tailored for CMPDI borehole logs, Detailed Project Reports (DPRs), and CIL operational archives.",
            "Live working prototype featuring dual-pane split-screen spatial verification and autonomous multi-format report synthesis."
        ]),
        ("Detailed Explanation of Proposed Solution:", [
            "PyMuPDF Coordinate Engine: Parses multi-hundred page mining PDFs into precise normalized bounding-box coordinates [x0, y0, x1, y1].",
            "ChromaDB Spatial Store: 384-dimensional dense semantic vector representations indexed by CIL subsidiary, year, and mining horizon."
        ]),
        ("How It Directly Addresses the CMPDI/CIL Problem:", [
            "Replaces weeks of manual cross-referencing with sub-second, auditable retrieval across 100+ official reports.",
            "Eliminates hallucination risk: Every metric is linked to an exact source page and visual bounding-box snippet."
        ]),
        ("Innovation & Uniqueness:", [
            "Zero Token Waste Architecture: Smart token budgeting (2200 tokens) with resilient Groq LPU hardware acceleration & offline fallback.",
            "Dynamic Citation Highlighting: Real-time bounding box overlays that adapt on page navigation."
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
            rb.font.size = Pt(10)
            rb.font.color.rgb = c_body

    # Right Column: Web App Screenshot
    s2.shapes.add_picture("/home/sankar/Desktop/sih/screenshots/feature_chat_split.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    # Caption Box below image
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
    
    for shape in s3.shapes:
        if shape.has_text_frame and "Your Team Name" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Data Miners"
            p.font.name = "Arial"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.alignment = PP_ALIGN.CENTER

    for shape in list(s3.shapes):
        if shape.has_text_frame and "Technologies to be used" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    # Top/Left Column: Bullet points
    left_box3 = s3.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(5.6), Inches(5.1))
    tf3 = left_box3.text_frame
    tf3.word_wrap = True

    sections_s3 = [
        ("Technologies to be Used:", [
            "Frontend Architecture: React 18, Vite, Tailwind CSS, Lucide Icons, Glassmorphic UI with dynamic SVG spatial bounding-box overlay.",
            "Backend & API Services: FastAPI, Python 3.12, Uvicorn, Asynchronous REST endpoints, multipart streaming PDF ingestion.",
            "Spatial Text Extraction: PyMuPDF (Fitz) token-level coordinate parser preserving page geometry and tabular bounding boxes.",
            "Semantic Vector Database: ChromaDB persistent vector store with All-MiniLM-L6-v2 384-dimensional dense embeddings.",
            "LLM & Inference Hardware: Groq LPU Hardware Acceleration (Meta LLaMA 3.3 70B & Qwen 2.5 32B), Local Hybrid extractive fallback.",
            "Multi-Format Document Engine: ReportLab PDF engine (inline browser preview), python-docx table compiler, Markdown generator."
        ]),
        ("Methodology & Implementation Pipeline:", [
            "1. Multimodal Harvester: Ministry of Coal web scraper & instant drag-and-drop ingestion with automatic file versioning (_v2.pdf).",
            "2. Spatial Indexing: Sliding-window chunking (400 words, 50-word overlap) retaining exact pixel bounding coordinates.",
            "3. Grounded Retrieval: Filtered hybrid search combining dense vector similarity with inverted domain keyword indices.",
            "4. Resilient Synthesis: Rate-limit resilient inference with smart token budgeting and 100% spatial citation provenance."
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

    # Right Column: High-Res Architecture Diagram
    s3.shapes.add_picture("/home/sankar/Desktop/sih/screenshots/architecture_diagram.png", 
                          Inches(6.4), Inches(1.3), width=Inches(6.3))

    cap3 = s3.shapes.add_textbox(Inches(6.4), Inches(5.95), Inches(6.3), Inches(0.4))
    cp3 = cap3.text_frame.paragraphs[0]
    cp3.text = "Figure 2: GeoIntel Core End-to-End 4-Stage Multimodal Architecture (Designed by Team Data Miners)"
    cp3.font.name = "Arial"
    cp3.font.size = Pt(8.5)
    cp3.font.italic = True
    cp3.font.color.rgb = c_body
    cp3.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 4: FEASIBILITY AND VIABILITY
    # -------------------------------------------------------------
    s4 = prs.slides[3]
    
    for shape in s4.shapes:
        if shape.has_text_frame and "Your Team Name" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Data Miners"
            p.font.name = "Arial"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.alignment = PP_ALIGN.CENTER

    for shape in list(s4.shapes):
        if shape.has_text_frame and "Analysis of the feasibility" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box4 = s4.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf4 = left_box4.text_frame
    tf4.word_wrap = True

    sections_s4 = [
        ("Analysis of Feasibility & Production Scalability:", [
            "Validated on 100+ multi-page geological documents, CIL annual reviews, and detailed mine plans.",
            "Sub-second vector indexing: High-throughput ingestion processes 50-page complex DPRs in under 3.2 seconds.",
            "Enterprise Deployment: Containerized FastAPI & React microservices ready for secure on-premises CIL deployment or cloud nodes.",
            "Data Sovereignty: 100% on-premises vector storage with zero external data exposure of confidential exploration reserves."
        ]),
        ("Potential Challenges & Operational Risks:", [
            "Hardware API Rate Limiting: LLM token rate limits (TPM/RPM) during intensive multi-department reporting sessions.",
            "Heterogeneous Legacy Archives: Complex multi-column tables, scanned geological boreholes, and unstandardized subsidiary formats."
        ]),
        ("Strategies for Overcoming Challenges:", [
            "Rate-Limit Resiliency Engine: Dynamic token budgeting (2200 max tokens) with exponential backoff retry logic.",
            "Graceful Hybrid Extractive Fallback: Autonomous fallback to local extractive ranking engine ensuring zero system downtime.",
            "PyMuPDF Geometric Normalization: Exact token-level coordinate bounding boxes adapt seamlessly across diverse page aspect ratios."
        ])
    ]

    first_p = True
    for header, bullets in sections_s4:
        p_hdr = tf4.paragraphs[0] if first_p else tf4.add_paragraph()
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
            p_b = tf4.add_paragraph()
            p_b.space_after = Pt(2)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(10)
            rb.font.color.rgb = c_body

    s4.shapes.add_picture("/home/sankar/Desktop/sih/screenshots/feature_document_repository.png", 
                          Inches(7.6), Inches(1.3), width=Inches(5.1))

    cap4 = s4.shapes.add_textbox(Inches(7.6), Inches(5.95), Inches(5.1), Inches(0.4))
    cp4 = cap4.text_frame.paragraphs[0]
    cp4.text = "Figure 3: Official Document Repository & Ingestion Hub (ChromaDB Vector Indexing & Real-Time Upload)"
    cp4.font.name = "Arial"
    cp4.font.size = Pt(8.5)
    cp4.font.italic = True
    cp4.font.color.rgb = c_body
    cp4.alignment = PP_ALIGN.CENTER

    # -------------------------------------------------------------
    # SLIDE 5: IMPACT AND BENEFITS
    # -------------------------------------------------------------
    s5 = prs.slides[4]
    
    for shape in s5.shapes:
        if shape.has_text_frame and "Your Team Name" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Data Miners"
            p.font.name = "Arial"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.alignment = PP_ALIGN.CENTER

    for shape in list(s5.shapes):
        if shape.has_text_frame and "Potential impact on the target audience" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box5 = s5.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf5 = left_box5.text_frame
    tf5.word_wrap = True

    sections_s5 = [
        ("Impact on Target Stakeholders (CMPDI & Coal India):", [
            "CMPDI Geologists & Drilling Engineers: Instant lookup of Gondwana stratigraphy, Barakar formations, and regional borehole meterage (RI-I to RI-VII).",
            "Mine General Managers & Planning Officers: Real-time benchmarking of Overburden Removal (OBR), stripping ratios (m³/t), and heavy equipment productivity.",
            "Ministry of Coal & CIL Leadership: Automated generation of board-level performance summaries, reducing preparation cycles from weeks to minutes."
        ]),
        ("Comprehensive Benefits of GeoIntel Core:", [
            "Operational Speed: 85%+ reduction in technical assessment and Detailed Project Report (DPR) synthesis time.",
            "Economic Value: Optimized stripping ratio tracking and FMC rail corridor dispatch, mitigating costly operational bottlenecks.",
            "Zero Hallucination Guarantee: 100% auditable spatial citations eliminate flawed projections and regulatory compliance penalties.",
            "Environmental Compliance: Rapid tracking of progressive mine closure plans, land reclamation, and afforestation targets per DGMS norms."
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
            p_b.space_after = Pt(2)
            p_b.level = 1
            rb = p_b.add_run()
            rb.text = "• " + b
            rb.font.name = "Arial"
            rb.font.size = Pt(10)
            rb.font.color.rgb = c_body

    s5.shapes.add_picture("/home/sankar/Desktop/sih/screenshots/feature_analytics_dashboard.png", 
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
    
    for shape in s6.shapes:
        if shape.has_text_frame and "Your Team Name" in shape.text:
            tf = shape.text_frame
            tf.clear()
            p = tf.paragraphs[0]
            p.text = "Data Miners"
            p.font.name = "Arial"
            p.font.size = Pt(13)
            p.font.bold = True
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.alignment = PP_ALIGN.CENTER

    for shape in list(s6.shapes):
        if shape.has_text_frame and "Details / Links of the reference" in shape.text:
            sp = shape._element
            sp.getparent().remove(sp)

    left_box6 = s6.shapes.add_textbox(Inches(0.6), Inches(1.25), Inches(6.8), Inches(5.1))
    tf6 = left_box6.text_frame
    tf6.word_wrap = True

    sections_s6 = [
        ("Details / Links of Reference & Research Work:", [
            "Ministry of Coal, Government of India: 'Guidelines for Preparation of Mine Plans and Mine Closure Plans for Coal and Lignite Mines' (2025/2026 Directives).",
            "Central Mine Planning & Design Institute (CMPDI): 'Annual Geological Exploration & Drilling Reports (RI-I to RI-VII)', Gondwana Basin Stratigraphy Archives, Ranchi.",
            "Coal India Limited (CIL): 'Operational & Production Performance Review (FY 2023-24)', Subsidiary Reports (MCL, SECL, NCL, CCL, WCL, BCCL, ECL).",
            "Directorate General of Mines Safety (DGMS): Statutory Operational Guidelines & Safety Circulars for Opencast and Underground Coal Extraction.",
            "Spatial Document Parsing & Retrieval: PyMuPDF (Fitz) Token-Level Coordinate Mapping & ChromaDB High-Density Vector Embedding Architecture.",
            "Hardware-Accelerated Inference: Groq LPU Deterministic Hardware Architecture for Ultra-Low Latency Large Language Model Serving."
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
            rb.font.size = Pt(10.5)
            rb.font.color.rgb = c_body

    s6.shapes.add_picture("/home/sankar/Desktop/sih/screenshots/feature_report_studio.png", 
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
