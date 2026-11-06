(function () {
  var STORAGE_KEY = 'theme';

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function applyTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  function effectiveTheme() {
    var theme = document.documentElement.getAttribute('data-theme');
    if (theme) return theme;
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  // Apply saved preference immediately to avoid a flash of the wrong theme.
  applyTheme(getStoredTheme());

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    // Pixel-art sun and moon, one character per pixel (see PALETTES).
    var SUN_PIXELS = [
      '.......rr.......',
      '.......rr.......',
      '..r..........r..',
      '...r..oooo..r...',
      '.....oWWMMo.....',
      '....oWWMMMMo....',
      '...oWWMMMMMMo...',
      'rr.oWMMMMMMMo.rr',
      'rr.oMMMMMMMyo.rr',
      '...oMMMMMMyyo...',
      '....oMMMMyyo....',
      '.....oMMyyo.....',
      '...r..oooo..r...',
      '..r..........r..',
      '.......rr.......',
      '.......rr.......'
    ];
    var MOON_PIXELS = [
      '................',
      '......o.........',
      '....oomo........',
      '...oMMmo........',
      '..oMMmo.........',
      '.oMMMmo.........',
      '.oMMMmo.........',
      '.oMMMmo.........',
      '.oMMMMmo........',
      '.oMcMMMmooooo...',
      '.oMMcMMMMMMMmo..',
      '..oMMMMMMMMmo...',
      '...oMcMMMMmo....',
      '....ooMMmoo.....',
      '......ooo.......',
      '................'
    ];
    var SUN_PALETTE = { o: '#b06010', M: '#ffd83a', y: '#ffb000', W: '#fff6b0', r: '#ffc21a' };
    var MOON_PALETTE = { o: '#5c6282', M: '#eaecf6', m: '#c8cde0', c: '#b0b5cc' };

    function pixelSvg(rows, palette) {
      var rects = '';
      for (var y = 0; y < rows.length; y++) {
        for (var x = 0; x < rows[y].length; x++) {
          var color = palette[rows[y].charAt(x)];
          if (color) rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + color + '"/>';
        }
      }
      return '<svg viewBox="0 0 16 16" width="32" height="32" shape-rendering="crispEdges" aria-hidden="true">' + rects + '</svg>';
    }

    var SUN_ICON = pixelSvg(SUN_PIXELS, SUN_PALETTE);
    var MOON_ICON = pixelSvg(MOON_PIXELS, MOON_PALETTE);

    function updateButton() {
      var current = effectiveTheme();
      // Icon reflects the theme that is currently active: sun while in
      // light mode, moon while in dark mode.
      btn.innerHTML = current === 'dark' ? MOON_ICON : SUN_ICON;
      btn.setAttribute('aria-label', current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('title', current === 'dark' ? 'Dark mode (click to switch to light)' : 'Light mode (click to switch to dark)');
    }

    btn.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setStoredTheme(next);
      updateButton();
    });

    updateButton();
  });
})();
