import fetch from 'node-fetch';

async function testAdminLogin() {
  try {
    console.log('Testing admin login endpoint...');
    
    const response = await fetch('http://localhost:3001/api/auth/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login: 'admin',
        password: 'admin123'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAdminLogin();
