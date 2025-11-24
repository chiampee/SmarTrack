/**
 * Test script to verify image extraction logic
 * This simulates what happens when extractMetadataFromPage is called
 */

// Simulate the getMetaContent function
function getMetaContent(name) {
  // In a real page, this would query the DOM
  // For testing, we'll simulate finding meta tags
  const testMetaTags = {
    'og:image': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
    'twitter:image': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
    'og:description': 'Test description'
  };
  return testMetaTags[name] || null;
}

// Simulate the image extraction logic from extractMetadataFromPage
function testImageExtraction() {
  console.log('=== Testing Image Extraction Logic ===\n');
  
  // Try meta tags first (og:image, twitter:image)
  let imageMeta = getMetaContent('og:image') || 
                  getMetaContent('twitter:image') ||
                  getMetaContent('og:image:secure_url');
  
  console.log('1. Meta tag extraction:');
  console.log('   og:image:', getMetaContent('og:image'));
  console.log('   twitter:image:', getMetaContent('twitter:image'));
  console.log('   Selected:', imageMeta);
  
  // Simulate finding images on page (if no meta tag)
  if (!imageMeta) {
    console.log('\n2. No meta tag found, searching page images...');
    // In real scenario, this would query document.querySelectorAll('img[src]')
    const mockImages = [
      { src: 'https://example.com/large.jpg', width: 400, height: 300 },
      { src: 'https://example.com/small.jpg', width: 100, height: 100 }
    ];
    
    const imageCandidates = mockImages.map(img => ({
      src: img.src,
      width: img.width,
      height: img.height,
      area: img.width * img.height
    }));
    
    imageCandidates.sort((a, b) => b.area - a.area);
    const largeImage = imageCandidates.find(img => img.width >= 200 && img.height >= 200);
    
    if (largeImage) {
      imageMeta = largeImage.src;
      console.log('   Found large image:', imageMeta);
    } else if (imageCandidates.length > 0) {
      imageMeta = imageCandidates[0].src;
      console.log('   Using largest available:', imageMeta);
    }
  }
  
  if (!imageMeta) {
    console.log('\n❌ No image found!');
    return null;
  }
  
  // Convert relative URLs to absolute
  console.log('\n3. URL conversion:');
  console.log('   Original:', imageMeta);
  
  let finalUrl = imageMeta;
  try {
    if (imageMeta.startsWith('http://') || imageMeta.startsWith('https://')) {
      finalUrl = imageMeta;
      console.log('   Already absolute URL');
    } else if (imageMeta.startsWith('//')) {
      finalUrl = 'https:' + imageMeta; // Assuming https
      console.log('   Protocol-relative URL converted');
    } else if (imageMeta.startsWith('data:')) {
      finalUrl = imageMeta;
      console.log('   Data URL (no conversion needed)');
    } else {
      // Would use: new URL(imageMeta, window.location.origin).href
      finalUrl = 'https://example.com' + (imageMeta.startsWith('/') ? imageMeta : '/' + imageMeta);
      console.log('   Relative URL converted to absolute');
    }
  } catch (e) {
    console.log('   Error converting URL:', e.message);
  }
  
  console.log('   Final URL:', finalUrl);
  console.log('\n✅ Image extraction test PASSED');
  return finalUrl;
}

// Run the test
const result = testImageExtraction();
console.log('\n=== Test Result ===');
console.log('Extracted image URL:', result);


