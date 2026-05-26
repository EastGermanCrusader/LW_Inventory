/**
 * LW Inventory – UI-Sounds (hover / press / input)
 * Hover: nur solange die Maus über dem Knopf ist, sonst Stopp.
 * Input: bei jeder Eingabe, Instanzen dürfen sich überlagern.
 */
(function () {
  'use strict';

  var HOVER_QUELLE = 'hover.mp3';
  var DRUCK_QUELLE = 'press.mp3';
  var EINGABE_QUELLE = 'input.mp3';
  var LAUTSTAERKE = 0.75;

  var hoverTon = null;
  var druckTon = null;
  var aktuellesHoverElement = null;
  var aktiviert = true;
  var letzteZeigerX = null;
  var letzteZeigerY = null;

  function klangMelden(staerke, ereignis) {
    window.dispatchEvent(new CustomEvent('lw-klang', {
      detail: {
        staerke: staerke,
        x: ereignis && typeof ereignis.clientX === 'number' ? ereignis.clientX : letzteZeigerX,
        y: ereignis && typeof ereignis.clientY === 'number' ? ereignis.clientY : letzteZeigerY
      }
    }));
  }

  var SELEKTOR = [
    'button',
    '.btn',
    '.tab-btn',
    'label.btn-upload',
    '.akte-file-actions a',
    '.modal-close'
  ].join(', ');

  function audioInitialisieren() {
    hoverTon = new Audio(HOVER_QUELLE);
    hoverTon.preload = 'auto';
    hoverTon.volume = LAUTSTAERKE;
    hoverTon.loop = false;

    druckTon = new Audio(DRUCK_QUELLE);
    druckTon.preload = 'auto';
    druckTon.volume = LAUTSTAERKE;
  }

  function knopfFinden(ziel) {
    if (!ziel || !ziel.closest) return null;
    if (ziel.closest('#splash-screen')) return null;
    var el = ziel.closest(SELEKTOR);
    if (!el) return null;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return null;
    return el;
  }

  function hoverStoppen() {
    if (!hoverTon) return;
    hoverTon.pause();
    hoverTon.currentTime = 0;
  }

  function hoverStarten() {
    if (!aktiviert || !hoverTon) return;
    hoverStoppen();
    var abspielen = hoverTon.play();
    if (abspielen && abspielen.catch) abspielen.catch(function () { /* Autoplay-Richtlinie */ });
    klangMelden(0.12, null);
  }

  function druckTonAbspielen() {
    if (!aktiviert || !druckTon) return;
    druckTon.currentTime = 0;
    var abspielen = druckTon.play();
    if (abspielen && abspielen.catch) abspielen.catch(function () { /* ignorieren */ });
  }

  var EINGABE_TYPEN_UEBERSPRINGEN = {
    hidden: 1,
    file: 1,
    checkbox: 1,
    radio: 1,
    button: 1,
    submit: 1,
    range: 1,
    color: 1
  };

  function texteingabeFinden(ziel) {
    if (!ziel || !ziel.closest) return null;
    if (ziel.closest('#splash-screen')) return null;
    var el = ziel.closest('input, textarea');
    if (!el) return null;
    if (el.disabled || el.readOnly) return null;
    if (el.tagName === 'INPUT') {
      var typ = (el.type || 'text').toLowerCase();
      if (EINGABE_TYPEN_UEBERSPRINGEN[typ]) return null;
    }
    return el;
  }

  function eingabeTonAbspielen() {
    if (!aktiviert) return;
    var ton = new Audio(EINGABE_QUELLE);
    ton.volume = LAUTSTAERKE;
    var abspielen = ton.play();
    if (abspielen && abspielen.catch) abspielen.catch(function () { /* ignorieren */ });
  }

  function beiEingabe(ereignis) {
    if (!texteingabeFinden(ereignis.target)) return;
    eingabeTonAbspielen();
    klangMelden(0.28, ereignis);
  }

  function beiMausDrueber(ereignis) {
    var knopf = knopfFinden(ereignis.target);
    if (!knopf) return;
    if (knopf === aktuellesHoverElement) return;
    var von = ereignis.relatedTarget;
    if (von && knopf.contains(von)) return;

    if (aktuellesHoverElement && aktuellesHoverElement !== knopf) {
      hoverStoppen();
    }
    aktuellesHoverElement = knopf;
    hoverStarten();
  }

  function beiMausWeg(ereignis) {
    if (!aktuellesHoverElement) return;
    var knopf = knopfFinden(ereignis.target);
    if (knopf !== aktuellesHoverElement) return;
    var nach = ereignis.relatedTarget;
    if (nach && aktuellesHoverElement.contains(nach)) return;

    hoverStoppen();
    aktuellesHoverElement = null;
  }

  function beiZeigerDruck(ereignis) {
    if (ereignis.button !== 0) return;
    var knopf = knopfFinden(ereignis.target);
    if (!knopf) return;
    hoverStoppen();
    aktuellesHoverElement = null;
    druckTonAbspielen();
    klangMelden(0.55, ereignis);
  }

  function binden() {
    document.addEventListener('pointermove', function (e) {
      letzteZeigerX = e.clientX;
      letzteZeigerY = e.clientY;
    }, { passive: true });
    document.addEventListener('mouseover', beiMausDrueber, true);
    document.addEventListener('mouseout', beiMausWeg, true);
    document.addEventListener('pointerdown', beiZeigerDruck, true);
    document.addEventListener('input', beiEingabe, true);
  }

  audioInitialisieren();
  binden();

  window.LW_UI_SOUNDS = {
    aktivieren: function () { aktiviert = true; },
    deaktivieren: function () { aktiviert = false; hoverStoppen(); },
    hoverStoppen: hoverStoppen
  };
})();
