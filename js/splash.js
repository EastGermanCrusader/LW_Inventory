/**
 * LW Inventory – Startseite / Splash (6 Sekunden + loading.mp3)
 */
(function () {
  'use strict';

  var MIN_DAUER_MS = 6000;
  var gestartetAm = Date.now();
  var appBereit = false;
  var ausblendenGeplant = false;
  var splashTon = null;
  var tonAusblendTimer = null;

  function element(id) { return document.getElementById(id); }

  function statusSetzen(text) {
    var ziel = element('splash-status');
    if (ziel) ziel.textContent = text;
  }

  function fortschrittSetzen(prozent) {
    var balken = element('splash-progress-bar');
    if (balken) balken.style.width = Math.min(100, Math.max(0, prozent)) + '%';
  }

  function laderEinfuegen() {
    var mount = element('splash-loader');
    if (!mount) return;
    fetch('js/splash-loader.html')
      .then(function (antwort) { return antwort.text(); })
      .then(function (html) { mount.innerHTML = html; })
      .catch(function () {
        mount.innerHTML = '<div class="socket"><div class="gel center-gel"><div class="hex-brick h1"></div><div class="hex-brick h2"></div><div class="hex-brick h3"></div></div></div>';
      });
  }

  function splashTonAbspielen() {
    splashTon = element('splash-audio');
    if (!splashTon) return;

    splashTon.volume = 0.9;
    splashTon.currentTime = 0;

    var abspielen = splashTon.play();
    if (abspielen && typeof abspielen.catch === 'function') {
      abspielen.catch(function () {
        var splash = element('splash-screen');
        if (!splash) return;
        var hinweis = document.createElement('p');
        hinweis.className = 'splash-audio-hint';
        hinweis.textContent = 'Tippen/Klicken für Sound';
        splash.querySelector('.splash-content').appendChild(hinweis);
        splash.addEventListener('click', function beiTipp() {
          splash.removeEventListener('click', beiTipp);
          if (hinweis.parentNode) hinweis.parentNode.removeChild(hinweis);
          splashTon.play().catch(function () { /* ignorieren */ });
        });
      });
    }
  }

  function splashTonAusblenden() {
    if (!splashTon) return;
    clearInterval(tonAusblendTimer);
    var schritte = 12;
    var schritt = 0;
    var startLautstaerke = splashTon.volume;
    tonAusblendTimer = setInterval(function () {
      schritt++;
      splashTon.volume = Math.max(0, startLautstaerke * (1 - schritt / schritte));
      if (schritt >= schritte) {
        clearInterval(tonAusblendTimer);
        splashTon.pause();
        splashTon.currentTime = 0;
      }
    }, 50);
  }

  function splashAusblenden() {
    var splash = element('splash-screen');
    var root = element('app-root');
    fortschrittSetzen(100);
    statusSetzen('Bereit');
    splashTonAusblenden();
    if (splash) {
      splash.classList.add('splash-screen--out');
      splash.setAttribute('aria-busy', 'false');
    }
    if (root) root.classList.remove('app-root--waiting');
    setTimeout(function () {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 700);
  }

  function ausblendenVersuchen() {
    if (!appBereit || ausblendenGeplant) return;
    ausblendenGeplant = true;
    var vergangen = Date.now() - gestartetAm;
    var warten = Math.max(0, MIN_DAUER_MS - vergangen);
    setTimeout(splashAusblenden, warten);
  }

  function abschliessen() {
    appBereit = true;
    fortschrittSetzen(88);
    statusSetzen('Inventar wird geladen…');
    ausblendenVersuchen();
  }

  window.LW_SPLASH = {
    statusSetzen: statusSetzen,
    fortschrittSetzen: fortschrittSetzen,
    abschliessen: abschliessen
  };

  laderEinfuegen();
  splashTonAbspielen();
  fortschrittSetzen(8);
  statusSetzen('System wird initialisiert…');

  setTimeout(function () { fortschrittSetzen(22); statusSetzen('Konfiguration laden…'); }, 1000);
  setTimeout(function () { fortschrittSetzen(42); statusSetzen('Verbindung vorbereiten…'); }, 2200);
  setTimeout(function () { fortschrittSetzen(62); statusSetzen('Module laden…'); }, 3600);
  setTimeout(function () { fortschrittSetzen(78); statusSetzen('Fast fertig…'); }, 4800);
})();
