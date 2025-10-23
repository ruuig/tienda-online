class ContactConfigurationError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ContactConfigurationError';
    this.status = status;
  }
}

let cachedMailer = null;

async function resolveMailer(customMailer, env = process.env) {
  if (customMailer) {
    return customMailer;
  }

  if (env.SMTP_TEST_MODULE_PATH) {
    const module = await import(env.SMTP_TEST_MODULE_PATH);
    return module.default || module;
  }

  if (!cachedMailer) {
    const module = await import('nodemailer');
    cachedMailer = module.default || module;
  }

  return cachedMailer;
}

export function parseRecipients(rawRecipients) {
  if (!rawRecipients) {
    return [];
  }

  if (Array.isArray(rawRecipients)) {
    return rawRecipients.map(String).map(recipient => recipient.trim()).filter(Boolean);
  }

  return String(rawRecipients)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

export async function buildTransporter(env = process.env, mailer) {
  const isTestMode = env.SMTP_TEST_MODE === 'true';

  if (!isTestMode && (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS)) {
    throw new ContactConfigurationError('SMTP_HOST, SMTP_USER o SMTP_PASS no configurados');
  }

  const resolvedMailer = await resolveMailer(mailer, env);

  if (isTestMode) {
    return resolvedMailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  const transportOptions = {
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT || 587),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  };

  if (env.SMTP_IGNORE_TLS === 'true') {
    transportOptions.tls = { rejectUnauthorized: false };
  }

  return resolvedMailer.createTransport(transportOptions);
}

export function buildMailOptions({ name, email, subject, message }, env, toList) {
  const sender = env.SMTP_FROM || `"${name}" <${env.SMTP_USER}>`;

  const textBody = `
Nombre: ${name}
Correo: ${email}
Asunto: ${subject}

Mensaje:
${message}
  `;

  return {
    from: sender,
    to: toList.join(','),
    subject: `[Soporte] ${subject}`,
    replyTo: `${name} <${email}>`,
    text: textBody,
  };
}

export async function sendContactEmail(payload, env = process.env, mailer) {
  const { name, email, subject, message } = payload;
  if (!name || !email || !subject || !message) {
    throw new ContactConfigurationError('Payload incompleto', 400);
  }

  const toList = parseRecipients(env.CONTACT_TO);
  if (!toList.length) {
    throw new ContactConfigurationError('CONTACT_TO no configurado');
  }

  const transporter = await buildTransporter(env, mailer);
  const mailOptions = buildMailOptions({ name, email, subject, message }, env, toList);

  const info = await transporter.sendMail(mailOptions);

  return { info, mailOptions, toList };
}

export { ContactConfigurationError };
