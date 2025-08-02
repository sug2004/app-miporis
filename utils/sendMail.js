import nodemailer from 'nodemailer';

export default function sendMailTo(email, pin, CData, password) {
    return new Promise((resolve, reject) => {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.MAIL_HOST,
                port: process.env.MAIL_PORT,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: {
                    ciphers: 'SSLv3'
                }
            });

            const logoUrl = `https://app.miporis.com/miporis.webp`;

            let mailOptions;
            if (pin && email) {
                mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Password Reset PIN',
                    html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${logoUrl}" alt="Miporis Logo" style="max-width: 150px;">
                        </div>
                        <h2 style="color: #0066cc; text-align: center;">Password Reset Request</h2>
                        <p>Hi,</p>
                        <p>You requested to reset your password. Use the PIN below to reset it:</p>
                        <div style="text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; color: #444; background: #f9f9f9; padding: 10px; border-radius: 8px;">
                            ${pin}
                        </div>
                        <p>The PIN is valid for <strong>15 minutes</strong>.</p>
                        <p>If you did not request a password reset, please ignore this email.</p>
                        <p style="text-align: center; margin-top: 30px;">Best regards,<br/><strong>Miporis Team</strong></p>
                    </div>
                    `,
                };
            } else if (password && email) {
                mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Your credentials for Miporis',
                    html: `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 40px auto; padding: 24px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 10px; color: #333;">
  <div style="text-align: center; margin-bottom: 24px;">
    <img src="${logoUrl}" alt="Miporis Logo" style="max-width: 160px;">
  </div>
  <h2 style="color: #004aad; text-align: center; margin-bottom: 16px;">Your Miporis Login Credentials</h2>

  <p style="font-size: 16px;">Dear User,</p>

  <p style="font-size: 16px; margin: 12px 0;">
    You recently requested to reset your password. Please find your login credentials below:
  </p>

  <table style="width: 100%; margin: 20px 0; font-size: 16px; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0;"><strong>Email:</strong></td>
      <td>${email}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0;"><strong>Temporary Password:</strong></td>
      <td>
        <div style="background-color: #f4f4f4; padding: 12px; border-radius: 6px; text-align: center; font-weight: bold; color: #000;">
          ${password}
        </div>
      </td>
    </tr>
  </table>

  <p style="font-size: 16px;">
    For your security, please log in and update your password immediately.
  </p>

  <p style="font-size: 16px; margin-top: 32px;">Warm regards,<br><strong>The Miporis Team</strong></p>
</div>

                    `,
                };
            } else {

                mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_CLIENT_MAIL,
                    subject: `New ${CData.service} Request from ${CData.name}`,
                    html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${logoUrl}" alt="Miporis Logo" style="max-width: 150px;">
                        </div>
                        <h2 style="color: #0066cc; text-align: center;">New Service Request</h2>
                        <p>You have received a new service request with the following details:</p>
                        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Name:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${CData.name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Email:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${CData.email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Service:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${CData.service}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Message:</strong></td>
                                <td style="padding: 10px; border: 1px solid #ddd;">${CData.message}</td>
                            </tr>
                        </table>
                        <p>Please respond to the requester at <a href="mailto:${CData.email}" style="color: #0066cc;">${CData.email}</a>.</p>
                        <p style="text-align: center; margin-top: 30px;">Best regards,<br/><strong>Miporis Team</strong></p>
                    </div>
                    `,
                };
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return reject(error);
                }
                resolve(info);
            });
        } catch (err) {
            reject(err);
        }
    });
}
