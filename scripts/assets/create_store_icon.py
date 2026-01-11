#!/usr/bin/env python3
"""
Create Chrome Web Store compliant icon from existing assets
Ensures 128x128 with 96x96 content area and proper padding
"""

import sys
from pathlib import Path

try:
    from PIL import Image, ImageFilter, ImageDraw
except ImportError:
    print("❌ PIL/Pillow not installed. Install with: pip install Pillow")
    sys.exit(1)

def create_store_icon(input_path, output_path=None):
    """Create Chrome Web Store compliant icon"""
    
    if not Path(input_path).exists():
        print(f"❌ Input file not found: {input_path}")
        return False
    
    if output_path is None:
        output_path = "extension/icons/icon128_store.png"
    
    print(f"📦 Creating Chrome Web Store icon...")
    print(f"   Input: {input_path}")
    print(f"   Output: {output_path}\n")
    
    try:
        # Load input image
        img = Image.open(input_path)
        print(f"✅ Loaded image: {img.size[0]}x{img.size[1]}, mode: {img.mode}")
        
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
            print(f"✅ Converted to RGBA")
        
        # If image is already 128x128, check if we need to add padding
        if img.size == (128, 128):
            print(f"✅ Image is already 128x128")
            
            # Check if corners are transparent (has padding)
            corners = [(0, 0), (127, 0), (0, 127), (127, 127)]
            transparent_corners = sum(1 for x, y in corners if img.getpixel((x, y))[3] == 0)
            
            if transparent_corners < 4:
                print(f"⚠️  Adding 16px transparent padding...")
                # Resize to 96x96 first
                icon_content = img.resize((96, 96), Image.Resampling.LANCZOS)
                
                # Create new 128x128 transparent canvas
                new_img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
                
                # Paste icon in center (16px padding on all sides)
                new_img.paste(icon_content, (16, 16), icon_content)
                img = new_img
            else:
                print(f"✅ Image already has transparent padding")
        else:
            # Resize to 96x96 (content area)
            print(f"📏 Resizing to 96x96 content area...")
            icon_content = img.resize((96, 96), Image.Resampling.LANCZOS)
            
            # Create new 128x128 transparent canvas
            new_img = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
            
            # Paste icon in center (16px padding on all sides)
            new_img.paste(icon_content, (16, 16), icon_content)
            img = new_img
            print(f"✅ Added 16px transparent padding")
        
        # Optional: Add subtle white glow for dark backgrounds
        # Only if icon is mostly dark
        print(f"\n🎨 Analyzing icon brightness...")
        pixels = list(img.getdata())
        non_transparent = [p for p in pixels if p[3] > 0]
        
        if non_transparent:
            avg_brightness = sum(sum(p[:3]) / 3 for p in non_transparent) / len(non_transparent)
            print(f"   Average brightness: {avg_brightness:.1f}/255")
            
            if avg_brightness < 128:  # Mostly dark
                print(f"   ⚠️  Icon is dark - adding subtle glow for dark backgrounds...")
                
                # Create glow effect
                glow = img.filter(ImageFilter.GaussianBlur(radius=2))
                
                # Create white glow layer
                glow_layer = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
                draw = ImageDraw.Draw(glow_layer)
                
                # Draw white glow around icon edges
                for x in range(128):
                    for y in range(128):
                        r, g, b, a = glow.getpixel((x, y))
                        if a > 0:
                            # Add subtle white glow
                            glow_layer.putpixel((x, y), (255, 255, 255, min(a // 4, 30)))
                
                # Composite glow with original
                img = Image.alpha_composite(glow_layer, img)
                print(f"   ✅ Added subtle white glow")
            else:
                print(f"   ✅ Icon is bright enough for dark backgrounds")
        
        # Save the final icon
        img.save(output_path, 'PNG', optimize=True)
        print(f"\n✅ Chrome Web Store icon created: {output_path}")
        print(f"   Size: {img.size[0]}x{img.size[1]}")
        print(f"   Format: PNG with transparency")
        print(f"\n📋 Next steps:")
        print(f"   1. Verify with: python3 verify_icon.py {output_path}")
        print(f"   2. Test on both light and dark backgrounds")
        print(f"   3. Replace extension/icons/icon128.png if satisfied")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    input_file = "extension/icons/icon128.png"
    output_file = "extension/icons/icon128_store.png"
    
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    
    success = create_store_icon(input_file, output_file)
    sys.exit(0 if success else 1)















