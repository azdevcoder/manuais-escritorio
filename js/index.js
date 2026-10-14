(function () {
  var lista = [];
  var $ = function (id) { return document.getElementById(id); };

  function setoresUnicos() {
    var s = {};
    lista.forEach(function (m) { if (m && m.setor) s[m.setor] = true; });
    return Object.keys(s).sort();
  }

  function filtrar() {
    var q = ($("busca").value || "").toLowerCase();
    var setor = $("filtroSetor").value;
    var prio = $("filtroPrioridade").value;
    var st = $("filtroStatus").value;
    return lista.filter(function (m) {
      if (!m || typeof m !== "object") return false;
      if (setor && m.setor !== setor) return false;
      if (prio && String(m.prioridade) !== String(prio)) return false;
      if (st) {
        var k = Store.status(m).chave;
        if (st === "pronto" && k !== "pronto") return false;
        if (st === "pendente" && k === "pronto") return false;
      }
      if (q && (String(m.titulo == null ? "" : m.titulo) + " " + String(m.setor == null ? "" : m.setor)).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function render() {
    var itens = filtrar();
    var prontos = lista.filter(function (m) { return m && Store.status(m).chave === "pronto"; }).length;
    $("stats").textContent = lista.length + " demandas • " + prontos + " com manual • mostrando " + itens.length;
    var grid = $("grid");
    grid.innerHTML = "";
    if (!itens.length) {
      grid.innerHTML = '<div class="empty-state">Nenhuma demanda encontrada. Ajuste a busca ou os filtros.</div>';
      return;
    }
    itens.forEach(function (m) {
      var st = Store.status(m);
      var row = document.createElement("div");
      row.className = "list-row";
      var descRaw = String(m.descricao == null ? "" : m.descricao);
      var desc = descRaw.slice(0, 90);
      row.innerHTML =
        '<div><span class="tag p' + m.prioridade + '"><span class="dot"></span>Prioridade ' + m.prioridade + "</span></div>" +
        "<div><h3>" + esc(m.titulo) + "</h3>" +
        (desc ? '<div class="sub">' + esc(desc) + (descRaw.length > 90 ? "…" : "") + "</div>" : "") + "</div>" +
        '<div><span class="tag setor">' + esc(m.setor) + "</span></div>" +
        '<div><span class="tag ' + (st.chave === "pronto" ? "ok" : "empty") + '">' + esc(st.rotulo) + "</span></div>" +
        '<div class="cell-action"><a class="open" href="manual.html?id=' + encodeURIComponent(m.id) + '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>' +
        "Abrir manual</a></div>";
      grid.appendChild(row);
    });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  async function init() {
    lista = await Store.carregar();
    var fs = $("filtroSetor");
    setoresUnicos().forEach(function (s) {
      var o = document.createElement("option");
      o.value = s; o.textContent = s;
      fs.appendChild(o);
    });
    ["busca", "filtroSetor", "filtroPrioridade", "filtroStatus"].forEach(function (id) {
      $(id).addEventListener("input", render);
    });
    $("btnExport").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify(lista, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "manuais-backup.json";
      a.click();
    });
    $("btnImport").addEventListener("click", function () { $("fileImport").click(); });
    $("fileImport").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var dados = JSON.parse(r.result);
          if (!Array.isArray(dados)) throw 0;
          lista = Store.sanitizar(dados);
          if (!lista.length) throw 0;
          Store.salvar(lista);
          location.reload();
        } catch (err) { alert("Arquivo inválido."); }
      };
      r.readAsText(f, "utf-8");
    });
    $("btnReset").addEventListener("click", function () {
      if (confirm("Apagar todas as edições e voltar aos dados originais da planilha?")) {
        localStorage.removeItem(Store.KEY);
        location.reload();
      }
    });
    render();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
