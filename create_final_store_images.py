#!/usr/bin/env python3
"""
Create FINAL polished Chrome Web Store images
Based on actual extension screenshots - professional touchup
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    print("❌ PIL/Pillow not installed. Install with: pip install Pillow")
    sys.exit(1)

def create_gradient_background(width, height, color1, color2, direction='vertical'):
    """Create a smooth gradient background"""
    img = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(img)
    
    if direction == 'vertical':
        for y in range(height):
            ratio = y / height
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(0, y), (width, y)], fill=(r, g, b))
    else:
        for x in range(width):
            ratio = x / width
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            draw.line([(x, 0), (x, height)], fill=(r, g, b))
    
    return img

def draw_rounded_rectangle(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle"""
    x1, y1, x2, y2 = xy
    if x1 > x2:
        x1, x2 = x2, x1
    if y1 > y2:
        y1, y2 = y2, y1
    max_radius = min((x2 - x1) // 2, (y2 - y1) // 2)
    radius = min(radius, max_radius)
    
    if radius > 0:
        draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill, outline=None)
        draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill, outline=None)
        draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill, outline=None)
        draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill, outline=None)
        draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill, outline=None)
        draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill, outline=None)
    else:
        draw.rectangle([x1, y1, x2, y2], fill=fill, outline=None)
    
    if outline:
        if radius > 0:
            draw.line([(x1 + radius, y1), (x2 - radius, y1)], fill=outline, width=width)
            draw.line([(x1 + radius, y2), (x2 - radius, y2)], fill=outline, width=width)
            draw.line([(x1, y1 + radius), (x1, y2 - radius)], fill=outline, width=width)
            draw.line([(x2, y1 + radius), (x2, y2 - radius)], fill=outline, width=width)
        else:
            draw.rectangle([x1, y1, x2, y2], fill=None, outline=outline, width=width)

def get_font(size, bold=False):
    """Get font with fallbacks"""
    try:
        if bold:
            return ImageFont.truetype("/System/Library/Fonts/Helvetica-Bold.ttf", size)
        return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
    except:
        try:
            return ImageFont.truetype("arial.ttf", size)
        except:
            return ImageFont.load_default()

