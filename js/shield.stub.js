/* LW Inventory Shield – Platzhalter (wird durch npm run build ersetzt) */
(function (g) {
  g.LW_SHIELD = {
    configured: false,
    cfg: function () {
      return { loginHash: '', apiUrl: null };
    },
    publicApiUrl: function () {
      return '';
    },
    unlock: async function () {
      throw new Error('LW Inventory ist nicht konfiguriert. Siehe SETUP.md.');
    }
  };
})(typeof window !== 'undefined' ? window : global);
