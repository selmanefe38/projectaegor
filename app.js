// Supabase Bağlantı Bilgileri
const SUPABASE_URL = 'https://bkeckhwhakvrmgdifukg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let teacherCodeCount = 0; // Maksimum 3 kullanım takibi

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
                if (userWelcomeText) userWelcomeText.textContent = `HOŞ GELDİNİZ, ${profile.first_name.toUpperCase()}`;
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

// Profil Bilgilerini Veritabanından Çekip Formu Doldurma
async function loadUserProfile() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return;

    const { data } = await db.from('profiles').select('*').eq('id', session.user.id).single();

    if (data) {
        if(document.getElementById('profileName')) document.getElementById('profileName').value = data.first_name || '';
        if(document.getElementById('profileSurname')) document.getElementById('profileSurname').value = data.last_name || '';
        if(document.getElementById('profileMcName')) document.getElementById('profileMcName').value = data.mc_ign || '';
        if(document.getElementById('profileClass')) document.getElementById('profileClass').value = data.grade || '5';
    }
    if(document.getElementById('newPassword')) document.getElementById('newPassword').value = '';
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

    // 2. Kayıt Ol
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

            const { data, error } = await db.auth.signUp({ email, password });

            if (error) {
                alert("Kayıt Hatası: " + error.message);
            } else {
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
                
                // Kayıttan sonra Yetkili Sorma Ekranını Aç
                openModal('authQuestionModal');
            }
        });
    }

    // 3. Kişisel Bilgileri & Şifreyi Güncelleme
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
            const newPassword = document.getElementById('newPassword').value;

            // Veritabanı bilgilerini güncelle
            const { error } = await db.from('profiles').upsert({
                id: session.user.id,
                first_name: firstName,
                last_name: lastName,
                mc_ign: mcIgn,
                grade: grade,
                updated_at: new Date()
            });

            if (error) {
                alert("Bilgiler Güncellenemedi: " + error.message);
                return;
            }

            // Eğer şifre alanı doldurulduysa şifreyi de güncelle
            if (newPassword && newPassword.length >= 6) {
                const { error: pwdError } = await db.auth.updateUser({ password: newPassword });
                if (pwdError) {
                    alert("Şifre Değiştirilemedi: " + pwdError.message);
                    return;
                }
            } else if (newPassword && newPassword.length < 6) {
                alert("Şifre en az 6 karakter olmalıdır!");
                return;
            }

            alert("Kişisel Bilgileriniz Başarıyla Güncellendi!");
            closeModal('profileModal');
            await syncUserUI();

            // Güncellemeden sonra Yetkili sorma ekranını aç
            setTimeout(() => {
                openModal('authQuestionModal');
            }, 300);
        });
    }

    // 4. "Yetkili Misiniz?" - "Evet" Butonu
    const authYesBtn = document.getElementById('authYesBtn');
    if (authYesBtn) {
        authYesBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            const codeInput = document.getElementById('authorizedCodeInput');
            if(codeInput) codeInput.value = '';
            openModal('authCodeModal');
        });
    }

    // 5. "Yetkili Misiniz?" - "Hayır" Butonu
    const authNoBtn = document.getElementById('authNoBtn');
    if (authNoBtn) {
        authNoBtn.addEventListener('click', () => {
            closeModal('authQuestionModal');
            alert("İşleminiz tamamlandı. İyi oyunlar dileriz!");
        });
    }

    // 6. Yetkili Kodu Doğrulama (S-Studio Kontrolü)
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

    // 7. Öğretmen Kodu Oluşturma (Max 3 Hakkı Var)
    const generateTeacherCodeBtn = document.getElementById('generateTeacherCodeBtn');
    if (generateTeacherCodeBtn) {
        generateTeacherCodeBtn.addEventListener('click', () => {
            if (teacherCodeCount >= 3) {
                alert("Çok fazla kullandın!");
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

    // Menüden Kişisel Bilgiler & Şifre Modalını Açma
    const openProfileModalBtn = document.getElementById('openProfileModalBtn');
    if (openProfileModalBtn) {
        openProfileModalBtn.addEventListener('click', async () => {
            await loadUserProfile();
            openModal('profileModal');
        });
    }

    // Menüden Öğretmen Paneli Açma
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
