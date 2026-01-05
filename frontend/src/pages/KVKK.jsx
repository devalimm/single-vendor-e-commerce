import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const KVKK = () => {
   return (
      <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
         <Link to="/" className="btn btn-secondary" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} />
            Ana Sayfa
         </Link>

         <div className="card" style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Gizlilik ve Güvenlik Politikası</h1>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
               KVKK (6698 Sayılı Kişisel Verilerin Korunması Kanunu) Aydınlatma Metni
            </p>

            <div style={{ lineHeight: '1.8', color: 'var(--color-text-secondary)' }}>
               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  1. VERİ SORUMLUSU
               </h2>
               <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz;
                  veri sorumlusu olarak Asiye Özel ("Şirket") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  2. KİŞİSEL VERİLERİN İŞLENME AMACI
               </h2>
               <p>Kişisel verileriniz aşağıdaki amaçlarla işlenecektir:</p>
               <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Sipariş ve teslimat işlemlerinin gerçekleştirilmesi</li>
                  <li>Fatura düzenlenmesi ve muhasebe işlemleri</li>
                  <li>Müşteri hizmetleri ve destek sağlanması</li>
                  <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                  <li>Kampanya ve promosyonlardan haberdar edilmeniz (izniniz dahilinde)</li>
               </ul>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  3. İŞLENEN KİŞİSEL VERİLER
               </h2>
               <p>İşlenen kişisel veriler şunlardır:</p>
               <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, TC kimlik numarası</li>
                  <li><strong>İletişim Bilgileri:</strong> Adres, telefon numarası, e-posta adresi</li>
                  <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, çerez verileri</li>
                  <li><strong>Müşteri İşlem Bilgileri:</strong> Sipariş geçmişi, ödeme bilgileri</li>
               </ul>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  4. KİŞİSEL VERİLERİN AKTARILMASI
               </h2>
               <p>
                  Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda,
                  iş ortaklarımıza, tedarikçilerimize, kargo şirketlerine ve yasal düzenlemelerin gerektirdiği
                  hallerde kamu kurumlarına aktarılabilecektir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  5. KİŞİSEL VERİLERİN TOPLANMA YÖNTEMİ
               </h2>
               <p>
                  Kişisel verileriniz; internet sitemiz üzerinden yapılan sipariş işlemleri, iletişim formları,
                  telefon görüşmeleri ve e-posta yazışmaları aracılığıyla toplanmaktadır.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  6. KİŞİSEL VERİLERİN SAKLANMA SÜRESİ
               </h2>
               <p>
                  Kişisel verileriniz, işleme amaçlarının gerektirdiği süreler boyunca ve yasal
                  saklama sürelerine uygun olarak muhafaza edilecektir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  7. VERİ SAHİBİNİN HAKLARI
               </h2>
               <p>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
               <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                  <li>Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                  <li>Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                  <li>KVKK'da öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme</li>
                  <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                  <li>Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme</li>
               </ul>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  8. ÇEREZ POLİTİKASI
               </h2>
               <p>
                  Web sitemizde kullanıcı deneyimini geliştirmek amacıyla çerezler kullanılmaktadır.
                  Çerezler, tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır.
                  Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz, ancak bu durumda
                  bazı site özellikleri düzgün çalışmayabilir.
               </p>

               <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.25rem', color: 'var(--color-text-primary)' }}>
                  9. İLETİŞİM
               </h2>
               <p>
                  KVKK kapsamındaki haklarınızı kullanmak veya sorularınız için aşağıdaki iletişim
                  bilgilerinden bize ulaşabilirsiniz:
               </p>
               <p style={{ marginTop: '0.5rem' }}>
                  <strong>E-posta:</strong> info@asiyeozel.com
               </p>

               <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
               }}>
                  <p style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: '0.5rem' }}>
                     Bu politika, yasal düzenlemelere uygun olarak güncellenebilir.
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

export default KVKK;
