# Extension Icons

This folder should contain the following PNG files:
- icon16.png (16x16 pixels)
- icon32.png (32x32 pixels)
- icon48.png (48x48 pixels)
- icon128.png (128x128 pixels)

## Creating PNG files from SVG

If you have ImageMagick installed:
```bash
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 32x32 icon32.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

Or use online tools:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

Or use the logo.png from public folder as reference for the design.

