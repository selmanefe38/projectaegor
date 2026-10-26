// Supabase Bağlantı Bilgileri
const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let teacherCodeCount = 0; // Max 3 kod üretme hakkı

// Arayüzü Kullanıcı Oturumuna Göre Güncelleme
async function syncUserUI() {
    try {
        const { data: { session } } = await db.auth.getSession();
        const guestGroup = document.getElementById('guestGroup');
        const userGroup = document.getElementById('userGroup');
        const userWelcomeText = document.getElementById('userWelcomeText');

        if (session && session.user) {
            if (guestGroup) guestGroup.style.display = 'none';
            if (userGroup) userGroup.style.display = 'block';

            // Kullanıcının adını veritabanından getir
            const { data: profile } = await db.from('profiles').select('first_name').eq('id', session.user.id).single();
            
            if (profile && profile.first_name) {
                if (userWelcomeText) userWelcomeText.textContent = `HOŞ GELDİNİZ ${profile.first_name.toUpperCase()}`;
            } else {
                if (userWelcomeText) userWelcomeText.textContent = `HOŞ GELDİNİZ!`;
            }
        } else {
            if (guestGroup) guestGroup.style.display = 'flex';
            if (userGroup) userGroup.style.display = 'none';
        }
    } catch (err) {
        console.error("Oturum kontrol hatası:", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await syncUserUI();

    db.auth.onAuthStateChange(async (event, session) => {
        await syncUserUI();
    });

    // 1. Giriş Yap
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            const { error } = await db.auth.signInWithPassword({ email, password });

            if (error) {
                alert("Giriş Hatası: " + error.message);
            } else {
                alert("Giriş Başarılı! Hoş Geldin.");
                closeModal('authModal');
                await syncUserUI();
            }
        });
    }

    // 2. Kayıt Ol (Tek Seferde Tüm Bilgileri Veritabanına Kaydeder)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const firstName = document.getElementById('regName').value.trim();
            const lastName = document.getElementById('regSurname').value.trim();
            const mcIgn = document.getElementById('regMcName').value.trim();
            const grade = document.getElementById('regClass').value;
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            // Supabase Üyelik Aç
            const { data, error } = await db.auth.signUp({ email, password });

            if (error) {
                alert("Kayıt Hatası: " + error.message);
            } else {
                // Hesaba özel veritabanına kaydet
                if (data.user) {
                    await db.from('profiles').upsert({
                        id: data.user.id,
                        first_name: firstName,
                        last_name: lastName,
                        mc_ign: mcIgn,
                        grade: grade,
                        updated_at: new Date()
                    });
                }

                alert("Kayıt Başarılı!");
                closeModal('authModal');
                await syncUserUI();
                
                // Kayıttan hemen sonra Kod Sorma Ekranını Aç
                openModal('authQuestionModal');
            }
        });
    }

    // 3. "Yetkili Misiniz?" - "Evet" Butonu
    const authYesBtn = document.getElementById('authYesBtn');
    if (authYesBtn) {
        authYesBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            
            // Kod giriş kutusunu tamamen temizle
            const codeInput = document.getElementById('authorizedCodeInput');
            if(codeInput) codeInput.value = '';

            openModal('authCodeModal');
        });
    }

    // 4. "Yetkili Misiniz?" - "Hayır" Butonu
    const authNoBtn = document.getElementById('authNoBtn');
    if (authNoBtn) {
        authNoBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            alert("İşleminiz tamamlandı. İyi oyunlar dileriz!");
        });
    }

    // 5. Yetkili Kodu Doğrulama (S-Studio Kontrolü)
    const submitAuthCodeBtn = document.getElementById('submitAuthCodeBtn');
    if (submitAuthCodeBtn) {
        submitAuthCodeBtn.addEventListener('click', () => {
            const codeInput = document.getElementById('authorizedCodeInput').value.trim();
            
            if (codeInput === 'S-Studio') {
                alert("Yetkili Kodu Doğrulandı! Öğretmen Kodu Sayfanız Açıldı.");
                closeModal('authCodeModal');
                
                const openTeacherPanelBtn = document.getElementById('openTeacherPanelBtn');
                if (openTeacherPanelBtn) openTeacherPanelBtn.style.display = 'block';

                openModal('teacherPanelModal');
            } else {
                alert("Hatalı Kod! Giriş kabul edilmedi.");
            }
        });
    }

    // 6. Öğretmen Kodu Oluşturma (Max 3 Hakkı Var)
    const generateTeacherCodeBtn = document.getElementById('generateTeacherCodeBtn');
    if (generateTeacherCodeBtn) {
        generateTeacherCodeBtn.addEventListener('click', () => {
            if (teacherCodeCount >= 3) {
                alert("Çok fazla kullandın! Daha fazla kod oluşturamazsın.");
                return;
            }

            teacherCodeCount++;
            const randomCode = 'MC-TEACHER-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            
            document.getElementById('teacherCodeDisplay').textContent = randomCode;
            document.getElementById('generatedCodeContainer').style.display = 'block';
            document.getElementById('remainingAttemptsText').textContent = (3 - teacherCodeCount);

            alert(`Öğretmen Kodu Oluşturuldu!\nKod: ${randomCode}\nKalan Hakkınız: ${3 - teacherCodeCount}`);

            if (teacherCodeCount === 3) {
                generateTeacherCodeBtn.disabled = true;
                generateTeacherCodeBtn.style.opacity = '0.5';
                generateTeacherCodeBtn.textContent = 'Çok fazla kullandın (3/3)';
            }
        });
    }

    // Menü Öğretmen Paneli Butonu
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

    // Profil Açılır Menüsü
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

// VIP / Sikke Satın Alma Uyarısı (Samet Mesajı)
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
