/* ============================================================
   Rohit weds Shefali — Wedding Invitation
   Interactions: date reveal, countdown, confetti, RSVP
   ============================================================ */

(function () {
  "use strict";

  /* ---- Config ---- */
  // Wedding day/time (local). Month is 0-indexed: 6 = July.
  // 22 July 2026, 7:00 PM (Phera Ceremony).
  var WEDDING_DATE = new Date(2026, 6, 22, 19, 0, 0);

  // RSVP submission:
  //  • Leave GOOGLE_SCRIPT_URL empty ("") to send RSVPs via WhatsApp.
  //  • Paste your Google Apps Script Web App URL (ends in /exec) to save
  //    RSVPs straight into your Google Sheet instead.
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJAWb8xIlq5tjhckfeR9uEDH38mvDXjCOkSHM593al6uFXZIi_eAKSVZTVGqKAQ3Oj/exec";
  // WhatsApp fallback number (international format, no "+" or spaces).
  var WHATSAPP_NUMBER = "919414042346";

  /* ============================================================
     0. Hide decorative images that fail to load
     (so missing artwork doesn't show broken-image icons)
     ============================================================ */
  var decorImgs = document.querySelectorAll(".motif, .divider");
  decorImgs.forEach(function (img) {
    img.addEventListener("error", function () { img.style.display = "none"; });
    if (img.complete && img.naturalWidth === 0) img.style.display = "none";
  });

  /* ============================================================
     1. Date reveal
     ============================================================ */
  var revealBtn = document.getElementById("revealBtn");
  var revealContent = document.getElementById("revealContent");

  if (revealBtn && revealContent) {
    revealBtn.addEventListener("click", function () {
      revealContent.hidden = false;
      revealBtn.setAttribute("aria-expanded", "true");
      revealBtn.style.display = "none";
      launchConfetti();
    });
  }

  /* ============================================================
     Poppers / crackers confetti effect (canvas, no library)
     ============================================================ */
  function launchConfetti() {
    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    var canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);

    var ctx = canvas.getContext("2d");
    var W = (canvas.width = window.innerWidth);
    var H = (canvas.height = window.innerHeight);
    var colors = ["#f5a623", "#e8821e", "#c9a24b", "#6b1414", "#b03052", "#fff8ec"];

    // Two "poppers" firing inward from the bottom corners.
    var pieces = [];
    function spawn(originX, angleDeg) {
      for (var i = 0; i < 70; i++) {
        var angle = (angleDeg + (Math.random() * 50 - 25)) * (Math.PI / 180);
        var speed = 8 + Math.random() * 9;
        pieces.push({
          x: originX,
          y: H,
          vx: Math.cos(angle) * speed,
          vy: -Math.sin(angle) * speed,
          size: 5 + Math.random() * 7,
          color: colors[(Math.random() * colors.length) | 0],
          rot: Math.random() * Math.PI,
          vr: Math.random() * 0.3 - 0.15,
          life: 1
        });
      }
    }
    spawn(W * 0.08, 70);
    spawn(W * 0.92, 110);

    var gravity = 0.22;
    var frames = 0;

    function frame() {
      ctx.clearRect(0, 0, W, H);
      frames++;
      var alive = false;

      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (frames > 60) p.life -= 0.018;

        if (p.life > 0 && p.y < H + 40) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (alive && frames < 220) {
        window.requestAnimationFrame(frame);
      } else {
        canvas.remove();
      }
    }
    window.requestAnimationFrame(frame);
  }

  /* ============================================================
     2. Countdown timer
     ============================================================ */
  var elDays = document.getElementById("cd-days");
  var elHours = document.getElementById("cd-hours");
  var elMins = document.getElementById("cd-mins");
  var elSecs = document.getElementById("cd-secs");
  var grid = document.getElementById("countdownGrid");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function tick() {
    var diff = WEDDING_DATE.getTime() - Date.now();

    if (diff <= 0) {
      if (grid) {
        grid.innerHTML =
          '<p class="cd-married">Today is the day! 🎉</p>';
      }
      clearInterval(timer);
      return;
    }

    var secs = Math.floor(diff / 1000);
    var days = Math.floor(secs / 86400);
    var hours = Math.floor((secs % 86400) / 3600);
    var mins = Math.floor((secs % 3600) / 60);
    var s = secs % 60;

    if (elDays) elDays.textContent = pad(days);
    if (elHours) elHours.textContent = pad(hours);
    if (elMins) elMins.textContent = pad(mins);
    if (elSecs) elSecs.textContent = pad(s);
  }

  tick();
  var timer = setInterval(tick, 1000);

  /* ============================================================
     3. RSVP — conditional fields + Google Sheet / WhatsApp
     ============================================================ */
  var form = document.getElementById("rsvpForm");

  if (form) {
    var yesBlock = document.getElementById("rsvpYesBlock");
    var phoneInput = document.getElementById("rsvpPhone");
    var submitBtn = document.getElementById("rsvpSubmit");
    var successBox = document.getElementById("rsvpSuccess");
    var attendRadios = form.querySelectorAll('input[name="attend"]');
    var dayRadios = form.querySelectorAll('input[name="days"]');

    // Show/hide the phone + days block based on the attend choice.
    // Phone and day selection are required only while the block is visible
    // (so hidden required fields never block submission when "No").
    function syncConditional() {
      var checked = form.querySelector('input[name="attend"]:checked');
      var isYes = checked && checked.value === "Yes";
      if (yesBlock) yesBlock.classList.toggle("is-open", !!isYes);
      if (phoneInput) {
        phoneInput.required = !!isYes;
        if (!isYes) phoneInput.value = "";
      }
      dayRadios.forEach(function (r) {
        r.required = !!isYes;
        if (!isYes) r.checked = false;
      });
    }
    attendRadios.forEach(function (r) {
      r.addEventListener("change", syncConditional);
    });
    syncConditional();

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var attendEl = form.querySelector('input[name="attend"]:checked');
      var daysEl = form.querySelector('input[name="days"]:checked');
      var isYes = attendEl && attendEl.value === "Yes";

      var data = {
        name: (document.getElementById("rsvpName").value || "").trim(),
        guests: (document.getElementById("rsvpGuests").value || "1").trim(),
        attend: attendEl ? attendEl.value : "",
        phone: isYes && phoneInput ? phoneInput.value.trim() : "",
        days: isYes && daysEl ? daysEl.value : "",
        message: (document.getElementById("rsvpMsg").value || "").trim()
      };

      function showSuccess() {
        form.hidden = true;
        if (successBox) successBox.hidden = false;
        launchConfetti();
      }

      if (GOOGLE_SCRIPT_URL) {
        // Save to Google Sheet via Apps Script (no-cors = fire-and-forget).
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Sending…";
        }
        var body = new URLSearchParams(data);
        fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: body })
          .then(showSuccess)
          .catch(function () {
            // Network failure — fall back to WhatsApp so the RSVP isn't lost.
            sendViaWhatsApp(data);
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = "Send RSVP";
            }
          });
      } else {
        sendViaWhatsApp(data);
      }
    });
  }

  function sendViaWhatsApp(data) {
    var lines = [
      "*Wedding RSVP — Rohit & Shefali*",
      "Name: " + data.name,
      "Guests: " + data.guests,
      "Attending: " + data.attend
    ];
    if (data.phone) lines.push("Phone: " + data.phone);
    if (data.days) lines.push("Days: " + data.days);
    if (data.message) lines.push("Message: " + data.message);

    var text = encodeURIComponent(lines.join("\n"));
    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text, "_blank", "noopener");
  }

  /* ============================================================
     4. Scroll-reveal animations
     ============================================================ */
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced && "IntersectionObserver" in window) {
    // Single elements that fade up as they enter the viewport.
    var singles = [
      ".divider",
      ".section__title",
      ".section__sub",
      ".ornament",
      ".invite__art",
      ".invite__lead",
      ".schedule__day",
      ".venue__card",
      ".venue__map",
      ".welcome__names",
      ".welcome__all",
      ".rsvp__form",
      ".footer__quote",
      ".footer__names",
      ".footer__date"
    ];
    singles.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add("anim");
      });
    });

    // Couple cards slide in from opposite sides.
    var sides = document.querySelectorAll(".invite__side");
    if (sides[0]) sides[0].classList.add("anim", "anim--left");
    if (sides[1]) sides[1].classList.add("anim", "anim--right");
    var heart = document.querySelector(".invite__heart");
    if (heart) heart.classList.add("anim", "anim--zoom");

    // Couple illustration: fade + gentle zoom-in on scroll.
    var art = document.querySelector(".invite__art");
    if (art) art.classList.add("anim--rise-zoom");

    // Grouped items animate with a stagger (delay grows per index).
    function stagger(selector, step) {
      document.querySelectorAll(selector).forEach(function (group) {
        var kids = group.children;
        for (var i = 0; i < kids.length; i++) {
          kids[i].classList.add("anim");
          kids[i].style.transitionDelay = i * step + "ms";
        }
      });
    }
    stagger("#countdownGrid", 110);
    stagger(".timeline", 90);
    stagger(".contact__grid", 120);

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll(".anim").forEach(function (el) {
      observer.observe(el);
    });

    /* ---- Subtle hero parallax ---- */
    var heroBg = document.querySelector(".hero__bg");
    if (heroBg) {
      var ticking = false;
      window.addEventListener(
        "scroll",
        function () {
          if (!ticking) {
            window.requestAnimationFrame(function () {
              var y = window.pageYOffset;
              if (y < window.innerHeight) {
                heroBg.style.transform = "translateY(" + y * 0.35 + "px) scale(1.08)";
              }
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );
    }
  }
})();