def create_image_1_save_popup():
    """Image 1: Save Link Popup (CNBC example)"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Subtle background pattern
    for y in range(0, height, 30):
        draw.line([(0, y), (width, y)], fill=(248, 249, 250), width=1)
    
    # Browser chrome
    draw.rectangle([0, 0, width, 75], fill=(252, 253, 254))
    draw.ellipse([25, 25, 40, 40], fill=(255, 95, 87))
    draw.ellipse([45, 25, 60, 40], fill=(255, 189, 46))
    draw.ellipse([65, 25, 80, 40], fill=(40, 201, 55))
    
    # Extension popup (centered, prominent)
    popup_width, popup_height = 450, 650
    popup_x = (width - popup_width) // 2
    popup_y = 100
    
    # Shadow
    shadow = Image.new('RGBA', (popup_width + 30, popup_height + 30), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    draw_rounded_rectangle(shadow_draw, [15, 15, popup_width + 15, popup_height + 15], 16, 
                          fill=(0, 0, 0, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))
    img.paste(shadow, (popup_x - 15, popup_y - 10), shadow)
    
    # Popup
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    # White background
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 16, 
                         fill=(255, 255, 255), outline=(230, 230, 230), width=2)
    
    # Header gradient
    header = create_gradient_background(popup_width, 140, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header, (0, 0))
    
    # ST Logo
    logo_size = 60
    logo_x = (popup_width - logo_size) // 2
    draw_rounded_rectangle(popup_draw, [logo_x, 25, logo_x + logo_size, 25 + logo_size], 12, 
                          fill=(255, 255, 255))
    popup_draw.text((logo_x + 15, 25 + 20), "ST", fill=(102, 126, 234), 
                   font=get_font(28, bold=True), anchor="mm")
    
    # Title
    popup_draw.text((popup_width // 2, 100), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(24, bold=True), anchor="mm")
    popup_draw.text((popup_width // 2, 125), "Smart Research Tracking", 
                   fill=(255, 255, 255, 220), font=get_font(13), anchor="mm")
    
    # Open Dashboard button
    btn_x = (popup_width - 140) // 2
    draw_rounded_rectangle(popup_draw, [btn_x, 95, btn_x + 140, 115], 6, 
                         fill=(255, 255, 255, 200), outline=(255, 255, 255), width=1)
    popup_draw.text((btn_x + 70, 105), "Open Dashboard", fill=(102, 126, 234), 
                   font=get_font(11, bold=True), anchor="mm")
    
    # Link preview card
    card_y = 160
    draw_rounded_rectangle(popup_draw, [25, card_y, popup_width - 25, card_y + 90], 12, 
                         fill=(248, 250, 252), outline=(225, 230, 235), width=1)
    
    # CNBC favicon (red)
    draw_rounded_rectangle(popup_draw, [40, card_y + 15, 80, card_y + 55], 8, 
                          fill=(220, 38, 38))
    popup_draw.text((60, card_y + 35), "CN", fill=(255, 255, 255), 
                   font=get_font(14, bold=True), anchor="mm")
    
    popup_draw.text((95, card_y + 20), "CNBC Pro - Premium Live TV, Stock Pic...", 
                   fill=(30, 30, 30), font=get_font(15, bold=True), anchor="lm")
    popup_draw.text((95, card_y + 45), "https://www.cnbc.com/pro/", 
                   fill=(120, 120, 120), font=get_font(11), anchor="lm")
    
    # Title field
    field_y = card_y + 110
    popup_draw.text((25, field_y), "Title", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [25, field_y + 22, popup_width - 25, field_y + 52], 8, 
                         fill=(255, 255, 255), outline=(102, 126, 234), width=2)
    popup_draw.text((32, field_y + 37), "Premium Live TV, Stock Picks and Investing Insights", 
                   fill=(50, 50, 50), font=get_font(13), anchor="lm")
    
    # Description
    desc_y = field_y + 70
    popup_draw.text((25, desc_y), "Description", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [25, desc_y + 22, popup_width - 25, desc_y + 100], 8, 
                         fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((32, desc_y + 37), "Add notes or description", 
                   fill=(160, 160, 160), font=get_font(12), anchor="lm")
    
    # Category
    cat_y = desc_y + 120
    popup_draw.text((25, cat_y), "Category", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [25, cat_y + 22, popup_width - 25, cat_y + 52], 8, 
                         fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((32, cat_y + 37), "Articles", fill=(50, 50, 50), font=get_font(13), anchor="lm")
    
    # Buttons
    btn_y = popup_height - 80
    draw_rounded_rectangle(popup_draw, [25, btn_y, 200, btn_y + 45], 8, 
                         fill=(248, 249, 250), outline=(220, 220, 220), width=1)
    popup_draw.text((112, btn_y + 22), "Cancel", fill=(100, 100, 100), 
                   font=get_font(14, bold=True), anchor="mm")
    
    save_btn = create_gradient_background(225, 45, (102, 126, 234), (118, 75, 162))
    popup_img.paste(save_btn, (225, btn_y))
    popup_draw.text((popup_width - 112, btn_y + 22), "Save Link", fill=(255, 255, 255), 
                   font=get_font(14, bold=True), anchor="mm")
    
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    return img

def create_image_2_category_dropdown():
    """Image 2: Category Dropdown Open"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    for y in range(0, height, 30):
        draw.line([(0, y), (width, y)], fill=(248, 249, 250), width=1)
    
    # Browser
    draw.rectangle([0, 0, width, 75], fill=(252, 253, 254))
    draw.ellipse([25, 25, 40, 40], fill=(255, 95, 87))
    draw.ellipse([45, 25, 60, 40], fill=(255, 189, 46))
    draw.ellipse([65, 25, 80, 40], fill=(40, 201, 55))
    
    # Extension icons in toolbar
    for i, color in enumerate([(66, 133, 244), (100, 100, 100), (102, 126, 234)]):
        x = width - 200 + i * 40
        draw_rounded_rectangle(draw, [x, 30, x + 30, 55], 6, fill=color)
    
    popup_width, popup_height = 450, 650
    popup_x = (width - popup_width) // 2
    popup_y = 100
    
    shadow = Image.new('RGBA', (popup_width + 30, popup_height + 30), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    draw_rounded_rectangle(shadow_draw, [15, 15, popup_width + 15, popup_height + 15], 16, 
                          fill=(0, 0, 0, 100))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=20))
    img.paste(shadow, (popup_x - 15, popup_y - 10), shadow)
    
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 16, 
                         fill=(255, 255, 255), outline=(230, 230, 230), width=2)
    
    header = create_gradient_background(popup_width, 140, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header, (0, 0))
    popup_draw.text((popup_width // 2, 70), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(24, bold=True), anchor="mm")
    
    # Open dropdown
    cat_y = 200
    popup_draw.text((25, cat_y), "Category", fill=(80, 80, 80), font=get_font(11, bold=True))
    
    dropdown_y = cat_y + 30
    draw_rounded_rectangle(popup_draw, [25, dropdown_y, popup_width - 25, dropdown_y + 280], 12, 
                         fill=(50, 50, 50), outline=(70, 70, 70), width=2)
    
    categories = [
        ("Research", False, True),  # Header
        ("Articles", True, False),  # Selected
        ("Tools", False, False),
        ("References", False, False),
        ("Other", False, False),
        ("Test", False, False),
        ("Markting", False, False),
    ]
    
    for i, (cat, selected, is_header) in enumerate(categories):
        y_pos = dropdown_y + 10 + i * 38
        if is_header:
            popup_draw.text((35, y_pos + 15), cat, fill=(180, 180, 180), 
                          font=get_font(12, bold=True), anchor="lm")
        elif selected:
            draw_rounded_rectangle(popup_draw, [30, y_pos, popup_width - 30, y_pos + 35], 8, 
                                 fill=(102, 126, 234))
            popup_draw.text((50, y_pos + 17), cat, fill=(255, 255, 255), 
                          font=get_font(15, bold=True), anchor="lm")
            popup_draw.text((popup_width - 35, y_pos + 17), "✓", fill=(255, 255, 255), 
                          font=get_font(18, bold=True), anchor="mm")
        else:
            popup_draw.text((50, y_pos + 17), cat, fill=(220, 220, 220), 
                          font=get_font(14), anchor="lm")
    
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    return img

def create_image_3_dashboard():
    """Image 3: Research Dashboard"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Header
    header = create_gradient_background(width, 100, (102, 126, 234), (118, 75, 162))
    img.paste(header, (0, 0))
    draw.text((60, 35), "Research Dashboard", fill=(255, 255, 255), 
             font=get_font(28, bold=True))
    
    # Sidebar
    sidebar_width = 220
    draw.rectangle([0, 100, sidebar_width, height], fill=(255, 255, 255))
    draw.line([(sidebar_width, 100), (sidebar_width, height)], fill=(230, 230, 230), width=1)
    
    # Navigation items
    nav_items = [
        ("Dashboard", True, "📊"),
        ("Show All Links", False, "📊"),
        ("Favorites", False, "⭐"),
        ("Recent (Last 7 days)", False, "🕐"),
        ("Archived", False, "📦"),
        ("+ Create New Project", False, "+"),
        ("", False, ""),
        ("articles", True, "📄"),
        ("Settings", False, "⚙️"),
        ("Analytics", False, "📊"),
    ]
    
    y_pos = 120
    for text, active, icon in nav_items:
        if not text:
            y_pos += 20
            continue
        if active:
            draw.rectangle([0, y_pos, sidebar_width, y_pos + 40], fill=(240, 243, 250))
            draw.rectangle([0, y_pos, 4, y_pos + 40], fill=(102, 126, 234))
            draw.text((50, y_pos + 20), text, fill=(102, 126, 234), 
                     font=get_font(13, bold=True), anchor="lm")
        else:
            draw.text((50, y_pos + 20), text, fill=(100, 100, 100), 
                     font=get_font(12), anchor="lm")
        if icon:
            draw.text((25, y_pos + 20), icon, font=get_font(14), anchor="mm")
        y_pos += 42
    
    # Main content
    main_x = sidebar_width + 40
    draw.text((main_x, 120), "2 links", fill=(100, 100, 100), font=get_font(14))
    draw.text((main_x + 80, 120), "0 favorites", fill=(100, 100, 100), font=get_font(14))
    
    # Buttons
    draw_rounded_rectangle(draw, [width - 200, 110, width - 100, 140], 6, 
                         fill=(248, 249, 250), outline=(220, 220, 220), width=1)
    draw.text((width - 150, 125), "Export", fill=(100, 100, 100), 
             font=get_font(13), anchor="mm")
    
    export_btn = create_gradient_background(120, 35, (102, 126, 234), (118, 75, 162))
    img.paste(export_btn, (width - 120, 110))
    draw.text((width - 60, 127), "+ Add Link", fill=(255, 255, 255), 
             font=get_font(13, bold=True), anchor="mm")
    
    # Search bar
    search_y = 160
    draw_rounded_rectangle(draw, [main_x, search_y, width - 40, search_y + 45], 22, 
                         fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    draw.text((main_x + 25, search_y + 22), "🔍 Search your research library...", 
             fill=(150, 150, 150), font=get_font(13), anchor="lm")
    
    # Articles list
    articles = [
        ("Friday stocks by analyst calls like Nvidia", 
         "https://www.cnbc.com/2025/11/21/friday-stocks-by-analyst-calls-like-nvidia.html",
         "Nov 22, 2025"),
        ("CNBC Pro - Premium Live TV, Stock Picks and Investing Insights",
         "https://www.cnbc.com/pro/",
         "Nov 22, 2025"),
    ]
    
    list_y = 240
    draw.text((main_x, list_y), "articles", fill=(50, 50, 50), font=get_font(18, bold=True))
    draw.text((main_x + 100, list_y), "2 links", fill=(150, 150, 150), font=get_font(14))
    
    list_y += 40
    for title, url, date in articles:
        # Checkbox
        draw_rounded_rectangle(draw, [main_x, list_y + 10, main_x + 20, list_y + 30], 4, 
                             fill=(255, 255, 255), outline=(200, 200, 200), width=1)
        
        # Globe icon
        draw.text((main_x + 35, list_y + 20), "🌐", font=get_font(16), anchor="mm")
        
        # Title
        draw.text((main_x + 55, list_y + 10), title, fill=(30, 30, 30), 
                 font=get_font(14, bold=True), anchor="lm")
        draw.text((main_x + 55, list_y + 30), url, fill=(120, 120, 120), 
                 font=get_font(11), anchor="lm")
        
        # Tag
        draw_rounded_rectangle(draw, [main_x + 55, list_y + 45, main_x + 120, list_y + 60], 4, 
                             fill=(240, 243, 250), outline=(102, 126, 234), width=1)
        draw.text((main_x + 60, list_y + 52), "articles", fill=(102, 126, 234), 
                 font=get_font(10, bold=True), anchor="lm")
        
        # Date
        draw.text((width - 200, list_y + 20), date, fill=(150, 150, 150), 
                 font=get_font(11), anchor="mm")
        
        # Menu dots
        draw.text((width - 50, list_y + 20), "⋮", fill=(150, 150, 150), 
                 font=get_font(20), anchor="mm")
        
        list_y += 90
    
    return img

def main():
    """Generate final polished images"""
    output_dir = Path("store_images")
    output_dir.mkdir(exist_ok=True)
    
    print("✨ Creating FINAL polished Chrome Web Store images...\n")
    
    print("1️⃣  Creating 'Save Link Popup' (CNBC example)...")
    img1 = create_image_1_save_popup()
    img1.save(output_dir / "1_save_link_popup.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/1_save_link_popup.png")
    
    print("2️⃣  Creating 'Category Dropdown' (open menu)...")
    img2 = create_image_2_category_dropdown()
    img2.save(output_dir / "2_category_selection.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/2_category_selection.png")
    
    print("3️⃣  Creating 'Research Dashboard' (full interface)...")
    img3 = create_image_3_dashboard()
    img3.save(output_dir / "3_dashboard_view.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/3_dashboard_view.png")
    
    print(f"\n✅ All FINAL images created and ready to share!")
    print(f"   📁 Location: {output_dir}/")
    print(f"   📐 Size: 1280x800 pixels")
    print(f"   🎨 Quality: Professional, polished, Chrome Web Store ready")

if __name__ == "__main__":
    main()



