const transports = [];

function createTransport(options = {}) {
  return {
    options,
    async sendMail(mailOptions) {
      const messageId = `mock-${transports.length + 1}`;
      const info = {
        messageId,
        envelope: {
          from: mailOptions.from,
          to: Array.isArray(mailOptions.to) ? mailOptions.to : String(mailOptions.to).split(',').map(item => item.trim()).filter(Boolean),
        },
        response: '250 Mock OK',
        message: Buffer.from(JSON.stringify({ options: mailOptions })),
      };
      transports.push({ options, mailOptions, info });
      return info;
    },
  };
}

export default {
  createTransport,
};

export { createTransport };
