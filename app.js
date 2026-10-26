// Supabase Bağlantı Bilgileri
const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

// Çakışmayı %100 önlemek için değişken adını 'db' yaptık
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Arayüzü Giriş Durumuna Göre Değiştiren Ana Fonksiyon
async function syncUserUI() {
    try {
        const { data: { session } } = await db.auth.getSession();
        const guestGroup = document.getElementById('guestGroup');
        const userGroup = document.getElementById('userGroup');
        const userEmailText = document.getElementById('userEmailText');

        if (session && session.user) {
            if (guestGroup) guestGroup.style.display = 'none';
            if (userGroup) userGroup.style.display = 'block';
            if (userEmailText) userEmailText.textContent = session.user.email;
        } else {
            if (guestGroup) guestGroup.style.display = 'flex';
            if (userGroup) userGroup.style.display = 'none';
        }
    } catch (err) {
        console.error("Oturum kontrol hatası:", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Sayfa Açılır Açılmaz Kullanıcı Oturumunu Kontrol Et
    await syncUserUI();

    // 2. Supabase Canlı Oturum Dinleyicisi
    db.auth.onAuthStateChange(async (event, session) => {
        await syncUserUI();
    });

    // 3. Giriş Yap Form İşlemi
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const { data, error } = await db.auth.signInWithPassword({ email, password });

            if (error) {
                alert("Giriş Hatası: " + error.message);
            } else {
                alert("Giriş Başarılı! Hoş Geldin.");
                closeModal('loginModal');
                await syncUserUI();
            }
        });
    }

    // 4. Kayıt Ol Form İşlemi
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;

            const { data, error } = await db.auth.signUp({ email, password });

            if (error) {
                alert("Kayıt Hatası: " + error.message);
            } else {
                alert("Kayıt Başarılı! E-postanızı doğruladıktan sonra giriş yapabilirsiniz.");
                closeModal('registerModal');
            }
        });
    }

    // 5. Kişisel Bilgileri Kaydetme Form İşlemi
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('profileName').value;
            const surname = document.getElementById('profileSurname').value;
            const mcName = document.getElementById('profileMcName').value;
            const userClass = document.getElementById('profileClass').value;

            alert(`Profil Bilgileri Başarıyla Kaydedildi!\nAd Soyad: ${name} ${surname}\nMC Adı: ${mcName}\nSınıf: ${userClass}. Sınıf`);
            closeModal('profileModal');
        });
    }

    // 6. Çıkış Yap Butonu
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await db.auth.signOut();
            await syncUserUI();
            alert("Çıkış Yapıldı.");
            window.location.reload();
        });
    }

    // 7. Sağ Üst Profil Menüsü Açma / Kapama
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            userDropdown.style.display = 'none';
        });
    }
});

// 8. VIP ve Sikke Butonlarına Tıklandığında Ekrana Gelecek Uyarı
document.addEventListener('click', async (e) => {
    const target = e.target.closest('.buy-action-btn');
    if (!target) return;
    
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await db.auth.getSession();

    if (!session) {
        alert("Giriş yapmalısınız!");
    } else {
        alert("Malesef çok yakında satın alımlar başlayacak (Samet dinen onay versin satın alımlar başlayacak)");
    }
});
