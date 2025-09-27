// Test script to verify user authentication-based filtering
const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testAuthFiltering() {
  console.log('Testing authentication-based filtering...\n');

  // Test 1: Call category list without authentication (should exclude hidden items)
  try {
    console.log('1. Testing /api/category/list without authentication:');
    const response1 = await axios.get(`${BASE_URL}/api/category/list`);
    console.log('Response:', JSON.stringify(response1.data, null, 2));
    console.log('---');
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 2: Call nav list without authentication (should exclude hidden items)
  try {
    console.log('2. Testing /api/nav/list without authentication:');
    const response2 = await axios.get(`${BASE_URL}/api/nav/list`);
    console.log('Response:', JSON.stringify(response2.data, null, 2));
    console.log('---');
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 3: Call with explicit hide=true without authentication (should still exclude hidden items)
  try {
    console.log('3. Testing /api/category/list?hide=false without authentication:');
    const response3 = await axios.get(`${BASE_URL}/api/category/list?hide=false`);
    console.log('Response:', JSON.stringify(response3.data, null, 2));
    console.log('---');
  } catch (error) {
    console.log('Error:', error.message);
  }

  // Test 4: Call nav info without authentication (should exclude hidden items)
  try {
    console.log('4. Testing /api/nav/find without authentication:');
    const response4 = await axios.get(`${BASE_URL}/api/nav/find`);
    console.log('Response:', JSON.stringify(response4.data, null, 2));
    console.log('---');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAuthFiltering();