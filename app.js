// Supabase Bağlantısı
const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sayfa yüklendiğinde çalışacak kontroller
document.addEventListener('DOMContentLoaded', async () => {
    // Mevcut oturumu kontrol et
    const { data: { session } } = await supabase.auth.getSession();
    
    // Sağ üstteki e-posta alanını güncelle (varsa)
    const userEmailDisplay = document.getElementById('user-email');
    if (session && userEmailDisplay) {
        userEmailDisplay.textContent = session.user.email;
    }

    // Çıkış yapma buton işlevi (varsa)
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
            window.location.reload();
        });
    }
});

// Mağaza / VIP Paketleri Butonları Kontrolü
document.querySelectorAll('.buy-btn, .incele-btn').forEach(button => {
    button.addEventListener('click', async () => {
        // Butona tıklandığı an güncel oturumu tekrar sorgula
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Giriş yapılmamışsa uyar
            alert("Giriş yapmalısınız!");
        } else {
            // Giriş yapılmışsa o efsane mesajı patlat
            alert("Malesef çok yakında satın alımlar başlayacak (Samet dinen onay versin satın alımlar başlayacak)");
        }
    });
});
