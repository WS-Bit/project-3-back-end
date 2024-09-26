import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { ResponseError } from '@sendgrid/helpers/classes';

interface EmailOptions {
  to: string;
  subject: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, string>;
  text?: string;
  html?: string;
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

export default sendEmail;