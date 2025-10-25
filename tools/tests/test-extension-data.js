// Test script to check extension data and dashboard functionality
console.log('🧪 Testing Extension Data and Dashboard Functionality');

// Test 1: Check if extension data is properly structured
async function testExtensionData() {
  console.log('\n📊 Test 1: Extension Data Structure');
  
  try {
    // Check chrome.storage.local for links
    const result = await new Promise((resolve) => {
      chrome.storage.local.get(['links'], resolve);
    });
    
    const links = result.links || [];
    console.log(`Found ${links.length} links in extension storage`);
    
    if (links.length > 0) {
      const firstLink = links[0];
      console.log('First link structure:', firstLink);
      console.log('Title:', firstLink.metadata?.title || firstLink.title || 'No title');
      console.log('Labels:', firstLink.labels || 'No labels');
      console.log('Status:', firstLink.status || 'No status');
      console.log('Created:', firstLink.createdAt || 'No date');
    }
  } catch (error) {
    console.error('Error testing extension data:', error);
  }
}

// Test 2: Check dashboard communication
async function testDashboardCommunication() {
  console.log('\n🌐 Test 2: Dashboard Communication');
  
  try {
    // Try to send a test message to the dashboard
    const response = await new Promise((resolve) => {
      window.postMessage({
        type: 'SRT_GET_LINKS',
        messageId: 'test-' + Date.now()
      }, '*');
      
      const handleResponse = (event) => {
        if (event.data && event.data.type === 'SRT_LINKS_RESPONSE') {
          window.removeEventListener('message', handleResponse);
          resolve(event.data);
        }
      };
      
      window.addEventListener('message', handleResponse);
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', handleResponse);
        resolve({ error: 'Timeout' });
      }, 2000);
    });
    
    if (response.error) {
      console.log('Dashboard communication failed:', response.error);
    } else {
      console.log('Dashboard communication successful');
      console.log('Links from dashboard:', response.links?.length || 0);
    }
  } catch (error) {
    console.error('Error testing dashboard communication:', error);
  }
}

// Test 3: Check link service functionality
async function testLinkService() {
  console.log('\n🔧 Test 3: Link Service Functionality');
  
  try {
    // This would test the local database service
    console.log('Link service test - would need to be run in dashboard context');
  } catch (error) {
    console.error('Error testing link service:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Extension and Dashboard Tests...\n');
  
  await testExtensionData();
  await testDashboardCommunication();
  await testLinkService();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this script is executed
if (typeof window !== 'undefined') {
  runAllTests();
} else {
  console.log('This script should be run in a browser context');
}

