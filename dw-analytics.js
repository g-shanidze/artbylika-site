/*
 * Google Analytics 4 behind a consent banner, plus lead events. Dags Web.
 *
 *   <script src="/dw-analytics.js" data-ga="G-XXXXXXX" data-privacy="/privacy" defer></script>
 *
 * Nothing is sent to Google until the visitor allows it. The choice is kept in
 * localStorage ("dw-consent") for a year; any element with [data-cookie-settings]
 * reopens the banner. Clicks on email, phone and WhatsApp links are reported as
 * email_click / phone_click / whatsapp_click. Any element (or form) with
 * data-dw-event="name" reports that event on click (or submit). Pages can call
 * window.dwTrack(name, params) after a form is really sent.
 *
 * The banner takes the site's look from CSS variables, set on :root by the site:
 *   --dw-bg, --dw-fg, --dw-muted, --dw-line, --dw-accent, --dw-accent-fg, --dw-font, --dw-radius
 */
(function () {
  "use strict";
  var me = document.currentScript;
  if (!me || !me.dataset.ga) return;
  var GA = me.dataset.ga;
  var PRIVACY = me.dataset.privacy || "";
  var KEY = "dw-consent";
  var YEAR = 365 * 24 * 60 * 60 * 1000;

  var TEXT = {
    en: {
      body: "We'd like to use Google Analytics to see how visitors find this site. It only runs if you allow it.",
      yes: "Allow",
      no: "No thanks",
      more: "Privacy",
    },
    ka: {
      body: "გვსურს Google Analytics-ით გავიგოთ, როგორ პოულობენ სტუმრები ამ საიტს. ის ჩაირთვება მხოლოდ თქვენი თანხმობით.",
      yes: "დაშვება",
      no: "არა, მადლობა",
      more: "კონფიდენციალურობა",
    },
    ru: {
      body: "Мы хотели бы использовать Google Analytics, чтобы понимать, как посетители находят сайт. Он включается только с вашего согласия.",
      yes: "Разрешить",
      no: "Нет, спасибо",
      more: "Конфиденциальность",
    },
    es: {
      body: "Nos gustaría usar Google Analytics para saber cómo llegan los visitantes a esta web. Solo se activa si usted lo permite.",
      yes: "Permitir",
      no: "No, gracias",
      more: "Privacidad",
    },
  };

  function lang() {
    var l = (document.documentElement.getAttribute("lang") || "en").slice(0, 2).toLowerCase();
    return TEXT[l] ? l : "en";
  }

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!c || typeof c.analytics !== "boolean" || Date.now() - c.at > YEAR) return null;
      return c;
    } catch (e) {
      return null;
    }
  }

  function write(analytics) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ analytics: analytics, at: Date.now() }));
    } catch (e) {
      /* private mode: the choice holds for this page view */
    }
  }

  // ---------- Google Analytics ----------

  var loaded = false;
  function load() {
    window["ga-disable-" + GA] = false;
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA, { allow_google_signals: false, allow_ad_personalization_signals: false });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA;
    document.head.appendChild(s);
  }

  function stop() {
    window["ga-disable-" + GA] = true;
    if (window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
    var host = location.hostname;
    var domains = ["", host, "." + host.split(".").slice(-2).join(".")];
    document.cookie.split(";").forEach(function (pair) {
      var name = pair.split("=")[0].trim();
      if (name !== "_ga" && name.indexOf("_ga_") !== 0) return;
      domains.forEach(function (d) {
        document.cookie = name + "=; Max-Age=0; path=/" + (d ? "; domain=" + d : "");
      });
    });
  }

  function track(name, params) {
    if (loaded && window.gtag) window.gtag("event", name, params || {});
  }
  window.dwTrack = track;

  // ---------- banner ----------

  var CSS =
    ".dw-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:640px;margin:0 auto;" +
    "background:var(--dw-bg,#fff);color:var(--dw-fg,#1a1a1a);border:1px solid var(--dw-line,rgba(0,0,0,.12));" +
    "border-radius:var(--dw-radius,4px);box-shadow:0 18px 50px -20px rgba(0,0,0,.35);padding:18px 20px;" +
    "font:400 14px/1.5 var(--dw-font,system-ui,sans-serif);display:flex;flex-wrap:wrap;gap:14px 18px;align-items:center}" +
    ".dw-consent p{margin:0;flex:1 1 280px;color:var(--dw-fg,#1a1a1a)}" +
    ".dw-consent a{color:var(--dw-muted,#666);text-decoration:underline;text-underline-offset:3px;margin-left:6px}" +
    ".dw-consent .dw-actions{display:flex;gap:8px;flex-wrap:wrap}" +
    ".dw-consent button{font:inherit;font-weight:500;cursor:pointer;padding:9px 16px;border-radius:var(--dw-radius,4px);" +
    "border:1px solid var(--dw-line,rgba(0,0,0,.18));background:transparent;color:var(--dw-fg,#1a1a1a);" +
    "transition:background .25s,color .25s,border-color .25s}" +
    ".dw-consent button:hover{border-color:var(--dw-accent,#1a1a1a)}" +
    ".dw-consent button.dw-yes{background:var(--dw-accent,#1a1a1a);border-color:var(--dw-accent,#1a1a1a);color:var(--dw-accent-fg,#fff)}" +
    ".dw-consent button.dw-yes:hover{filter:brightness(1.08)}" +
    ".dw-consent button:focus-visible{outline:2px solid var(--dw-accent,#1a1a1a);outline-offset:2px}" +
    "@media (prefers-reduced-motion:no-preference){.dw-consent{animation:dw-in .35s ease-out}}" +
    "@keyframes dw-in{from{opacity:0;transform:translateY(8px)}}";

  var box = null;
  function render() {
    if (!box) return;
    var t = TEXT[lang()];
    box.innerHTML =
      "<p>" + t.body + (PRIVACY ? '<a href="' + PRIVACY + '">' + t.more + "</a>" : "") + "</p>" +
      '<div class="dw-actions"><button type="button" class="dw-no">' + t.no + "</button>" +
      '<button type="button" class="dw-yes">' + t.yes + "</button></div>";
    box.querySelector(".dw-yes").addEventListener("click", function () {
      decide(true);
    });
    box.querySelector(".dw-no").addEventListener("click", function () {
      decide(false);
    });
  }

  function open() {
    if (box) return;
    if (!document.getElementById("dw-consent-css")) {
      var st = document.createElement("style");
      st.id = "dw-consent-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    box = document.createElement("div");
    box.className = "dw-consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", "Cookies");
    render();
    document.body.appendChild(box);
  }

  function close() {
    if (box) box.remove();
    box = null;
  }

  function decide(analytics) {
    write(analytics);
    close();
    if (analytics) load();
    else stop();
  }

  window.dwConsent = { open: open };
  document.addEventListener("langchange", render);

  // ---------- leads ----------

  function contactEvent(href) {
    if (href.indexOf("mailto:") === 0) return ["email_click", href.slice(7).split("?")[0]];
    if (href.indexOf("tel:") === 0) return ["phone_click", href.slice(4)];
    if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return ["whatsapp_click", href.split("?")[0]];
    return null;
  }

  document.addEventListener(
    "click",
    function (e) {
      var el = e.target && e.target.closest ? e.target : null;
      if (!el) return;
      var settings = el.closest("[data-cookie-settings]");
      if (settings) {
        e.preventDefault();
        open();
        return;
      }
      var a = el.closest("a[href]");
      var hit = a && contactEvent(a.getAttribute("href") || "");
      if (hit) track(hit[0], { link_url: hit[1] });
      var custom = el.closest("[data-dw-event]:not(form)");
      if (custom) track(custom.getAttribute("data-dw-event"));
    },
    true
  );

  document.addEventListener(
    "submit",
    function (e) {
      var f = e.target && e.target.closest ? e.target.closest("form[data-dw-event]") : null;
      if (f) track(f.getAttribute("data-dw-event"));
    },
    true
  );

  // ---------- start ----------

  var choice = read();
  if (choice && choice.analytics) load();
  else if (!choice) {
    if (document.body) open();
    else document.addEventListener("DOMContentLoaded", open);
  }
})();
