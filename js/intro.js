// Home page intro: the hero photo zooms in under a dark veil while the bank name blurs into focus,
// settles exactly onto the hero image's real position, then the logo flies into the header.
(function () {
  "use strict";
  window.kucbIntroMs = 0;
  var html = document.documentElement;
  function ready() { html.classList.remove("iz-pre"); }   // lifts the "hide page until the intro is ready" cover set in <head>
  if (html.classList.contains("iz-skip")) { ready(); return; }   // already shown once in this visit
  var brandImg = document.querySelector(".topbar-brand img"), hero = document.querySelector(".hero");
  if (!brandImg || !hero || !document.body.animate) { ready(); return; }
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { ready(); return; }
  var NAME = ["The Kaveripattinam", "Cooperative Town", "Bank Ltd"];
  var EASE = "cubic-bezier(.2,.8,.2,1)", FLYE = "cubic-bezier(.6,0,.2,1)";
  var ZOOM = 2400, LIFT = 950, FLY = 750, HOLD = ZOOM;           // photo lands at HOLD, then the veil lifts
  var TOTAL = HOLD + LIFT;
  window.kucbIntroMs = TOTAL + 200;
  var st = document.createElement("style");
  st.textContent = "html.iz-on{overflow:hidden}.iz{position:fixed;inset:0;z-index:9999;overflow:hidden;pointer-events:none}" +
    ".iz-bg{position:absolute;inset:0;background:linear-gradient(135deg,#14304d,#042B28)}" +
    ".iz-clip{position:absolute;overflow:hidden}.iz-photo{position:absolute;inset:0;background:url(assets/home-hero-bg7.png) center/cover no-repeat}" +
    ".iz-logo{position:fixed;z-index:6;object-fit:contain}" +
    ".iz-name{position:fixed;left:0;right:0;z-index:5;text-align:center;color:#fff;font-family:Inter,'Mukta Malar',system-ui,sans-serif;font-weight:700;padding:0 1rem;line-height:1.3;font-size:clamp(1.3rem,3.8vw,2.4rem);text-shadow:0 2px 16px rgba(0,0,0,.7)}" +
    ".iz-line{display:block}";
  document.head.appendChild(st);
  brandImg.style.visibility = "hidden";
  var ov = document.createElement("div"); ov.className = "iz"; ov.setAttribute("aria-hidden", "true");
  var bg = document.createElement("div"); bg.className = "iz-bg"; ov.appendChild(bg);
  document.body.appendChild(ov); html.classList.add("iz-on");
  ready();   // the opaque intro screen is in place, so the page underneath can be shown
  function A(n, f, o) { o.fill = o.fill || "both"; o.easing = o.easing || EASE; return n.animate(f, o); }
  function mk(c, p, t) { var e = document.createElement(t || "div"); e.className = c; (p || ov).appendChild(e); return e; }

  requestAnimationFrame(function () {
    window.scrollTo(0, 0);
    var vw = innerWidth, vh = innerHeight, hr = hero.getBoundingClientRect();
    // clip box = the hero's exact rectangle; the photo inside covers it the same way the hero does
    var clip = mk("iz-clip", ov);
    clip.style.cssText = "left:" + hr.left + "px;top:" + hr.top + "px;width:" + hr.width + "px;height:" + hr.height + "px";
    var photo = mk("iz-photo", clip);
    A(photo, [{ opacity: 0, filter: "brightness(.35)", transform: "scale(1.3)" }, { opacity: 1, filter: "brightness(.5)", transform: "scale(1.12)", offset: .28 },
      { opacity: 1, filter: "brightness(.55)", transform: "scale(1)" }], { duration: ZOOM, easing: "cubic-bezier(.25,.6,.3,1)" });
    // veil lifts: photo brightens to full (identical to the page beneath) while the navy backdrop dissolves
    A(photo, [{ filter: "brightness(.55)" }, { filter: "brightness(1)" }], { duration: LIFT, delay: HOLD, easing: "ease-in-out", fill: "forwards" });
    A(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: LIFT, delay: HOLD, easing: "ease-in-out", fill: "forwards" });
    A(clip, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: .8 }, { opacity: 0, offset: 1 }], { duration: LIFT + 250, delay: HOLD, fill: "forwards" });

    var L = Math.min(110, vw * .28), cx = vw / 2, cy = vh / 2 - 46;
    var logo = mk("iz-logo", ov, "img"); logo.src = brandImg.currentSrc || brandImg.src; logo.alt = "";
    logo.style.cssText = "left:" + (cx - L / 2) + "px;top:" + (cy - L / 2) + "px;width:" + L + "px;height:" + L + "px";
    A(logo, [{ transform: "scale(.35)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 650, delay: 300 });
    var box = mk("iz-name", ov); box.style.top = (cy + L / 2 + 26) + "px";
    NAME.forEach(function (t, i) {
      var l = mk("iz-line", box); l.textContent = t;
      A(l, [{ opacity: 0, filter: "blur(14px)", letterSpacing: ".35em" }, { opacity: 1, filter: "blur(0px)", letterSpacing: ".02em" }], { duration: 900, delay: 700 + i * 320 });
      A(l, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: HOLD - 100, fill: "forwards" });
    });
    // logo flies to its exact header spot (measured now, after page scripts have settled)
    var r = brandImg.getBoundingClientRect();
    A(logo, [{ left: (cx - L / 2) + "px", top: (cy - L / 2) + "px", width: L + "px", height: L + "px" },
      { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" }], { duration: FLY, delay: HOLD + 50, easing: FLYE });
    setTimeout(function () { brandImg.style.visibility = ""; }, HOLD + 50 + FLY - 40);
    setTimeout(function () { ov.remove(); html.classList.remove("iz-on"); brandImg.style.visibility = ""; }, TOTAL + 250);
  });
})();
