#!/usr/bin/env node

/**
 * Test script to demonstrate the USSD flow
 * This simulates the Africa's Talking USSD requests
 * Run with: node test-ussd-flow.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
const SESSION_ID = 'test-session-' + Date.now();

console.log('🧪 Testing USSD Flow for Split-Bill Platform\n');
console.log(`Session ID: ${SESSION_ID}\n`);

// Simulate USSD flow steps
async function testUSSDFlow() {
  try {
    // Step 1: Initial USSD request (no text)
    console.log('📱 Step 1: Initial USSD request');
    const step1Response = await sendUSSDRequest(SESSION_ID, '');
    console.log('Response:', step1Response.data);
    console.log('Status:', step1Response.data.status);
    console.log('Message:', step1Response.data.message);
    console.log('');

    // Step 2: Enter bill amount
    console.log('💰 Step 2: Enter bill amount (50000)');
    const step2Response = await sendUSSDRequest(SESSION_ID, '50000');
    console.log('Response:', step2Response.data);
    console.log('Status:', step2Response.data.status);
    console.log('Message:', step2Response.data.message);
    console.log('');

    // Step 3: Enter member phone numbers
    console.log('📞 Step 3: Enter member phone numbers');
    const step3Response = await sendUSSDRequest(SESSION_ID, '+255712345678,+255698765432');
    console.log('Response:', step3Response.data);
    console.log('Status:', step3Response.data.status);
    console.log('Message:', step3Response.data.message);
    console.log('');

    // Step 4: Confirm bill creation
    console.log('✅ Step 4: Confirm bill creation (1)');
    const step4Response = await sendUSSDRequest(SESSION_ID, '1');
    console.log('Response:', step4Response.data);
    console.log('Status:', step4Response.data.status);
    console.log('Message:', step4Response.data.message);
    console.log('');

    console.log('🎉 USSD Flow Test Completed!');
    
    if (step4Response.data.status === 'END') {
      console.log('✅ Bill created successfully!');
    } else {
      console.log('❌ Unexpected response status');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

async function sendUSSDRequest(sessionId, text) {
  return axios.post(`${BASE_URL}/ussd`, {
    sessionId,
    serviceCode: '*123#',
    phoneNumber: '+255700000000',
    text
  });
}

// Check if server is running
async function checkServerHealth() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running');
    console.log('Health:', response.data);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   npm run dev');
    console.log('');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerHealth();
  if (serverRunning) {
    await testUSSDFlow();
  }
}

main().catch(console.error);
