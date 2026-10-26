// Supabase Bağlantı Bilgileri
const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let teacherCodeCount = 0; // Maksimum 3 kullanım takibi

// Arayüzü Giriş Durumuna Göre Değiştirme
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

// Profil Bilgilerini Yükleme
async function loadUserProfile() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (data) {
        if(document.getElementById('profileName')) document.getElementById('profileName').value = data.first_name || '';
        if(document.getElementById('profileSurname')) document.getElementById('profileSurname').value = data.last_name || '';
        if(document.getElementById('profileMcName')) document.getElementById('profileMcName').value = data.mc_ign || '';
        if(document.getElementById('profileClass')) document.getElementById('profileClass').value = data.grade || '5';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await syncUserUI();

    db.auth.onAuthStateChange(async (event, session) => {
        await syncUserUI();
    });

    // Giriş Yap Formu
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

    // Kayıt Ol Formu
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

    // Kişisel Bilgileri Hesaba Kaydetme
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const { data: { session } } = await db.auth.getSession();
            
            if (!session) {
                alert("Lütfen önce giriş yapın!");
                return;
            }

            const firstName = document.getElementById('profileName').value.trim();
            const lastName = document.getElementById('profileSurname').value.trim();
            const mcIgn = document.getElementById('profileMcName').value.trim();
            const grade = document.getElementById('profileClass').value;

            const { error } = await db.from('profiles').upsert({
                id: session.user.id,
                first_name: firstName,
                last_name: lastName,
                mc_ign: mcIgn,
                grade: grade,
                updated_at: new Date()
            });

            if (error) {
                alert("Profil Kaydedilemedi: " + error.message);
            } else {
                alert("Profil Bilgileriniz Hesabınıza Başarıyla Kaydedildi!");
                closeModal('profileModal');
                // Kaydettikten sonra soru modalını aç
                openModal('authQuestionModal');
            }
        });
    }

    // "Yetkili Misiniz?" - "Evet" Butonu
    const authYesBtn = document.getElementById('authYesBtn');
    if (authYesBtn) {
        authYesBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            openModal('authCodeModal');
        });
    }

    // "Yetkili Misiniz?" - "Hayır" Butonu
    const authNoBtn = document.getElementById('authNoBtn');
    if (authNoBtn) {
        authNoBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            alert("Kayıt tamamlandı, iyi oyunlar!");
        });
    }

    // Yetkili Kodu Doğrulama Butonu (S-Studio Kontrolü)
    const submitAuthCodeBtn = document.getElementById('submitAuthCodeBtn');
    if (submitAuthCodeBtn) {
        submitAuthCodeBtn.addEventListener('click', () => {
            const codeInput = document.getElementById('authorizedCodeInput').value.trim();
            
            if (codeInput === 'S-Studio') {
                alert("Yetkili Kodu Doğrulandı! Öğretmen Kodu Sayfanız Açıldı.");
                closeModal('authCodeModal');
                
                // Sağ üst menüde Öğretmen Kod Sayfası butonunu görünür yap
                const openTeacherPanelBtn = document.getElementById('openTeacherPanelBtn');
                if (openTeacherPanelBtn) openTeacherPanelBtn.style.display = 'block';

                // Öğretmen Kod Sayfasını Aç
                openModal('teacherPanelModal');
            } else {
                alert("Hatalı Kod! Kabul edilmedi. (Kod: S-Studio olmalıdır)");
            }
        });
    }

    // Öğretmen Kodu Oluşturma İşlemi (Maksimum 3 Hakkı Var)
    const generateTeacherCodeBtn = document.getElementById('generateTeacherCodeBtn');
    if (generateTeacherCodeBtn) {
        generateTeacherCodeBtn.addEventListener('click', () => {
            if (teacherCodeCount >= 3) {
                alert("Çok fazla kullandın!");
                return;
            }

            teacherCodeCount++;
            
            // Rastgele MC Öğretmen Kodu Üret
            const randomCode = 'MC-TEACHER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            document.getElementById('teacherCodeDisplay').textContent = randomCode;
            document.getElementById('generatedCodeContainer').style.display = 'block';
            document.getElementById('remainingAttemptsText').textContent = (3 - teacherCodeCount);

            alert(`Öğretmen Kodu Başarıyla Oluşturuldu!\nKodunuz: ${randomCode}\nKalan Hakkınız: ${3 - teacherCodeCount}`);

            if (teacherCodeCount === 3) {
                generateTeacherCodeBtn.disabled = true;
                generateTeacherCodeBtn.style.opacity = '0.5';
                generateTeacherCodeBtn.textContent = 'Limit Dolduruldu (3/3)';
            }
        });
    }

    // Açılır Menüden Profil Aç
    const openProfileModalBtn = document.getElementById('openProfileModalBtn');
    if (openProfileModalBtn) {
        openProfileModalBtn.addEventListener('click', async () => {
            await loadUserProfile();
            openModal('profileModal');
        });
    }

    // Açılır Menüden Öğretmen Paneli Aç
    const openTeacherPanelBtn = document.getElementById('openTeacherPanelBtn');
    if (openTeacherPanelBtn) {
        openTeacherPanelBtn.addEventListener('click', () => {
            openModal('teacherPanelModal');
        });
    }

    // Çıkış Yap
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

    // Profil Menüsü Açma / Kapama
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

// Mağaza / VIP / Sikke Tıklama Uyarısı (Samet Mesajı)
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
