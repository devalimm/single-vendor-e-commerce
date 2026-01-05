import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MesafeliSatisSozlesmesi = () => {
   return (
      <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
         <Link to="/" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
            Ana Sayfa
         </Link>

         <div className="card" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Mesafeli Satış Sözleşmesi</h1>

            <div style={{ lineHeight: '1.8', color: 'var(--color-text-secondary)' }}>
               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  1. TARAFLAR
               </h2>
               <p><strong>SATICI:</strong></p>
               <p>Unvan: Asiye Özel</p>
               <p>Adres: [Şirket Adresi]</p>
               <p>Telefon: [Telefon Numarası]</p>
               <p>E-posta: info@asiyeozel.com</p>

               <p style={{ marginTop: '1rem' }}><strong>ALICI:</strong></p>
               <p>Sipariş sırasında belirtilen kişi ve adres bilgileri.</p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  2. SÖZLEŞMENİN KONUSU
               </h2>
               <p>
                  İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait www.asiyeozel.com internet sitesinden
                  elektronik ortamda siparişini verdiği aşağıda nitelikleri ve satış fiyatı belirtilen
                  ürünün satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında
                  Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve
                  yükümlülüklerinin belirlenmesidir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  3. ÜRÜN BİLGİLERİ
               </h2>
               <p>
                  Ürünün temel özellikleri (türü, miktarı, rengi, bedeni vb.) SATICI'ya ait internet
                  sitesinde yer almaktadır. Ürünün temel özelliklerini kampanya süresince inceleyebilirsiniz.
                  Kampanya tarihine kadar geçerlidir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  4. TESLİMAT
               </h2>
               <p>
                  Ürün, ALICI'nın sipariş formunda belirttiği adrese teslim edilecektir.
                  Teslimat süresi, ödemenin onaylanmasından itibaren 3-7 iş günüdür.
                  ALICI'nın belirttiği adresin hatalı olması durumunda SATICI sorumlu tutulamaz.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  5. ÖDEME ŞEKLİ
               </h2>
               <p>
                  Ödeme, kapıda ödeme veya online ödeme yöntemlerinden biri ile yapılabilir.
                  Ürün bedeli ve kargo ücreti sipariş onay sayfasında gösterilmektedir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  6. CAYMA HAKKI
               </h2>
               <p>
                  ALICI, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir
                  gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir.
               </p>
               <p style={{ marginTop: '0.5rem' }}>
                  Cayma hakkının kullanılması için bu süre içinde SATICI'ya yazılı bildirimde bulunulması
                  ve ürünün kullanılmamış, ambalajının açılmamış olması gerekmektedir.
               </p>
               <p style={{ marginTop: '0.5rem' }}>
                  Cayma hakkı kapsamında iade edilecek ürünlerin kargo ücreti ALICI'ya aittir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  7. CAYMA HAKKI KULLANILAMAYACAK ÜRÜNLER
               </h2>
               <p>
                  Tüketicinin istekleri veya açıkça kişisel ihtiyaçları doğrultusunda hazırlanan,
                  niteliği itibariyle geri gönderilmeye elverişli olmayan ve çabuk bozulma tehlikesi
                  olan veya son kullanma tarihi geçme ihtimali olan ürünler cayma hakkı kapsamı dışındadır.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  8. GENEL HÜKÜMLER
               </h2>
               <p>
                  ALICI, bu sözleşmede yer alan tüm koşulları ve açıklamaları okuduğunu, anladığını
                  ve kabul ettiğini beyan eder. İşbu sözleşme, taraflar arasında akdedilen mesafeli
                  satış sözleşmesinin ayrılmaz bir parçasıdır.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  9. YETKİLİ MAHKEME
               </h2>
               <p>
                  İşbu sözleşmeden doğan uyuşmazlıklarda, Tüketici Hakem Heyetleri ve Tüketici
                  Mahkemeleri yetkilidir. Parasal sınırlar için yürürlükteki mevzuat hükümleri uygulanır.
               </p>

               <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
               }}>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem' }}>
                     Bu sözleşme, sipariş onayı ile birlikte yürürlüğe girer.
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                     Son güncelleme: Ocak 2026
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default MesafeliSatisSozlesmesi;
