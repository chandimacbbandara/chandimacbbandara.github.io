/* ================================================================
   CHANDIMA BANDARA — Portfolio
   Interactive Engine
================================================================ */

/* ── THEME INITIALIZATION ───────────────────────────────────── */
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
  document.documentElement.setAttribute('data-theme', 'light');
}

document.addEventListener('DOMContentLoaded', () => {

  /* ── THEME TOGGLE ─────────────────────────────────────────── */
  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      if (next === 'dark') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', next);
      }
      localStorage.setItem('theme', next);
    });
  });

  /* ── PAGE LOADER ──────────────────────────────────────────── */
  const loader = document.querySelector('.page-loader');
  if (loader) {
    const hide = () => loader.classList.add('loaded');
    window.addEventListener('load', () => setTimeout(hide, 700));
    setTimeout(hide, 3000);
  }

  /* ── SCROLL PROGRESS ──────────────────────────────────────── */
  const progress = document.getElementById('scrollProgress');
  const onScroll = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = max > 0 ? (window.scrollY / max * 100) + '%' : '0%';
  };

  /* ── HEADER SCROLL STATE ──────────────────────────────────── */
  const header = document.querySelector('.site-header');
  const updateHeader = () => {
    if (header) header.classList.toggle('scrolled', window.scrollY > 40);
  };

  /* ── SCROLL TO TOP ────────────────────────────────────────── */
  const scrollTopBtn = document.getElementById('scrollTop');
  const updateScrollTop = () => {
    if (scrollTopBtn) scrollTopBtn.classList.toggle('visible', window.scrollY > 500);
  };
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));

  /* ── UNIFIED SCROLL HANDLER ───────────────────────────────── */
  let raf = false;
  window.addEventListener('scroll', () => {
    if (!raf) {
      requestAnimationFrame(() => {
        onScroll(); updateHeader(); updateScrollTop();
        raf = false;
      });
      raf = true;
    }
  }, { passive: true });
  onScroll(); updateHeader(); updateScrollTop();

  /* ── MOBILE NAV ───────────────────────────────────────────── */
  const burger    = document.getElementById('burger') || document.querySelector('.nav-toggle');
  const panel     = document.getElementById('mobilePanel') || document.querySelector('.mobile-panel');
  const panelLinks = panel?.querySelectorAll('a') || [];

  const closePanel = () => {
    burger?.classList.remove('open');
    panel?.classList.remove('open');
    document.body.style.overflow = '';
  };
  const openPanel = () => {
    burger?.classList.add('open');
    panel?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  burger?.addEventListener('click', () => {
    panel?.classList.contains('open') ? closePanel() : openPanel();
  });
  panelLinks.forEach(a => a.addEventListener('click', closePanel));

  /* ── SMOOTH ANCHOR SCROLL ─────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = (header?.offsetHeight || 68) + 8;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        closePanel();
      }
    });
  });

  /* ── CUSTOM CURSOR ────────────────────────────────────────── */
  if (window.matchMedia('(pointer:fine)').matches) {
    const dot  = document.getElementById('cdot')  || document.querySelector('.cursor-dot');
    const ring = document.getElementById('cring') || document.querySelector('.cursor-ring');

    if (dot && ring) {
      let mx = -200, my = -200, rx = -200, ry = -200;

      window.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      });
      window.addEventListener('mouseleave', () => {
        dot.style.opacity = '0'; ring.style.opacity = '0';
      });
      window.addEventListener('mouseenter', () => {
        dot.style.opacity = '1'; ring.style.opacity = '1';
      });

      const animRing = () => {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(animRing);
      };
      animRing();

      document.querySelectorAll('a, button, .skill-pill, .filter-btn, [data-cursor]').forEach(el => {
        el.addEventListener('mouseenter', () => {
          if (el.dataset.cursor === 'view') { ring.classList.add('view'); ring.textContent = 'View'; }
          else { ring.classList.add('hover'); }
        });
        el.addEventListener('mouseleave', () => {
          ring.classList.remove('view', 'hover'); ring.textContent = '';
        });
      });
    }
  }

  /* ── HERO SIGNAL GLOW FOLLOWS CURSOR ─────────────────────── */
  const signalField = document.getElementById('signalField');
  const glow        = document.getElementById('signalGlow');
  if (signalField && glow) {
    signalField.addEventListener('mousemove', e => {
      const r = signalField.getBoundingClientRect();
      glow.style.left    = (e.clientX - r.left) + 'px';
      glow.style.top     = (e.clientY - r.top) + 'px';
      glow.style.opacity = '1';
    });
    signalField.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  }

  /* ── TYPEWRITER ───────────────────────────────────────────── */
  const typeTarget = document.getElementById('typeTarget');
  const typeData   = typeTarget?.dataset.phrases;
  if (typeTarget && typeData) {
    const phrases = typeData.split('|');
    let pi = 0, ci = 0, del = false;
    const loop = () => {
      const cur = phrases[pi];
      if (!del) {
        ci++; typeTarget.textContent = cur.slice(0, ci);
        if (ci >= cur.length) { del = true; setTimeout(loop, 1800); return; }
        setTimeout(loop, 55);
      } else {
        ci--; typeTarget.textContent = cur.slice(0, ci);
        if (ci <= 0) { del = false; pi = (pi + 1) % phrases.length; setTimeout(loop, 400); return; }
        setTimeout(loop, 28);
      }
    };
    setTimeout(loop, 1400);
  }

  /* ── SCROLL REVEAL ────────────────────────────────────────── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(el => {
    io.observe(el);
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) el.classList.add('in');
  });

  /* ── PROJECT FILTERS ──────────────────────────────────────── */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.projects-grid .project-card');
  const projectRows  = document.querySelectorAll('.projects-list .project');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      [...projectCards, ...projectRows].forEach(el => {
        const cat = el.dataset.category;
        el.style.display = (f === 'all' || cat === f) ? '' : 'none';
      });
    });
  });

  /* ── CAROUSEL ─────────────────────────────────────────────── */
  document.querySelectorAll('.carousel').forEach(carousel => {
    const track = carousel.querySelector('.carousel-track');
    if (!track) return;

    // drag
    let isDown = false, sx = 0, sl = 0, dragged = false;
    const gx = e => e.pageX ?? e.touches?.[0]?.pageX ?? 0;
    track.addEventListener('mousedown',  e => { isDown=true; sx=gx(e); sl=track.scrollLeft; dragged=false; });
    track.addEventListener('touchstart', e => { isDown=true; sx=gx(e); sl=track.scrollLeft; dragged=false; }, { passive:true });
    track.addEventListener('mousemove',  e => { if(!isDown) return; const dx=gx(e)-sx; if(Math.abs(dx)>8) dragged=true; track.scrollLeft=sl-dx*1.3; });
    track.addEventListener('touchmove',  e => { if(!isDown) return; const dx=gx(e)-sx; if(Math.abs(dx)>8) dragged=true; track.scrollLeft=sl-dx*1.3; }, { passive:true });
    const stop = () => { isDown=false; };
    track.addEventListener('mouseup',    stop);
    track.addEventListener('mouseleave', stop);
    track.addEventListener('touchend',   stop);
    track.addEventListener('click', e => { if(dragged) { e.preventDefault(); e.stopPropagation(); } }, true);

    // buttons + dots
    const items = track.querySelectorAll('img, video');
    if (items.length >= 2) {
      const pBtn = Object.assign(document.createElement('button'), { className:'carousel-btn prev', innerHTML:'&#8249;', ariaLabel:'Previous' });
      const nBtn = Object.assign(document.createElement('button'), { className:'carousel-btn next', innerHTML:'&#8250;', ariaLabel:'Next' });
      carousel.append(pBtn, nBtn);

      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'carousel-dots';
      items.forEach((_, i) => {
        const d = Object.assign(document.createElement('button'), { className:'carousel-dot' + (i===0?' active':''), ariaLabel:`Slide ${i+1}` });
        d.addEventListener('click', () => items[i].scrollIntoView({ behavior:'smooth', inline:'center', block:'nearest' }));
        dotsWrap.appendChild(d);
      });
      carousel.after(dotsWrap);

      const slideW = () => (items[0]?.offsetWidth || track.clientWidth * 0.72) + 14;
      pBtn.addEventListener('click', () => track.scrollBy({ left:-slideW(), behavior:'smooth' }));
      nBtn.addEventListener('click', () => track.scrollBy({ left: slideW(), behavior:'smooth' }));

      let dotTick = false;
      track.addEventListener('scroll', () => {
        if (!dotTick) {
          requestAnimationFrame(() => {
            const active = Math.round(track.scrollLeft / slideW());
            dotsWrap.querySelectorAll('.carousel-dot').forEach((d,i) => d.classList.toggle('active', i===active));
            dotTick = false;
          });
          dotTick = true;
        }
      }, { passive:true });
    }

    // auto-play
    const delay = Number(carousel.dataset.autoplay) || 5000;
    let timer;
    const startAuto = () => {
      clearInterval(timer);
      timer = setInterval(() => {
        const max = track.scrollWidth - track.clientWidth;
        const next = Math.min(track.scrollLeft + track.clientWidth * 0.72, max);
        track.scrollTo({ left:next, behavior:'smooth' });
        if (next >= max - 4) setTimeout(() => track.scrollTo({ left:0, behavior:'smooth' }), 600);
      }, delay);
    };
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', startAuto);
    startAuto();
  });

  /* ── LIGHTBOX ─────────────────────────────────────────────── */
  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.querySelector('.lightbox-image');
  const lbClose     = document.querySelector('.lightbox-close');
  const triggers    = [...document.querySelectorAll('img[data-lightbox]')];
  let cur = -1;

  if (lightbox && lbImg && triggers.length) {
    const pBtn = Object.assign(document.createElement('button'), { className:'lightbox-nav prev', innerHTML:'&#8249;', ariaLabel:'Previous' });
    const nBtn = Object.assign(document.createElement('button'), { className:'lightbox-nav next', innerHTML:'&#8250;', ariaLabel:'Next' });
    const ctr  = Object.assign(document.createElement('div'),    { className:'lightbox-counter' });
    lightbox.append(pBtn, nBtn, ctr);

    const show = i => {
      if (i < 0 || i >= triggers.length) return;
      cur = i; lbImg.src = triggers[i].src; lbImg.alt = triggers[i].alt || '';
      ctr.textContent = `${i+1} / ${triggers.length}`;
      pBtn.style.display = i === 0 ? 'none' : 'grid';
      nBtn.style.display = i === triggers.length-1 ? 'none' : 'grid';
    };
    const open  = i => { show(i); lightbox.classList.add('open'); document.body.style.overflow='hidden'; };
    const close = () => { lightbox.classList.remove('open'); document.body.style.overflow=''; cur=-1; };

    triggers.forEach((img,i) => img.addEventListener('click', () => open(i)));
    lbClose?.addEventListener('click', close);
    lightbox.addEventListener('click', e => { if(e.target===lightbox) close(); });
    pBtn.addEventListener('click', e => { e.stopPropagation(); show(cur-1); });
    nBtn.addEventListener('click', e => { e.stopPropagation(); show(cur+1); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key==='Escape') close();
      if (e.key==='ArrowLeft'  && cur>0) show(cur-1);
      if (e.key==='ArrowRight' && cur<triggers.length-1) show(cur+1);
    });
  }

});
