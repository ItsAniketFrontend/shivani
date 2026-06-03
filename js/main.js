/* ============================================================
   Mansi & Akash — Wedding Invitation
   Interactions: date reveal, countdown, WhatsApp RSVP
   ============================================================ */

(function () {
  "use strict";

  /* ---- Config ---- */
  // Wedding day/time (local). Month is 0-indexed: 6 = July.
  var WEDDING_DATE = new Date(2026, 6, 22, 7, 15, 0);
  // Contact number for RSVP (international format, no "+" or spaces).
  var WHATSAPP_NUMBER = "919414042146";

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
    });
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
     3. RSVP → WhatsApp
     ============================================================ */
  var form = document.getElementById("rsvpForm");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var name = (document.getElementById("rsvpName").value || "").trim();
      var guests = (document.getElementById("rsvpGuests").value || "1").trim();
      var attendEl = form.querySelector('input[name="attend"]:checked');
      var attend = attendEl ? attendEl.value : "";
      var msg = (document.getElementById("rsvpMsg").value || "").trim();

      var lines = [
        "*Wedding RSVP — Rohit & Shefali*",
        "Name: " + name,
        "Guests: " + guests,
        "Attending: " + attend
      ];
      if (msg) lines.push("Message: " + msg);

      var text = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text;

      window.open(url, "_blank", "noopener");
    });
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
