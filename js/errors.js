/**
 * LW Inventory – Fehlerprotokoll (Debug)
 */
(function () {
  'use strict';

  var SPEICHER_SCHLUESSEL = 'lw_error_log';
  var MAX_EINTRAEGE = 80;
  var protokoll = [];
  var panelGebunden = false;

  function element(id) { return document.getElementById(id); }

  function protokollLaden() {
    try {
      var roh = sessionStorage.getItem(SPEICHER_SCHLUESSEL);
      protokoll = roh ? JSON.parse(roh) : [];
      if (!Array.isArray(protokoll)) protokoll = [];
    } catch (e) {
      protokoll = [];
    }
  }

  function protokollSpeichern() {
    try {
      sessionStorage.setItem(SPEICHER_SCHLUESSEL, JSON.stringify(protokoll.slice(0, MAX_EINTRAEGE)));
    } catch (e) { /* Speicher voll */ }
  }

  function zeitFormatieren(iso) {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function eintragAlsText(eintrag, index) {
    var zeilen = [];
    zeilen.push('=== LW Inventory Fehler #' + (index != null ? index + 1 : '?') + ' ===');
    zeilen.push('Zeit:      ' + zeitFormatieren(eintrag.time));
    zeilen.push('Level:     ' + (eintrag.level || 'error').toUpperCase());
    zeilen.push('Quelle:    ' + (eintrag.source || '—'));
    zeilen.push('Meldung:   ' + eintrag.message);
    if (eintrag.stack) zeilen.push('Stack:\n' + eintrag.stack);
    if (eintrag.detail) {
      try {
        zeilen.push('Details:\n' + JSON.stringify(eintrag.detail, null, 2));
      } catch (e) {
        zeilen.push('Details:   ' + String(eintrag.detail));
      }
    }
    zeilen.push('URL:       ' + (eintrag.url || ''));
    zeilen.push('');
    return zeilen.join('\n');
  }

  function gesamtAlsText() {
    if (!protokoll.length) return 'Keine Fehler im Protokoll.';
    var kopf = 'LW Inventory – Fehlerprotokoll (' + protokoll.length + ' Einträge)\n' +
      'Exportiert: ' + zeitFormatieren(new Date().toISOString()) + '\n' +
      'User-Agent: ' + navigator.userAgent + '\n\n';
    return kopf + protokoll.map(function (e, i) { return eintragAlsText(e, i); }).join('\n');
  }

  function textKopieren(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var feld = document.createElement('textarea');
    feld.value = text;
    feld.style.position = 'fixed';
    feld.style.left = '-9999px';
    document.body.appendChild(feld);
    feld.select();
    document.execCommand('copy');
    document.body.removeChild(feld);
    return Promise.resolve();
  }

  function badgeAktualisieren() {
    var knopf = element('btn-error-log');
    var badge = element('error-log-badge');
    if (!knopf || !badge) return;
    var anzahl = protokoll.length;
    badge.textContent = anzahl > 99 ? '99+' : String(anzahl);
    badge.hidden = anzahl === 0;
    knopf.classList.toggle('has-errors', anzahl > 0);
  }

  function protokollieren(stufe, meldung, optionen) {
    optionen = optionen || {};
    var eintrag = {
      id: 'E' + Date.now() + Math.floor(Math.random() * 1e4),
      time: new Date().toISOString(),
      level: stufe || 'error',
      source: optionen.source || 'app',
      message: String(meldung || 'Unbekannter Fehler'),
      stack: optionen.stack || null,
      detail: optionen.detail || null,
      url: window.location.href
    };
    protokoll.unshift(eintrag);
    if (protokoll.length > MAX_EINTRAEGE) protokoll.length = MAX_EINTRAEGE;
    protokollSpeichern();
    badgeAktualisieren();
    if (element('error-log-modal') && element('error-log-modal').classList.contains('open')) {
      listeRendern();
    }
    return eintrag;
  }

  function ausException(fehler, optionen) {
    optionen = optionen || {};
    if (!fehler) return protokollieren('error', optionen.message || 'Unbekannter Fehler', optionen);
    return protokollieren(optionen.level || 'error', fehler.message || String(fehler), {
      source: optionen.source || 'exception',
      stack: fehler.stack || null,
      detail: optionen.detail || null
    });
  }

  function listeRendern() {
    var liste = element('error-log-list');
    var leer = element('error-log-empty');
    if (!liste) return;

    if (!protokoll.length) {
      liste.innerHTML = '';
      if (leer) leer.hidden = false;
      return;
    }
    if (leer) leer.hidden = true;

    liste.innerHTML = protokoll.map(function (eintrag, idx) {
      var stufe = (eintrag.level || 'error').toLowerCase();
      var detailVorschau = '';
      if (eintrag.detail) {
        try {
          detailVorschau = JSON.stringify(eintrag.detail);
          if (detailVorschau.length > 120) detailVorschau = detailVorschau.slice(0, 120) + '…';
        } catch (e) {
          detailVorschau = String(eintrag.detail);
        }
      }
      return (
        '<article class="error-log-item error-log-item--' + stufe + '" data-id="' + eintrag.id + '">' +
        '<div class="error-log-item-head">' +
        '<span class="error-log-level">' + stufe.toUpperCase() + '</span>' +
        '<time class="error-log-time">' + zeitFormatieren(eintrag.time) + '</time>' +
        '<span class="error-log-source">' + (eintrag.source || 'app') + '</span>' +
        '</div>' +
        '<p class="error-log-msg">' + htmlEscapen(eintrag.message) + '</p>' +
        (eintrag.stack ? '<pre class="error-log-stack">' + htmlEscapen(eintrag.stack) + '</pre>' : '') +
        (detailVorschau ? '<pre class="error-log-detail">' + htmlEscapen(detailVorschau) + '</pre>' : '') +
        '<div class="error-log-item-actions">' +
        '<button type="button" class="btn btn-secondary btn-error-copy-one" data-id="' + eintrag.id + '">Kopieren</button>' +
        '</div></article>'
      );
    }).join('');

    liste.querySelectorAll('.btn-error-copy-one').forEach(function (knopf) {
      knopf.addEventListener('click', function () {
        var id = knopf.getAttribute('data-id');
        var eintrag = protokoll.find(function (x) { return x.id === id; });
        var index = protokoll.indexOf(eintrag);
        if (eintrag) {
          textKopieren(eintragAlsText(eintrag, index)).then(kopiertHinweis).catch(kopierenFehlgeschlagen);
        }
      });
    });
  }

  function htmlEscapen(s) {
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function kopiertHinweis() {
    var hinweis = element('error-log-copy-hint');
    if (hinweis) {
      hinweis.textContent = 'In Zwischenablage kopiert.';
      hinweis.hidden = false;
      setTimeout(function () { hinweis.hidden = true; }, 2000);
    }
  }

  function kopierenFehlgeschlagen() {
    var hinweis = element('error-log-copy-hint');
    if (hinweis) {
      hinweis.textContent = 'Kopieren fehlgeschlagen.';
      hinweis.hidden = false;
    }
  }

  function panelOeffnen() {
    var modal = element('error-log-modal');
    if (modal) {
      modal.classList.add('open');
      listeRendern();
    }
  }

  function panelSchliessen() {
    var modal = element('error-log-modal');
    if (modal) modal.classList.remove('open');
  }

  function protokollLeeren() {
    if (!protokoll.length) return;
    if (!confirm('Gesamtes Fehlerprotokoll löschen?')) return;
    protokoll = [];
    protokollSpeichern();
    badgeAktualisieren();
    listeRendern();
  }

  function panelBinden() {
    if (panelGebunden) return;
    panelGebunden = true;

    var knopf = element('btn-error-log');
    if (knopf) knopf.addEventListener('click', panelOeffnen);

    var allesKopieren = element('btn-error-copy-all');
    if (allesKopieren) {
      allesKopieren.addEventListener('click', function () {
        textKopieren(gesamtAlsText()).then(kopiertHinweis).catch(kopierenFehlgeschlagen);
      });
    }

    var leerenKnopf = element('btn-error-clear');
    if (leerenKnopf) leerenKnopf.addEventListener('click', protokollLeeren);

    document.querySelectorAll('[data-close="error-log-modal"]').forEach(function (el) {
      el.addEventListener('click', panelSchliessen);
    });

    var modal = element('error-log-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) panelSchliessen();
      });
    }
  }

  function globaleFehlerhandlerInstallieren() {
    window.addEventListener('error', function (ereignis) {
      protokollieren('error', ereignis.message || 'Script-Fehler', {
        source: 'window.onerror',
        stack: ereignis.error && ereignis.error.stack ? ereignis.error.stack : (ereignis.filename ? ereignis.filename + ':' + ereignis.lineno + ':' + ereignis.colno : null),
        detail: { file: ereignis.filename, line: ereignis.lineno, col: ereignis.colno }
      });
    });

    window.addEventListener('unhandledrejection', function (ereignis) {
      var grund = ereignis.reason;
      if (grund instanceof Error) {
        ausException(grund, { source: 'unhandledrejection' });
      } else {
        protokollieren('error', String(grund), { source: 'unhandledrejection', detail: grund });
      }
    });
  }

  protokollLaden();
  globaleFehlerhandlerInstallieren();

  window.LW_ERRORS = {
    protokollieren: protokollieren,
    ausException: ausException,
    alleHolen: function () { return protokoll.slice(); },
    leeren: protokollLeeren,
    oeffnen: panelOeffnen,
    allesKopieren: function () { return textKopieren(gesamtAlsText()); },
    aktualisieren: listeRendern
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      panelBinden();
      badgeAktualisieren();
    });
  } else {
    panelBinden();
    badgeAktualisieren();
  }
})();
