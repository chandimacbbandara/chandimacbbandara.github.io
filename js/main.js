/* ================================================================
   CHANDIMA BANDARA – PORTFOLIO
   Interactive Engine v2
   ================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  /* ==================== SCROLL PROGRESS BAR ==================== */
  const scrollProgress = document.getElementById("scrollProgress");

  const updateScrollProgress = () => {
    if (!scrollProgress) return;
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = progress + "%";
  };

  /* ==================== HEADER SCROLL EFFECT ==================== */
  const header = document.querySelector(".site-header");

  const updateHeaderState = () => {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  };

  /* ==================== SCROLL TO TOP ==================== */
  const scrollTopBtn = document.getElementById("scrollTop");

  const updateScrollTopBtn = () => {
    if (!scrollTopBtn) return;
    scrollTopBtn.classList.toggle("visible", window.scrollY > 400);
  };

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Unified scroll handler */
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateHeaderState();
        updateScrollTopBtn();
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==================== MOBILE NAV TOGGLE ==================== */
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      navToggle.classList.toggle("active", isOpen);
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
      });
    });

    document.addEventListener("click", (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
      }
    });
  }

  /* ==================== THEME TOGGLE ==================== */
  const themeToggle = document.querySelector(".theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");

  const setTheme = (theme) => {
    body.classList.toggle("theme-light", theme === "light");
    body.classList.toggle("theme-dark", theme !== "light");
    if (themeIcon) {
      themeIcon.textContent = theme === "light" ? "☾" : "☀";
    }
  };

  setTheme(localStorage.getItem("theme") || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = body.classList.contains("theme-light") ? "dark" : "light";
      localStorage.setItem("theme", next);
      setTheme(next);
    });
  }

  /* ==================== TYPEWRITER ==================== */
  const typewriter = document.querySelector(".typewriter");

  if (typewriter) {
    const phrases = typewriter.dataset.phrases
      ? typewriter.dataset.phrases.split("|")
      : [];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      if (phrases.length === 0) return;

      const current = phrases[phraseIndex];
      typewriter.textContent = current.slice(0, charIndex);

      if (!isDeleting && charIndex < current.length) {
        charIndex++;
      } else if (isDeleting && charIndex > 0) {
        charIndex--;
      } else {
        isDeleting = !isDeleting;
        if (!isDeleting) {
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      const delay = isDeleting ? 45 : 75;
      const pause = !isDeleting && charIndex === current.length ? 1600 : 0;
      setTimeout(type, pause || delay);
    };

    type();
  }

  /* ==================== REVEAL ON SCROLL ==================== */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );

  document
    .querySelectorAll(".reveal, .reveal-left, .reveal-right")
    .forEach((el) => {
      revealObserver.observe(el);
      /* Show immediately if already in view */
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add("is-visible");
      }
    });

  /* ==================== SMOOTH ANCHOR SCROLL ==================== */
  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 8 : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  /* ==================== CAROUSEL (DRAG / SWIPE) ==================== */
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let dragged = false;

    const getX = (e) => (e.pageX ?? e.touches?.[0]?.pageX) || 0;

    const onDown = (e) => {
      isDown = true;
      startX = getX(e);
      scrollLeft = track.scrollLeft;
      dragged = false;
    };

    const onMove = (e) => {
      if (!isDown) return;
      const deltaX = getX(e) - startX;
      if (Math.abs(deltaX) > 8) {
        dragged = true;
      }
      const walk = deltaX * 1.3;
      track.scrollLeft = scrollLeft - walk;
    };

    const onUp = () => {
      isDown = false;
    };

    track.addEventListener("mousedown", onDown);
    track.addEventListener("touchstart", onDown, { passive: true });
    track.addEventListener("mousemove", onMove);
    track.addEventListener("touchmove", onMove, { passive: true });
    track.addEventListener("mouseup", onUp);
    track.addEventListener("mouseleave", onUp);
    track.addEventListener("touchend", onUp);

    track.addEventListener("click", (e) => {
      if (dragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    /* Auto-play */
    const delay = Number(carousel.dataset.autoplay) || 5000;
    let timer = null;

    const start = () => {
      stop();
      timer = setInterval(() => {
        const slideW = track.clientWidth * 0.72;
        const max = track.scrollWidth - track.clientWidth;
        const next = Math.min(track.scrollLeft + slideW, max);
        track.scrollTo({ left: next, behavior: "smooth" });
        if (next >= max - 4) {
          setTimeout(() => track.scrollTo({ left: 0, behavior: "smooth" }), 600);
        }
      }, delay);
    };

    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);
    start();
  });

  /* ==================== LIGHTBOX ==================== */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.querySelector(".lightbox-image");
  const lightboxClose = document.querySelector(".lightbox-close");
  const triggers = document.querySelectorAll("img[data-lightbox]");

  if (lightbox && lightboxImg && triggers.length > 0) {
    const open = (img) => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || "Preview";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      body.classList.add("no-scroll");
    };

    const close = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImg.src = "";
      lightboxImg.alt = "";
      body.classList.remove("no-scroll");
    };

    triggers.forEach((img) => img.addEventListener("click", () => open(img)));
    if (lightboxClose) lightboxClose.addEventListener("click", close);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) close();
    });
  }
});
