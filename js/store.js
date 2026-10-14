// Persistência simples: seed (data/manuais.json ou js/seed.js) + localStorage.
(function () {
  var KEY = "manuais-escritorio-v1";

  function lerLS() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn("localStorage indisponível", e); }
    return null;
  }

  function salvarLS(lista) {
    try { localStorage.setItem(KEY, JSON.stringify(lista)); }
    catch (e) { alert("Não foi possível salvar (armazenamento cheio?). Tente usar imagens menores."); }
  }

  function normalizar(m, i) {
    if (!m || typeof m !== "object") return null;
    return {
      id: String(m.id == null ? "item-" + i : m.id),
      titulo: String(m.titulo == null ? "" : m.titulo),
      setor: String(m.setor == null ? "" : m.setor),
      prioridade: [1, 2, 3, 4].indexOf(Number(m.prioridade)) > -1 ? Number(m.prioridade) : 4,
      descricao: String(m.descricao == null ? "" : m.descricao),
      passos: Array.isArray(m.passos) ? m.passos.filter(function (p) { return p && typeof p === "object"; }).map(function (p) {
        return { titulo: String(p.titulo == null ? "" : p.titulo), comentario: String(p.comentario == null ? "" : p.comentario), imagem: String(p.imagem == null ? "" : p.imagem) };
      }) : []
    };
  }

  function sanitizar(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map(normalizar).filter(function (m) { return m && m.titulo; });
  }

  function seedLocal() {
    if (Array.isArray(window.MANUAIS_SEED)) return sanitizar(window.MANUAIS_SEED);
    return [];
  }

  async function carregar() {
    var local = lerLS();
    if (local && local.length) return sanitizar(local);
    try {
      var r = await fetch("data/manuais.json", { cache: "no-store" });
      if (r.ok) {
        var dados = await r.json();
        var limpos = sanitizar(dados);
        salvarLS(limpos);
        return limpos;
      }
    } catch (e) { /* file:// pode bloquear fetch; usa seed embutido */ }
    var seed = seedLocal();
    if (seed.length) salvarLS(seed);
    return seed;
  }

  function status(m) {
    if (!m || typeof m !== "object") return { chave: "vazio", rotulo: "Sem manual" };
    var n = (m.passos || []).filter(function (p) { return p && (p.titulo || "").trim(); }).length;
    if (n > 0) return { chave: "pronto", rotulo: "Manual pronto (" + n + " passos)" };
    if ((m.descricao || "").trim()) return { chave: "rascunho", rotulo: "Rascunho" };
    return { chave: "vazio", rotulo: "Sem manual" };
  }

  window.Store = { carregar: carregar, salvar: salvarLS, status: status, sanitizar: sanitizar, KEY: KEY };
})();
