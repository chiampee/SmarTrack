#!/usr/bin/env python3
"""
Convert SVG to PNG icons for Chrome extension
Requires: cairosvg (pip install cairosvg)
"""

import sys
from pathlib import Path

def convert_svg_to_png():
    """Convert icon.svg to all required PNG sizes"""
    
    try:
        import cairosvg
    except ImportError:
        print("❌ cairosvg not installed.")
        print("   Install with: pip install cairosvg")
        print("\n   Or use online tools:")
        print("   - https://cloudconvert.com/svg-to-png")
        print("   - https://convertio.co/svg-png/")
        return False
    
    icon_dir = Path(__file__).parent
    svg_path = icon_dir / "icon.svg"
    
    if not svg_path.exists():
        print(f"❌ SVG file not found: {svg_path}")
        return False
    
    sizes = [16, 32, 48, 128]
    
    print(f"🔄 Converting {svg_path} to PNG icons...\n")
    
    for size in sizes:
        output_path = icon_dir / f"icon{size}.png"
        try:
            cairosvg.svg2png(
                url=str(svg_path),
                write_to=str(output_path),
                output_width=size,
                output_height=size
            )
            print(f"✅ Created {output_path} ({size}x{size})")
        except Exception as e:
            print(f"❌ Failed to create {output_path}: {e}")
            return False
    
    print(f"\n✅ All icons created successfully!")
    return True

if __name__ == "__main__":
    success = convert_svg_to_png()
    sys.exit(0 if success else 1)
