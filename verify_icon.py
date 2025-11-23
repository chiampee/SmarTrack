#!/usr/bin/env python3
"""
Chrome Web Store Icon Verification Script
Checks if icon128.png meets Google's requirements
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ PIL/Pillow not installed. Install with: pip install Pillow")
    sys.exit(1)

def verify_icon(icon_path):
    """Verify icon meets Chrome Web Store requirements"""
    print(f"🔍 Checking: {icon_path}\n")
    
    if not Path(icon_path).exists():
        print(f"❌ File not found: {icon_path}")
        return False
    
    try:
        img = Image.open(icon_path)
    except Exception as e:
        print(f"❌ Failed to open image: {e}")
        return False
    
    # Check format
    if img.format != 'PNG':
        print(f"❌ Format: {img.format} (must be PNG)")
        return False
    else:
        print(f"✅ Format: PNG")
    
    # Check dimensions
    width, height = img.size
    if width != 128 or height != 128:
        print(f"❌ Dimensions: {width}x{height} (must be 128x128)")
        return False
    else:
        print(f"✅ Dimensions: {width}x{height}")
    
    # Check transparency
    has_alpha = img.mode in ('RGBA', 'LA') or 'transparency' in img.info
    if not has_alpha:
        print(f"⚠️  Warning: No transparency detected (recommended for padding)")
    else:
        print(f"✅ Has transparency")
    
    # Check if icon content is in center 96x96 area
    if has_alpha:
        # Convert to RGBA if needed
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Check corners (should be transparent for padding)
        corners = [
            (0, 0),      # Top-left
            (127, 0),    # Top-right
            (0, 127),    # Bottom-left
            (127, 127)   # Bottom-right
        ]
        
        transparent_corners = 0
        for x, y in corners:
            r, g, b, a = img.getpixel((x, y))
            if a == 0:  # Fully transparent
                transparent_corners += 1
        
        if transparent_corners == 4:
            print(f"✅ Corners are transparent (good padding)")
        elif transparent_corners > 0:
            print(f"⚠️  {transparent_corners}/4 corners are transparent")
        else:
            print(f"⚠️  No transparent corners (icon may extend to edges)")
    
    # Check center area (96x96) has content
    center_x, center_y = 64, 64
    center_area = img.crop((16, 16, 112, 112))  # 96x96 area
    
    # Check if center has non-transparent pixels
    if has_alpha:
        center_has_content = False
        for x in range(center_area.width):
            for y in range(center_area.height):
                r, g, b, a = center_area.getpixel((x, y))
                if a > 0:  # Has some opacity
                    center_has_content = True
                    break
            if center_has_content:
                break
        
        if center_has_content:
            print(f"✅ Center 96x96 area has icon content")
        else:
            print(f"⚠️  Warning: Center 96x96 area appears empty")
    
    print(f"\n📋 Summary:")
    print(f"   - Size: {width}x{height} ✅")
    print(f"   - Format: {img.format} ✅")
    print(f"   - Transparency: {'Yes' if has_alpha else 'No'}")
    
    # Final check
    if width == 128 and height == 128 and img.format == 'PNG':
        print(f"\n✅ Icon meets basic Chrome Web Store requirements!")
        print(f"   Remember to test on both light and dark backgrounds.")
        return True
    else:
        print(f"\n❌ Icon does NOT meet requirements")
        return False

if __name__ == "__main__":
    icon_path = "extension/icons/icon128.png"
    
    if len(sys.argv) > 1:
        icon_path = sys.argv[1]
    
    success = verify_icon(icon_path)
    sys.exit(0 if success else 1)



