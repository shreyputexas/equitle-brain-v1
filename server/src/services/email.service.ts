import nodemailer from 'nodemailer';
import logger from '../utils/logger';

// Create transporter function to ensure env vars are loaded
function createTransporter() {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
    },
  });
}

/**
 * Sends a notification email when a new signup request is received
 * @param userEmail - The email address of the user who signed up
 * @param timestamp - The timestamp when the signup occurred
 */
export async function sendSignupNotification(
  userEmail: string,
  timestamp: string
): Promise<void> {
  const notificationEmail = process.env.NOTIFICATION_EMAIL || 'contact@equitle.com';

  // Skip sending if SMTP credentials are not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Email notification skipped.', {
      userEmail,
      timestamp,
      smtpUserConfigured: !!process.env.SMTP_USER,
      smtpPassConfigured: !!process.env.SMTP_PASS,
    });
    return;
  }

  // Create transporter each time to ensure fresh config
  const transporter = createTransporter();
  if (!transporter) {
    logger.warn('Cannot create email transporter - SMTP credentials missing', {
      smtpUserConfigured: !!process.env.SMTP_USER,
      smtpPassConfigured: !!process.env.SMTP_PASS,
    });
    return;
  }

  logger.debug('Attempting to send signup notification email', {
    from: process.env.SMTP_USER,
    to: notificationEmail,
    userEmail,
  });

  const mailOptions = {
    from: process.env.SMTP_USER?.trim(),
    to: notificationEmail,
    subject: 'New Signup Request',
    html: `
      <h2>New Signup Request</h2>
      <p>A new user has requested credentials for Equitle.</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p>Please follow up with this user to provide access credentials.</p>
    `,
    text: `
      New Signup Request
      
      A new user has requested credentials for Equitle.
      
      Email: ${userEmail}
      Timestamp: ${timestamp}
      
      Please follow up with this user to provide access credentials.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info('Signup notification email sent successfully', {
      userEmail,
      messageId: info.messageId,
      to: notificationEmail,
      from: process.env.SMTP_USER,
    });
  } catch (error) {
    logger.error('Failed to send signup notification email', {
      userEmail,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      errorResponse: (error as any)?.response,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpUser: process.env.SMTP_USER,
    });
    // Don't throw - we don't want email failures to break the signup process
  }
}

