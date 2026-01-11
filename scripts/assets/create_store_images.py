#!/usr/bin/env python3
"""
Create Chrome Web Store promotional images for SmarTrack
Generates 3 images: Popup, Category Selection, Dashboard
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("❌ PIL/Pillow not installed. Install with: pip install Pillow")
    sys.exit(1)

def create_gradient_background(width, height, color1, color2, direction='vertical'):
    """Create a gradient background"""
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
    # Draw main rectangle
    draw.rectangle([x1 + radius, y1, x2 - radius, y2], fill=fill, outline=None)
    draw.rectangle([x1, y1 + radius, x2, y2 - radius], fill=fill, outline=None)
    # Draw corners
    draw.ellipse([x1, y1, x1 + 2*radius, y1 + 2*radius], fill=fill, outline=None)
    draw.ellipse([x2 - 2*radius, y1, x2, y1 + 2*radius], fill=fill, outline=None)
    draw.ellipse([x1, y2 - 2*radius, x1 + 2*radius, y2], fill=fill, outline=None)
    draw.ellipse([x2 - 2*radius, y2 - 2*radius, x2, y2], fill=fill, outline=None)
    # Draw outline if specified
    if outline:
        # Simple rectangle outline (rounded corners would need more complex drawing)
        draw.rectangle([x1, y1, x2, y2], fill=None, outline=outline, width=width)

def create_popup_image():
    """Create image 1: Save Link Popup"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (245, 247, 250))
    draw = ImageDraw.Draw(img)
    
    # Browser chrome at top
    browser_color = (248, 249, 250)
    draw.rectangle([0, 0, width, 60], fill=browser_color)
    draw.rectangle([0, 60, width, 65], fill=(220, 220, 220))
    
    # Browser buttons
    draw.ellipse([20, 20, 35, 35], fill=(255, 95, 87))
    draw.ellipse([40, 20, 55, 35], fill=(255, 189, 46))
    draw.ellipse([60, 20, 75, 35], fill=(40, 201, 55))
    
    # Extension popup (centered)
    popup_width, popup_height = 400, 600
    popup_x = (width - popup_width) // 2
    popup_y = 100
    
    # Popup shadow
    shadow = Image.new('RGBA', (popup_width + 10, popup_height + 10), (0, 0, 0, 30))
    img.paste(shadow, (popup_x + 5, popup_y + 5), shadow)
    
    # Popup background
    draw_rounded_rectangle(draw, [popup_x, popup_y, popup_x + popup_width, popup_y + popup_height], 
                          12, fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    
    # Header with gradient
    header_gradient = create_gradient_background(popup_width, 120, (102, 126, 234), (118, 75, 162))
    img.paste(header_gradient, (popup_x, popup_y))
    
    # ST Logo
    logo_size = 50
    logo_x = popup_x + (popup_width - logo_size) // 2
    logo_y = popup_y + 20
    draw_rounded_rectangle(draw, [logo_x, logo_y, logo_x + logo_size, logo_y + logo_size], 
                          8, fill=(255, 255, 255))
    try:
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except:
        font_large = ImageFont.load_default()
    draw.text((logo_x + 12, logo_y + 10), "ST", fill=(102, 126, 234), font=font_large)
    
    # Title
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        font_subtitle = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
    
    draw.text((popup_x + popup_width // 2, popup_y + 80), "Save to SmarTrack", 
              fill=(255, 255, 255), font=font_title, anchor="mm")
    draw.text((popup_x + popup_width // 2, popup_y + 105), "Smart Research Tracking", 
              fill=(255, 255, 255), font=font_subtitle, anchor="mm")
    
    # Link preview card
    card_y = popup_y + 140
    draw_rounded_rectangle(draw, [popup_x + 20, card_y, popup_x + popup_width - 20, card_y + 80], 
                          8, fill=(248, 249, 250), outline=(220, 220, 220), width=1)
    
    # Favicon placeholder
    draw_rounded_rectangle(draw, [popup_x + 30, card_y + 10, popup_x + 70, card_y + 50], 
                          4, fill=(200, 200, 200))
    
    # Link info
    draw.text((popup_x + 85, card_y + 15), "Reddit - The heart of the internet", 
              fill=(30, 30, 30), font=font_title)
    draw.text((popup_x + 85, card_y + 45), "https://www.reddit.com/", 
              fill=(120, 120, 120), font=font_subtitle)
    
    # Form fields
    field_y = card_y + 100
    draw.text((popup_x + 20, field_y), "Title", fill=(100, 100, 100), font=font_subtitle)
    draw_rounded_rectangle(draw, [popup_x + 20, field_y + 20, popup_x + popup_width - 20, field_y + 50], 
                          6, fill=(255, 255, 255), outline=(200, 200, 200), width=1)
    draw.text((popup_x + 25, field_y + 35), "Reddit - The heart of the internet", 
              fill=(50, 50, 50), font=font_subtitle)
    
    desc_y = field_y + 70
    draw.text((popup_x + 20, desc_y), "Description", fill=(100, 100, 100), font=font_subtitle)
    draw_rounded_rectangle(draw, [popup_x + 20, desc_y + 20, popup_x + popup_width - 20, desc_y + 100], 
                          6, fill=(255, 255, 255), outline=(200, 200, 200), width=1)
    draw.text((popup_x + 25, desc_y + 35), "Add notes or description", 
              fill=(150, 150, 150), font=font_subtitle)
    
    # Category
    cat_y = desc_y + 120
    draw.text((popup_x + 20, cat_y), "Category", fill=(100, 100, 100), font=font_subtitle)
    draw_rounded_rectangle(draw, [popup_x + 20, cat_y + 20, popup_x + popup_width - 20, cat_y + 50], 
                          6, fill=(255, 255, 255), outline=(200, 200, 200), width=1)
    draw.text((popup_x + 25, cat_y + 35), "Research", fill=(50, 50, 50), font=font_subtitle)
    
    # Buttons
    btn_y = popup_y + popup_height - 70
    draw_rounded_rectangle(draw, [popup_x + 20, btn_y, popup_x + 180, btn_y + 40], 
                          6, fill=(240, 240, 240), outline=(200, 200, 200), width=1)
    draw.text((popup_x + 100, btn_y + 20), "Cancel", fill=(100, 100, 100), font=font_title, anchor="mm")
    
    draw_rounded_rectangle(draw, [popup_x + 200, btn_y, popup_x + popup_width - 20, btn_y + 40], 
                          6, fill=(102, 126, 234))
    draw.text((popup_x + popup_width - 110, btn_y + 20), "Save Link", fill=(255, 255, 255), font=font_title, anchor="mm")
    
    # Caption
    try:
        font_caption = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except:
        font_caption = ImageFont.load_default()
    draw.text((width // 2, height - 50), "Save any page instantly with one click", 
              fill=(50, 50, 50), font=font_caption, anchor="mm")
    
    return img

def create_category_image():
    """Create image 2: Category Selection"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (245, 247, 250))
    draw = ImageDraw.Draw(img)
    
    # Similar popup structure
    popup_width, popup_height = 400, 600
    popup_x = (width - popup_width) // 2
    popup_y = 100
    
    # Popup
    shadow = Image.new('RGBA', (popup_width + 10, popup_height + 10), (0, 0, 0, 30))
    img.paste(shadow, (popup_x + 5, popup_y + 5), shadow)
    draw_rounded_rectangle(draw, [popup_x, popup_y, popup_x + popup_width, popup_y + popup_height], 
                          12, fill=(255, 255, 255), outline=(220, 220, 220), width=1)
    
    # Header
    header_gradient = create_gradient_background(popup_width, 120, (102, 126, 234), (118, 75, 162))
    img.paste(header_gradient, (popup_x, popup_y))
    
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 20)
        font_subtitle = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 12)
        font_caption = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_caption = ImageFont.load_default()
    
    draw.text((popup_x + popup_width // 2, popup_y + 60), "Save to SmarTrack", 
              fill=(255, 255, 255), font=font_title, anchor="mm")
    
    # Category dropdown (open)
    cat_y = popup_y + 200
    draw.text((popup_x + 20, cat_y), "Category", fill=(100, 100, 100), font=font_subtitle)
    
    # Dropdown open state
    dropdown_y = cat_y + 30
    draw_rounded_rectangle(draw, [popup_x + 20, dropdown_y, popup_x + popup_width - 20, dropdown_y + 250], 
                          6, fill=(50, 50, 50), outline=(200, 200, 200), width=1)
    
    # Category options
    categories = ["Articles", "Tools", "References", "Research", "Other"]
    for i, cat in enumerate(categories):
        y_pos = dropdown_y + 10 + i * 45
        if i == 0:  # Selected
            draw_rounded_rectangle(draw, [popup_x + 25, y_pos, popup_x + popup_width - 25, y_pos + 40], 
                                  4, fill=(102, 126, 234))
            draw.text((popup_x + 50, y_pos + 20), cat, fill=(255, 255, 255), font=font_title, anchor="lm")
            # Checkmark
            draw.text((popup_x + popup_width - 40, y_pos + 20), "✓", fill=(255, 255, 255), font=font_title, anchor="mm")
        else:
            draw.text((popup_x + 50, y_pos + 20), cat, fill=(255, 255, 255), font=font_title, anchor="lm")
    
    # Caption
    draw.text((width // 2, height - 50), "Organize your research as you browse", 
              fill=(50, 50, 50), font=font_caption, anchor="mm")
    
    return img

def create_dashboard_image():
    """Create image 3: Dashboard View"""
    width, height = 1280, 800
    img = Image.new('RGB', (width, height), (245, 247, 250))
    draw = ImageDraw.Draw(img)
    
    # Browser chrome
    draw.rectangle([0, 0, width, 60], fill=(248, 249, 250))
    
    # Dashboard header
    header_gradient = create_gradient_background(width, 120, (102, 126, 234), (118, 75, 162))
    img.paste(header_gradient, (0, 60))
    
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
        font_subtitle = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        font_card = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
        font_caption = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_card = ImageFont.load_default()
        font_caption = ImageFont.load_default()
    
    draw.text((60, 100), "SmarTrack Dashboard", fill=(255, 255, 255), font=font_title)
    draw.text((60, 140), "Your Research Library", fill=(255, 255, 255, 200), font=font_subtitle)
    
    # Link cards grid
    cards = [
        ("Reddit", "https://reddit.com", "Research"),
        ("Wikipedia", "https://wikipedia.org", "Articles"),
        ("GitHub", "https://github.com", "Tools"),
        ("Medium", "https://medium.com", "Articles"),
        ("Stack Overflow", "https://stackoverflow.com", "References"),
        ("YouTube", "https://youtube.com", "Research"),
    ]
    
    card_width, card_height = 380, 200
    start_x, start_y = 60, 220
    spacing = 20
    
    for i, (title, url, category) in enumerate(cards):
        row = i // 3
        col = i % 3
        x = start_x + col * (card_width + spacing)
        y = start_y + row * (card_height + spacing)
        
        # Card
        draw_rounded_rectangle(draw, [x, y, x + card_width, y + card_height], 
                              12, fill=(255, 255, 255), outline=(220, 220, 220), width=1)
        
        # Favicon placeholder
        draw_rounded_rectangle(draw, [x + 15, y + 15, x + 55, y + 55], 
                              6, fill=(200, 200, 200))
        
        # Title
        draw.text((x + 70, y + 20), title, fill=(30, 30, 30), font=font_card)
        draw.text((x + 70, y + 45), url, fill=(120, 120, 120), font=font_subtitle)
        
        # Category badge
        draw_rounded_rectangle(draw, [x + 15, y + 160, x + 100, y + 180], 
                              4, fill=(102, 126, 234), outline=(102, 126, 234), width=1)
        draw.text((x + 25, y + 170), category, fill=(102, 126, 234), font=font_subtitle, anchor="lm")
    
    # Caption
    draw.text((width // 2, height - 50), "Your personal research library, synced everywhere", 
              fill=(50, 50, 50), font=font_caption, anchor="mm")
    
    return img

def main():
    """Generate all three promotional images"""
    output_dir = Path("store_images")
    output_dir.mkdir(exist_ok=True)
    
    print("🎨 Creating Chrome Web Store promotional images...\n")
    
    # Image 1: Popup
    print("1️⃣  Creating 'Save Link Popup' image...")
    img1 = create_popup_image()
    img1.save(output_dir / "1_save_link_popup.png", "PNG", quality=95)
    print(f"   ✅ Saved: {output_dir}/1_save_link_popup.png")
    
    # Image 2: Category Selection
    print("2️⃣  Creating 'Category Selection' image...")
    img2 = create_category_image()
    img2.save(output_dir / "2_category_selection.png", "PNG", quality=95)
    print(f"   ✅ Saved: {output_dir}/2_category_selection.png")
    
    # Image 3: Dashboard
    print("3️⃣  Creating 'Dashboard View' image...")
    img3 = create_dashboard_image()
    img3.save(output_dir / "3_dashboard_view.png", "PNG", quality=95)
    print(f"   ✅ Saved: {output_dir}/3_dashboard_view.png")
    
    print(f"\n✅ All images created in '{output_dir}' folder!")
    print(f"   Size: 1280x800 pixels (Chrome Web Store recommended)")
    print(f"\n📋 Next steps:")
    print(f"   1. Review the images in the '{output_dir}' folder")
    print(f"   2. Upload them to Chrome Web Store dashboard")
    print(f"   3. They will appear in your extension listing")

if __name__ == "__main__":
    main()

