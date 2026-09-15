/* ============================================================
   MULTI-PAGE NAVIGATION
   ============================================================ */
const pages = ['home','about','bubut','pompa','elektrikal','material','galeri','kontak'];

function showPage(name){
  if(!pages.includes(name)) name = 'home';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + name);
  if(target) target.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === name);
  });

  window.scrollTo({ top:0, behavior:'smooth' });
  history.replaceState(null, '', '#' + name);

  setTimeout(initReveal, 60);
}

document.addEventListener('click', e => {
  const navEl = e.target.closest('[data-nav]');
  if(navEl){
    e.preventDefault();
    showPage(navEl.dataset.nav);
    closeMenu();
  }
});

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

function closeMenu(){
  navMenu.classList.remove('open');
  hamburger.classList.remove('open');
}

hamburger.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  hamburger.classList.toggle('open');
});

document.addEventListener('click', e => {
  if(!navMenu.contains(e.target) && !hamburger.contains(e.target)){
    closeMenu();
  }
});

/* ============================================================
   HEADER SHADOW ON SCROLL
   ============================================================ */
const header = document.getElementById('siteHeader');
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('scrolled', y > 10);
  lastScroll = y;
}, { passive: true });

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const scrollProgress = document.getElementById('scrollProgress');
function updateScrollProgress(){
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
  if(scrollProgress) scrollProgress.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
let revealObserver;
function initReveal(){
  const items = document.querySelectorAll('.page.active .reveal');
  if(revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold:0.12, rootMargin:'0px 0px -40px 0px' });

  items.forEach((item, i) => {
    item.style.transitionDelay = (i % 6) * 0.06 + 's';
    revealObserver.observe(item);
  });
}

/* ============================================================
   COUNT-UP ANIMATION untuk STATS
   ============================================================ */
