import mailgun from 'mailgun-js';
import config from '@config';

export interface MailgunParams {
  to: string;
  subject: string;
  text: string;
  from: string;
}

const mg = mailgun({
  apiKey: config.mailgun.api_key,
  domain: config.mailgun.domain
});

export const sendEmail = async (data: MailgunParams): Promise<void> => {
  try {
    await mg.messages().send(data);
  } catch (error) {
    console.error(error);
    throw new Error('Error sending email');
  }
};
