/**
 * Test script to verify Apollo search and enrichment returns email and phone numbers
 * Run with: npx ts-node server/test-apollo-enrichment.ts
 */

import { ApolloService } from './src/services/apollo.service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testApolloEnrichment() {
  console.log('🧪 Testing Apollo Search and Enrichment\n');
  console.log('=' .repeat(60));

  // Get API key from environment or prompt
  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ APOLLO_API_KEY not found in environment variables');
    console.log('Please set APOLLO_API_KEY in your .env file or export it');
    process.exit(1);
  }

  console.log('✅ Apollo API Key found\n');

  const apolloService = new ApolloService(apiKey);
  
  // Get webhook URL
  const webhookUrl = process.env.BACKEND_URL || 
                   process.env.BASE_URL || 
                   `http://localhost:${process.env.PORT || 4001}`;
  const cleanWebhookUrl = webhookUrl.replace(/\/$/, '');
  const fullWebhookUrl = `${cleanWebhookUrl}/api/apollo/webhook/phone-numbers`;
  
  console.log('📡 Webhook URL for phone numbers:', fullWebhookUrl);
  console.log('⚠️  NOTE: For webhook to work, this URL must be publicly accessible');
  console.log('   In production, set BACKEND_URL or BASE_URL environment variable\n');

  // Test 1: Search for people
  console.log('📋 TEST 1: Search for people (CEO at tech companies)');
  console.log('-'.repeat(60));
  
  try {
    const searchParams: any = {
      person_titles: ['CEO', 'Chief Executive Officer'],
      q_keywords: 'technology',
      organization_locations: ['San Francisco, CA'],
      per_page: 3,
      page: 1,
      reveal_personal_emails: true
      // NOTE: reveal_phone_number requires webhook_url - testing without it
    };

    console.log('Search params:', JSON.stringify(searchParams, null, 2));
    console.log('\n🔍 Calling Apollo search API...\n');

    const searchResponse = await apolloService.searchPeople(searchParams);
    
    console.log(`✅ Search returned ${searchResponse.people.length} results\n`);

    if (searchResponse.people.length === 0) {
      console.log('⚠️  No results found. Trying a broader search...\n');
      
      // Try broader search
      const broaderSearch = await apolloService.searchPeople({
        person_titles: ['CEO'],
        per_page: 3,
        reveal_personal_emails: true,
        reveal_phone_number: true
      } as any);

      if (broaderSearch.people.length === 0) {
        console.log('❌ No results found even with broader search');
        return;
      }

      searchResponse.people = broaderSearch.people;
    }

    // Analyze search results
    for (let i = 0; i < searchResponse.people.length; i++) {
      const person = searchResponse.people[i];
      console.log(`\n📊 Person ${i + 1}: ${person.name || `${person.first_name} ${person.last_name}`}`);
      console.log('  From SEARCH API:');
      console.log(`    - Email: ${person.email || 'NONE'} ${person.email === 'email_not_unlocked' ? '(LOCKED)' : ''}`);
      console.log(`    - Phone: ${person.phone_numbers?.[0]?.sanitized_number || 'NONE'}`);
      console.log(`    - Phone Numbers Array: ${JSON.stringify(person.phone_numbers || [])}`);
      console.log(`    - Title: ${person.title || 'NONE'}`);
      console.log(`    - Company: ${person.organization?.name || 'NONE'}`);
      console.log(`    - Domain: ${person.organization?.primary_domain || person.organization?.website_url || 'NONE'}`);
      console.log(`    - LinkedIn: ${person.linkedin_url || 'NONE'}`);
      console.log(`    - Apollo ID: ${person.id || 'NONE'}`);

      // Test 2: Enrich the person
      console.log(`\n  🔄 TEST 2: Enriching person ${i + 1}...`);
      
      try {
        const domain = person.organization?.primary_domain || 
                      (person.organization?.website_url ? 
                        new URL(person.organization.website_url).hostname : 
                        undefined);

        console.log(`    Using domain: ${domain || 'NONE'}`);

        // Try enrichment with ID first - test WITHOUT reveal_phone_number first
        let enriched: any = null;
        if (person.id) {
          console.log('    📞 Step 1: Trying enrichment with Apollo ID (without reveal_phone_number)...');
          // Temporarily modify enrichPersonData to not use reveal_phone_number
          const testResult = await apolloService.enrichPerson({
            first_name: person.first_name,
            last_name: person.last_name,
            organization_name: person.organization?.name,
            domain: domain
          });
          enriched = testResult;

          if (enriched) {
            console.log('    ✅ Enrichment with ID SUCCESSFUL');
          } else {
            console.log('    ❌ Enrichment with ID returned null');
          }
        }

        // Fallback to name-based enrichment
        if (!enriched) {
          console.log('    📞 Step 2: Trying name-based enrichment...');
          enriched = await apolloService.enrichPerson({
            first_name: person.first_name,
            last_name: person.last_name,
            organization_name: person.organization?.name,
            domain: domain
          });

          if (enriched) {
            console.log('    ✅ Name-based enrichment SUCCESSFUL');
          } else {
            console.log('    ❌ Name-based enrichment returned null');
          }
        }

        if (enriched) {
          console.log('\n  📊 ENRICHMENT RESULTS:');
          console.log(`    - Email: ${enriched.email || 'NONE'} ${enriched.email === 'email_not_unlocked' ? '(LOCKED)' : ''}`);
          console.log(`    - Phone Count: ${enriched.phone_numbers?.length || 0}`);
          console.log(`    - Phone Numbers: ${JSON.stringify(enriched.phone_numbers || [])}`);
          console.log(`    - Best Phone: ${enriched.phone_numbers?.[0]?.sanitized_number || 'NONE'}`);
          console.log(`    - Title: ${enriched.title || 'NONE'}`);
          console.log(`    - LinkedIn: ${enriched.linkedin_url || 'NONE'}`);
          console.log(`    - Company: ${enriched.organization?.name || 'NONE'}`);
          console.log(`    - Domain: ${enriched.organization?.primary_domain || 'NONE'}`);

          // Try Email Finder if email is locked
          if (!enriched.email || enriched.email === 'email_not_unlocked') {
            console.log('\n    📧 Step 3: Trying Email Finder API...');
            const emailResult = await apolloService.findEmail({
              first_name: person.first_name,
              last_name: person.last_name,
              organization_name: person.organization?.name,
              domain: domain
            });

            if (emailResult?.email) {
              console.log(`    ✅ Email Finder found: ${emailResult.email} (confidence: ${emailResult.confidence || 'N/A'})`);
            } else {
              console.log('    ❌ Email Finder returned no email');
            }
          }
        } else {
          console.log('    ❌ All enrichment attempts failed');
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.log(`    ❌ Enrichment error: ${error.message}`);
        if (error.response) {
          console.log(`    Status: ${error.response.status}`);
          console.log(`    Data: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const totalResults = searchResponse.people.length;
    const withEmail = searchResponse.people.filter(p => p.email && p.email !== 'email_not_unlocked').length;
    const withPhone = searchResponse.people.filter(p => p.phone_numbers && p.phone_numbers.length > 0).length;
    
    console.log(`Total results: ${totalResults}`);
    console.log(`With email (from search): ${withEmail}/${totalResults} (${Math.round((withEmail/totalResults)*100)}%)`);
    console.log(`With phone (from search): ${withPhone}/${totalResults} (${Math.round((withPhone/totalResults)*100)}%)`);
    console.log('\n✅ Test completed!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testApolloEnrichment().catch(console.error);

