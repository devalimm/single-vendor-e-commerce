import nodemailer from 'nodemailer';

// Create email transporter
const createTransporter = () => {
   return nodemailer.createTransport({
      service: 'gmail',
      auth: {
         user: process.env.EMAIL_USER,
         pass: process.env.EMAIL_PASSWORD
      }
   });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetUrl) => {
   try {
      const transporter = createTransporter();

      const mailOptions = {
         from: `"Asiye Özel" <${process.env.EMAIL_USER}>`,
         to: email,
         subject: 'Şifre Sıfırlama Talebi',
         html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ec4899; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Şifre Sıfırlama</h1>
            </div>
            <div class="content">
              <p>Merhaba,</p>
              <p>Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
              </div>
              <p>Veya bu linki tarayıcınıza kopyalayın:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>Bu link 1 saat içinde geçerliliğini yitirecektir.</strong></p>
              <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Asiye Özel. Tüm hakları saklıdır.</p>
            </div>
          </div>
        </body>
        </html>
      `
      };

      await transporter.sendMail(mailOptions);
      console.log('Password reset email sent to:', email);
      return true;
   } catch (error) {
      console.error('Email send error:', error);
      throw new Error('Email gönderilemedi');
   }
};
