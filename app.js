// Supabase SDK Bağlantısı (CDN üzerinden)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Senin Supabase Bilgilerin
const SUPABASE_URL = "https://bkeckhwhakvrmgdifukg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZWNraHdoYWt2cm1nZGlmdWtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTg2NDEsImV4cCI6MjEwODU5NDY0MX0.Y3n4B8g6K8Wr_HSxD4NH9Sc7bMlZkG-gcz_Q2DQSiNw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kayıt Ol Form İşlemi
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    // Supabase Auth ile Kayıt Olma
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        alert("Kayıt Hatası: " + error.message);
    } else {
        alert("Kayıt başarılı! E-postanızı kontrol edin veya giriş yapın.");
        document.getElementById('registerModal').style.display = 'none';
    }
});

// Giriş Yap Form İşlemi
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Supabase Auth ile Giriş Yapma
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert("Giriş Hatası: E-posta veya şifre hatalı!");
    } else {
        alert("Giriş başarılı! Hoş geldiniz.");
        document.getElementById('loginModal').style.display = 'none';
        checkUserSession();
    }
});

// Oturum Kontrolü ve Arayüz Güncelleme
async function checkUserSession() {
    const { data: { session } } = await supabase.auth.getSession();
    const authBtns = document.getElementById('authButtons');

    if (session) {
        const user = session.user;
        authBtns.innerHTML = `
            <span style="font-size:0.9rem; color:var(--primary);">${user.email}</span>
            <button class="btn btn-secondary" id="logoutBtn" style="padding: 6px 12px; font-size: 0.85rem;">Çıkış</button>
        `;
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            alert("Çıkış yapıldı.");
            window.location.reload();
        });
    }
}

// Sayfa yüklendiğinde oturumu kontrol et
checkUserSession();