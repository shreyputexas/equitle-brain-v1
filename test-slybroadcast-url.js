// Test Slybroadcast with URL approach
const fs = require('fs');

// Use the same file but serve it via URL
const baseUrl = 'https://unaborted-cranioscopical-mauricio.ngrok-free.dev';
const mp3Url = `${baseUrl}/uploads/campaigns/campaign_1760566878049_cfdqdda7u/campaign_1760566878049_cfdqdda7u_Aarav_Kansupada_1760566880187.mp3`;

// Required date parameter (immediate delivery)
const now = new Date();
const easternTime = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}).formatToParts(now);

const dateStr = `${easternTime.find(p => p.type === 'month')?.value}/${easternTime.find(p => p.type === 'day')?.value}/${easternTime.find(p => p.type === 'year')?.value} ${easternTime.find(p => p.type === 'hour')?.value}:${easternTime.find(p => p.type === 'minute')?.value}`;

// Create URL-encoded form data
const formParams = new URLSearchParams();
formParams.append('c_uid', 'equitlefinancial@gmail.com');
formParams.append('c_password', 'ObaidObeyed25!');
formParams.append('c_phone', '8322358750');
formParams.append('c_date', dateStr);
formParams.append('c_url', mp3Url);
formParams.append('c_audio', 'MP3');
formParams.append('c_callerID', '5551234567');

console.log('Testing Slybroadcast API with URL approach...');
console.log('Date:', dateStr);
console.log('Phone:', '8322358750');
console.log('MP3 URL:', mp3Url);

// Send request to Slybroadcast
fetch('https://www.mobile-sphere.com/gateway/vmb.php', {
  method: 'POST',
  body: formParams.toString(),
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Equitle-VoicemailService/1.0'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.text();
})
.then(responseText => {
  console.log('Response text:', responseText);
})
.catch(error => {
  console.error('Error:', error);
});