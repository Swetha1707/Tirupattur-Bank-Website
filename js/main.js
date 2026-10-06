(function () {
  "use strict";

  function tr(text) { return window.kucbTranslate ? window.kucbTranslate(text) : text; }

  // Font size preference - applied immediately so it holds across page navigations
  var FONT_SCALES = { decrease: "80%", normal: "90%", increase: "100%" };
  var storedFontSize = null;
  try { storedFontSize = window.localStorage.getItem("kucbFontSize"); } catch (e) {}

  function currentLang() {
    try { return window.localStorage.getItem("kucb-language") === "ta" ? "ta" : "en"; } catch (e) { return "en"; }
  }
  // Tamil labels are long enough that the nav bar overflows at the biggest
  // size, so in that one combination the header/nav is pinned back to its
  // normal size via CSS (.nav-scale-lock) while the page content still grows.
  function updateNavScaleLock() {
    document.body.classList.toggle("nav-scale-lock", false);
    setHeaderHeight();
  }
  function applyStoredFontSize() {
    document.documentElement.style.fontSize = FONT_SCALES[storedFontSize] || FONT_SCALES.normal;
    updateNavScaleLock();
  }
  applyStoredFontSize();
  window.addEventListener("kucb-languagechange", updateNavScaleLock);

  // Expose the header height so sticky page sub-navs can sit just below it
  var siteHeader = document.querySelector(".site-header");
  function setHeaderHeight() {
    if (siteHeader) document.documentElement.style.setProperty("--header-h", siteHeader.offsetHeight + "px");
  }
  setHeaderHeight();
  window.addEventListener("resize", setHeaderHeight);
  window.addEventListener("load", setHeaderHeight);
  window.addEventListener("kucb-languagechange", setHeaderHeight);

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Settings icon: reveal the language switcher
  var settingsToggle = document.querySelector(".settings-toggle");
  var languageMenu = document.getElementById("language-menu");
  if (settingsToggle && languageMenu) {
    function closeLanguageMenu() {
      languageMenu.classList.remove("open");
      settingsToggle.setAttribute("aria-expanded", "false");
    }
    settingsToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = languageMenu.classList.toggle("open");
      settingsToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    languageMenu.querySelectorAll("[data-language]").forEach(function (btn) {
      btn.addEventListener("click", closeLanguageMenu);
    });
    var fontButtons = languageMenu.querySelectorAll("[data-font-size]");
    if (storedFontSize) {
      fontButtons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-font-size") === storedFontSize ? "true" : "false");
      });
    }
    fontButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var size = btn.getAttribute("data-font-size");
        storedFontSize = size;
        document.documentElement.style.fontSize = FONT_SCALES[size];
        updateNavScaleLock();
        fontButtons.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        try { window.localStorage.setItem("kucbFontSize", size); } catch (e) {}
        closeLanguageMenu();
      });
    });
    document.addEventListener("click", function (e) {
      if (languageMenu.classList.contains("open") && !languageMenu.contains(e.target) && e.target !== settingsToggle) {
        closeLanguageMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && languageMenu.classList.contains("open")) {
        closeLanguageMenu();
        settingsToggle.focus();
      }
    });
  }

  // Auto-scrolling "What do you need today?" highlights
  (function () {
    var wrap = document.getElementById("quickSlides");
    var dotsWrap = document.getElementById("quickDots");
    if (!wrap || !dotsWrap) return;
    var slides = Array.prototype.slice.call(wrap.querySelectorAll(".quick-slide"));
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var index = 0, timer = null;

    slides.forEach(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Highlight " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", function () { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(i) {
      slides[index].classList.remove("is-active");
      dots[index].classList.remove("is-active");
      index = (i + slides.length) % slides.length;
      slides[index].classList.add("is-active");
      dots[index].classList.add("is-active");
    }
    function next() { goTo(index + 1); }
    function restart() {
      if (reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(next, 4200);
    }
    var aside = wrap.closest(".quick");
    aside.addEventListener("mouseenter", function () { clearInterval(timer); });
    aside.addEventListener("mouseleave", restart);
    restart();
  })();

  // Hero background: floating bokeh particles, drifting (no twinkle)
  (function () {
    var canvas = document.getElementById("heroParticles");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var particles = [];
    var palette = ["255,255,255", "201,205,210", "116,150,196"];
    var W, H, DPR, t = 0;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth;
      H = hero.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function makeParticles() {
      var count = Math.round((W * H) / 16000);
      count = Math.max(24, Math.min(50, count));
      particles = [];
      for (var i = 0; i < count; i++) {
        var big = Math.random() < 0.3;
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          size: big ? 3 + Math.random() * 3 : 1.4 + Math.random() * 1.8,
          speed: 0.12 + Math.random() * 0.26,
          sway: 10 + Math.random() * 22,
          swaySpeed: 0.15 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 0.22 + Math.random() * 0.4,
          glow: big
        });
      }
    }

    function step() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.y -= p.speed;
        p.x += Math.sin(t * p.swaySpeed + p.phase) * p.sway * 0.02;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12;
        if (p.x > W + 12) p.x = -12;

        ctx.beginPath();
        if (p.glow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(" + p.color + "," + (p.alpha * 0.9) + ")";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillStyle = "rgba(" + p.color + "," + p.alpha + ")";
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduceMotion) requestAnimationFrame(step);
    }

    function start() {
      resize();
      makeParticles();
      step();
    }
    window.addEventListener("resize", function () { resize(); makeParticles(); if (reduceMotion) step(); });
    start();
  })();

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Back to top
  var top = document.querySelector(".to-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("show", window.scrollY > 600);
    }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
  }

  // Indian number formatting
  function inr(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  // Calculators
  document.querySelectorAll("[data-calc]").forEach(function (calc) {
    var tabs = calc.querySelectorAll("[role=tab]");
    var panels = calc.querySelectorAll("[role=tabpanel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", t === tab ? "true" : "false"); });
        panels.forEach(function (p) { p.hidden = p.id !== tab.getAttribute("aria-controls"); });
      });
    });

    function val(name) { var n = parseFloat(calc.querySelector("[data-manual=" + name + "]").value); return isNaN(n) ? 0 : n; }
    function out(name, text) { var o = calc.querySelector("[data-out=" + name + "]"); if (o) o.textContent = text; }

    function update() {
      // EMI
      var P = val("loan"), R = val("lrate") / 12 / 100, N = val("tenure");
      var emi = !N ? 0 : (R === 0 ? P / N : (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1));
      out("loan", inr(P)); out("lrate", val("lrate").toFixed(1) + "%"); out("tenure", N + " " + tr("months"));
      out("emi", inr(emi)); out("interest", inr(emi * N - P)); out("total", inr(emi * N));

      // FD (quarterly compounding, as is common practice)
      var D = val("dep"), r = val("drate") / 100, y = val("years");
      var mat = D * Math.pow(1 + r / 4, 4 * y);
      out("dep", inr(D)); out("drate", val("drate").toFixed(1) + "%"); out("years", y + " " + tr(y === 1 ? "year" : "years"));
      out("mat", inr(mat)); out("earned", inr(mat - D)); out("principal", inr(D));

      // RD (monthly instalments, quarterly compounding)
      if (calc.querySelector("[data-manual=rdmonthly]")) {
        var M = val("rdmonthly"), rr = val("rdrate") / 100, n = Math.round(val("rdmonths")), rdMat = 0;
        for (var k = 1; k <= n; k++) rdMat += M * Math.pow(1 + rr / 4, (n - k + 1) / 3);
        out("rdmat", inr(rdMat)); out("rdearned", inr(rdMat - M * n)); out("rdprincipal", inr(M * n));
      }
    }
    window.addEventListener("kucb-languagechange", update);
    var loanType = calc.querySelector("[data-manual=loantype]");
    var loanRate = calc.querySelector("[data-manual=lrate]");
    if (loanType && loanRate) {
      loanType.addEventListener("change", function () {
        loanRate.value = loanType.value;
        update();
      });
    }
    var rdType = calc.querySelector("[data-manual=rdtype]");
    var rdRate = calc.querySelector("[data-manual=rdrate]");
    if (rdType && rdRate) {
      rdType.addEventListener("change", function () { rdRate.value = rdType.value; update(); });
    }
    panels.forEach(function (panel) {
      panel.querySelector("[data-action=calculate]").addEventListener("click", function () {
        update();
      });
      panel.querySelector("[data-action=cancel]").addEventListener("click", function () {
        panel.querySelectorAll("input[data-manual]").forEach(function (input) { input.value = input.defaultValue; });
        var select = panel.querySelector("select[data-manual]");
        if (select) {
          select.selectedIndex = Array.prototype.findIndex.call(select.options, function (o) { return o.defaultSelected; });
          var rateBox = panel.querySelector("input[readonly][data-manual]");
          if (rateBox) rateBox.value = select.value;
        }
        update();
      });
    });
    update();
  });

  // Enquiry form: static site, so compose an email
      var form = document.querySelector("[data-enquiry]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector(".form-msg");
      var contactField = form.elements.contact;
      var contact = contactField.value.trim();
      var digits = contact.replace(/\D/g, "");
      var isPhone = /^\+?[0-9][0-9+ ()-]*$/.test(contact) && digits.length >= 10 && digits.length <= 14;
      var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
      contactField.setCustomValidity(isPhone || isEmail ? "" : tr("Enter a valid mobile number or email address."));
      [form.elements.name, form.elements.reason].forEach(function (field) {
        if (field) field.setCustomValidity(field.value.trim() ? "" : tr("Please complete this field."));
      });
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = new FormData(form);
      var body = tr("Name:") + " " + d.get("name") + "\n" + tr("Mobile nr / email:") + " " + contact +
        "\n" + tr("Category:") + " " + tr(d.get("topic")) + "\n" + tr("Reason:") + " " + d.get("reason");
      var to = form.getAttribute("data-email") || "";
      msg.textContent = tr("Your email app should open with the enquiry ready. Review it and press Send to submit.");
      window.location.href = "mailto:" + to + "?subject=" +
        encodeURIComponent(tr("Website enquiry: ") + tr(d.get("topic"))) + "&body=" + encodeURIComponent(body);
    });
    form.addEventListener("reset", function () {
      [form.elements.contact, form.elements.name, form.elements.reason].forEach(function (field) {
        if (field) field.setCustomValidity("");
      });
      form.querySelector(".form-msg").textContent = tr("Enquiry cancelled. The form has been cleared.");
    });
  }

  // Notices & circulars filter tabs
  (function () {
    var tabs = document.querySelectorAll(".notice-tab");
    var cards = document.querySelectorAll(".notice-card");
    var empty = document.querySelector(".notice-empty");
    if (!tabs.length || !cards.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");
        var filter = tab.getAttribute("data-filter");
        var visible = 0;
        cards.forEach(function (card) {
          var show = filter === "all" || card.getAttribute("data-category") === filter;
          card.classList.toggle("is-hidden", !show);
          if (show) visible++;
        });
        if (empty) empty.hidden = visible > 0;
      });
    });
  })();

  // Deposits page: show only the selected product card
  (function () {
    var links = [].slice.call(document.querySelectorAll(".page-deposits .product-nav a"));
    var cards = [].slice.call(document.querySelectorAll(".page-deposits article.product"));
    if (!links.length || !cards.length) return;
    function show(id) {
      cards.forEach(function (c) { c.hidden = c.id !== id; });
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      });
    }
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var id = a.getAttribute("href").slice(1);
        history.replaceState(null, "", "#" + id);
        show(id);
      });
    });
    // Banner buttons: open the chosen tab and scroll down to it
    [].slice.call(document.querySelectorAll(".page-hero [data-tab]")).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var id = b.getAttribute("data-tab");
        history.replaceState(null, "", "#" + id);
        show(id);
        var nav = document.querySelector(".product-nav");
        if (nav) window.scrollTo({ top: nav.getBoundingClientRect().top + window.pageYOffset - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 54) - 8, behavior: "smooth" });
      });
    });
    var start = location.hash.slice(1);
    show(cards.some(function (c) { return c.id === start; }) ? start : cards[0].id);
  })();

  // Services page: flip cards (hover on desktop, tap on touch) built from the service tiles
  (function () {
    var tiles = [].slice.call(document.querySelectorAll(".page-services .service"));
    if (!tiles.length) return;
    tiles.forEach(function (t, i) {
      var svg = t.querySelector("svg"), title = t.querySelector("h3"), short = t.querySelector(".svc-short"), more = t.querySelector(".svc-more ul");
      if (!svg || !title || !more) return;
      var front = '<div class="lc-front"><div class="lc-top"><span class="lc-ico-w"><span class="lc-ico">' + svg.outerHTML + '</span></span></div><h3>' + title.textContent + '</h3><p class="lc-p">' + (short ? short.textContent : "") + '</p><span class="lc-cta">Hover or tap for details <i>&rarr;</i></span></div>';
      var back = '<div class="lc-back"><h4>Key features</h4>' + more.outerHTML + '</div>';
      t.className = "lc lc-3 ic" + ((i % 9) + 1);
      t.innerHTML = '<div class="lc-inner">' + front + back + "</div>";
      t.tabIndex = 0;
      t.setAttribute("role", "button");
      t.addEventListener("click", function () { t.classList.toggle("is-flip"); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t.click(); }
        if (e.key === "Escape") t.classList.remove("is-flip");
      });
    });
  })();

  // Loans page: flip cards with a details dialog
  (function () {
    if (!document.body.classList.contains("page-loans")) return;
    var arts = [].slice.call(document.querySelectorAll("article.product"));
    var nav = document.querySelector(".product-nav");
    if (!arts.length || !nav || typeof HTMLDialogElement === "undefined") return;
    var ICONS=[
       /* gold: necklace with pendant */
       '<path d="M8 6Q32 52 56 6" fill="none" stroke="#D9A521" stroke-width="3.500" stroke-linecap="round"/><circle cx="17" cy="20" r="3.500" fill="#E0AE2F"/><circle cx="47" cy="20" r="3.500" fill="#E0AE2F"/><circle cx="24" cy="31" r="3.500" fill="#E0AE2F"/><circle cx="40" cy="31" r="3.500" fill="#E0AE2F"/><path d="M32 36l7 8-7 8-7-8z" fill="#8E2A3A" stroke="#D9A521" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="58" r="4" fill="#D36B7C"/>',
       /* house construction: house with coin */
       '<rect x="16" y="14" width="6" height="12" fill="#6B1A26"/><path d="M6 32 32 10l26 22z" fill="#8E2A3A"/><rect x="12" y="32" width="40" height="22" fill="#FFEEC2"/><rect x="28" y="40" width="9" height="14" rx="1" fill="#E2B74A"/><rect x="16" y="37" width="8" height="8" fill="#E2B74A"/><rect x="40" y="37" width="8" height="8" fill="#E2B74A"/><rect x="6" y="54" width="52" height="5" rx="2.500" fill="#6B1226"/><circle cx="52" cy="14" r="8" fill="#E0AE2F" stroke="#E0A81B" stroke-width="2"/><circle cx="52" cy="14" r="3.500" fill="none" stroke="#E0A81B" stroke-width="2"/>',
       /* mortgage: bank with cash */
       '<rect x="14" y="4" width="36" height="18" rx="3" fill="#D9A521"/><circle cx="32" cy="13" r="4.500" fill="#E0D0A8"/><path d="M5 36 32 20l27 16z" fill="#E2B74A"/><rect x="11" y="38" width="7" height="14" fill="#E2B74A"/><rect x="23" y="38" width="7" height="14" fill="#E2B74A"/><rect x="34" y="38" width="7" height="14" fill="#E2B74A"/><rect x="46" y="38" width="7" height="14" fill="#E2B74A"/><rect x="5" y="54" width="54" height="6" rx="2" fill="#B81C36"/>',
       /* NHFDC: wheelchair */
       '<circle cx="26" cy="10" r="6" fill="#8E2A3A"/><path d="M26 19V36H40L47 52" fill="none" stroke="#E2B74A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 27H38" fill="none" stroke="#E2B74A" stroke-width="6" stroke-linecap="round"/><circle cx="24" cy="44" r="13" fill="none" stroke="#F5C03A" stroke-width="5"/><circle cx="24" cy="44" r="3" fill="#6B1226"/>',
       /* SHG: group of three */
       '<circle cx="12" cy="26" r="6" fill="#F4DCA1"/><path d="M1 56Q1 38 12 38Q23 38 23 56z" fill="#E2B74A"/><circle cx="52" cy="26" r="6" fill="#F4DCA1"/><path d="M41 56Q41 38 52 38Q63 38 63 56z" fill="#D9A521"/><circle cx="32" cy="18" r="9" fill="#F4DCA1"/><path d="M16 58Q16 32 32 32Q48 32 48 58z" fill="#8E2A3A"/>',
       /* TABCEDCO: sprout with coin */
       '<path d="M32 54V26" stroke="#D9A521" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M32 38Q12 38 10 18Q30 18 32 38z" fill="#D9A521"/><path d="M32 30Q34 12 54 10Q54 28 32 30z" fill="#D1B46B"/><ellipse cx="32" cy="57" rx="22" ry="5" fill="#A0833A"/><circle cx="50" cy="46" r="7" fill="#E0AE2F" stroke="#E0A81B" stroke-width="2"/>',
       /* TAMCO: scales */
       '<rect x="30" y="10" width="4" height="42" fill="#6B1226"/><rect x="18" y="52" width="28" height="6" rx="3" fill="#6B1226"/><rect x="8" y="14" width="48" height="4" rx="2" fill="#D9A521"/><circle cx="32" cy="9" r="4.500" fill="#8E2A3A"/><path d="M10 17 2 34M10 17 18 34M54 17 46 34M54 17 62 34" stroke="#6B1226" stroke-width="1.500" fill="none"/><path d="M2 34H18Q16 45 10 45Q4 45 2 34z" fill="#E2B74A"/><path d="M46 34H62Q60 45 54 45Q48 45 46 34z" fill="#8E2A3A"/>',
       /* women entrepreneur: shop */
       '<path d="M6 12H58L62 26H2z" fill="#8E2A3A"/><path d="M19 12H32V26H17zM45 12H58L62 26H47z" fill="#fff"/><rect x="8" y="26" width="48" height="28" fill="#FFEEC2"/><rect x="26" y="34" width="14" height="20" fill="#E2B74A"/><rect x="11" y="32" width="11" height="10" fill="#F5A8B5"/><rect x="43" y="32" width="10" height="10" fill="#F5A8B5"/><rect x="4" y="54" width="56" height="5" rx="2.500" fill="#6B1226"/>',
       /* working women: briefcase */
       '<path d="M24 22V14Q24 10 28 10H36Q40 10 40 14V22" fill="none" stroke="#6B1226" stroke-width="4"/><rect x="6" y="20" width="52" height="36" rx="6" fill="#F5C03A"/><rect x="6" y="34" width="52" height="4" fill="#C7971F"/><rect x="27" y="30" width="10" height="12" rx="2" fill="#E0AE2F"/>',
       /* surety: shield with tick */
       '<path d="M32 4 10 12V30C10 44 20 54 32 60 44 54 54 44 54 30V12z" fill="#E2B74A"/><path d="M32 4V60C20 54 10 44 10 30V12z" fill="#B81C36"/><path d="M20 31 29 40 44 22" fill="none" stroke="#fff" stroke-width="5.500" stroke-linecap="round" stroke-linejoin="round"/>'
      ];
    function read(a) {
      var tag = a.querySelector(".tag").textContent;
      var m = /([\d.]+)/.exec(tag);
      return {
        id: a.id,
        title: a.querySelector("h2").textContent,
        ta: a.querySelector(".ta").textContent,
        tag: tag,
        rate: m ? m[1] : "",
        desc: a.querySelector(".product-body>p").textContent,
        feats: [].map.call(a.querySelectorAll(".ticks li"), function (l) { return l.textContent; }),
        docs: a.querySelector(".docs").innerHTML
      };
    }
    var host = document.createElement("div");
    host.id = "lc-grid";
    host.className = "grid-3";
    nav.parentNode.insertBefore(host, nav.nextSibling);
    var dlg = document.createElement("dialog");
    dlg.className = "lc-dialog";
    dlg.setAttribute("aria-labelledby", "lcd-t");
    document.body.appendChild(dlg);
    function openDialog(id) {
      var d = read(document.getElementById(id));
      var docs = d.docs.replace(/<b>[\s\S]*?<\/b>\s*/, "");
      dlg.innerHTML = '<div class="lcd2"><aside class="lcd2-side"><span class="lcd2-kick">' + tr("Loan scheme") + '</span><div class="lcd2-rate"><b>' + d.rate + '</b><i>%</i><small>' + tr("per annum") + '</small></div></aside><div class="lcd2-main"><button class="lcd2-close" aria-label="' + tr("Close") + '">&times;</button><h3 id="lcd-t">' + d.title + '</h3><p class="lcd2-ta">' + d.ta + '</p><p class="lcd2-desc">' + d.desc + '</p><h4>' + tr("What you get") + '</h4><ol class="lcd2-list">' + d.feats.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ol><h4>' + tr("Documents to bring") + '</h4><p class="lcd2-docs">' + docs + '</p></div></div>';
      dlg.querySelector(".lcd2-close").onclick = function () { dlg.close(); };
      dlg.showModal();
    }
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    var tilesL = [];
    arts.forEach(function (a, i) {
      var d = read(a);
      var c = document.createElement("div");
      c.className = "service";
      c.tabIndex = 0;
      c.setAttribute("role", "button");
      c.setAttribute("aria-expanded", "false");
      c.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true">' + ICONS[i % ICONS.length] + '</svg><h3>' + d.title + '</h3><span class="svc-short"><b>' + d.rate + '%</b> per annum</span><div class="svc-more"><span class="st">' + d.title + '</span><ul>' + d.feats.slice(0, 4).map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul><button type="button" class="svc-detail">View details &rarr;</button></div>';
      function setOpen(on) { c.classList.toggle("is-open", on); c.setAttribute("aria-expanded", on ? "true" : "false"); }
      c.addEventListener("click", function () {
        var on = !c.classList.contains("is-open");
        tilesL.forEach(function (o) { o.classList.remove("is-open"); o.setAttribute("aria-expanded", "false"); });
        setOpen(on);
      });
      c.querySelector(".svc-detail").addEventListener("click", function (e) { e.stopPropagation(); openDialog(a.id); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.click(); }
        if (e.key === "Escape") setOpen(false);
      });
      tilesL.push(c);
      host.appendChild(c);
    });
    document.documentElement.classList.add("lc-on");
    var start = location.hash.slice(1);
    if (start && document.getElementById(start) && document.getElementById(start).matches("article.product")) {
      var card = host.children[arts.indexOf(document.getElementById(start))];
      if (card) {
        card.scrollIntoView({ block: "center" });
        openDialog(start);
      }
    }
    // Banner link: scroll to the loan's card and open its details
    [].slice.call(document.querySelectorAll(".page-hero [data-loan]")).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var id = b.getAttribute("data-loan"), art = document.getElementById(id);
        var card = art && host.children[arts.indexOf(art)];
        if (!card) return;
        card.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(function () { openDialog(id); }, 500);
      });
    });
  })();

  // Services page: banner button jumps to a service tile, flashes it and opens it
  (function () {
    [].slice.call(document.querySelectorAll(".page-services [data-service]")).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var tile = document.getElementById(b.getAttribute("data-service"));
        if (!tile) return;
        history.replaceState(null, "", "#" + tile.id);
        tile.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(function () {
          tile.classList.add("is-flip");
          tile.classList.remove("is-flash");
          void tile.offsetWidth;
          tile.classList.add("is-flash");
        }, 450);
      });
    });
  })();

  // Notices page: banner button switches to a filter tab and scrolls to the list
  (function () {
    [].slice.call(document.querySelectorAll(".page-hero [data-notice-filter]")).forEach(function (b) {
      b.addEventListener("click", function (e) {
        e.preventDefault();
        var tab = document.querySelector('.notice-tab[data-filter="' + b.getAttribute("data-notice-filter") + '"]');
        var bar = document.getElementById("notices-list");
        if (tab) tab.click();
        if (bar) window.scrollTo({ top: bar.getBoundingClientRect().top + window.pageYOffset - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--hdr-h")) || 54) - 16, behavior: "smooth" });
      });
    });
  })();

  // Home page: content rises from the bottom the first time it scrolls into view
  (function () {
    if (!document.querySelector(".hero")) return;
    if ((window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) || !("IntersectionObserver" in window)) return;
    var groups = [".offer-panel", ".offer-panel .offer-card", ".gold .wrap > *", ".gold-points li", ".hr-sec .split > div",
      ".values-head", ".values .value-card", "#visit .visit-info", "#visit .map", ".cta-band .wrap > *", ".foot-grid > *"];
    var seen = new Set(), items = [];
    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (seen.has(el) || el.closest(".hero")) return;
        seen.add(el); items.push(el);
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = el.parentElement ? [].filter.call(el.parentElement.children, function (c) { return c.classList.contains("rv"); }) : [];
        el.style.transitionDelay = (Math.max(0, sibs.indexOf(el)) * 110) + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  })();

  // About page: numbers count up and blocks rise in when they scroll into view
  (function () {
    if (!document.querySelector(".ab-stats")) return;
    var reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
    var els=[].slice.call(document.querySelectorAll(".ab-stats,.ab-tl-item,.ab-cert,.ab-head:not(#offices .ab-head)"));
    if(!("IntersectionObserver" in window)||reduce){return;}
    els.forEach(function(e){e.classList.add("ab-rv");});
    var fmt={plain:function(v){return String(Math.round(v));},in:function(v){return Math.round(v).toLocaleString("en-IN");},lakh:function(v){return "\u20B9"+v.toFixed(2)+" "+tr("lakh");}};
    function count(el){
      var end=parseFloat(el.dataset.count),f=fmt[el.dataset.fmt]||fmt.plain,t0=performance.now(),dur=1400;
      (function step(t){var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);(el.firstChild||el.appendChild(document.createTextNode(""))).nodeValue=f(end*e);if(k<1)requestAnimationFrame(step);})(t0);
    }
    var io=new IntersectionObserver(function(en){en.forEach(function(x){
      if(!x.isIntersecting)return;var el=x.target;
      var sibs=[].filter.call(el.parentElement.children,function(c){return c.classList.contains("ab-rv");});
      el.style.transitionDelay=(Math.max(0,sibs.indexOf(el))*90)+"ms";
      el.classList.add("is-in");
      if(el.classList.contains("ab-stats"))el.querySelectorAll("[data-count]").forEach(count);
      io.unobserve(el);
    });},{threshold:.15,rootMargin:"0px 0px -6% 0px"});
    els.forEach(function(e){io.observe(e);});
  })();

  // Customer corner page: KYC tabs
  (function () {
    var tabs = [].slice.call(document.querySelectorAll("[data-cc-tab]")), panels = [].slice.call(document.querySelectorAll("[data-cc-panel]"));
    if (!tabs.length) return;
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        var id = t.getAttribute("data-cc-tab");
        tabs.forEach(function (x) { var on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        panels.forEach(function (p) { var on = p.getAttribute("data-cc-panel") === id; p.hidden = !on; p.classList.toggle("is-active", on); });
      });
    });
  })();

  // Home page: value cards fill from the cursor entry point
  (function () {
    document.querySelectorAll(".value-card").forEach(function (c) {
      c.addEventListener("mouseenter", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--ox", (e.clientX - r.left) + "px");
        c.style.setProperty("--oy", (e.clientY - r.top) + "px");
      });
    });
  })();
})();

