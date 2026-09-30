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

  // Home page: proverb popup: bottom-right, shown on every load / refresh, auto-hides after 3s
  var welcomePopup = document.getElementById("welcomePopup");
  if (welcomePopup) {
    var closePopup = function () {
      welcomePopup.hidden = true;
      document.removeEventListener("keydown", popupKey);
    };
    var popupKey = function (e) { if (e.key === "Escape") closePopup(); };
    welcomePopup.querySelector(".welcome-popup-close").addEventListener("click", closePopup);
    // Wait for the page-open intro (js/intro.js) to finish, then show for 3s
    setTimeout(function () {
      welcomePopup.hidden = false;
      document.addEventListener("keydown", popupKey);
      setTimeout(closePopup, 3000);
    }, window.kucbIntroMs || 0);
  }

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

    function val(name) { return parseFloat(calc.querySelector("[data-manual=" + name + "]").value); }
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
    panels.forEach(function (panel) {
      panel.querySelector("[data-action=calculate]").addEventListener("click", function () {
        var inputs = panel.querySelectorAll("input[data-manual]");
        for (var i = 0; i < inputs.length; i++) {
          if (!inputs[i].reportValidity()) return;
        }
        update();
      });
      panel.querySelector("[data-action=cancel]").addEventListener("click", function () {
        panel.querySelectorAll("input[data-manual]").forEach(function (input) { input.value = input.defaultValue; });
        var select = panel.querySelector("select[data-manual]");
        if (select) {
          select.selectedIndex = Array.prototype.findIndex.call(select.options, function (o) { return o.defaultSelected; });
          if (loanRate) loanRate.value = select.value;
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
      var to = form.getAttribute("data-email") || "email@kaveripattinamtown.bank.in";
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

  // Services page: click a tile to reveal its description
  (function () {
    var tiles = [].slice.call(document.querySelectorAll(".page-services .service"));
    if (!tiles.length) return;
    function setOpen(t, on) {
      t.classList.toggle("is-open", on);
      t.setAttribute("aria-expanded", on ? "true" : "false");
    }
    tiles.forEach(function (t) {
      var p = t.querySelector("p");
      var title = t.querySelector("h3");
      if (!p || !title) return;
      var st = document.createElement("span");
      st.className = "st";
      p.insertBefore(st, p.firstChild);
      t.tabIndex = 0;
      t.setAttribute("role", "button");
      t.setAttribute("aria-expanded", "false");
      t.addEventListener("click", function () {
        var on = !t.classList.contains("is-open");
        st.textContent = title.textContent;
        tiles.forEach(function (o) { setOpen(o, false); });
        setOpen(t, on);
      });
      t.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); t.click(); }
        if (e.key === "Escape") setOpen(t, false);
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
       /* gold bars */
       '<path class="ac" d="M2.5 20 4.7 14.5h6.6L13.5 20z"/><path class="ac" d="M10.5 20l2.2-5.5h6.6L21.5 20z"/><path class="ac" d="M6.5 14l2.2-5.5h6.6L17.5 14z"/><path d="M19 2.5v3.6M17.2 4.3h3.6M4.5 3.5v2.4M3.3 4.7h2.4"/>',
       /* house */
       '<path d="M2.5 11.5 12 3.5l9.500 8"/><path d="M5.500 10.200V20.500h13V10.200" fill="#fff" fill-opacity=".18"/><path d="M15.800 6.800V4h2.300v4.700"/><path class="ac" d="M10 14.500h4v6h-4z"/><path class="ac" d="M6.800 12h2.400v2.400H6.800z"/><path d="M1.500 20.500h21"/>',
       /* mortgage deed with seal */
       '<path d="M5.500 2.500h9.500l4 4V21h-13.500z" fill="#fff" fill-opacity=".18"/><path d="M15 2.500v4h4"/><path d="M8.500 12 11.500 9.500 14.500 12v4h-6z"/><path d="M8.500 19h4.500"/><circle class="ac" cx="17.500" cy="18.500" r="3.200"/><path d="m16.100 18.600 1 1 1.700-2" stroke="#14243D"/>',
       /* accessibility */
       '<circle class="ac" cx="11" cy="4" r="2"/><path d="M11 7.500v6.500h5.200l2.300 5"/><path d="M8 9.500h7"/><path d="M8.200 12.200a5.800 5.800 0 1 0 7.300 8"/>',
       /* group */
       '<circle class="ac" cx="12" cy="7" r="3.100"/><path d="M6.300 20c0-3.500 2.500-5.800 5.700-5.800s5.700 2.300 5.700 5.800z" fill="#fff" fill-opacity=".2"/><circle cx="4.700" cy="10" r="2.100"/><path d="M1.600 17.700c.2-2 1.500-3.400 3.100-3.700"/><circle cx="19.300" cy="10" r="2.100"/><path d="M22.400 17.700c-.2-2-1.500-3.400-3.100-3.700"/>',
       /* sprout */
       '<path d="M12 21.500v-9.500"/><path class="ac" d="M12 13.500c0-4.200 2.700-6.900 7.300-7.100 0 4.400-2.700 7.100-7.300 7.100z"/><path d="M12 16C12 12.300 9.700 10 5.200 9.800c0 3.800 2.300 6.200 6.800 6.200z" fill="#fff" fill-opacity=".25"/><path d="M3.500 21.500h17"/>',
       /* scale */
       '<path d="M12 3.500v17M7.500 20.500h9"/><path d="M4 7.500h16"/><path class="ac" d="M4 7.500 1.700 14h4.600z"/><path d="M1.700 14a2.300 2.300 0 0 0 4.600 0"/><path class="ac" d="M20 7.500 17.700 14h4.600z"/><path d="M17.700 14a2.300 2.300 0 0 0 4.600 0"/><circle cx="12" cy="3.600" r="1.200" fill="#fff"/>',
       /* storefront */
       '<path class="ac" d="M3.500 9.500 5 4h14l1.500 5.500z"/><path d="M3.500 9.500c0 1.700 1.200 2.900 2.700 2.900s2.700-1.200 2.700-2.900c0 1.700 1.200 2.900 3.100 2.900s3.100-1.200 3.100-2.900c0 1.700 1.200 2.900 2.700 2.900s2.700-1.200 2.700-2.900"/><path d="M5 12.400V20.500h14v-8.100"/><path d="M9.500 14.500h5v6h-5z" fill="#fff" fill-opacity=".25"/>',
       /* briefcase */
       '<rect x="2.500" y="7.500" width="19" height="13" rx="2.400" fill="#fff" fill-opacity=".18"/><path d="M8.500 7.500V5.700c0-1 .8-1.700 1.700-1.700h3.600c.9 0 1.700.7 1.700 1.700v1.800"/><path d="M2.500 13.200h19"/><rect class="ac" x="10.200" y="11.600" width="3.600" height="3" rx=".8"/>',
       /* shield */
       '<path d="M12 2.500 4.400 5.600v5.900c0 4.700 3.200 8.400 7.600 9.900 4.400-1.500 7.600-5.200 7.600-9.900V5.600z" fill="#fff" fill-opacity=".2"/><path class="ac" style="fill:none" stroke-width="2.200" d="m8.300 12.200 2.700 2.800 4.800-5.300"/>'
      ];
      var BADGES=["#C9962F,#7A5A12","#C0503F,#7A231B","#3B5F8F,#1C3454","#2F8A86,#164A4A","#E08A2E,#A5561A","#4C9A5F,#215A35","#7E5BB0,#3E2670","#C2517F,#7F2050","#8A9A2E,#4F5E14","#4A5A73,#1A2436"];
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
    nav.parentNode.insertBefore(host, nav.nextSibling);
    var dlg = document.createElement("dialog");
    dlg.className = "lc-dialog";
    dlg.setAttribute("aria-labelledby", "lcd-t");
    document.body.appendChild(dlg);
    function openDialog(id) {
      var d = read(document.getElementById(id));
      dlg.innerHTML = '<div class="lcd-head"><button class="lcd-close" aria-label="' + tr("Close") + '">&times;</button><h3 id="lcd-t">' + d.title + '</h3><p class="lcd-ta">' + d.ta + '</p><span class="lcd-rate">' + d.tag + '</span></div><div class="lcd-body"><p>' + d.desc + '</p><ul>' + d.feats.map(function (f) { return "<li>" + f + "</li>"; }).join("") + '</ul><div class="lcd-docs">' + d.docs + "</div></div>";
      dlg.querySelector(".lcd-close").onclick = function () { dlg.close(); };
      dlg.showModal();
    }
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    arts.forEach(function (a, i) {
      var d = read(a);
      var c = document.createElement("div");
      c.className = "lc lc-3 ic" + (i + 1);
      c.tabIndex = 0;
      c.setAttribute("role", "button");
      var front = '<div class="lc-front"><div class="lc-top"><span class="lc-ico-w"><span class="lc-ico" style="background:linear-gradient(145deg,' + BADGES[i % BADGES.length] + ')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[i % ICONS.length] + '</svg></span></span><div class="lc-rate"><span class="num">' + d.rate + '</span>%<small>per annum</small></div></div><h3>' + d.title + '</h3><p class="lc-ta">' + d.ta + '</p><p class="lc-p">' + d.desc + '</p><span class="lc-cta">View details <i>&rarr;</i></span></div>';
      var back = '<div class="lc-back"><h4>Key features</h4><ul>' + d.feats.slice(0, 4).map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul></div>";
      c.innerHTML = '<div class="lc-inner">' + front + back + "</div>";
      c.addEventListener("click", function () { openDialog(a.id); });
      c.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDialog(a.id); }
      });
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
          if (!tile.classList.contains("is-open")) tile.click();
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
