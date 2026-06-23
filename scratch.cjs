const fs = require('fs');
require('dotenv').config();

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + (process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY),
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'Pistis <noreply@thepistisplaceglobal.org>',
    to: 'pistisglobal@gmail.com',
    subject: 'test',
    html: '<p>Hi</p>'
  })
}).then(r => r.json()).then(console.log);
