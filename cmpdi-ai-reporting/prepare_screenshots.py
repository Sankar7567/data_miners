import os
from PIL import Image, ImageDraw, ImageFont

def rebrand_header(img_path, out_path):
    im = Image.open(img_path).convert("RGBA")
    draw = ImageDraw.Draw(im)

    header_bg = (15, 23, 42, 255) # slate-900
    
    # In chat_audit, nav starts at x=724. In the other three, nav starts at x=442.
    clear_right = 720 if "chat_audit" in img_path else 440
    
    # Completely clear the old branding area up to the nav bar
    draw.rectangle([125, 2, clear_right, 58], fill=header_bg)

    font_title = ImageFont.truetype("/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf", 19)
    font_badge = ImageFont.truetype("/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf", 10.5)
    font_sub = ImageFont.truetype("/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf", 10)

    # Draw "GeoIntel Core"
    draw.text((130, 11), "GeoIntel Core", font=font_title, fill=(255, 255, 255, 255))
    
    # Draw badge "Team Data Miners"
    badge_x = 275
    badge_y = 13
    draw.rounded_rectangle([badge_x, badge_y, badge_x + 120, badge_y + 20], radius=5, fill=(30, 58, 138, 255), outline=(59, 130, 246, 255), width=1)
    draw.text((badge_x + 8, badge_y + 3), "Team Data Miners", font=font_badge, fill=(147, 197, 253, 255))

    # Draw Subtitle
    draw.text((130, 36), "CMPDI & Coal India Geological Intelligence • Autonomous Multimodal Reporting", font=font_sub, fill=(148, 163, 184, 255))

    im.convert("RGB").save(out_path, quality=95)
    print(f"Saved {out_path}")

rebrand_header("/home/sankar/Desktop/sih/screenshots/chat_audit.png", "/home/sankar/Desktop/sih/screenshots/tab1_chat_audit.png")
rebrand_header("/home/sankar/Desktop/sih/screenshots/analytics.png", "/home/sankar/Desktop/sih/screenshots/tab2_geological_analytics.png")
rebrand_header("/home/sankar/Desktop/sih/screenshots/reports.png", "/home/sankar/Desktop/sih/screenshots/tab3_report_studio.png")
rebrand_header("/home/sankar/Desktop/sih/screenshots/repository.png", "/home/sankar/Desktop/sih/screenshots/tab4_document_repository.png")
