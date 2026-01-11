#!/usr/bin/env python3
"""
Create IMPROVED Chrome Web Store promotional images for SmarTrack
Enhanced with better design, shadows, typography, and professional polish
"""

import sys
from pathlib import Path
import math

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
    """Draw a rounded rectangle with proper anti-aliasing"""
    x1, y1, x2, y2 = xy
    # Ensure proper order
    if x1 > x2:
        x1, x2 = x2, x1
    if y1 > y2:
        y1, y2 = y2, y1
    # Limit radius to half the smallest dimension
    max_radius = min((x2 - x1) // 2, (y2 - y1) // 2)
    radius = min(radius, max_radius)
    
    if radius > 0:
        # Main rectangle
        if x2 - x1 > 2 * radius:
            draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill, outline=None)
        if y2 - y1 > 2 * radius:
            draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill, outline=None)
        # Rounded corners
        draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill, outline=None)
        draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill, outline=None)
        draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill, outline=None)
        draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill, outline=None)
    else:
        draw.rectangle([x1, y1, x2, y2], fill=fill, outline=None)
    
    # Outline
    if outline:
        # Draw outline segments
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

def create_shadow(width, height, blur=10, opacity=40):
    """Create a shadow effect"""
    shadow = Image.new('RGBA', (width + blur*2, height + blur*2), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rectangle([blur, blur, width + blur, height + blur], 
                         fill=(0, 0, 0, opacity))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=blur))
    return shadow

