/**
 * LW Inventory – Klangpegel (Web Audio) für Partikel & Effekte
 */
(function () {
  'use strict';

  var audioKontext = null;
  var messungen = [];
  var laeuft = false;
  var pegel = {
    gesamt: 0,
    musik: 0,
    ui: 0,
    db: -Infinity
  };

  function kontextHolen() {
    if (!audioKontext) {
      audioKontext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioKontext;
  }

  function kontextFreischalten() {
    var k = kontextHolen();
    if (k.state === 'suspended') {
      k.resume().catch(function () { /* ignorieren */ });
    }
  }

  function pegelAusAnalyser(analyser) {
    var daten = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(daten);
    var summe = 0;
    for (var i = 0; i < daten.length; i++) {
      summe += daten[i];
    }
    return summe / (daten.length * 255);
  }

  function messungRegistrieren(id, analyser, gewichtung) {
    messungen.push({
      id: id,
      analyser: analyser,
      gewicht: gewichtung || 1,
      aktiv: true
    });
    if (!laeuft) {
      laeuft = true;
      analyseSchleife();
    }
  }

  function dauerTonVerbinden(audio, id, gewichtung, lautstaerke) {
    if (!audio || audio._lwKlangVerbunden) {
      return audio && audio._lwAnalyseId ? audio._lwAnalyseId : null;
    }
    kontextFreischalten();
    var k = kontextHolen();
    var quelle = k.createMediaElementSource(audio);
    var analyser = k.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    var laut = k.createGain();
    laut.gain.value = typeof lautstaerke === 'number' ? lautstaerke : 1;
    quelle.connect(analyser);
    analyser.connect(laut);
    laut.connect(k.destination);
    audio._lwKlangVerbunden = true;
    audio._lwAnalyseId = id;
    audio._lwLautGain = laut;
    messungRegistrieren(id, analyser, gewichtung);
    return id;
  }

  function einmalTonAbspielen(audio, id, gewichtung, lautstaerke) {
    if (!audio) return;
    kontextFreischalten();
    var k = kontextHolen();
    if (!audio._lwKlangVerbunden) {
      var quelle = k.createMediaElementSource(audio);
      var analyser = k.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.6;
      var laut = k.createGain();
      laut.gain.value = typeof lautstaerke === 'number' ? lautstaerke : 1;
      quelle.connect(analyser);
      analyser.connect(laut);
      laut.connect(k.destination);
      audio._lwKlangVerbunden = true;
      audio._lwLautGain = laut;
      var eintrag = { id: id, analyser: analyser, gewicht: gewichtung || 0.5, aktiv: true };
      messungen.push(eintrag);
      audio.addEventListener('ended', function () {
        eintrag.aktiv = false;
      }, { once: true });
    } else if (audio._lwLautGain) {
      audio._lwLautGain.gain.value = typeof lautstaerke === 'number' ? lautstaerke : 1;
    }
    if (!laeuft) {
      laeuft = true;
      analyseSchleife();
    }
    var abspielen = audio.play();
    if (abspielen && abspielen.catch) abspielen.catch(function () { /* ignorieren */ });
  }

  function lautstaerkeSetzen(audio, wert) {
    if (audio && audio._lwLautGain) {
      audio._lwLautGain.gain.value = wert;
    }
  }

  function analyseSchleife() {
    var musik = 0;
    var ui = 0;
    messungen.forEach(function (m) {
      if (!m.aktiv) return;
      var roh = pegelAusAnalyser(m.analyser);
      var gewichtet = roh * m.gewicht;
      if (m.id === 'musik') {
        musik = Math.max(musik, gewichtet);
      } else {
        ui = Math.max(ui, gewichtet);
      }
    });
    pegel.musik = musik;
    pegel.ui = ui;
    pegel.gesamt = Math.min(1, musik * 1.15 + ui * 0.65);
    pegel.db = pegel.gesamt > 0.0001
      ? 20 * Math.log10(pegel.gesamt)
      : -60;

    window.dispatchEvent(new CustomEvent('lw-klangpegel', {
      detail: {
        gesamt: pegel.gesamt,
        musik: pegel.musik,
        ui: pegel.ui,
        db: pegel.db
      }
    }));

    requestAnimationFrame(analyseSchleife);
  }

  window.LW_KLANG_ANALYSE = {
    kontextFreischalten: kontextFreischalten,
    dauerTonVerbinden: dauerTonVerbinden,
    einmalTonAbspielen: einmalTonAbspielen,
    messungRegistrieren: messungRegistrieren,
    lautstaerkeSetzen: lautstaerkeSetzen,
    holePegel: function () {
      return pegel;
    }
  };

  document.addEventListener('pointerdown', kontextFreischalten, { once: false, passive: true });
  document.addEventListener('keydown', kontextFreischalten, { once: false, passive: true });
})();
