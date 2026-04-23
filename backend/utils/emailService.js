import { Resend } from 'resend';

let _resend = null;

function getResend() {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Asiye Özel <noreply@asiyeozel.com>';

export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Şifre Sıfırlama Talebi',
      html: `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Şifre Sıfırlama</title>
  <style>
    /* Reset & E-posta İstemcisi Düzeltmeleri */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #333333; }
    
    /* Mobil Uyumluluk */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .content-padding { padding: 20px !important; }
      .long-link { font-size: 13px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <tr>
            <td align="center" style="background-color: #8b5cf6; background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 35px 20px; color: #ffffff;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">Şifre Sıfırlama</h1>
            </td>
          </tr>

          <tr>
            <td class="content-padding" style="padding: 40px 30px;">
              <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px;">Merhaba,</p>
              <p style="margin: 0 0 25px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi yeni ve güvenli bir şifreyle değiştirmek için aşağıdaki butona tıklayabilirsiniz:
              </p>

              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 25px;">
                <tr>
                  <td align="center">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" bgcolor="#ec4899" style="border-radius: 6px;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 30px; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 6px;">Şifremi Sıfırla</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px;">Buton çalışmıyorsa, aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:</p>
              <div style="background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
                <p class="long-link" style="margin: 0; color: #6b7280; font-size: 14px; word-break: break-all; line-height: 1.5;">
                  <a href="${resetUrl}" style="color: #8b5cf6; text-decoration: none;">${resetUrl}</a>
                </p>
              </div>

              <p style="margin: 0 0 15px 0; color: #ef4444; font-size: 14px; font-weight: 600;">
                ⚠️ Bu bağlantı güvenlik amacıyla 1 saat içinde geçerliliğini yitirecektir.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
                Eğer bu şifre sıfırlama talebini siz yapmadıysanız, hesabınız güvendedir ve bu e-postayı görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="background-color: #f9fafb; border-top: 1px solid #eeeeee; padding: 20px; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Asiye Özel. Tüm hakları saklıdır.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
            `
    });
    return true;
  } catch (error) {
    console.error('Password reset email error:', error?.message || error);
    throw error;
  }
};

export const sendOrderConfirmation = async (order) => {
  try {
    const orderId = order._id.toString().slice(-8).toUpperCase();
    const orderDate = new Date(order.createdAt).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsList = order.items.map(item => {
      const options = item.selectedOptions?.length > 0
        ? ` (${item.selectedOptions.map(o => o.name).join(', ')})`
        : '';
      const variation = item.variationSelections?.length > 0
        ? ` - ${item.variationSelections.map(s => `${s.variationName}: ${s.optionName}`).join(', ')}`
        : item.size ? ` - ${item.size}` : '';
      return `<li><strong>${item.productName}</strong>${variation}${options}<br/>${item.quantity} adet × ${item.basePrice.toFixed(2)} TL = <strong>${item.itemTotal.toFixed(2)} TL</strong></li>`;
    }).join('');

    const statusBadge = {
      pending: { bg: '#f59e0b', text: 'Ödeme Bekliyor' },
      paid: { bg: '#10b981', text: 'Ödendi' },
      confirmed: { bg: '#3b82f6', text: 'Onaylandı' },
      processing: { bg: '#8b5cf6', text: 'Hazırlanıyor' },
      shipped: { bg: '#06b6d4', text: 'Kargoya Verildi' },
      delivered: { bg: '#22c55e', text: 'Teslim Edildi' },
      cancelled: { bg: '#ef4444', text: 'İptal Edildi' }
    }[order.status] || { bg: '#6b7280', text: order.status };

    const statusBadgeHtml = `<span style="display: inline-block; padding: 6px 14px; background: ${statusBadge.bg}; color: white; border-radius: 20px; font-size: 0.85rem;">${statusBadge.text}</span>`;

    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: order.shippingAddress.email,
      subject: `Siparişiniz Alındı - #${orderId}`,
      html: `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sipariş Onayı</title>
  <style>
    /* Reset & E-posta İstemcisi Düzeltmeleri */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f5f7; color: #333333; }
    
    /* Mobil Uyumluluk */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .mobile-stack { display: block !important; width: 100% !important; margin-bottom: 15px !important; text-align: left !important; }
      .content-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f5f7;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e5e7eb;">
          
          <tr>
            <td align="center" style="background-color: #8b5cf6; background: linear-gradient(135deg, #ec4899, #8b5cf6); padding: 40px 20px; color: #ffffff;">
              <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Siparişiniz Alındı!</h1>
              <p style="margin: 0; font-size: 16px; opacity: 0.9;">Siparişiniz başarıyla oluşturuldu.</p>
            </td>
          </tr>

          <tr>
            <td class="content-padding" style="padding: 30px;">
              
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #eeeeee; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Sipariş Numarası</p>
                    <div style="font-size: 24px; font-weight: bold; color: #8b5cf6; margin-bottom: 20px; letter-spacing: 1px;">#${orderId}</div>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td class="mobile-stack" width="33%" valign="top">
                          <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Durum</p>
                          <div style="font-size: 14px; font-weight: 600; color: #111827;">${statusBadgeHtml}</div>
                        </td>
                        <td class="mobile-stack" width="33%" valign="top">
                          <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Tarih</p>
                          <div style="font-size: 14px; font-weight: 600; color: #111827;">${orderDate}</div>
                        </td>
                        <td class="mobile-stack" width="33%" valign="top">
                          <p style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Ödeme</p>
                          <div style="font-size: 14px; font-weight: 600; color: #111827;">${order.paymentMethod === 'iyzico' ? 'Kredi/Banka Kartı' : order.paymentMethod === 'cash_on_delivery' ? 'Kapıda Ödeme' : order.paymentMethod}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Sipariş Özeti</h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 1px solid #eeeeee; border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="margin-bottom: 20px;">
                      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                        ${itemsList}
                      </ul>
                    </div>

                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #eeeeee; padding-top: 15px;">
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Ara Toplam</td>
                        <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${order.subtotal.toFixed(2)} TL</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #4b5563; font-size: 14px;">Kargo</td>
                        <td align="right" style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${order.shippingCost === 0 ? 'Ücretsiz' : order.shippingCost.toFixed(2) + ' TL'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0 5px 0; color: #111827; font-size: 16px; font-weight: bold; border-top: 2px solid #eeeeee;">Toplam</td>
                        <td align="right" style="padding: 15px 0 5px 0; color: #ec4899; font-size: 18px; font-weight: bold; border-top: 2px solid #eeeeee;">${order.total.toFixed(2)} TL</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Teslimat Adresi</h3>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #eeeeee; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                    <strong style="color: #111827; font-size: 15px; display: block; margin-bottom: 5px;">${order.shippingAddress.fullName}</strong>
                    ${order.shippingAddress.address}<br>
                    ${order.shippingAddress.neighborhood}, ${order.shippingAddress.district}<br>
                    ${order.shippingAddress.city}<br>
                    <span style="color: #6b7280; display: block; margin-top: 8px;">Tel: ${order.shippingAddress.phone}</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5;">
                Siparişinizin durumunu takip etmek için sipariş numaranızı kullanabilirsiniz.
              </p>
              
            </td>
          </tr>
          
          <tr>
            <td align="center" style="background-color: #f9fafb; border-top: 1px solid #eeeeee; padding: 20px; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Asiye Özel. Tüm hakları saklıdır.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
            `
    });

    return true;
  } catch (error) {
    console.error('Order confirmation email error:', error?.message || error);
    return false;
  }
};