// Seamless header: the banner image runs behind the nav; the header turns solid once scrolled.
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;
  var notices = document.querySelector(".notices");
  function measure() {
    var h = header.offsetHeight, n = notices && !notices.closest("main") ? notices.offsetHeight : 0;
    var root = document.documentElement.style;
    root.setProperty("--hdr-h", h + "px");
    root.setProperty("--notices-h", n + "px");
    root.setProperty("--over-h", (h + n) + "px");
  }
  function stuck() { header.classList.toggle("is-stuck", window.scrollY > 8); }
  // Once the banner has scrolled away, the header paints the same slice of the banner image
  // (same size and position) that it showed at the top, so it looks identical after scrolling.
  var bannerImg = null, bannerUrl = "";
  function syncBanner() {
    var b = document.querySelector(".page-hero, .hero");
    if (!b) return;
    var m = /url\(["']?(.*?)["']?\)/.exec(getComputedStyle(b).backgroundImage);
    if (!m) return;
    function apply() {
      var W = b.offsetWidth, H = b.offsetHeight, iw = bannerImg.naturalWidth, ih = bannerImg.naturalHeight;
      if (!iw || !ih) return;
      var k = Math.max(W / iw, H / ih), sw = iw * k, sh = ih * k;
      var root = document.documentElement.style;
      root.setProperty("--hdr-bg-size", sw + "px " + sh + "px");
      root.setProperty("--hdr-bg-pos", (W - sw) / 2 + "px " + (H - sh) / 2 + "px");
      root.setProperty("--banner-h", H + "px");
    }
    if (bannerUrl === m[1] && bannerImg) { apply(); return; }
    bannerUrl = m[1];
    bannerImg = new Image();
    bannerImg.onload = apply;
    bannerImg.src = bannerUrl;
  }
  measure(); stuck(); syncBanner();
  window.addEventListener("resize", function () { measure(); syncBanner(); });
  window.addEventListener("load", function () { measure(); syncBanner(); });
  window.addEventListener("kucb-languagechange", function () { setTimeout(syncBanner, 50); });
  window.addEventListener("scroll", stuck, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(measure).observe(header);
})();

// Internet Banking pop-up (coming soon)
(function () {
  var btn = document.querySelector(".top-btn-line");
  if (!btn || typeof HTMLDialogElement === "undefined") return;
  btn.setAttribute("aria-haspopup", "dialog");
  var dlg = document.createElement("dialog");
  dlg.className = "ib-dialog";
  dlg.setAttribute("aria-labelledby", "ib-title");
  document.body.appendChild(dlg);
  function t(s) { return window.kucbTranslate ? window.kucbTranslate(s) : s; }
  function build() {
    dlg.innerHTML = '<button type="button" class="ib-x" aria-label="' + t("Close") + '">&times;</button>' +
      '<span class="ib-badge"><i></i>' + t("Coming soon") + '</span>' +
      '<h3 id="ib-title">' + t("Internet Banking is launching soon") + '</h3>' +
      '<p class="ib-lead">' + t("We are building a safe and simple internet banking service for your convenience. Something good is coming your way very soon!") + '</p>' +
      '<ul class="ib-chips"><li>' + t("Available 24×7") + '</li><li>' + t("Safe and secure") + '</li><li>' + t("Easy to use") + '</li></ul>' +
      '<p class="ib-note">' + t("Until then, visit your nearest branch - our team will be happy to help you.") + '</p>' +
      '<div class="ib-actions"><a class="btn btn-teal" href="contact.html">' + t("Contact Us") + '</a><button type="button" class="ib-close btn btn-line">' + t("Close") + '</button></div>';
    dlg.querySelector(".ib-x").onclick = function () { dlg.close(); };
    dlg.querySelector(".ib-close").onclick = function () { dlg.close(); };
  }
  btn.addEventListener("click", function (e) { e.preventDefault(); build(); dlg.showModal(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
})();

// FAQ accordion: one answer open at a time, search, expand / collapse all
(function () {
  var box = document.querySelector(".faq");
  if (!box) return;
  var items = [].slice.call(box.querySelectorAll(".faq-item"));
  var search = box.querySelector(".faq-search");
  var empty = box.querySelector(".faq-empty");
  var searching = false;
  items.forEach(function (it) {
    it.addEventListener("toggle", function () {
      if (!it.open || searching || box.getAttribute("data-all") === "1") return;
      items.forEach(function (o) { if (o !== it) o.open = false; });
    });
  });
  [].forEach.call(box.querySelectorAll("[data-faq]"), function (b) {
    b.addEventListener("click", function () {
      var open = b.getAttribute("data-faq") === "open";
      box.setAttribute("data-all", "1");
      items.forEach(function (it) { if (!it.hidden) it.open = open; });
      setTimeout(function () { box.removeAttribute("data-all"); }, 0);
    });
  });
  function filter() {
    var q = search.value.trim().toLowerCase(), shown = 0;
    searching = !!q;
    items.forEach(function (it) {
      var hit = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
      it.hidden = !hit;
      if (hit) shown++;
    });
    empty.hidden = shown !== 0;
  }
  search.addEventListener("input", filter);
  window.addEventListener("kucb-languagechange", function () { if (search.value) filter(); });
  if (location.hash === "#faq") { var f = document.getElementById("faq"); if (f) f.scrollIntoView(); }
})();
