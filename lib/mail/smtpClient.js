import nodemailer from 'nodemailer';

let cachedTransporter = null;

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Configuración SMTP incompleta. Verifica SMTP_HOST, SMTP_USER y SMTP_PASS.');
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  };
}

export function getSmtpTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const config = getSmtpConfig();
  cachedTransporter = nodemailer.createTransport(config);
  return cachedTransporter;
}

export async function sendSmtpMail({ to, subject, text, html, fromName, replyTo }) {
  const transporter = getSmtpTransporter();

  const toList = Array.isArray(to) ? to.filter(Boolean) : [to];
  if (!toList.length) {
    throw new Error('Debe proporcionar al menos un destinatario para el correo.');
  }

  const fromAddress = process.env.SMTP_USER;
  const mailOptions = {
    from: fromName ? `"${fromName}" <${fromAddress}>` : fromAddress,
    to: toList.join(','),
    subject,
    text,
    html,
    replyTo,
  };

  return transporter.sendMail(mailOptions);
}

export async function verifySmtpConnection() {
  const transporter = getSmtpTransporter();
  await transporter.verify();
  return transporter;
}
