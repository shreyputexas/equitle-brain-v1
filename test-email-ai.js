// Test script for OpenAI email analysis
// Run this with: node test-email-ai.js

const testEmails = [
  {
    subject: "Series A Funding Opportunity - TechCorp",
    content: "Hi, I'm reaching out about a Series A funding opportunity for TechCorp. We're looking to raise $5M and are in the due diligence phase. The company has shown strong growth and we believe it would be a great fit for your portfolio.",
    sender: "john@techcorp.com"
  },
  {
    subject: "LP Capital Call Notice",
    content: "Dear Limited Partner, this is to notify you of an upcoming capital call for Fund II. We need to call $2M of your committed capital by the end of the month for a new investment opportunity.",
    sender: "investor.relations@equitle.com"
  },
  {
    subject: "Introduction to Promising Startup",
    content: "I wanted to introduce you to a promising fintech startup that's looking for Series B funding. They've shown excellent traction and I believe they'd be a great fit for your investment criteria. Would you be interested in learning more?",
    sender: "broker@placementagent.com"
  },
  {
    subject: "Term Sheet Discussion",
    content: "Following our due diligence, we'd like to discuss the term sheet for the acquisition of HealthTech Solutions. The valuation is set at $15M with a 6-month closing timeline.",
    sender: "legal@acquisition.com"
  }
];

async function testEmailAnalysis() {
  console.log('🧪 Testing OpenAI Email Analysis...\n');
  
  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    console.log(`📧 Test Email ${i + 1}:`);
    console.log(`Subject: ${email.subject}`);
    console.log(`From: ${email.sender}`);
    console.log(`Content: ${email.content.substring(0, 100)}...`);
    console.log('---');
    
    try {
      const response = await fetch('http://localhost:4001/api/email-processing/test-ai-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(email)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ AI Analysis Result:');
        console.log(`Category: ${result.data.analysis.category}`);
        console.log(`Sub-category: ${result.data.analysis.subCategory}`);
        console.log(`Confidence: ${(result.data.analysis.confidence * 100).toFixed(1)}%`);
        console.log(`Sentiment: ${result.data.analysis.extractedData.sentiment}`);
        if (result.data.analysis.extractedData.companyName) {
          console.log(`Company: ${result.data.analysis.extractedData.companyName}`);
        }
        if (result.data.analysis.extractedData.dealValue) {
          console.log(`Deal Value: $${result.data.analysis.extractedData.dealValue}M`);
        }
      } else {
        console.log('❌ Error:', result.error);
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  }
}

// Instructions
console.log('🚀 OpenAI Email Analysis Test');
console.log('============================');
console.log('');
console.log('Before running this test:');
console.log('1. Make sure your server is running: npm run dev:server');
console.log('2. Add your OpenAI API key to the .env file: OPENAI_API_KEY=your-key-here');
console.log('');
console.log('Starting test in 3 seconds...\n');

setTimeout(testEmailAnalysis, 3000);
