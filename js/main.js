document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeIcon = document.querySelector(".theme-icon");
  const typewriter = document.querySelector(".typewriter");
  const body = document.body;

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
      });
    });
  }

  const setTheme = (theme) => {
    body.classList.toggle("theme-light", theme === "light");
    body.classList.toggle("theme-dark", theme !== "light");
    if (themeIcon) {
      themeIcon.textContent = theme === "light" ? "☾" : "☀";
    }
  };

  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = body.classList.contains("theme-light") ? "dark" : "light";
      localStorage.setItem("theme", nextTheme);
      setTheme(nextTheme);
    });
  }

  if (typewriter) {
    const phrases = typewriter.dataset.phrases
      ? typewriter.dataset.phrases.split("|")
      : [];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      if (phrases.length === 0) {
        return;
      }

      const current = phrases[phraseIndex];
      const displayed = current.slice(0, charIndex);
      typewriter.textContent = displayed;

      if (!isDeleting && charIndex < current.length) {
        charIndex += 1;
      } else if (isDeleting && charIndex > 0) {
        charIndex -= 1;
      } else {
        isDeleting = !isDeleting;
        if (!isDeleting) {
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }

      const delay = isDeleting ? 60 : 90;
      const pause = !isDeleting && charIndex === current.length ? 1200 : 0;
      setTimeout(type, pause || delay);
    };

    type();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((element) => {
    observer.observe(element);
    // Trigger immediately if element is already in viewport on page load
    if (element.getBoundingClientRect().top < window.innerHeight) {
      element.classList.add("is-visible");
    }
  });

  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      const target = document.querySelector(targetId);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  document.querySelectorAll(".carousel").forEach((carousel) => {
    const track = carousel.querySelector(".carousel-track");
    if (!track) {
      return;
    }

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const onPointerDown = (event) => {
      isDown = true;
      startX = event.pageX || event.touches[0].pageX;
      scrollLeft = track.scrollLeft;
    };

    const onPointerMove = (event) => {
      if (!isDown) {
        return;
      }
      const x = event.pageX || event.touches[0].pageX;
      const walk = (x - startX) * 1.2;
      track.scrollLeft = scrollLeft - walk;
    };

    const onPointerUp = () => {
      isDown = false;
    };

    track.addEventListener("mousedown", onPointerDown);
    track.addEventListener("touchstart", onPointerDown, { passive: true });
    track.addEventListener("mousemove", onPointerMove);
    track.addEventListener("touchmove", onPointerMove, { passive: true });
    track.addEventListener("mouseup", onPointerUp);
    track.addEventListener("mouseleave", onPointerUp);
    track.addEventListener("touchend", onPointerUp);

    const autoplayDelay = Number(carousel.dataset.autoplay) || 5000;
    let autoplayTimer = null;

    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimer = window.setInterval(() => {
        const slideWidth = track.clientWidth * 0.72;
        const maxScroll = track.scrollWidth - track.clientWidth;
        const nextScroll = Math.min(track.scrollLeft + slideWidth, maxScroll);
        track.scrollTo({ left: nextScroll, behavior: "smooth" });
        if (nextScroll >= maxScroll - 4) {
          track.scrollTo({ left: 0, behavior: "smooth" });
        }
      }, autoplayDelay);
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    startAutoplay();
  });

  const lightbox = document.querySelector("#lightbox");
  const lightboxImage = document.querySelector(".lightbox-image");
  const lightboxClose = document.querySelector(".lightbox-close");
  const lightboxTriggers = document.querySelectorAll("img[data-lightbox]");

  if (lightbox && lightboxImage && lightboxTriggers.length > 0) {
    const openLightbox = (image) => {
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt || "Preview";
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      body.classList.add("lightbox-open");
    };

    const closeLightbox = () => {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImage.src = "";
      lightboxImage.alt = "";
      body.classList.remove("lightbox-open");
    };

    lightboxTriggers.forEach((image) => {
      image.addEventListener("click", () => openLightbox(image));
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }
});
