/**
 * LW Inventory – rote Partikel (Playstation-ähnlich), reagieren auf Cursor & Klänge
 */
(function () {
  'use strict';

  var leinwand = null;
  var kontext = null;
  var teilchen = [];
  var mausX = -1000;
  var mausY = -1000;
  var mausAktiv = false;
  var laeuft = false;
  var breite = 0;
  var hoehe = 0;
  var geraetePixelRatio = 1;
  var TEILCHEN_ANZAHL = 88;
  var VERBINDUNGS_DISTANZ = 130;
  var KLANG_ABKLINGEN = 0.92;

  function teilchenAnzahlErmitteln() {
    if (window.matchMedia && window.matchMedia('(max-width: 640px)').matches) return 48;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 24;
    return TEILCHEN_ANZAHL;
  }

  function zufalls(min, max) {
    return min + Math.random() * (max - min);
  }

  function teilchenErzeugen() {
    teilchen = [];
    var anzahl = teilchenAnzahlErmitteln();
    for (var i = 0; i < anzahl; i++) {
      teilchen.push({
        x: Math.random() * breite,
        y: Math.random() * hoehe,
        vx: zufalls(-0.25, 0.25),
        vy: zufalls(-0.25, 0.25),
        radius: zufalls(1.5, 4.5),
        phase: Math.random() * Math.PI * 2,
        helligkeit: zufalls(0.35, 0.85),
        klangBoost: 0
      });
    }
  }

  function groesseAnpassen() {
    if (!leinwand) return;
    geraetePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    breite = window.innerWidth;
    hoehe = window.innerHeight;
    leinwand.width = Math.floor(breite * geraetePixelRatio);
    leinwand.height = Math.floor(hoehe * geraetePixelRatio);
    leinwand.style.width = breite + 'px';
    leinwand.style.height = hoehe + 'px';
    kontext.setTransform(geraetePixelRatio, 0, 0, geraetePixelRatio, 0, 0);
    if (!teilchen.length) teilchenErzeugen();
  }

  function klangImpuls(x, y, staerke) {
    var px = typeof x === 'number' ? x : breite * 0.5;
    var py = typeof y === 'number' ? y : hoehe * 0.5;
    var kraft = (staerke || 0.4) * 2.2;
    teilchen.forEach(function (p) {
      var dx = p.x - px;
      var dy = p.y - py;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = kraft * 45 / (dist + 40);
      p.vx += (dx / dist) * f;
      p.vy += (dy / dist) * f;
      p.klangBoost = Math.min(1, p.klangBoost + (staerke || 0.4) * 0.85);
    });
  }

  function teilchenAktualisieren() {
    teilchen.forEach(function (p) {
      if (mausAktiv) {
        var dx = mausX - p.x;
        var dy = mausY - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 220) {
          var zug = (1 - dist / 220) * 0.018;
          p.vx += dx * zug * 0.04;
          p.vy += dy * zug * 0.04;
        }
        if (dist < 90) {
          var stoss = (1 - dist / 90) * 0.06;
          p.vx -= (dx / dist) * stoss;
          p.vy -= (dy / dist) * stoss;
        }
      }

      p.vx += Math.sin(p.phase * 0.7) * 0.002;
      p.vy += Math.cos(p.phase * 0.5) * 0.002;
      p.phase += 0.012;

      p.x += p.vx;
      p.y += p.vy;

      p.vx *= 0.985;
      p.vy *= 0.985;

      if (p.x < -20) p.x = breite + 20;
      if (p.x > breite + 20) p.x = -20;
      if (p.y < -20) p.y = hoehe + 20;
      if (p.y > hoehe + 20) p.y = -20;

      p.klangBoost *= KLANG_ABKLINGEN;
    });
  }

  function teilchenZeichnen() {
    kontext.clearRect(0, 0, breite, hoehe);

    for (var i = 0; i < teilchen.length; i++) {
      for (var j = i + 1; j < teilchen.length; j++) {
        var a = teilchen[i];
        var b = teilchen[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < VERBINDUNGS_DISTANZ) {
          var alpha = (1 - dist / VERBINDUNGS_DISTANZ) * 0.22;
          kontext.strokeStyle = 'rgba(239, 68, 68, ' + alpha + ')';
          kontext.lineWidth = 0.6;
          kontext.beginPath();
          kontext.moveTo(a.x, a.y);
          kontext.lineTo(b.x, b.y);
          kontext.stroke();
        }
      }
    }

    teilchen.forEach(function (p) {
      var hell = Math.min(1, p.helligkeit + p.klangBoost * 0.6);
      var r = p.radius * (1 + p.klangBoost * 0.8);
      var gradient = kontext.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
      gradient.addColorStop(0, 'rgba(255, 120, 120, ' + (hell * 0.95) + ')');
      gradient.addColorStop(0.35, 'rgba(239, 68, 68, ' + (hell * 0.55) + ')');
      gradient.addColorStop(0.7, 'rgba(139, 26, 42, ' + (hell * 0.2) + ')');
      gradient.addColorStop(1, 'rgba(139, 26, 42, 0)');
      kontext.fillStyle = gradient;
      kontext.beginPath();
      kontext.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
      kontext.fill();

      kontext.fillStyle = 'rgba(255, 200, 200, ' + hell + ')';
      kontext.beginPath();
      kontext.arc(p.x, p.y, r * 0.6, 0, Math.PI * 2);
      kontext.fill();
    });
  }

  function rahmen() {
    if (!laeuft) return;
    teilchenAktualisieren();
    teilchenZeichnen();
    requestAnimationFrame(rahmen);
  }

  function starten() {
    if (laeuft) return;
    laeuft = true;
    requestAnimationFrame(rahmen);
  }

  function initialisieren() {
    leinwand = document.getElementById('partikel-leinwand');
    if (!leinwand) return;
    kontext = leinwand.getContext('2d');
    if (!kontext) return;

    groesseAnpassen();
    starten();

    window.addEventListener('resize', function () {
      groesseAnpassen();
    });

    document.addEventListener('pointermove', function (e) {
      mausX = e.clientX;
      mausY = e.clientY;
      mausAktiv = true;
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      mausAktiv = false;
    }, { passive: true });

    window.addEventListener('lw-klang', function (e) {
      var d = e.detail || {};
      klangImpuls(d.x, d.y, d.staerke);
    });
  }

  window.LW_PARTIKEL = {
    klangImpuls: klangImpuls,
    neustart: function () {
      teilchenErzeugen();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialisieren);
  } else {
    initialisieren();
  }
})();
