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

 export const sendOrderConfirmation = async (order) => {
    try {
       const transporter = createTransporter();
       const itemsList = order.items.map(item =>
          `<li>${item.productName} - ${item.quantity} adet x ${item.basePrice.toFixed(2)} TL${item.selectedOptions.length > 0 ? ' (' + item.selectedOptions.map(o => o.name).join(', ') + ')' : ''}</li>`
       ).join('');

       const statusBadge = {
          pending: { bg: '#f59e0b', text: 'Ödeme Bekliyor' },
          paid: { bg: '#10b981', text: 'Ödendi' },
          confirmed: { bg: '#3b82f6', text: 'Onaylandı' },
          processing: { bg: '#8b5cf6', text: 'Hazırlanıyor' },
          shipped: { bg: '#06b6d4', text: 'Kargoya Verildi' },
          delivered: { bg: '#22c55e', text: 'Teslim Edildi' },
          cancelled: { bg: '#ef4444', text: 'İptal Edildi' }
       }[order.status] || { bg: '#6b7280', text: order.status };

       const mailOptions = {
          from: `"Asiye Özel" <${process.env.EMAIL_USER}>`,
          to: order.shippingAddress.email,
          subject: `Siparişiniz Alındı - #${order._id.toString().slice(-8).toUpperCase()}`,
          html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .order-box { background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .order-id { font-size: 24px; font-weight: bold; color: #8b5cf6; }
              .items { margin: 15px 0; }
              .items ul { padding-left: 20px; }
              .items li { margin: 8px 0; }
              .total { font-size: 20px; font-weight: bold; color: #ec4899; text-align: right; margin-top: 15px; }
              .status { display: inline-block; padding: 8px 16px; background: ${statusBadge.bg}; color: white; border-radius: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Siparişiniz Alındı!</h1>
                <p>Siparişiniz başarıyla oluşturuldu.</p>
              </div>
              <div class="order-box">
                <p><strong>Sipariş Numarası:</strong></p>
                <div class="order-id">#${order._id.toString().slice(-8).toUpperCase()}</div>
                <p style="margin-top: 15px;"><strong>Durum:</strong> <span class="status">${statusBadge.text}</span></p>
                <p><strong>Tarih:</strong> ${new Date(order.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div class="order-box">
                <h3>Sipariş Özeti</h3>
                <div class="items">
                  <ul>${itemsList}</ul>
                </div>
                <div class="total">Toplam: ${order.total.toFixed(2)} TL</div>
              </div>
              <div class="order-box">
                <h3>Teslimat Adresi</h3>
                <p><strong>${order.shippingAddress.fullName}</strong></p>
                <p>${order.shippingAddress.neighborhood}, ${order.shippingAddress.district}</p>
                <p>${order.shippingAddress.city}</p>
                <p>Tel: ${order.shippingAddress.phone}</p>
              </div>
              <p>Siparişinizin durumunu takip etmek için sipariş numaranızı kullanabilirsiniz.</p>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Asiye Özel. Tüm hakları saklıdır.</p>
              </div>
            </div>
          </body>
          </html>
        `
       };

       await transporter.sendMail(mailOptions);
       console.log('Order confirmation email sent to:', order.shippingAddress.email);
       return true;
    } catch (error) {
       console.error('Order confirmation email error:', error);
       return false;
    }
 };
