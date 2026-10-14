(function () {
  var lista = [], manual = null, editando = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function idUrl() {
    var m = location.search.match(/[?&]id=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function renderLeitura() {
    var st = Store.status(manual);
    $("manualHead").innerHTML =
      '<div class="badges"><span class="tag setor">' + esc(manual.setor) + "</span>" +
      '<span class="tag p' + manual.prioridade + '">Prioridade ' + manual.prioridade + "</span>" +
      '<span class="tag ' + (st.chave === "pronto" ? "ok" : "empty") + '">' + esc(st.rotulo) + "</span></div>" +
      "<h2>" + esc(manual.titulo) + "</h2>" +
      (manual.descricao ? '<div class="desc">' + esc(manual.descricao) + "</div>"
        : '<div class="desc">Nenhuma descrição ainda. Clique em “Editar manual” para escrever.</div>');
    var box = $("steps");
    box.innerHTML = "";
    var passos = manual.passos || [];
    if (!passos.length) {
      box.innerHTML = '<div class="empty-state">Este manual ainda não tem passos.<br>Clique em <b>Editar manual</b> para escrever as instruções passo a passo.</div>';
      return;
    }
    passos.forEach(function (p, i) {
      var d = document.createElement("div");
      d.className = "step";
      var temImg = p && p.imagem;
      var img = temImg
        ? '<img class="print" src="' + p.imagem + '" alt="Imagem ilustrativa do passo ' + (i + 1) + '" loading="lazy">'
        : '';
      d.innerHTML = '<div class="step-num">' + (i + 1) + "</div>" +
        '<div class="step-body"><h4>' + esc(p.titulo || ("Passo " + (i + 1))) + "</h4>" +
        '<div class="comment">' + esc(p.comentario || "Sem instruções escritas ainda.") + "</div>" + img + "</div>";
      box.appendChild(d);
    });
    box.querySelectorAll("img.print").forEach(function (img) {
      img.addEventListener("click", function () {
        $("lightImg").src = img.src;
        $("lightbox").classList.add("open");
      });
    });
  }

  function renderEditor() {
    var ed = $("editor");
    var btn = $("btnEdit");
    if (!editando) { ed.style.display = "none"; if (btn) btn.querySelector("span").textContent = "Editar manual"; return; }
    if (btn) btn.querySelector("span").textContent = "Voltar à leitura";
    ed.style.display = "block";
    $("fDescricao").value = manual.descricao || "";
    var box = $("passosEdit");
    box.innerHTML = "";
    (manual.passos || []).forEach(function (p, i) {
      var d = document.createElement("div");
      d.className = "passo-edit";
      d.innerHTML =
        "<b>Passo " + (i + 1) + "</b>" +
        '<label>Título do passo</label><input type="text" data-k="titulo" value="' + esc(p.titulo || "") + '" placeholder="Ex.: Acessar o saldo no sistema">' +
        '<label>Instruções por escrito</label><textarea data-k="comentario" placeholder="Descreva em detalhes o que fazer neste passo, onde clicar, o que conferir…">' + esc(p.comentario || "") + "</textarea>" +
        '<label>Imagem ilustrativa (opcional)</label>' +
        '<input type="file" accept="image/*" data-k="arquivo">' +
        '<input type="text" data-k="imagem" value="' + esc(p.imagem && p.imagem.length < 300 ? p.imagem : "") + '" placeholder="opcional: assets/prints/exemplo.png">' +
        '<div class="hint">Opcional. O foco são as instruções por escrito acima. Se quiser ilustrar, envie uma imagem ou cole o caminho de <b>assets/prints/</b>. O upload comprime e salva dentro do navegador; para compartilhar entre PCs use Exportar backup.</div>' +
        (p.imagem ? '<img class="preview" src="' + p.imagem + '">' : "") +
        '<div class="row">' +
          '<button class="btn small ghost" data-a="up">Subir</button>' +
          '<button class="btn small ghost" data-a="down">Descer</button>' +
          '<button class="btn small danger" data-a="del">Excluir</button>' +
        "</div>";
      d.querySelectorAll("[data-k]").forEach(function (inp) {
        if (inp.dataset.k === "arquivo") {
          inp.addEventListener("change", function (e) {
            var f = e.target.files[0];
            if (f) redimensionar(f, function (url) { p.imagem = url; persistir(); renderTudo(); });
          });
        } else {
          inp.addEventListener("input", function () { p[inp.dataset.k] = inp.value; persistir(); renderLeitura(); });
        }
      });
      d.querySelectorAll("[data-a]").forEach(function (b) {
        b.addEventListener("click", function () {
          var a = b.dataset.a, arr = manual.passos || (manual.passos = []);
          if (a === "del" && confirm("Excluir o passo " + (i + 1) + "?")) arr.splice(i, 1);
          if (a === "up" && i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); }
          if (a === "down" && i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); }
          persistir(); renderTudo();
        });
      });
      box.appendChild(d);
    });
  }

  function redimensionar(file, cb) {
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var max = 1280, w = img.width, h = img.height;
      if (w > max) { h = Math.round(h * max / w); w = max; }
      var c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      cb(c.toDataURL("image/jpeg", 0.82));
    };
    img.src = url;
  }

  function persistir() {
    var i = lista.findIndex(function (m) { return m.id === manual.id; });
    if (i > -1) lista[i] = manual;
    Store.salvar(lista);
  }
  function renderTudo() { renderLeitura(); renderEditor(); }

  async function init() {
    lista = await Store.carregar();
    var id = idUrl();
    manual = lista.find(function (m) { return m.id === id; }) || lista[0];
    if (!manual) { document.body.innerHTML = "<p style='padding:40px'>Nenhum manual encontrado.</p>"; return; }
    document.title = manual.titulo + " — Manuais do Escritório";
    renderTudo();
    $("btnEdit").addEventListener("click", function () { editando = !editando; renderEditor(); });
    $("btnAdd").addEventListener("click", function () {
      if (!Array.isArray(manual.passos)) manual.passos = [];
      manual.passos.push({ titulo: "", comentario: "", imagem: "" });
      editando = true; persistir(); renderTudo();
      window.scrollTo(0, document.body.scrollHeight);
    });
    $("fDescricao").addEventListener("input", function (e) { manual.descricao = e.target.value; persistir(); renderLeitura(); });
    $("btnPrint").addEventListener("click", function () { window.print(); });
    $("lightbox").addEventListener("click", function () { $("lightbox").classList.remove("open"); });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
