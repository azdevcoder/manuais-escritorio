(function () {
  var KEY = "manuais-tema";
  function aplicar(t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    var label = document.getElementById("themeLabel");
    var sun = document.getElementById("iconSun");
    var moon = document.getElementById("iconMoon");
    var btn = document.getElementById("btnTheme");
    if (label) label.textContent = t === "dark" ? "Modo claro" : "Modo escuro";
    if (sun) sun.style.display = t === "dark" ? "" : "none";
    if (moon) moon.style.display = t === "dark" ? "none" : "";
    if (btn) btn.title = t === "dark" ? "Alternar para modo claro" : "Alternar para modo escuro";
  }
  function temaAtual() {
    try { return localStorage.getItem(KEY) || "dark"; } catch (e) { return "dark"; }
  }
  document.addEventListener("DOMContentLoaded", function () {
    aplicar(temaAtual());
    var btn = document.getElementById("btnTheme");
    if (btn) btn.addEventListener("click", function () {
      var atual = document.documentElement.getAttribute("data-theme") || "dark";
      aplicar(atual === "dark" ? "light" : "dark");
    });
  });
})();
