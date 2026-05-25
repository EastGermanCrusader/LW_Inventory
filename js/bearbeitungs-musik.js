/**
 * LW Inventory – Hintergrundmusik nur im Bearbeitungsmodus (nach Anmeldung)
 */
(function () {
  'use strict';

  var QUELLE = 'music.mp3';
  var LAUTSTAERKE = 0.05;
  var ton = null;
  var laeuft = false;

  function tonHolen() {
    if (!ton) {
      ton = new Audio(QUELLE);
      ton.loop = true;
      ton.preload = 'auto';
    }
    ton.volume = LAUTSTAERKE;
    return ton;
  }

  function starten() {
    if (laeuft) return;
    var audio = tonHolen();
    laeuft = true;
    var abspielen = audio.play();
    if (abspielen && typeof abspielen.catch === 'function') {
      abspielen.catch(function () {
        laeuft = false;
      });
    }
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

  function bearbeitungsAnsichtAktiv(istAktiv) {
    if (istAktiv) starten();
    else stoppen();
  }

  window.LW_BEARBEITUNGS_MUSIK = {
    starten: starten,
    stoppen: stoppen,
    bearbeitungsAnsichtAktiv: bearbeitungsAnsichtAktiv
  };
})();
