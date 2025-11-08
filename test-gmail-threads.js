// Quick test to see what Gmail API returns
const axios = require('axios');

async function testGmailThreads() {
  try {
    console.log('\n🧪 Testing Gmail Threads API...\n');
    
    // Get your auth token from localStorage in browser console:
    // localStorage.getItem('token')
    const token = process.env.TEST_TOKEN || 'YOUR_TOKEN_HERE';
    
    if (token === 'YOUR_TOKEN_HERE') {
      console.log('❌ Please set TEST_TOKEN environment variable');
      console.log('Get it from browser console: localStorage.getItem(\'token\')');
      return;
    }
    
    const baseURL = process.env.API_URL || 'http://localhost:3000/api';
    
    // Test with different maxResults values
    const tests = [
      { maxResults: 5, label: 'With maxResults=5' },
      { maxResults: 10, label: 'With maxResults=10' },
      { maxResults: 100, label: 'With maxResults=100' },
      { maxResults: undefined, label: 'Without maxResults (should default to 100)' }
    ];
    
    for (const test of tests) {
      console.log(`\n📧 Testing: ${test.label}`);
      console.log(`   URL: ${baseURL}/firebase-gmail/threads${test.maxResults ? `?maxResults=${test.maxResults}` : ''}`);
      
      try {
        const response = await axios.get(`${baseURL}/firebase-gmail/threads`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: test.maxResults ? { maxResults: test.maxResults } : {}
        });
        
        console.log(`   ✅ Response received:`);
        console.log(`      Threads count: ${response.data.threads?.length || 0}`);
        console.log(`      Result size estimate: ${response.data.resultSizeEstimate}`);
        console.log(`      Has next page: ${!!response.data.nextPageToken}`);
        
        if (response.data.threads && response.data.threads.length > 0) {
          console.log(`      First thread subject: ${response.data.threads[0].messages?.[0]?.payload?.headers?.find(h => h.name === 'Subject')?.value || 'N/A'}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`      Status: ${error.response.status}`);
          console.log(`      Data: ${JSON.stringify(error.response.data).substring(0, 200)}`);
        }
      }
    }
    
    console.log('\n✅ Test complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testGmailThreads();

