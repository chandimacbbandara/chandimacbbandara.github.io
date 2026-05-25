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
});
