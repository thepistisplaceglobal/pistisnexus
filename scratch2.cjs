require('dotenv').config();
console.log('Key length:', process.env.RESEND_API_KEY.length);
console.log('Key exact:', `"${process.env.RESEND_API_KEY}"`);
