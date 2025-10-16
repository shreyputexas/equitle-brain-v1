const fs = require('fs');

// Read the audio file as base64
const audioFilePath = '/Users/shreyp/Documents/Equitle/newShit/uploads/campaigns/campaign_1760566878049_cfdqdda7u/campaign_1760566878049_cfdqdda7u_Aarav_Kansupada_1760566880187.mp3';
const audioBuffer = fs.readFileSync(audioFilePath);
const audioBase64 = audioBuffer.toString('base64');

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
formParams.append('c_record_audio', audioBase64);

console.log('Testing Slybroadcast API with URL-encoded form data...');
console.log('Date:', dateStr);
console.log('Phone:', '8322358750');
console.log('Audio size:', audioBuffer.length, 'bytes');
console.log('Base64 length:', audioBase64.length);

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