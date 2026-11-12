// Hide ".html" / "index.html" in the address bar (e.g. old bookmarks to /about.html).
// GitHub Pages already serves /about for about.html, so this only tidies the URL.
(function () {
  if (!/^https?:$/.test(location.protocol)) return;
  var path = location.pathname;
  var clean = path.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  if (clean !== path) {
    history.replaceState(null, '', clean + location.search + location.hash);
  }
})();
