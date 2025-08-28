/**
 * SendGrid Email Utility for Cloudflare Workers
 * Handles magic link email sending with HTML template
 */

/**
 * Send magic link email via SendGrid
 * @param {string} email - Recipient email address
 * @param {string} magicLinkUrl - The complete magic link URL
 * @param {string} sendgridApiKey - SendGrid API key
 * @returns {Promise<boolean>} - Success status
 */
export async function sendMagicLinkEmail(email, magicLinkUrl, sendgridApiKey) {
  const currentYear = new Date().getFullYear();
  
  // HTML email template with your styling
  const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Login to TrySnowball</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f6f6;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 10px 0;
      font-size: 24px;
      font-weight: bold;
      color: #2B2E4A;
    }
    .content {
      font-size: 16px;
      line-height: 1.6;
      color: #333333;
    }
    .button {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 20px;
      background-color: #4CAF50;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #888888;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      TrySnowball Login
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Click the button below to securely log in to your TrySnowball account.</p>
      <p>
        <a href="${magicLinkUrl}" class="button">Log In</a>
      </p>
      <p>This magic link is valid for 15 minutes and can be used only once.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
    <div class="footer">
      © ${currentYear} TrySnowball. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  // Plain text fallback
  const textContent = `
TrySnowball Login

Hello,

Click the link below to securely log in to your TrySnowball account:

${magicLinkUrl}

This magic link is valid for 15 minutes and can be used only once.

If you didn't request this email, you can safely ignore it.

© ${currentYear} TrySnowball. All rights reserved.
  `.trim();

  // SendGrid email payload
  const emailData = {
    personalizations: [{
      to: [{ email: email }],
      subject: "Your TrySnowball Login Link"
    }],
    from: { 
      email: "noreply@trysnowball.co.uk", 
      name: "TrySnowball" 
    },
    content: [
      {
        type: "text/plain",
        value: textContent
      },
      {
        type: "text/html",
        value: htmlTemplate
      }
    ]
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`SendGrid error: ${response.status} ${errorText}`);
    }

    console.log('Magic link email sent successfully to:', email);
    return true;

  } catch (error) {
    console.error('Failed to send magic link email:', error);
    throw error;
  }
}

/**
 * Send a generic email via SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.from - Sender email (optional, defaults to noreply@trysnowball.co.uk)
 * @param {string} sendgridApiKey - SendGrid API key
 * @returns {Promise<boolean>} - Success status
 */
export async function sendEmail(options, sendgridApiKey) {
  const {
    to,
    subject,
    html,
    text = null,
    from = { email: "noreply@trysnowball.co.uk", name: "TrySnowball" }
  } = options;

  const content = [];
  
  if (text) {
    content.push({
      type: "text/plain",
      value: text
    });
  }
  
  content.push({
    type: "text/html",
    value: html
  });

  const emailData = {
    personalizations: [{
      to: [typeof to === 'string' ? { email: to } : to],
      subject: subject
    }],
    from: typeof from === 'string' ? { email: from } : from,
    content: content
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('SendGrid API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`SendGrid error: ${response.status} ${errorText}`);
    }

    console.log('Email sent successfully to:', typeof to === 'string' ? to : to.email);
    return true;

  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create magic link URL with token
 * @param {string} baseUrl - Base URL of your app
 * @param {string} token - Magic link token
 * @returns {string} - Complete magic link URL
 */
export function createMagicLinkUrl(baseUrl, token) {
  const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  return `${cleanBaseUrl}/auth/verify?token=${token}`;
}