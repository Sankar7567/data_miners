import matplotlib.pyplot as plt
import matplotlib.patches as patches

def create_architecture_diagram(output_path="/home/sankar/Desktop/sih/screenshots/architecture_diagram.png"):
    fig = plt.figure(figsize=(16, 9), dpi=200)
    fig.patch.set_facecolor('#0a0f1d')
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_facecolor('#0a0f1d')
    ax.set_xlim(0, 1600)
    ax.set_ylim(900, 0) # Flip y so 0 is top
    ax.axis('off')

    # Title Banner
    ax.text(800, 45, "GeoIntel Core : Autonomous Multimodal Architecture", 
            fontsize=22, fontweight='bold', color='#ffffff', ha='center', va='center', fontfamily='sans-serif')
    ax.text(800, 78, "CMPDI & Coal India Geological Intelligence • Built by Team Data Miners", 
            fontsize=12, fontweight='bold', color='#38bdf8', ha='center', va='center', fontfamily='sans-serif')

    # 4 Main Columns / Stages
    cols = [
        {
            "x": 60, "y": 110, "w": 330, "h": 740,
            "title": "1. INGESTION & EXTRACTION",
            "subtitle": "Multimodal Geological Ingestion",
            "color": "#0284c7", "bg": "#0c213d", "border": "#38bdf8",
            "boxes": [
                ("Ministry Archives & DPRs", "CIL Annual Reports, CMPDI Exploration Volumes, Mine Closure Plans, DGMS Circulars", "#0369a1"),
                ("Live Web Harvester", "Ministry of Coal crawler & automated folder watch for continuous ingestion", "#0284c7"),
                ("PyMuPDF Spatial Engine", "High-precision PDF parser extracting raw text + exact (x0, y0, x1, y1) bounding box coordinates", "#0ea5e9"),
                ("Dual Ingestion Pipeline", "FastAPI multipart uploader + real-time versioning (_v2.pdf) & instant index refresh", "#38bdf8")
            ]
        },
        {
            "x": 440, "y": 110, "w": 330, "h": 740,
            "title": "2. INDEXING & KNOWLEDGE BASE",
            "subtitle": "High-Density Spatial Vector Store",
            "color": "#0d9488", "bg": "#0c332e", "border": "#2dd4bf",
            "boxes": [
                ("Sliding-Window Chunking", "400-word spatial segments with 50-word overlap, preserving bounding box coordinates", "#0f766e"),
                ("All-MiniLM-L6-v2 Embeddings", "384-dimensional dense semantic vector representations for coal mining terminology", "#14b8a6"),
                ("ChromaDB Vector Store", "Filtered semantic search partitioned by subsidiary (MCL, SECL, ECL), year, & doc type", "#2dd4bf"),
                ("Domain Entity Lexicon", "Stratigraphy, CIL subsidiaries, extraction methods, GCV bands, stripping ratio indices", "#5eead4")
            ]
        },
        {
            "x": 820, "y": 110, "w": 330, "h": 740,
            "title": "3. RESILIENT INFERENCE ENGINE",
            "subtitle": "LPU Acceleration & Spatial Audit",
            "color": "#7c3aed", "bg": "#221340", "border": "#a855f7",
            "boxes": [
                ("Groq LPU Hardware Acceleration", "Ultra-low latency inference using Meta LLaMA 3.3 70B & Qwen 2.5 32B models", "#6d28d9"),
                ("Rate-Limit Resilient Handler", "Smart token budgeting (max_tokens=2200) with automatic retry and exponential backoff", "#7c3aed"),
                ("Spatial BBox Citation Verifier", "Binds LLM claims to exact source page coordinates, eliminating hallucinations", "#9333ea"),
                ("Zero-Downtime Fallback", "Graceful degradation to local hybrid extractive engine when API limits are reached", "#c084fc")
            ]
        },
        {
            "x": 1200, "y": 110, "w": 330, "h": 740,
            "title": "4. PRESENTATION & SYNTHESIS",
            "subtitle": "Interactive Portal & Multi-Format Studio",
            "color": "#e11d48", "bg": "#3b0d1e", "border": "#fb7185",
            "boxes": [
                ("Split-Screen Spatial PDF Audit", "Interactive ChatGPT-style assistant with real-time amber bounding-box SVG overlays", "#be123c"),
                ("Geological Analytics & Cloud", "Interactive domain word cloud with in-place occurrence inspector & subsidiary metrics", "#e11d48"),
                ("Autonomous Report Studio", "Custom engineering directives driving end-to-end technical report synthesis", "#f43f5e"),
                ("Multi-Format Export Hub", "Instant publication-grade PDF (ReportLab inline viewer), Word (.docx), & Markdown (.md)", "#fb7185")
            ]
        }
    ]

    for col in cols:
        # Column Outer Box
        card = patches.FancyBboxPatch(
            (col["x"], col["y"]), col["w"], col["h"],
            boxstyle="round,pad=0,rounding_size=18",
            facecolor=col["bg"], edgecolor=col["border"], linewidth=2, alpha=0.9
        )
        ax.add_patch(card)

        # Header Badge
        badge = patches.FancyBboxPatch(
            (col["x"] + 15, col["y"] + 14), col["w"] - 30, 48,
            boxstyle="round,pad=0,rounding_size=12",
            facecolor=col["color"], edgecolor="none", alpha=0.95
        )
        ax.add_patch(badge)
        ax.text(col["x"] + col["w"]/2, col["y"] + 38, col["title"],
                fontsize=11.5, fontweight='bold', color='#ffffff', ha='center', va='center', fontfamily='sans-serif')
        ax.text(col["x"] + col["w"]/2, col["y"] + 80, col["subtitle"],
                fontsize=9.5, fontweight='semibold', color='#cbd5e1', ha='center', va='center', fontfamily='sans-serif')

        # Sub-boxes
        sub_y_starts = [col["y"] + 115, col["y"] + 265, col["y"] + 415, col["y"] + 565]
        for i, (btitle, bdesc, bcolor) in enumerate(col["boxes"]):
            sy = sub_y_starts[i]
            sbox = patches.FancyBboxPatch(
                (col["x"] + 16, sy), col["w"] - 32, 125,
                boxstyle="round,pad=0,rounding_size=10",
                facecolor="#0f172a", edgecolor=bcolor, linewidth=1.5, alpha=0.9
            )
            ax.add_patch(sbox)
            ax.text(col["x"] + 30, sy + 25, f"▸ {btitle}", 
                    fontsize=10.5, fontweight='bold', color='#ffffff', ha='left', va='center', fontfamily='sans-serif')
            
            # Multi-line description wrapping
            words = bdesc.split()
            lines = []
            curr = []
            for w in words:
                curr.append(w)
                if len(" ".join(curr)) > 34:
                    lines.append(" ".join(curr))
                    curr = []
            if curr:
                lines.append(" ".join(curr))
            
            wrapped_text = "\n".join(lines[:3])
            ax.text(col["x"] + 30, sy + 68, wrapped_text, 
                    fontsize=8.5, color='#94a3b8', ha='left', va='center', fontfamily='sans-serif', linespacing=1.3)

    # Inter-column Flow Arrows
    arrow_xs = [390, 770, 1150]
    for ax_idx, x_pos in enumerate(arrow_xs):
        ax.annotate(
            "", xy=(x_pos + 46, 450), xytext=(x_pos + 4, 450),
            arrowprops=dict(arrowstyle="->,head_width=0.6,head_length=0.7", color="#38bdf8", lw=3.5)
        )
        ax.text(x_pos + 25, 430, f"Flow {ax_idx+1}→{ax_idx+2}", 
                fontsize=8, fontweight='bold', color="#38bdf8", ha='center', va='bottom', fontfamily='sans-serif')

    # Footer Metadata
    ax.text(800, 875, "Security & Compliance: 100% On-Premises Indexing | Zero Data Leakage | Auditable Spatial Lineage | DGMS Compliant",
            fontsize=9.5, fontweight='semibold', color='#64748b', ha='center', va='center', fontfamily='sans-serif')

    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight', pad_inches=0.1)
    plt.close()
    print(f"Architecture diagram successfully created at {output_path}")

if __name__ == "__main__":
    create_architecture_diagram()
