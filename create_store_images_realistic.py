#!/usr/bin/env python3
"""
Create REALISTIC Chrome Web Store promotional images
Styled like actual Chrome Web Store listings with real browser context
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

def create_realistic_browser(img, draw, width, height):
    """Create realistic Chrome browser window"""
    # Browser chrome (light gray)
    draw.rectangle([0, 0, width, 80], fill=(248, 249, 250))
    
    # macOS traffic lights
    draw.ellipse([20, 25, 35, 40], fill=(255, 95, 87))
    draw.ellipse([40, 25, 55, 40], fill=(255, 189, 46))
    draw.ellipse([60, 25, 75, 40], fill=(40, 201, 55))
    
    # Chrome menu
    draw.ellipse([width - 50, 30, width - 35, 45], fill=(150, 150, 150))
    draw.ellipse([width - 30, 30, width - 15, 45], fill=(150, 150, 150))
    draw.ellipse([width - 10, 30, width + 5, 45], fill=(150, 150, 150))
    
    # URL bar (realistic)
    url_bar_x = 100
    url_bar_width = width - 250
    draw_rounded_rectangle(draw, [url_bar_x, 30, url_bar_x + url_bar_width, 55], 20, 
                          fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    
    # Lock icon
    draw.ellipse([url_bar_x + 15, 38, url_bar_x + 25, 48], fill=(100, 150, 100))
    draw.text((url_bar_x + 20, 43), "🔒", font=get_font(8), anchor="mm")
    
    # URL text
    draw.text((url_bar_x + 35, 42), "reddit.com/r/technology", 
             fill=(50, 50, 50), font=get_font(13), anchor="lm")
    
    # Extension icon in toolbar
    ext_icon_x = width - 200
    draw_rounded_rectangle(draw, [ext_icon_x, 30, ext_icon_x + 35, 55], 6, 
                          fill=(102, 126, 234))
    draw.text((ext_icon_x + 17, 42), "ST", fill=(255, 255, 255), 
             font=get_font(12, bold=True), anchor="mm")
    
    # Bookmarks bar
    draw.rectangle([0, 80, width, 105], fill=(245, 247, 250))
    draw.line([(0, 105), (width, 105)], fill=(220, 220, 220), width=1)
    
    # Bookmark icons
    bookmarks = ["Reddit", "GitHub", "Stack Overflow"]
    for i, bm in enumerate(bookmarks):
        x = 120 + i * 100
        draw.text((x, 92), bm, fill=(100, 100, 100), font=get_font(11), anchor="lm")

def create_reddit_content(img, draw, width, height, start_y=105):
    """Create realistic Reddit page content"""
    # Background
    draw.rectangle([0, start_y, width, height], fill=(255, 255, 255))
    
    # Reddit header
    draw.rectangle([0, start_y, width, start_y + 50], fill=(255, 69, 0))
    draw.text((60, start_y + 25), "reddit", fill=(255, 255, 255), 
             font=get_font(24, bold=True), anchor="lm")
    draw.text((150, start_y + 25), "r/technology", fill=(255, 255, 255), 
             font=get_font(16), anchor="lm")
    
    # Post cards
    posts = [
        ("AI breakthrough in quantum computing", "2.3k upvotes", "89 comments", "5 hours ago"),
        ("New JavaScript framework released", "1.8k upvotes", "142 comments", "8 hours ago"),
        ("Cybersecurity best practices 2025", "3.1k upvotes", "201 comments", "12 hours ago"),
    ]
    
    for i, (title, upvotes, comments, time) in enumerate(posts):
        y = start_y + 80 + i * 180
        
        # Post card
        draw_rounded_rectangle(draw, [20, y, width - 20, y + 160], 8, 
                             fill=(255, 255, 255), outline=(230, 230, 230), width=1)
        
        # Upvote arrow
        draw.polygon([(40, y + 20), (50, y + 10), (60, y + 20)], fill=(200, 200, 200))
        draw.text((50, y + 35), upvotes, fill=(100, 100, 100), font=get_font(11), anchor="mm")
        
        # Post title
        draw.text((80, y + 25), title, fill=(30, 30, 30), font=get_font(16, bold=True), anchor="lm")
        
        # Metadata
        draw.text((80, y + 50), f"{comments} • Posted {time}", 
                 fill=(150, 150, 150), font=get_font(12), anchor="lm")
        
        # Post preview text
        draw.text((80, y + 75), "This is a sample post preview text that shows how content...", 
                 fill=(100, 100, 100), font=get_font(13), anchor="lm")

def create_popup_image():
    """Create realistic image 1: Extension popup over Reddit"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Realistic browser
    create_realistic_browser(img, draw, width, height)
    
    # Reddit content
    create_reddit_content(img, draw, width, height, 105)
    
    # Extension popup (positioned top-right, like real Chrome)
    popup_width, popup_height = 420, 580
    popup_x = width - popup_width - 30
    popup_y = 120
    
    # Popup shadow
    shadow = Image.new('RGBA', (popup_width + 20, popup_height + 20), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    draw_rounded_rectangle(shadow_draw, [10, 10, popup_width + 10, popup_height + 10], 12, 
                          fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
    img.paste(shadow, (popup_x - 10, popup_y - 10), shadow)
    
    # Popup
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    # White background
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 12, 
                         fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    
    # Header gradient
    header = create_gradient_background(popup_width, 130, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header, (0, 0))
    
    # Logo
    logo_size = 55
    logo_x = (popup_width - logo_size) // 2
    draw_rounded_rectangle(popup_draw, [logo_x, 20, logo_x + logo_size, 20 + logo_size], 10, 
                          fill=(255, 255, 255))
    popup_draw.text((logo_x + 15, 20 + 18), "ST", fill=(102, 126, 234), 
                   font=get_font(26, bold=True), anchor="mm")
    
    # Title
    popup_draw.text((popup_width // 2, 95), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(22, bold=True), anchor="mm")
    popup_draw.text((popup_width // 2, 118), "Smart Research Tracking", 
                   fill=(255, 255, 255, 220), font=get_font(12), anchor="mm")
    
    # Link preview
    card_y = 150
    draw_rounded_rectangle(popup_draw, [20, card_y, popup_width - 20, card_y + 85], 10, 
                         fill=(248, 250, 252), outline=(225, 230, 235), width=1)
    
    # Reddit favicon
    draw_rounded_rectangle(popup_draw, [35, card_y + 15, 75, card_y + 55], 8, 
                          fill=(255, 69, 0))
    popup_draw.text((55, card_y + 35), "r", fill=(255, 255, 255), 
                   font=get_font(20, bold=True), anchor="mm")
    
    popup_draw.text((90, card_y + 20), "Reddit - The heart of the internet", 
                   fill=(30, 30, 30), font=get_font(15, bold=True), anchor="lm")
    popup_draw.text((90, card_y + 45), "reddit.com/r/technology", 
                   fill=(120, 120, 120), font=get_font(11), anchor="lm")
    
    # Form
    field_y = card_y + 105
    popup_draw.text((20, field_y), "Title", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [20, field_y + 22, popup_width - 20, field_y + 52], 8, 
                         fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((28, field_y + 37), "AI breakthrough in quantum computing", 
                   fill=(50, 50, 50), font=get_font(13), anchor="lm")
    
    desc_y = field_y + 70
    popup_draw.text((20, desc_y), "Description", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [20, desc_y + 22, popup_width - 20, desc_y + 100], 8, 
                         fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((28, desc_y + 37), "Add notes or description...", 
                   fill=(160, 160, 160), font=get_font(12), anchor="lm")
    
    cat_y = desc_y + 120
    popup_draw.text((20, cat_y), "Category", fill=(80, 80, 80), font=get_font(11, bold=True))
    draw_rounded_rectangle(popup_draw, [20, cat_y + 22, popup_width - 20, cat_y + 52], 8, 
                         fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((28, cat_y + 37), "Research", fill=(50, 50, 50), font=get_font(13), anchor="lm")
    
    # Buttons
    btn_y = popup_height - 75
    draw_rounded_rectangle(popup_draw, [20, btn_y, 190, btn_y + 42], 8, 
                         fill=(248, 249, 250), outline=(220, 220, 220), width=1)
    popup_draw.text((105, btn_y + 21), "Cancel", fill=(100, 100, 100), 
                   font=get_font(14, bold=True), anchor="mm")
    
    save_gradient = create_gradient_background(210, 42, (102, 126, 234), (118, 75, 162))
    popup_img.paste(save_gradient, (210, btn_y))
    popup_draw.text((popup_width - 105, btn_y + 21), "Save Link", fill=(255, 255, 255), 
                   font=get_font(14, bold=True), anchor="mm")
    
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    return img

def create_category_image():
    """Create realistic image 2: Category dropdown"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    create_realistic_browser(img, draw, width, height)
    create_reddit_content(img, draw, width, height, 105)
    
    # Popup with open dropdown
    popup_width, popup_height = 420, 580
    popup_x = width - popup_width - 30
    popup_y = 120
    
    shadow = Image.new('RGBA', (popup_width + 20, popup_height + 20), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    draw_rounded_rectangle(shadow_draw, [10, 10, popup_width + 10, popup_height + 10], 12, 
                          fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=15))
    img.paste(shadow, (popup_x - 10, popup_y - 10), shadow)
    
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 12, 
                         fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    
    header = create_gradient_background(popup_width, 130, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header, (0, 0))
    popup_draw.text((popup_width // 2, 65), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(22, bold=True), anchor="mm")
    
    # Open dropdown
    cat_y = 200
    popup_draw.text((20, cat_y), "Category", fill=(80, 80, 80), font=get_font(11, bold=True))
    
    dropdown_y = cat_y + 30
    draw_rounded_rectangle(popup_draw, [20, dropdown_y, popup_width - 20, dropdown_y + 260], 10, 
                         fill=(50, 50, 50), outline=(70, 70, 70), width=2)
    
    categories = ["Articles", "Tools", "References", "Research", "Other"]
    for i, cat in enumerate(categories):
        y_pos = dropdown_y + 12 + i * 50
        if i == 0:  # Selected
            draw_rounded_rectangle(popup_draw, [25, y_pos, popup_width - 25, y_pos + 42], 8, 
                                 fill=(102, 126, 234))
            popup_draw.text((50, y_pos + 21), cat, fill=(255, 255, 255), 
                          font=get_font(15, bold=True), anchor="lm")
            popup_draw.text((popup_width - 35, y_pos + 21), "✓", fill=(255, 255, 255), 
                          font=get_font(18, bold=True), anchor="mm")
        else:
            popup_draw.text((50, y_pos + 21), cat, fill=(220, 220, 220), 
                          font=get_font(14), anchor="lm")
    
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    return img

def create_dashboard_image():
    """Create realistic image 3: Dashboard view"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Header
    header = create_gradient_background(width, 140, (102, 126, 234), (118, 75, 162))
    img.paste(header, (0, 0))
    
    draw.text((60, 50), "SmarTrack", fill=(255, 255, 255), font=get_font(32, bold=True))
    draw.text((60, 95), "Your Research Library", fill=(255, 255, 255, 220), font=get_font(16))
    
    # Search bar
    search_x, search_y = 60, 160
    draw_rounded_rectangle(draw, [search_x, search_y, width - 60, search_y + 50], 25, 
                         fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    draw.text((search_x + 25, search_y + 25), "🔍 Search your links...", 
             fill=(150, 150, 150), font=get_font(14), anchor="lm")
    
    # Link cards
    cards = [
        ("Reddit", "reddit.com/r/technology", "Research", (255, 69, 0)),
        ("Wikipedia", "wikipedia.org/wiki/Quantum", "Articles", (0, 0, 0)),
        ("GitHub", "github.com/trending", "Tools", (36, 41, 46)),
        ("Medium", "medium.com/@tech", "Articles", (0, 0, 0)),
        ("Stack Overflow", "stackoverflow.com/questions", "References", (244, 128, 36)),
        ("YouTube", "youtube.com/watch", "Research", (255, 0, 0)),
    ]
    
    card_width, card_height = 380, 200
    start_x, start_y = 60, 240
    spacing = 20
    
    for i, (title, url, category, color) in enumerate(cards):
        row = i // 3
        col = i % 3
        x = start_x + col * (card_width + spacing)
        y = start_y + row * (card_height + spacing)
        
        # Card shadow
        shadow_img = Image.new('RGBA', (card_width + 10, card_height + 10), (0, 0, 0, 15))
        shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(radius=10))
        img.paste(shadow_img, (x + 5, y + 5), shadow_img)
        
        # Card
        draw_rounded_rectangle(draw, [x, y, x + card_width, y + card_height], 12, 
                             fill=(255, 255, 255), outline=(230, 230, 230), width=1)
        
        # Favicon
        draw_rounded_rectangle(draw, [x + 20, y + 20, x + 70, y + 70], 10, fill=color)
        draw.text((x + 45, y + 45), title[0].upper(), fill=(255, 255, 255), 
                 font=get_font(22, bold=True), anchor="mm")
        
        # Content
        draw.text((x + 85, y + 25), title, fill=(30, 30, 30), font=get_font(17, bold=True))
        draw.text((x + 85, y + 50), url, fill=(120, 120, 120), font=get_font(12))
        draw.text((x + 85, y + 75), "Saved 2 days ago", fill=(150, 150, 150), font=get_font(11))
        
        # Category badge
        badge_y = y + card_height - 32
        draw_rounded_rectangle(draw, [x + 20, badge_y, x + 110, badge_y + 24], 6, 
                             fill=(240, 243, 250), outline=(102, 126, 234), width=1)
        draw.text((x + 30, badge_y + 12), category, fill=(102, 126, 234), 
                 font=get_font(11, bold=True), anchor="lm")
    
    return img

def main():
    """Generate all three realistic promotional images"""
    output_dir = Path("store_images")
    output_dir.mkdir(exist_ok=True)
    
    print("🎨 Creating REALISTIC Chrome Web Store images...\n")
    
    print("1️⃣  Creating 'Save Link Popup' (realistic browser context)...")
    img1 = create_popup_image()
    img1.save(output_dir / "1_save_link_popup.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/1_save_link_popup.png")
    
    print("2️⃣  Creating 'Category Selection' (realistic browser context)...")
    img2 = create_category_image()
    img2.save(output_dir / "2_category_selection.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/2_category_selection.png")
    
    print("3️⃣  Creating 'Dashboard View' (clean professional layout)...")
    img3 = create_dashboard_image()
    img3.save(output_dir / "3_dashboard_view.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/3_dashboard_view.png")
    
    print(f"\n✅ All REALISTIC images created!")
    print(f"   ✨ Realistic browser windows")
    print(f"   ✨ Actual website content (Reddit)")
    print(f"   ✨ Extension shown in context")
    print(f"   ✨ Professional Chrome Web Store style")

if __name__ == "__main__":
    main()

