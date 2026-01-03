// static/js/dark-mode.js
// Robust dark/light toggler with guaranteed "Services we provide" lock.
// Replaces previous dark-mode.js. Will:
//  - toggle dark-mode class on <body>
//  - remember preference in localStorage
//  - find the heading text "Services we provide" (case-insensitive) and the nearby subtitle
//  - apply inline styles with !important so those two lines remain visible in dark mode
(function () {
  const storageKey = "site-theme";
  const className = "dark-mode";
  const body = document.body;

  // This is the main text we are protecting (case-insensitive)
  const HEADING_TEXT = "services we provide";
  // Some possible starting words for the subtitle to detect it reliably
  const SUBTITLE_SNIPPETS = ["here are some", "here are some of the services", "here are some of the services we provide"];

  // Utility: normalize string for matching
  function norm(s) {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  // Find heading element(s) that match the exact visible text
  function findServiceHeadingElements() {
    const matches = [];
    const headingSelector = "h1,h2,h3,h4,h5,h6";
    const headings = document.querySelectorAll(headingSelector);
    headings.forEach(h => {
      const t = norm(h.textContent);
      if (!t) return;
      if (t.includes(HEADING_TEXT)) {
        // found heading
        // find subtitle: prefer next sibling paragraph/text node with some text
        let subtitleEl = null;
        // check nextElementSibling chain up to a couple nodes
        let next = h.nextElementSibling;
        let checks = 0;
        while (next && checks < 6) {
          const nt = norm(next.textContent);
          if (nt && nt.length > 5) {
            // check if it looks like the subtitle by containing known snippet OR length not too long
            const looksLikeSubtitle = SUBTITLE_SNIPPETS.some(sn => nt.includes(sn)) || nt.length < 200;
            if (looksLikeSubtitle) {
              subtitleEl = next;
              break;
            }
          }
          next = next.nextElementSibling;
          checks++;
        }

        // if not found, try parent/child search (some templates nest)
        if (!subtitleEl) {
          const parent = h.parentElement;
          if (parent) {
            const pCandidates = parent.querySelectorAll("p,div");
            for (let el of pCandidates) {
              const nt = norm(el.textContent);
              if (nt && nt.length > 5 && nt !== norm(h.textContent)) {
                if (SUBTITLE_SNIPPETS.some(sn => nt.includes(sn)) || nt.length < 200) {
                  subtitleEl = el;
                  break;
                }
              }
            }
          }
        }

        // find container block to lock background (closest ancestor section/div with class 'bar' or with background)
        let container = h.closest("section,div");
        // try to find the ancestor with a background image or class 'bar' or 'background-white'
        let candidate = h.closest(".bar, .background-white, .background-gray");
        if (candidate) container = candidate;

        matches.push({ heading: h, subtitle: subtitleEl, container: container });
      }
    });
    return matches;
  }

  // Apply inline styles (with priority) to force light look for this section
  function applyLockToMatch(m, enable) {
    const { heading, subtitle, container } = m;

    function setImportant(el, prop, val) {
      try { el.style.setProperty(prop, val, "important"); } catch (e) {}
    }
    function removeImportant(el, prop) {
      try { el.style.removeProperty(prop); } catch (e) {}
    }

    if (enable) {
      if (container) {
        // preserve existing background-image if any by copying computed style
        try {
          const cs = window.getComputedStyle(container);
          const bgImage = cs.getPropertyValue("background-image");
          if (bgImage && bgImage !== "none") {
            setImportant(container, "background-image", bgImage);
            setImportant(container, "background-size", cs.getPropertyValue("background-size") || "cover");
            setImportant(container, "background-position", cs.getPropertyValue("background-position") || "center");
            setImportant(container, "background-repeat", cs.getPropertyValue("background-repeat") || "no-repeat");
          }
        } catch (e) {}
        setImportant(container, "background-color", "#ffffff");
        setImportant(container, "color", "#222222");
        setImportant(container, "opacity", "1");
        setImportant(container, "mix-blend-mode", "normal");
        setImportant(container, "filter", "none");
      }

      if (heading) {
        setImportant(heading, "color", "#111111");
        setImportant(heading, "opacity", "1");
        setImportant(heading, "text-shadow", "none");
      }
      if (subtitle) {
        setImportant(subtitle, "color", "#555555");
        setImportant(subtitle, "opacity", "1");
        setImportant(subtitle, "text-shadow", "none");
      }

      // enforce on all descendant text nodes as well (children)
      try {
        const root = container || (heading && heading.parentElement) || document;
        root.querySelectorAll("*").forEach(function (el) {
          // skip SVG paths to avoid breaking icons
          if (el.tagName && el.tagName.toLowerCase().indexOf("svg") !== -1) return;
          setImportant(el, "color", "#222222");
          setImportant(el, "opacity", "1");
          setImportant(el, "mix-blend-mode", "normal");
          setImportant(el, "filter", "none");
        });
      } catch (e) {}
    } else {
      // remove the inline properties we set
      if (container) {
        removeImportant(container, "background-image");
        removeImportant(container, "background-size");
        removeImportant(container, "background-position");
        removeImportant(container, "background-repeat");
        removeImportant(container, "background-color");
        removeImportant(container, "color");
        removeImportant(container, "opacity");
        removeImportant(container, "mix-blend-mode");
        removeImportant(container, "filter");
      }
      if (heading) {
        removeImportant(heading, "color");
        removeImportant(heading, "opacity");
        removeImportant(heading, "text-shadow");
      }
      if (subtitle) {
        removeImportant(subtitle, "color");
        removeImportant(subtitle, "opacity");
        removeImportant(subtitle, "text-shadow");
      }
      try {
        const root = container || (heading && heading.parentElement) || document;
        root.querySelectorAll("*").forEach(function (el) {
          if (el.tagName && el.tagName.toLowerCase().indexOf("svg") !== -1) return;
          removeImportant(el, "color");
          removeImportant(el, "opacity");
          removeImportant(el, "mix-blend-mode");
          removeImportant(el, "filter");
        });
      } catch (e) {}
    }
  }

  // Apply lock to all matches
  function applyServicesLock(enable) {
    const matches = findServiceHeadingElements();
    if (!matches || matches.length === 0) return false;
    matches.forEach(function (m) { applyLockToMatch(m, enable); });
    return matches.length;
  }

  // Toggle theme class and apply locks
  function applyTheme(theme) {
    if (theme === "dark") {
      body.classList.add(className);
      applyServicesLock(true);
    } else {
      body.classList.remove(className);
      applyServicesLock(false);
    }
    updateToggleIcons(theme);
  }

  // Icon updater (moon <-> sun)
  function updateToggleIcons(theme) {
    const toggles = document.querySelectorAll("#theme-toggle, .theme-toggle");
    toggles.forEach(function (el) {
      const icon = el.querySelector(".fa") || el;
      if (!icon) return;
      if (theme === "dark") {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
      } else {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
      }
    });
  }

  // Read saved preference safely
  function readSaved() {
    try { return localStorage.getItem(storageKey); } catch (e) { return null; }
  }

  // Init & wiring
  document.addEventListener("DOMContentLoaded", function () {
    const saved = readSaved();
    const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = saved || (systemPrefersDark ? "dark" : "light");

    applyTheme(initialTheme);

    // wire toggle elements
    const els = document.querySelectorAll("#theme-toggle, .theme-toggle");
    els.forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e && e.preventDefault) e.preventDefault();
        const isDark = body.classList.contains(className);
        const next = isDark ? "light" : "dark";
        try { localStorage.setItem(storageKey, next); } catch (err) {}
        applyTheme(next);
      });
    });

    // re-apply lock after load and on small delays in case theme manipulates DOM
    const reapply = function () {
      const isDarkNow = body.classList.contains(className);
      applyServicesLock(isDarkNow);
    };
    window.addEventListener("load", reapply);
    [200, 600, 1200, 2500].forEach(function (d) { setTimeout(reapply, d); });

    // Observe body.class changes
    try {
      const observer = new MutationObserver(function (mutations) {
        for (const m of mutations) {
          if (m.type === "attributes" && m.attributeName === "class") {
            const isDarkNow = body.classList.contains(className);
            applyServicesLock(isDarkNow);
            updateToggleIcons(isDarkNow ? "dark" : "light");
          }
        }
      });
      observer.observe(body, { attributes: true });
    } catch (e) {}
  });

  // react to system preference changes only if user hasn't selected preference
  if (window.matchMedia) {
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        const saved2 = readSaved();
        if (!saved2) applyTheme(e.matches ? "dark" : "light");
      });
    } catch (err) {
      try {
        window.matchMedia("(prefers-color-scheme: dark)").addListener(function (e) {
          const saved2 = readSaved();
          if (!saved2) applyTheme(e.matches ? "dark" : "light");
        });
      } catch (err2) {}
    }
  }
})();
