/**
 * LW Inventory – Hintergrundmusik nur im Bearbeitungsmodus (nach Anmeldung)
 */
(function () {
  'use strict';

  var QUELLE = 'music.mp3';
  var LAUTSTAERKE = 0.01;
  var ton = null;
  var laeuft = false;
  var bearbeitungsAktiv = false;
  var stummGeschaltet = false;
  var stummKnopf = null;
  var stummEingabe = null;

  function tonHolen() {
    if (!ton) {
      ton = new Audio(QUELLE);
      ton.loop = true;
      ton.preload = 'auto';
    }
    ton.volume = LAUTSTAERKE;
    return ton;
  }

  function stummKnopfSichtbar(zeigen) {
    var wrap = document.getElementById('bearbeitungs-musik-mute-wrap');
    if (!wrap) return;
    wrap.hidden = !zeigen;
  }

  function wiedergabeAktualisieren() {
    if (!bearbeitungsAktiv || stummGeschaltet) {
      if (laeuft) stoppen();
      return;
    }
    starten();
  }

  function starten() {
    if (laeuft || stummGeschaltet || !bearbeitungsAktiv) return;
    var audio = tonHolen();
    laeuft = true;
    var abspielen = audio.play();
    if (abspielen && typeof abspielen.catch === 'function') {
      abspielen.catch(function () {
        laeuft = false;
      });
    }
    window.dispatchEvent(new CustomEvent('lw-klang', {
      detail: { staerke: 0.38, x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 }
    }));
  }

  function stoppen() {
    if (!ton) {
      laeuft = false;
      return;
    }
    laeuft = false;
    ton.pause();
    try { ton.currentTime = 0; } catch (e) { /* ignorieren */ }
  }

  function stummSetzen(stumm) {
    stummGeschaltet = !!stumm;
    if (stummEingabe) stummEingabe.checked = stummGeschaltet;
    wiedergabeAktualisieren();
  }

  function bearbeitungsAnsichtAktiv(istAktiv) {
    bearbeitungsAktiv = !!istAktiv;
    stummKnopfSichtbar(bearbeitungsAktiv);
    if (!bearbeitungsAktiv) {
      stoppen();
      return;
    }
    if (stummEingabe) stummEingabe.checked = stummGeschaltet;
    wiedergabeAktualisieren();
  }

  function knopfInitialisieren() {
    stummEingabe = document.getElementById('bearbeitungs-musik-stumm');
    if (!stummEingabe || stummKnopf) return;
    stummKnopf = true;
    stummEingabe.addEventListener('change', function () {
      stummSetzen(stummEingabe.checked);
    });
  }

  window.LW_BEARBEITUNGS_MUSIK = {
    starten: starten,
    stoppen: stoppen,
    stummSetzen: stummSetzen,
    bearbeitungsAnsichtAktiv: bearbeitungsAnsichtAktiv
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', knopfInitialisieren);
  } else {
    knopfInitialisieren();
  }
})();
