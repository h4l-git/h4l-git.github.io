(function () {
  var RECIPIENT = 'harryalees@me.com';
  var MAILTO = 'mailto:' + RECIPIENT;

  document.querySelectorAll('a.footer-email').forEach(function (link) {
    link.setAttribute('href', MAILTO);
    link.setAttribute('aria-label', 'Email ' + RECIPIENT);
    link.addEventListener('click', function (event) {
      // Always open the OS/email app with this address in To, even if
      // another handler cancelled the native mailto navigation.
      event.preventDefault();
      window.location.href = MAILTO;
    });
  });
})();