def create_popup_image():
    """Create improved image 1: Save Link Popup"""
    width, height = 1280, 800
    # Light gray background with subtle texture
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Subtle background pattern
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(248, 249, 250), width=1)
    
    # Browser chrome (more realistic)
    browser_gradient = create_gradient_background(width, 70, (252, 253, 254), (248, 249, 250))
    img.paste(browser_gradient, (0, 0))
    
    # Browser buttons (macOS style)
    draw.ellipse([25, 25, 40, 40], fill=(255, 95, 87))
    draw.ellipse([45, 25, 60, 40], fill=(255, 189, 46))
    draw.ellipse([65, 25, 80, 40], fill=(40, 201, 55))
    
    # URL bar
    draw_rounded_rectangle(draw, [100, 30, width - 200, 55], 12, 
                          fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    draw.text((120, 42), "https://www.reddit.com/r/technology", 
              fill=(100, 100, 100), font=get_font(12), anchor="lm")
    
    # Extension popup (centered, larger, more prominent)
    popup_width, popup_height = 440, 650
    popup_x = (width - popup_width) // 2
    popup_y = 90
    
    # Create popup with shadow
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    # Popup background (white with subtle border)
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 
                          16, fill=(255, 255, 255), outline=(230, 230, 230), width=2)
    
    # Header with beautiful gradient
    header_gradient = create_gradient_background(popup_width, 140, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header_gradient, (0, 0))
    
    # ST Logo (larger, more prominent)
    logo_size = 60
    logo_x = (popup_width - logo_size) // 2
    logo_y = 25
    draw_rounded_rectangle(popup_draw, [logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], 
                          12, fill=(255, 255, 255))
    popup_draw.text((logo_x + 15, logo_y + 15), "ST", fill=(102, 126, 234), font=get_font(28, bold=True))
    
    # Title (better typography)
    popup_draw.text((popup_width // 2, 100), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(24, bold=True), anchor="mm")
    popup_draw.text((popup_width // 2, 125), "Smart Research Tracking", 
                   fill=(255, 255, 255, 220), font=get_font(13), anchor="mm")
    
    # Link preview card (enhanced)
    card_y = 160
    draw_rounded_rectangle(popup_draw, [20, card_y, popup_width - 20, card_y + 90], 
                          12, fill=(248, 250, 252), outline=(225, 230, 235), width=1)
    
    # Favicon (more realistic)
    favicon_x, favicon_y = 35, card_y + 15
    draw_rounded_rectangle(popup_draw, [favicon_x, favicon_y, favicon_x + 50, favicon_y + 50], 
                          8, fill=(255, 69, 0))  # Reddit orange
    popup_draw.text((favicon_x + 25, favicon_y + 25), "r", fill=(255, 255, 255), 
                   font=get_font(24, bold=True), anchor="mm")
    
    # Link info (better spacing)
    popup_draw.text((95, card_y + 20), "Reddit - The heart of the internet", 
                   fill=(30, 30, 30), font=get_font(16, bold=True))
    popup_draw.text((95, card_y + 45), "https://www.reddit.com/", 
                   fill=(120, 120, 120), font=get_font(12))
    popup_draw.text((95, card_y + 65), "Save this link to your research library", 
                   fill=(150, 150, 150), font=get_font(11))
    
    # Form fields (better design)
    field_y = card_y + 110
    popup_draw.text((20, field_y), "Title", fill=(80, 80, 80), font=get_font(12, bold=True))
    draw_rounded_rectangle(popup_draw, [20, field_y + 25, popup_width - 20, field_y + 55], 
                          8, fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((30, field_y + 40), "Reddit - The heart of the internet", 
                   fill=(50, 50, 50), font=get_font(14), anchor="lm")
    
    desc_y = field_y + 75
    popup_draw.text((20, desc_y), "Description", fill=(80, 80, 80), font=get_font(12, bold=True))
    draw_rounded_rectangle(popup_draw, [20, desc_y + 25, popup_width - 20, desc_y + 110], 
                          8, fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((30, desc_y + 40), "Add notes or description...", 
                   fill=(160, 160, 160), font=get_font(13), anchor="lm")
    
    # Category (enhanced)
    cat_y = desc_y + 140
    popup_draw.text((20, cat_y), "Category", fill=(80, 80, 80), font=get_font(12, bold=True))
    draw_rounded_rectangle(popup_draw, [20, cat_y + 25, popup_width - 20, cat_y + 60], 
                          8, fill=(255, 255, 255), outline=(210, 215, 220), width=1)
    popup_draw.text((30, cat_y + 42), "Research", fill=(50, 50, 50), font=get_font(14), anchor="lm")
    # Dropdown arrow
    popup_draw.polygon([(popup_width - 35, cat_y + 40), (popup_width - 25, cat_y + 40), 
                       (popup_width - 30, cat_y + 50)], fill=(150, 150, 150))
    
    # Buttons (more prominent)
    btn_y = popup_height - 80
    # Cancel button
    draw_rounded_rectangle(popup_draw, [20, btn_y, 200, btn_y + 45], 
                          8, fill=(248, 249, 250), outline=(220, 220, 220), width=1)
    popup_draw.text((110, btn_y + 22), "Cancel", fill=(100, 100, 100), 
                   font=get_font(15, bold=True), anchor="mm")
    
    # Save button (gradient)
    save_btn_gradient = create_gradient_background(220, 45, (102, 126, 234), (118, 75, 162))
    popup_img.paste(save_btn_gradient, (220, btn_y))
    draw_rounded_rectangle(popup_draw, [220, btn_y, popup_width - 20, btn_y + 45], 
                          8, fill=None, outline=(102, 126, 234), width=2)
    popup_draw.text((popup_width - 110, btn_y + 22), "Save Link", fill=(255, 255, 255), 
                   font=get_font(15, bold=True), anchor="mm")
    
    # Apply shadow to popup
    shadow = create_shadow(popup_width, popup_height, blur=20, opacity=60)
    img.paste(shadow, (popup_x - 20, popup_y - 12), shadow)
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    # Caption (better styling)
    caption_bg = Image.new('RGBA', (width, 80), (0, 0, 0, 0))
    caption_draw = ImageDraw.Draw(caption_bg)
    caption_draw.rectangle([0, 0, width, 80], fill=(255, 255, 255, 240))
    img.paste(caption_bg, (0, height - 80), caption_bg)
    draw.text((width // 2, height - 45), "Save any page instantly with one click", 
             fill=(50, 50, 50), font=get_font(32, bold=True), anchor="mm")
    
    return img

def create_category_image():
    """Create improved image 2: Category Selection"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Background pattern
    for y in range(0, height, 40):
        draw.line([(0, y), (width, y)], fill=(248, 249, 250), width=1)
    
    # Popup
    popup_width, popup_height = 440, 650
    popup_x = (width - popup_width) // 2
    popup_y = 90
    
    popup_img = Image.new('RGBA', (popup_width, popup_height), (0, 0, 0, 0))
    popup_draw = ImageDraw.Draw(popup_img)
    
    draw_rounded_rectangle(popup_draw, [0, 0, popup_width, popup_height], 
                          16, fill=(255, 255, 255), outline=(230, 230, 230), width=2)
    
    # Header
    header_gradient = create_gradient_background(popup_width, 140, (102, 126, 234), (118, 75, 162))
    popup_img.paste(header_gradient, (0, 0))
    popup_draw.text((popup_width // 2, 70), "Save to SmarTrack", 
                   fill=(255, 255, 255), font=get_font(24, bold=True), anchor="mm")
    
    # Category dropdown (open, more realistic)
    cat_y = 200
    popup_draw.text((20, cat_y), "Category", fill=(80, 80, 80), font=get_font(12, bold=True))
    
    # Dropdown container
    dropdown_y = cat_y + 30
    draw_rounded_rectangle(popup_draw, [20, dropdown_y, popup_width - 20, dropdown_y + 280], 
                          12, fill=(50, 50, 50), outline=(70, 70, 70), width=2)
    
    # Category options (enhanced)
    categories = [
        ("Articles", True),
        ("Tools", False),
        ("References", False),
        ("Research", False),
        ("Other", False)
    ]
    
    for i, (cat, selected) in enumerate(categories):
        y_pos = dropdown_y + 15 + i * 52
        if selected:
            # Selected item (highlighted)
            draw_rounded_rectangle(popup_draw, [25, y_pos, popup_width - 25, y_pos + 45], 
                                  8, fill=(102, 126, 234))
            popup_draw.text((50, y_pos + 22), cat, fill=(255, 255, 255), 
                          font=get_font(16, bold=True), anchor="lm")
            # Checkmark
            popup_draw.text((popup_width - 40, y_pos + 22), "✓", fill=(255, 255, 255), 
                          font=get_font(20, bold=True), anchor="mm")
        else:
            popup_draw.text((50, y_pos + 22), cat, fill=(220, 220, 220), 
                          font=get_font(15), anchor="lm")
    
    # Shadow
    shadow = create_shadow(popup_width, popup_height, blur=20, opacity=60)
    img.paste(shadow, (popup_x - 20, popup_y - 12), shadow)
    img.paste(popup_img, (popup_x, popup_y), popup_img)
    
    # Caption
    caption_bg = Image.new('RGBA', (width, 80), (255, 255, 255, 240))
    img.paste(caption_bg, (0, height - 80), caption_bg)
    draw.text((width // 2, height - 45), "Organize your research as you browse", 
             fill=(50, 50, 50), font=get_font(32, bold=True), anchor="mm")
    
    return img

def create_dashboard_image():
    """Create improved image 3: Dashboard View"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (250, 251, 252))
    draw = ImageDraw.Draw(img)
    
    # Header with gradient
    header_gradient = create_gradient_background(width, 150, (102, 126, 234), (118, 75, 162))
    img.paste(header_gradient, (0, 0))
    
    # Title
    draw.text((60, 60), "SmarTrack Dashboard", fill=(255, 255, 255), font=get_font(36, bold=True))
    draw.text((60, 110), "Your Research Library", fill=(255, 255, 255, 220), font=get_font(16))
    
    # Link cards (enhanced design)
    cards = [
        ("Reddit", "https://reddit.com", "Research", (255, 69, 0)),
        ("Wikipedia", "https://wikipedia.org", "Articles", (0, 0, 0)),
        ("GitHub", "https://github.com", "Tools", (36, 41, 46)),
        ("Medium", "https://medium.com", "Articles", (0, 0, 0)),
        ("Stack Overflow", "https://stackoverflow.com", "References", (244, 128, 36)),
        ("YouTube", "https://youtube.com", "Research", (255, 0, 0)),
    ]
    
    card_width, card_height = 380, 220
    start_x, start_y = 60, 180
    spacing = 20
    
    for i, (title, url, category, color) in enumerate(cards):
        row = i // 3
        col = i % 3
        x = start_x + col * (card_width + spacing)
        y = start_y + row * (card_height + spacing)
        
        # Card shadow
        card_shadow = Image.new('RGBA', (card_width + 10, card_height + 10), (0, 0, 0, 20))
        card_shadow = card_shadow.filter(ImageFilter.GaussianBlur(radius=8))
        img.paste(card_shadow, (x + 5, y + 5), card_shadow)
        
        # Card
        draw_rounded_rectangle(draw, [x, y, x + card_width, y + card_height], 
                              16, fill=(255, 255, 255), outline=(230, 230, 230), width=2)
        
        # Favicon (colored)
        draw_rounded_rectangle(draw, [x + 20, y + 20, x + 70, y + 70], 
                              10, fill=color)
        draw.text((x + 45, y + 45), title[0].upper(), fill=(255, 255, 255), 
                 font=get_font(24, bold=True), anchor="mm")
        
        # Title
        draw.text((x + 85, y + 25), title, fill=(30, 30, 30), font=get_font(18, bold=True))
        draw.text((x + 85, y + 50), url, fill=(120, 120, 120), font=get_font(12))
        
        # Description
        draw.text((x + 85, y + 75), "Saved 2 days ago", fill=(150, 150, 150), font=get_font(11))
        
        # Category badge (enhanced)
        badge_y = y + card_height - 35
        # Light blue background
        draw_rounded_rectangle(draw, [x + 20, badge_y, x + 120, badge_y + 25], 
                              6, fill=(240, 243, 250), outline=(102, 126, 234), width=1)
        draw.text((x + 30, badge_y + 12), category, fill=(102, 126, 234), 
                 font=get_font(12, bold=True), anchor="lm")
    
    # Caption
    caption_bg = Image.new('RGBA', (width, 80), (255, 255, 255, 240))
    img.paste(caption_bg, (0, height - 80), caption_bg)
    draw.text((width // 2, height - 45), "Your personal research library, synced everywhere", 
             fill=(50, 50, 50), font=get_font(32, bold=True), anchor="mm")
    
    return img

def main():
    """Generate all three improved promotional images"""
    output_dir = Path("store_images")
    output_dir.mkdir(exist_ok=True)
    
    print("🎨 Creating IMPROVED Chrome Web Store promotional images...\n")
    
    # Image 1: Popup
    print("1️⃣  Creating enhanced 'Save Link Popup' image...")
    img1 = create_popup_image()
    img1.save(output_dir / "1_save_link_popup.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/1_save_link_popup.png")
    
    # Image 2: Category Selection
    print("2️⃣  Creating enhanced 'Category Selection' image...")
    img2 = create_category_image()
    img2.save(output_dir / "2_category_selection.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/2_category_selection.png")
    
    # Image 3: Dashboard
    print("3️⃣  Creating enhanced 'Dashboard View' image...")
    img3 = create_dashboard_image()
    img3.save(output_dir / "3_dashboard_view.png", "PNG", quality=100)
    print(f"   ✅ Saved: {output_dir}/3_dashboard_view.png")
    
    print(f"\n✅ All IMPROVED images created in '{output_dir}' folder!")
    print(f"   Size: 1280x800 pixels (Chrome Web Store recommended)")
    print(f"   Quality: High (100% PNG quality)")
    print(f"\n📋 Improvements made:")
    print(f"   ✨ Better shadows and depth")
    print(f"   ✨ Enhanced typography and spacing")
    print(f"   ✨ More realistic UI elements")
    print(f"   ✨ Professional color gradients")
    print(f"   ✨ Polished details and borders")

if __name__ == "__main__":
    main()

