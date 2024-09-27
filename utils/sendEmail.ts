import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { ResponseError } from '@sendgrid/helpers/classes';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, string>;
  text?: string;
  html?: string;
}

interface ConfirmationEmailOptions {
  to: string;
  confirmationToken: string;
  username: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not set in the environment variables');
  }

  sgMail.setApiKey(apiKey);

  let msg: MailDataRequired;

  if (options.templateId) {
    msg = {
      to: options.to,
      from: process.env.FROM_EMAIL || 'default@example.com',
      subject: options.subject,
      templateId: options.templateId,
      dynamicTemplateData: options.dynamicTemplateData
    };
  } else {
    msg = {
      to: options.to,
      from: process.env.FROM_EMAIL || 'default@example.com',
      subject: options.subject,
      content: [
        { type: 'text/plain', value: options.text || '' },
        ...(options.html ? [{ type: 'text/html', value: options.html }] : [])
      ]
    };
  }

  try {
    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Detailed SendGrid Error:', JSON.stringify(error, null, 2));
    if (error instanceof ResponseError) {
      console.error('SendGrid Error Body:', error.response?.body);
    }
    throw new Error(`Email could not be sent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const sendConfirmationEmail = async (options: ConfirmationEmailOptions): Promise<void> => {
  const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-email/${options.confirmationToken}`;

  const emailOptions: EmailOptions = {
    to: options.to,
    subject: 'Confirm Your Email',
    templateId: process.env.SENDGRID_CONFIRMATION_TEMPLATE_ID,
    dynamicTemplateData: {
      confirmationUrl: confirmationUrl,
      username: options.username,
    },
  };

  if (!emailOptions.templateId) {
    throw new Error('SENDGRID_CONFIRMATION_TEMPLATE_ID is not set in the environment variables');
  }

  await sendEmail(emailOptions);
};

export default sendEmail;