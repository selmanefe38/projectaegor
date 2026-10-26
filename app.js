const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    await checkUserSession();

    // Giriş Yap İşlemi
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                alert("Giriş Hatası: " + error.message);
            } else {
                alert("Giriş Başarılı!");
                closeModal('loginModal');
                await checkUserSession();
            }
        });
    }

    // Kayıt Ol İşlemi
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;

            const { data, error } = await supabase.auth.signUp({ email, password });

            if (error) {
                alert("Kayıt Hatası: " + error.message);
            } else {
                alert("Kayıt Başarılı! E-postanızı doğruladıktan sonra giriş yapabilirsiniz.");
                closeModal('registerModal');
            }
        });
    }

    // Profil Kaydetme
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('profileName').value;
            const surname = document.getElementById('profileSurname').value;
            const mcName = document.getElementById('profileMcName').value;
            const userClass = document.getElementById('profileClass').value;

            alert(`Profil Bilgileri Kaydedildi!\nAd Soyad: ${name} ${surname}\nMC Adı: ${mcName}\nSınıf: ${userClass}. Sınıf`);
            closeModal('profileModal');
        });
    }

    // Çıkış Yap
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.reload();
        });
    }

    // Profil Menüsü Aç/Kapat
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

async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const guestGroup = document.getElementById('guestGroup');
    const userGroup = document.getElementById('userGroup');
    const userEmailText = document.getElementById('userEmailText');

    if (session) {
        if (guestGroup) guestGroup.style.display = 'none';
        if (userGroup) userGroup.style.display = 'block';
        if (userEmailText) userEmailText.textContent = session.user.email;
    } else {
        if (guestGroup) guestGroup.style.display = 'flex';
        if (userGroup) userGroup.style.display = 'none';
    }
}

// Mağaza/VIP Buton Tıklama Kontrolü ve Samet Mesajı
document.addEventListener('click', async (e) => {
    const target = e.target.closest('.buy-action-btn');
    if (!target) return;
    
    e.preventDefault();
    e.stopPropagation();

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        alert("Giriş yapmalısınız!");
    } else {
        alert("Malesef çok yakında satın alımlar başlayacak (Samet dinen onay versin satın alımlar başlayacak)");
    }
});