function animateCounter(el, target, duration = 1800){
  const start = performance.now();
  const decimals = parseInt(el.dataset.decimals) || 0;
  const suffix = el.dataset.suffix || '';
  const isDecimal = decimals > 0;

  function tick(now){
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;

    const formatted = isDecimal
      ? value.toFixed(decimals)
      : Math.floor(value).toLocaleString('id-ID');

    el.textContent = formatted + suffix;

    if(progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if(e.isIntersecting){
      const el = e.target.querySelector('.stat-num');
      if(el && !el.dataset.animated){
        const target = parseFloat(el.dataset.target);
        animateCounter(el, target);
        el.dataset.animated = '1';
      }
      statObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(s => statObserver.observe(s));

/* ============================================================
   MAGNETIC BUTTONS + RIPPLE EFFECT
   ============================================================ */
function initMagneticButtons(){
  const buttons = document.querySelectorAll('.btn-primary, .btn-gold, .btn-ghost');

  buttons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Posisi gradient ripple
      btn.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      btn.style.setProperty('--my', (e.clientY - rect.top) + 'px');

      // Magnetic effect halus
      btn.style.transform = `translate(${x * 0.08}px, ${y * 0.08}px) translateY(-2px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ============================================================
   CONTACT FORM — Kirim via WhatsApp
   ============================================================ */
function handleSubmit(e){
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const nama    = data.get('nama')?.trim() || '-';
  const telepon = data.get('telepon')?.trim() || '-';
  const email   = data.get('email')?.trim() || '-';
  const layanan = data.get('layanan')?.trim() || '-';
  const pesan   = data.get('pesan')?.trim() || '-';

  const text =
    `Halo Dinasty Sulung Teknik,%0A%0A` +
    `Nama: ${encodeURIComponent(nama)}%0A` +
    `Telepon: ${encodeURIComponent(telepon)}%0A` +
    `Email: ${encodeURIComponent(email)}%0A` +
    `Layanan: ${encodeURIComponent(layanan)}%0A%0A` +
    `Detail:%0A${encodeURIComponent(pesan)}`;

  window.open(`https://wa.me/6288214612468?text=${text}`, '_blank');
  form.reset();

  const btn = form.querySelector('button[type="submit"]');
  const original = btn.innerHTML;
  btn.innerHTML = '✓ Terkirim — Membuka WhatsApp...';
  btn.style.background = 'linear-gradient(135deg, #3d9a62, #4fb377)';
  setTimeout(() => {
    btn.innerHTML = original;
    btn.style.background = '';
  }, 2600);
}

/* ============================================================
   GALERI SUPABASE — VIEW PUBLIK + ADMIN
   ============================================================ */
(function(){
  const ADMIN_PASSWORD = 'dinastysulung';
  const SESSION_KEY = 'dst_admin_logged_in';

  let galleryItems = [];
  let deleteMode = false;
  let isLoggedIn = false;

  const galleryGrid        = document.getElementById('galleryGrid');
  const galleryStatus      = document.getElementById('galleryStatus');
  const gallerySearch      = document.getElementById('gallerySearch');
  const btnRefresh         = document.getElementById('btnRefreshGallery');
  const btnToggleDelete    = document.getElementById('btnToggleDelete');
  const btnLock            = document.getElementById('btnLock');
  const adminUploadSection = document.getElementById('adminUploadSection');

  const loginModal   = document.getElementById('loginModal');
  const modalClose   = document.getElementById('modalClose');
  const loginForm    = document.getElementById('loginForm');
  const loginPassword= document.getElementById('loginPassword');
  const btnLogin     = document.getElementById('btnLogin');
  const loginStatus  = document.getElementById('loginStatus');

  const uploadForm     = document.getElementById('uploadForm');
  const uploadJudul    = document.getElementById('uploadJudul');
  const uploadKategori = document.getElementById('uploadKategori');
  const uploadFile     = document.getElementById('uploadFile');
  const uploadPreview  = document.getElementById('uploadPreview');
  const btnUpload      = document.getElementById('btnUpload');
  const btnResetUpload = document.getElementById('btnResetUpload');
  const uploadStatus   = document.getElementById('uploadStatus');

  const btnLogout = document.getElementById('btnLogout');

  if(!galleryGrid) return;

  function setStatus(el, msg, type){
    if(!el) return;
    el.textContent = msg || '';
    el.className = 'upload-status' + (type ? ' ' + type : '');
    el.style.display = msg ? 'block' : 'none';
  }

  function openModal(){
    loginModal.classList.add('open');
    loginModal.setAttribute('aria-hidden', 'false');
    setStatus(loginStatus, '', '');
    loginForm.reset();
    setTimeout(() => loginPassword?.focus(), 200);
  }

  function closeModal(){
    loginModal.classList.remove('open');
    loginModal.setAttribute('aria-hidden', 'true');
  }

  function enterAdmin(){
    isLoggedIn = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    adminUploadSection.style.display = 'block';
    btnToggleDelete.style.display = 'inline-flex';
    btnLock.classList.add('logged-in');
    btnLock.querySelector('.lock-ico').textContent = '🔓';
    btnLock.querySelector('.lock-text').textContent = 'Admin (Login)';
    closeModal();
    renderGallery();

    setTimeout(() => {
      adminUploadSection.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 250);
  }

  function exitAdmin(){
    isLoggedIn = false;
    deleteMode = false;
    sessionStorage.removeItem(SESSION_KEY);
    adminUploadSection.style.display = 'none';
    btnToggleDelete.style.display = 'none';
    btnToggleDelete.textContent = '🗑️ Mode Hapus: OFF';
    btnToggleDelete.classList.remove('active');
    btnLock.classList.remove('logged-in');
    btnLock.querySelector('.lock-ico').textContent = '🔒';
    btnLock.querySelector('.lock-text').textContent = 'Admin';
    uploadForm?.reset();
    if(uploadPreview) uploadPreview.style.display = 'none';
    setStatus(uploadStatus, '', '');
    renderGallery();
  }

  btnLock?.addEventListener('click', () => {
    if(isLoggedIn){
      if(confirm('Anda sudah login sebagai admin.\n\nLogout sekarang?')){
        exitAdmin();
      }
    } else {
      openModal();
    }
  });

  modalClose?.addEventListener('click', closeModal);
  loginModal?.addEventListener('click', (e) => {
    if(e.target === loginModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && loginModal.classList.contains('open')) closeModal();
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = loginPassword.value.trim();

    if(!input){
      setStatus(loginStatus, '⚠️ Password tidak boleh kosong.', 'err');
      return;
    }

    btnLogin.disabled = true;
    btnLogin.textContent = '⏳ Memeriksa...';

    setTimeout(() => {
      if(input === ADMIN_PASSWORD){
        setStatus(loginStatus, '✅ Login berhasil!', 'ok');
        setTimeout(() => {
          enterAdmin();
          btnLogin.disabled = false;
          btnLogin.textContent = '🔓 Masuk';
        }, 500);
      } else {
        setStatus(loginStatus, '❌ Password salah. Coba lagi.', 'err');
        loginPassword.value = '';
        loginPassword.focus();
        btnLogin.disabled = false;
        btnLogin.textContent = '🔓 Masuk';
      }
    }, 350);
  });

  btnLogout?.addEventListener('click', () => {
    if(!confirm('Yakin ingin logout dari panel admin?')) return;
    exitAdmin();
  });

  if(sessionStorage.getItem(SESSION_KEY) === '1'){
    isLoggedIn = true;
    adminUploadSection.style.display = 'block';
    btnToggleDelete.style.display = 'inline-flex';
    btnLock.classList.add('logged-in');
    btnLock.querySelector('.lock-ico').textContent = '🔓';
    btnLock.querySelector('.lock-text').textContent = 'Admin (Login)';
  }

  uploadFile?.addEventListener('change', () => {
    const file = uploadFile.files[0];
    if(!file){ uploadPreview.style.display = 'none'; return; }
    const reader = new FileReader();
    reader.onload = e => {
      uploadPreview.src = e.target.result;
      uploadPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!isLoggedIn){
      setStatus(uploadStatus, '⚠️ Silakan login dulu.', 'err');
      return;
    }

    const judul    = uploadJudul.value.trim();
    const kategori = uploadKategori.value;
    const file     = uploadFile.files[0];

    if(!judul){ setStatus(uploadStatus, '⚠️ Judul wajib diisi.', 'err'); return; }
    if(!file){ setStatus(uploadStatus, '⚠️ Pilih gambar dulu.', 'err'); return; }

    btnUpload.disabled = true;
    btnUpload.innerHTML = '⏳ Mengupload...';
    setStatus(uploadStatus, 'Mengupload ke Supabase...', 'info');

    try {
      await uploadGambarGaleri(file, judul, kategori);
      setStatus(uploadStatus, '✅ Berhasil upload!', 'ok');
      uploadForm.reset();
      uploadPreview.style.display = 'none';
      await loadGallery();
      setTimeout(() => setStatus(uploadStatus, '', ''), 2200);
    } catch(err){
      console.error(err);
      setStatus(uploadStatus, '❌ Gagal: ' + (err.message || err), 'err');
    } finally {
      btnUpload.disabled = false;
      btnUpload.innerHTML = '⬆️ Upload ke Galeri';
    }
  });

  btnResetUpload?.addEventListener('click', () => {
    uploadForm.reset();
    uploadPreview.style.display = 'none';
    setStatus(uploadStatus, '', '');
  });

  async function loadGallery(){
    setStatus(galleryStatus, 'Memuat galeri...', 'info');
    try {
      galleryItems = await ambilSemuaGambar();
      renderGallery();
      setStatus(galleryStatus, `✅ ${galleryItems.length} gambar dimuat.`, 'ok');
      setTimeout(() => setStatus(galleryStatus, '', ''), 1600);
    } catch(err){
      console.error(err);
      setStatus(galleryStatus, '❌ Gagal memuat: ' + (err.message || err), 'err');
    }
  }

  function renderGallery(){
    const q = (gallerySearch?.value || '').toLowerCase().trim();
    const filtered = q
      ? galleryItems.filter(it =>
          it.judul.toLowerCase().includes(q) ||
          it.kategori.toLowerCase().includes(q))
      : galleryItems;

    if(filtered.length === 0){
      galleryGrid.innerHTML = '<div class="gallery-empty">📭 Belum ada gambar' +
        (q ? ' yang cocok dengan pencarian.' : '.') + '</div>';
      return;
    }

    galleryGrid.innerHTML = filtered.map(item => `
      <div class="gallery-card ${deleteMode ? 'delete-mode' : ''}" data-file="${item.fileName}">
        <div class="gallery-thumb" style="background-image:url('${item.url}')">
          <span class="gallery-cat">${escapeHtml(item.kategori)}</span>
        </div>
        <div class="gallery-info">
          <h4>${escapeHtml(item.judul)}</h4>
          <span class="gallery-date">📅 ${item.tanggal}</span>
        </div>
        ${isLoggedIn ? `<button class="gallery-delete" data-file="${item.fileName}" title="Hapus gambar">🗑️</button>` : ''}
      </div>
    `).join('');

    galleryGrid.querySelectorAll('.gallery-thumb').forEach(el => {
      el.addEventListener('click', (e) => {
        if(deleteMode) return;
        const file = e.currentTarget.parentElement.dataset.file;
        const item = galleryItems.find(i => i.fileName === file);
        if(item) window.open(item.url, '_blank');
      });
    });

    galleryGrid.querySelectorAll('.gallery-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if(!isLoggedIn){
          alert('⚠️ Silakan login dulu untuk menghapus.');
          return;
        }

        const fileName = btn.dataset.file;
        const item = galleryItems.find(i => i.fileName === fileName);

        if(!confirm(`Hapus gambar:\n"${item?.judul || fileName}"?\n\nTindakan ini tidak bisa dibatalkan.`)) return;

        btn.disabled = true;
        btn.textContent = '⏳';
        setStatus(galleryStatus, 'Menghapus...', 'info');

        try {
          await hapusGambar(fileName);
          galleryItems = galleryItems.filter(i => i.fileName !== fileName);
          renderGallery();
          setStatus(galleryStatus, '🗑️ Gambar berhasil dihapus.', 'ok');
          setTimeout(() => setStatus(galleryStatus, '', ''), 1600);
        } catch(err){
          console.error(err);
          setStatus(galleryStatus, '❌ Gagal hapus: ' + (err.message || err), 'err');
          btn.disabled = false;
          btn.textContent = '🗑️';
        }
      });
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  gallerySearch?.addEventListener('input', renderGallery);

  btnRefresh?.addEventListener('click', () => {
    btnRefresh.disabled = true;
    btnRefresh.textContent = '⏳ Memuat...';
    loadGallery().finally(() => {
      btnRefresh.disabled = false;
      btnRefresh.textContent = '🔄 Refresh';
    });
  });

  btnToggleDelete?.addEventListener('click', () => {
    if(!isLoggedIn){
      alert('⚠️ Silakan login dulu.');
      return;
    }
    deleteMode = !deleteMode;
    btnToggleDelete.textContent = '🗑️ Mode Hapus: ' + (deleteMode ? 'ON' : 'OFF');
    btnToggleDelete.classList.toggle('active', deleteMode);
    renderGallery();
  });

  const observer = new MutationObserver(() => {
    const galeriPage = document.getElementById('page-galeri');
    if(galeriPage && galeriPage.classList.contains('active') && galleryItems.length === 0){
      loadGallery();
    }
  });

  document.querySelectorAll('.page').forEach(p => {
    observer.observe(p, { attributes:true, attributeFilter:['class'] });
  });

  if(document.getElementById('page-galeri')?.classList.contains('active')){
    loadGallery();
  }
})();

/* ============================================================
   HOME SLIDER GALERI
   ============================================================ */
(function(){
  const track    = document.getElementById('homeSliderTrack');
  const btnPrev  = document.getElementById('sliderPrev');
  const btnNext  = document.getElementById('sliderNext');
  const dotsWrap = document.getElementById('sliderDots');

  if(!track) return;

  let currentIdx = 0;
  let autoTimer  = null;
  let isLoaded   = false;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  async function loadSliderData(){
    if(isLoaded) return;
    try {
      const items = await ambilSemuaGambar();
      renderSlides(items);
      isLoaded = true;
    } catch(err){
      console.error('Slider error:', err);
      track.innerHTML = '<div class="slider-empty">📭 Belum ada gambar. Tambahkan lewat halaman Galeri.</div>';
      if(btnPrev) btnPrev.style.display = 'none';
      if(btnNext) btnNext.style.display = 'none';
    }
  }

  function renderSlides(items){
    if(!items || items.length === 0){
      track.innerHTML = '<div class="slider-empty">📭 Belum ada gambar. Tambahkan lewat halaman Galeri.</div>';
      if(btnPrev) btnPrev.style.display = 'none';
      if(btnNext) btnNext.style.display = 'none';
      return;
    }

    const list = items.slice(0, 10);

    track.innerHTML = list.map(item => `
      <div class="slide-item" data-url="${item.url}" style="background-image:url('${item.url}')">
        <span class="slide-cat">${escapeHtmlSlider(item.kategori)}</span>
        <div class="slide-info">
          <h4>${escapeHtmlSlider(item.judul)}</h4>
          <span>📅 ${item.tanggal}</span>
        </div>
      </div>
    `).join('');

    track.querySelectorAll('.slide-item').forEach(el => {
      el.addEventListener('click', () => {
        window.open(el.dataset.url, '_blank');
      });
    });

    buildDots(list.length);
    updateNavButtons();

    if(!prefersReducedMotion){
      startAutoSlide();
      track.addEventListener('mouseenter', stopAutoSlide);
      track.addEventListener('mouseleave', startAutoSlide);
    }

    track.addEventListener('scroll', debounce(onScroll, 100));

    // Pause saat tab tidak aktif
    document.addEventListener('visibilitychange', () => {
      if(document.hidden) stopAutoSlide();
      else if(!prefersReducedMotion) startAutoSlide();
    });
  }

  function escapeHtmlSlider(s){
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function buildDots(count){
    if(!dotsWrap) return;
    dotsWrap.innerHTML = '';
    for(let i = 0; i < count; i++){
      const dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Slide ' + (i + 1));
      dot.addEventListener('click', () => {
        goToSlide(i);
        restartAutoSlide();
      });
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots(idx){
    if(!dotsWrap) return;
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
  }

  function getSlideWidth(){
    const first = track.querySelector('.slide-item');
    if(!first) return 0;
    const gap = 20;
    return first.offsetWidth + gap;
  }

  function goToSlide(idx){
    const slidesAll = track.querySelectorAll('.slide-item');
    if(slidesAll.length === 0) return;

    idx = Math.max(0, Math.min(idx, slidesAll.length - 1));
    currentIdx = idx;

    const w = getSlideWidth();
    track.scrollTo({ left: idx * w, behavior: 'smooth' });
    updateDots(idx);
    updateNavButtons();
  }

  function nextSlide(){
    const total = track.querySelectorAll('.slide-item').length;
    if(total === 0) return;
    if(currentIdx >= total - 1){
      goToSlide(0);
    } else {
      goToSlide(currentIdx + 1);
    }
  }

  function prevSlide(){
    const total = track.querySelectorAll('.slide-item').length;
    if(total === 0) return;
    if(currentIdx <= 0){
      goToSlide(total - 1);
    } else {
      goToSlide(currentIdx - 1);
    }
  }

  btnNext?.addEventListener('click', () => { nextSlide(); restartAutoSlide(); });
  btnPrev?.addEventListener('click', () => { prevSlide(); restartAutoSlide(); });

  function updateNavButtons(){
    if(btnPrev) btnPrev.disabled = false;
    if(btnNext) btnNext.disabled = false;
  }

  function startAutoSlide(){
    stopAutoSlide();
    autoTimer = setInterval(nextSlide, 4000);
  }
  function stopAutoSlide(){
    if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
  }
  function restartAutoSlide(){
    stopAutoSlide();
    if(!prefersReducedMotion) startAutoSlide();
  }

  function onScroll(){
    const w = getSlideWidth();
    if(!w) return;
    const idx = Math.round(track.scrollLeft / w);
    if(idx !== currentIdx){
      currentIdx = idx;
      updateDots(idx);
    }
  }

  function debounce(fn, delay){
    let t;
    return function(...args){
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const homeObserver = new MutationObserver(() => {
    const homePage = document.getElementById('page-home');
    if(homePage && homePage.classList.contains('active')){
      loadSliderData();
      if(isLoaded && !prefersReducedMotion) startAutoSlide();
    } else {
      stopAutoSlide();
    }
  });

  document.querySelectorAll('.page').forEach(p => {
    homeObserver.observe(p, { attributes: true, attributeFilter: ['class'] });
  });

  if(document.getElementById('page-home')?.classList.contains('active')){
    loadSliderData();
  }

  window.addEventListener('resize', debounce(() => {
    if(isLoaded) goToSlide(currentIdx);
  }, 200));
})();

/* ============================================================
   INIT
   ============================================================ */
document.getElementById('year').textContent = new Date().getFullYear();

window.addEventListener('DOMContentLoaded', () => {
  const hash = location.hash.replace('#','');
  if(pages.includes(hash)) showPage(hash);
  initReveal();
  initMagneticButtons();
  updateScrollProgress();
});