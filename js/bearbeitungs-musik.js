/**
 * LW Inventory – Hintergrundmusik nur im Bearbeitungsmodus (nach Anmeldung)
 * Stumm = Lautstärke 0, Wiedergabe läuft weiter (kein pause).
 */
(function () {
  'use strict';

  var QUELLE = 'music.mp3';
  var LAUTSTAERKE = 0.01;
  var ton = null;
  var wiedergabeGestartet = false;
  var bearbeitungsAktiv = false;
  var stummGeschaltet = false;
  var stummKnopf = null;
  var stummEingabe = null;

  function tonHolen() {
    if (!ton) {
      ton = new Audio(QUELLE);
      ton.loop = true;
      ton.preload = 'auto';
      if (window.LW_KLANG_ANALYSE) {
        LW_KLANG_ANALYSE.dauerTonVerbinden(ton, 'musik', 1, LAUTSTAERKE);
      }
    }
    return ton;
  }

  function hoerbareLautstaerkeSetzen() {
    if (!ton) return;
    var wert = stummGeschaltet ? 0 : LAUTSTAERKE;
    if (window.LW_KLANG_ANALYSE && ton._lwKlangVerbunden) {
      ton.volume = 1;
      ton.muted = false;
      LW_KLANG_ANALYSE.lautstaerkeSetzen(ton, wert);
    } else {
      ton.volume = wert;
      ton.muted = stummGeschaltet;
    }
  }

  function stummKnopfSichtbar(zeigen) {
    var wrap = document.getElementById('bearbeitungs-musik-mute-wrap');
    if (!wrap) return;
    wrap.hidden = !zeigen;
  }

  function wiedergabeStarten() {
    if (!bearbeitungsAktiv || wiedergabeGestartet) {
      hoerbareLautstaerkeSetzen();
      return;
    }
    var audio = tonHolen();
    if (window.LW_KLANG_ANALYSE) {
      LW_KLANG_ANALYSE.kontextFreischalten();
    }
    wiedergabeGestartet = true;
    hoerbareLautstaerkeSetzen();
    var abspielen = audio.play();
    if (abspielen && typeof abspielen.catch === 'function') {
      abspielen.catch(function () {
        wiedergabeGestartet = false;
      });
    }
  }

  function wiedergabeBeenden() {
    if (!ton) {
      wiedergabeGestartet = false;
      return;
    }
    wiedergabeGestartet = false;
    ton.pause();
    try { ton.currentTime = 0; } catch (e) { /* ignorieren */ }
  }

  function stummSetzen(stumm) {
    stummGeschaltet = !!stumm;
    if (stummEingabe) stummEingabe.checked = stummGeschaltet;
    hoerbareLautstaerkeSetzen();
  }

  function bearbeitungsAnsichtAktiv(istAktiv) {
    bearbeitungsAktiv = !!istAktiv;
    stummKnopfSichtbar(bearbeitungsAktiv);
    if (!bearbeitungsAktiv) {
      wiedergabeBeenden();
      return;
    }
    if (stummEingabe) stummEingabe.checked = stummGeschaltet;
    wiedergabeStarten();
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
    wiedergabeStarten: wiedergabeStarten,
    wiedergabeBeenden: wiedergabeBeenden,
    stummSetzen: stummSetzen,
    bearbeitungsAnsichtAktiv: bearbeitungsAnsichtAktiv
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', knopfInitialisieren);
  } else {
    knopfInitialisieren();
  }
})();
