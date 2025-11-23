# SmarTrack Image Extraction Testing Guide

## Test Results Summary

✅ **Logic Test**: PASSED
- Image extraction logic correctly extracts og:image and twitter:image meta tags
- URL conversion works correctly for absolute, relative, and protocol-relative URLs
- Fallback to page images works when meta tags are missing

## How to Test the Extension

### 1. Test with Test HTML Page

1. Open `test_image_extraction.html` in Chrome
2. Click the SmarTrack extension icon
3. **Expected Result**: 
   - Thumbnail should show the Unsplash image (1200x630)
   - Console should show: `[SRT] ✅ Extracted image URL: https://images.unsplash.com/...`

### 2. Test with Real Website (CNBC)

1. Navigate to: https://www.cnbc.com/2025/11/16/make-the-most-of-health-care-expenses-before-end-of-year.html
2. Click the SmarTrack extension icon
3. **Expected Result**:
   - Thumbnail should display the article's featured image
   - Check browser console for extraction logs

### 3. Debug Checklist

If images are not showing, check the browser console (F12) for:

#### In Popup Console:
- `[SRT] Page data before populateUI:` - Should show `image` property
- `[SRT] populateUI - pageData.image:` - Should show the image URL
- `[SRT] Setting thumbnail image:` - Should show the final image URL
- `[SRT] Thumbnail image loaded successfully` - Confirms image loaded

#### In Page Console (F12 on the webpage):
- `[SRT] Extracted image from page:` - Shows if image was found
- `[SRT] No image found on page` - Indicates no image found

### 4. Common Issues & Solutions

#### Issue: No image extracted
**Symptoms**: Console shows `[SRT] ❌ No image found in page data`
**Possible Causes**:
- Page has no og:image or twitter:image meta tags
- Page has no large images (200x200+)
- Script injection failed (check for errors)

**Solution**: Check page source for meta tags, verify script can access page

#### Issue: Image extracted but not displaying
**Symptoms**: Console shows image URL but thumbnail is blank
**Possible Causes**:
- CORS blocking image load
- Invalid image URL
- Thumbnail element not found

**Solution**: 
- Check `img.onerror` in console
- Verify image URL is accessible
- Check if thumbnail element exists: `document.getElementById('thumbnail')`

#### Issue: Thumbnail element not found
**Symptoms**: Console shows `[SRT] Thumbnail element not found!`
**Solution**: Verify `popup.html` has `<div id="thumbnail" class="preview-thumbnail"></div>`

## Code Flow Verification

1. **extractPageMetadata()** is called in `init()`
2. **chrome.scripting.executeScript()** injects `extractMetadataFromPage()` into the page
3. **extractMetadataFromPage()** runs in page context and extracts:
   - og:image or twitter:image meta tags (first priority)
   - Or finds largest image on page (fallback)
4. Result is stored in `this.pageData.image`
5. **populateUI()** is called
6. **populateUI()** creates `<img>` element and sets `src` to image URL
7. Image loads and `has-image` class is added to show thumbnail

## Test Files Created

- `test_image_extraction.html` - Test page with og:image meta tag
- `test_extraction_logic.js` - Standalone logic test (✅ PASSED)

## Next Steps if Still Not Working

1. Check browser console for any errors
2. Verify the extension is reloaded after code changes
3. Test with the test HTML page first (simpler case)
4. Check if image URLs are being blocked by CORS
5. Verify thumbnail element CSS is correct (should show when `has-image` class is present)

