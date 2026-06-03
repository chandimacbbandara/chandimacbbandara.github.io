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

  /* ==================== SCROLL SPY ==================== */
  const navAnchors = document.querySelectorAll(".nav-links a[href^='#']");
  const sections = [];
  navAnchors.forEach((a) => {
    const id = a.getAttribute("href");
    const section = document.querySelector(id);
    if (section) sections.push({ el: section, link: a });
  });

  const updateScrollSpy = () => {
    if (sections.length === 0) return;
    const scrollY = window.scrollY + (header ? header.offsetHeight + 60 : 60);
    let current = sections[0];
    for (const s of sections) {
      if (scrollY >= s.el.offsetTop) current = s;
    }
    navAnchors.forEach((a) => a.classList.remove("active"));
    current.link.classList.add("active");
  };

  /* Unified scroll handler */
  let ticking = false;
  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollProgress();
        updateHeaderState();
        updateScrollTopBtn();
        updateScrollSpy();
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
    .querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
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

  /* ==================== LIGHTBOX (GALLERY NAVIGATION) ==================== */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.querySelector(".lightbox-image");
  const lightboxClose = document.querySelector(".lightbox-close");
  const triggers = [...document.querySelectorAll("img[data-lightbox]")];
  let currentLightboxIndex = -1;

  if (lightbox && lightboxImg && triggers.length > 0) {
    // Add nav buttons and counter
    const prevBtn = document.createElement("button");
    prevBtn.className = "lightbox-nav prev";
    prevBtn.setAttribute("aria-label", "Previous image");
    prevBtn.innerHTML = "&#8249;";
    const nextBtn = document.createElement("button");
    nextBtn.className = "lightbox-nav next";
    nextBtn.setAttribute("aria-label", "Next image");
    nextBtn.innerHTML = "&#8250;";
    const counter = document.createElement("div");
    counter.className = "lightbox-counter";
    lightbox.appendChild(prevBtn);
    lightbox.appendChild(nextBtn);
    lightbox.appendChild(counter);

    const showImage = (index) => {
      if (index < 0 || index >= triggers.length) return;
      currentLightboxIndex = index;
      lightboxImg.src = triggers[index].src;
      lightboxImg.alt = triggers[index].alt || "Preview";
      counter.textContent = `${index + 1} / ${triggers.length}`;
      prevBtn.style.display = index === 0 ? "none" : "grid";
      nextBtn.style.display = index === triggers.length - 1 ? "none" : "grid";
    };

    const open = (index) => {
      showImage(index);
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
      currentLightboxIndex = -1;
    };

    triggers.forEach((img, i) => img.addEventListener("click", () => open(i)));
    if (lightboxClose) lightboxClose.addEventListener("click", close);
    prevBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentLightboxIndex - 1); });
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); showImage(currentLightboxIndex + 1); });
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" && currentLightboxIndex > 0) showImage(currentLightboxIndex - 1);
      if (e.key === "ArrowRight" && currentLightboxIndex < triggers.length - 1) showImage(currentLightboxIndex + 1);
    });
  }

  /* ==================== PAGE LOADER ==================== */
  const pageLoader = document.querySelector(".page-loader");
  if (pageLoader) {
    window.addEventListener("load", () => {
      setTimeout(() => pageLoader.classList.add("loaded"), 200);
    });
  }

  /* ==================== PARTICLE CANVAS ==================== */
  const heroCanvas = document.getElementById("heroCanvas");
  if (heroCanvas) {
    const ctx = heroCanvas.getContext("2d");
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let canvasW, canvasH;
    const PARTICLE_COUNT = window.innerWidth < 768 ? 30 : 60;
    const CONNECTION_DIST = 120;
    const MOUSE_DIST = 150;

    const resize = () => {
      const hero = heroCanvas.parentElement;
      canvasW = heroCanvas.width = hero.offsetWidth;
      canvasH = heroCanvas.height = hero.offsetHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvasW;
        this.y = Math.random() * canvasH;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.r = Math.random() * 2 + 1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvasW) this.vx *= -1;
        if (this.y < 0 || this.y > canvasH) this.vy *= -1;
        // Mouse repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.03;
          this.vx += dx * force;
          this.vy += dy * force;
        }
        // Clamp velocity
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 1.5) {
          this.vx = (this.vx / speed) * 1.5;
          this.vy = (this.vy / speed) * 1.5;
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);
      const isLight = body.classList.contains("theme-light");
      const particleColor = isLight ? "rgba(0, 102, 255," : "rgba(0, 212, 255,";
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        ctx.fillStyle = particleColor + "0.5)";
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particleColor + (0.15 * (1 - dist / CONNECTION_DIST)) + ")";
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    };

    heroCanvas.parentElement.addEventListener("mousemove", (e) => {
      const rect = heroCanvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    heroCanvas.parentElement.addEventListener("mouseleave", () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    window.addEventListener("resize", resize);
    init();
    animate();
  }

  /* ==================== ANIMATED COUNTERS ==================== */
  const counters = document.querySelectorAll(".stat-number");
  if (counters.length > 0) {
    const animateCounter = (el) => {
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || "";
      const duration = 2000;
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(eased * target);
        el.textContent = current + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach((c) => counterObserver.observe(c));
  }

  /* ==================== CURSOR GLOW ==================== */
  const cursorGlow = document.querySelector(".cursor-glow");
  if (cursorGlow && window.matchMedia("(min-width: 901px)").matches) {
    let glowX = 0, glowY = 0, targetX = 0, targetY = 0;
    document.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!cursorGlow.classList.contains("active")) cursorGlow.classList.add("active");
    });
    const updateGlow = () => {
      glowX += (targetX - glowX) * 0.08;
      glowY += (targetY - glowY) * 0.08;
      cursorGlow.style.left = glowX + "px";
      cursorGlow.style.top = glowY + "px";
      requestAnimationFrame(updateGlow);
    };
    updateGlow();
  }

  /* ==================== CAROUSEL CONTROLS ==================== */
  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    if (!track) return;
    const items = track.querySelectorAll("img, video");
    if (items.length < 2) return;

    // Create prev/next buttons
    const prevBtn = document.createElement("button");
    prevBtn.className = "carousel-btn prev";
    prevBtn.setAttribute("aria-label", "Previous slide");
    prevBtn.innerHTML = "&#8249;";
    const nextBtn = document.createElement("button");
    nextBtn.className = "carousel-btn next";
    nextBtn.setAttribute("aria-label", "Next slide");
    nextBtn.innerHTML = "&#8250;";
    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);

    // Create dots
    const dotsContainer = document.createElement("div");
    dotsContainer.className = "carousel-dots";
    items.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => {
        items[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      dotsContainer.appendChild(dot);
    });
    carousel.after(dotsContainer);

    // Scroll handlers
    const getSlideWidth = () => items[0]?.offsetWidth + 16 || track.clientWidth * 0.72;

    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -getSlideWidth(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: getSlideWidth(), behavior: "smooth" });
    });

    // Update dots on scroll
    let dotTicking = false;
    track.addEventListener("scroll", () => {
      if (!dotTicking) {
        requestAnimationFrame(() => {
          const scrollLeft = track.scrollLeft;
          const slideW = getSlideWidth();
          const activeIndex = Math.round(scrollLeft / slideW);
          dotsContainer.querySelectorAll(".carousel-dot").forEach((d, i) => {
            d.classList.toggle("active", i === activeIndex);
          });
          dotTicking = false;
        });
        dotTicking = true;
      }
    }, { passive: true });
  });
});
