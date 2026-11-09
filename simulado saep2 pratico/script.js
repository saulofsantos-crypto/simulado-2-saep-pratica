/* ========== 1. DADOS ========== */
const POR_PAGINA = 4;
const usuarios = [
  { id: 1, nome: 'Carlos Mendes', email: 'carlos@planta.com', senha: '123456' },
  { id: 2, nome: 'Ana Souza', email: 'ana@planta.com', senha: '123456' }
];
const operadores = [...usuarios, { id: 3, nome: 'Rafael Lima' }];
const TIPOS = ['manutenção', 'operação', 'inspeção'];
const titulos = ['Troca de rolamento', 'Ronda da linha 2', 'Inspeção da caldeira', 'Lubrificação de esteira', 'Calibração de sensores'];

const estado = { usuario: null, filtro: null, pagina: 1, tela: 'feed', abertos: new Set(), proxId: 100 };

// 15 registros iniciais (km e h já convertidos)
const registros = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  titulo: `${titulos[i % 5]} #${i + 1}`,
  tipo: TIPOS[i % 3],
  operadorId: operadores[i % 3].id,
  km: +(0.5 + (i * 0.37) % 5).toFixed(1),
  h: +(0.5 + (i * 0.45) % 3.5).toFixed(1),
  data: new Date(2026, 10, 1 + (i % 9), 7 + (i % 10), (i * 7) % 60),
  curtidas: new Set(i % 4 === 0 ? [2] : []),
  comentarios: []
}));

/* ========== 2. UTILITÁRIOS ========== */
const $ = (s) => document.querySelector(s);
const esc = (t) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const metrosParaKm = (m) => +(m / 1000).toFixed(2);
const minutosParaHoras = (min) => +(min / 60).toFixed(2);
const dois = (n) => String(n).padStart(2, '0');
const formatarData = (d) => `${dois(d.getHours())}:${dois(d.getMinutes())} - ${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
const nomeOperador = (id) => operadores.find((o) => o.id === id).nome;
function avatar(nome) {
  const ini = nome.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#483DAD"/><text x="40" y="52" font-size="32" font-family="Arial" fill="#fff" text-anchor="middle">${ini}</text></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* ========== 3. FILTRO + PAGINAÇÃO ========== */
function registrosFiltrados() {
  const lista = estado.filtro ? registros.filter((r) => r.tipo === estado.filtro) : registros;
  return lista; // novos registros entram no início do array
}
function totalPaginas() { return Math.max(1, Math.ceil(registrosFiltrados().length / POR_PAGINA)); }

/* ========== 4. RENDERIZAÇÃO ========== */
function renderCard(r) {
  const curtiu = estado.usuario && r.curtidas.has(estado.usuario.id);
  const aberto = estado.abertos.has(r.id);
  return `<article class="card" data-id="${r.id}">
    <h3>${esc(r.titulo)}</h3>
    <div class="operador"><img src="${avatar(nomeOperador(r.operadorId))}" alt="Foto de ${esc(nomeOperador(r.operadorId))}">${esc(nomeOperador(r.operadorId))}</div>
    <div class="dados">
      <span>Distância: ${r.km} km</span><span>Tempo: ${r.h} h</span>
      <span>Eficiência: ${(r.km / r.h).toFixed(1)} km/h</span><span>${formatarData(r.data)}</span>
    </div>
    <div class="acoes">
      <button class="like ${curtiu ? 'ativo' : ''}" data-acao="like" aria-label="Reagir"><img src="assets/like.svg" alt="Reação">${r.curtidas.size}</button>
      <button data-acao="chat" aria-label="Comentar"><img src="assets/chat.svg" alt="Comentários">${r.comentarios.length}</button>
    </div>
    ${aberto ? `<div class="comentarios">
      <ul>${r.comentarios.map((c) => `<li><strong>${esc(c.autor)}:</strong> ${esc(c.texto)}</li>`).join('')}</ul>
      <div class="novo-coment"><input type="text" placeholder="Escrever um comentário..." aria-label="Comentário"><button data-acao="enviar" aria-label="Enviar"><img src="assets/send.svg" alt="Enviar"></button></div>
      <small class="erro"></small></div>` : ''}
  </article>`;
}
function renderFeed() {
  const lista = registrosFiltrados();
  estado.pagina = Math.min(estado.pagina, totalPaginas());
  const ini = (estado.pagina - 1) * POR_PAGINA;
  $('#feed').innerHTML = lista.slice(ini, ini + POR_PAGINA).map(renderCard).join('') || '<p>Nenhum registro encontrado.</p>';
}
function renderPaginacao() {
  const t = totalPaginas(), p = estado.pagina;
  let h = `<button data-p="1" ${p === 1 ? 'disabled' : ''}>Primeira</button><button data-p="${p - 1}" ${p === 1 ? 'disabled' : ''}>Anterior</button>`;
  for (let i = 1; i <= t; i++) h += `<button data-p="${i}" class="${i === p ? 'ativo' : ''}">${i}</button>`;
  h += `<button data-p="${p + 1}" ${p === t ? 'disabled' : ''}>Próxima</button><button data-p="${t}" ${p === t ? 'disabled' : ''}>Última</button>`;
  $('#paginacao').innerHTML = h;
}
function renderIndicadores() {
  $('#ind-total').textContent = registros.length;
  $('#ind-horas').textContent = registros.reduce((s, r) => s + r.h, 0).toFixed(1) + ' h';
  if (estado.usuario) {
    const meus = registros.filter((r) => r.operadorId === estado.usuario.id);
    $('#perfil-qtd').textContent = meus.length;
    $('#perfil-horas').textContent = meus.reduce((s, r) => s + r.h, 0).toFixed(1);
  }
}
function render() {
  const logado = !!estado.usuario, noForm = estado.tela === 'form';
  $('#feed').hidden = $('#paginacao').hidden = $('#filtros').hidden = noForm;
  $('#form-registro').hidden = !noForm;
  document.querySelectorAll('#filtros button').forEach((b) => b.classList.toggle('ativo', b.dataset.filtro === estado.filtro));
  const btn = $('#btn-auth');
  btn.textContent = logado ? 'Logout' : 'Login';
  btn.classList.toggle('logout', logado);
  $('#btn-registros').disabled = !logado;
  $('#btn-registros').classList.toggle('ativo', logado && noForm);
  $('#perfil').hidden = !logado;
  if (logado) { $('#perfil-nome').textContent = estado.usuario.nome; $('#perfil-foto').src = avatar(estado.usuario.nome); }
  renderIndicadores();
  if (!noForm) { renderFeed(); renderPaginacao(); }
}

/* ========== 5. MODAL E LOGIN ========== */
function abrirModal() { $('#modal').hidden = false; $('#email').focus(); }
function fecharModal() {
  $('#modal').hidden = true; $('#form-login').reset();
  $('#erro-login').textContent = ''; ['#email', '#senha'].forEach((s) => $(s).classList.remove('invalido'));
}
const exigirLogin = () => { if (estado.usuario) return true; abrirModal(); return false; };

$('#form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#email').value.trim(), senha = $('#senha').value;
  const campos = [$('#email'), $('#senha')];
  campos.forEach((c) => c.classList.remove('invalido'));
  if (!email || !senha) {
    campos.forEach((c) => !c.value.trim() && c.classList.add('invalido'));
    $('#erro-login').textContent = 'email ou senha obrigatório';
    return;
  }
  const u = usuarios.find((x) => x.email === email && x.senha === senha);
  if (!u) {
    campos.forEach((c) => c.classList.add('invalido'));
    $('#erro-login').textContent = 'email ou senha incorreta';
    return;
  }
  estado.usuario = u; estado.tela = 'feed';
  fecharModal(); render();
});
$('#modal-x').onclick = $('#btn-cancelar').onclick = fecharModal;
$('#btn-auth').onclick = () => {
  if (!estado.usuario) return abrirModal();
  Object.assign(estado, { usuario: null, tela: 'feed', filtro: null, pagina: 1 }); estado.abertos.clear(); render();
};

/* ========== 6. FILTROS, PAGINAÇÃO, REGISTROS ========== */
$('#filtros').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || !exigirLogin()) return;
  estado.filtro = estado.filtro === b.dataset.filtro ? null : b.dataset.filtro;
  estado.pagina = 1; render();
});
$('#paginacao').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled || !exigirLogin()) return;
  estado.pagina = Number(b.dataset.p); render();
});
$('#btn-registros').onclick = () => { estado.tela = 'form'; render(); };

/* ========== 7. LIKE E COMENTÁRIOS ========== */
$('#feed').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (!exigirLogin()) return;
  const card = b.closest('.card'), r = registros.find((x) => x.id === Number(card.dataset.id));
  const acao = b.dataset.acao;
  if (acao === 'like') {
    r.curtidas.has(estado.usuario.id) ? r.curtidas.delete(estado.usuario.id) : r.curtidas.add(estado.usuario.id);
    render();
  } else if (acao === 'chat') {
    estado.abertos.has(r.id) ? estado.abertos.delete(r.id) : estado.abertos.add(r.id); render();
  } else if (acao === 'enviar') {
    const texto = card.querySelector('.novo-coment input').value.trim();
    if (texto.length <= 2) { card.querySelector('.erro').textContent = 'não é possível enviar um comentário vazio'; return; }
    r.comentarios.push({ autor: estado.usuario.nome, texto }); render();
  }
});

/* ========== 8. CADASTRO DE REGISTRO ========== */
$('#form-novo').addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = { tipo: $('#tipo'), distancia: $('#distancia'), tempo: $('#tempo') };
  let ok = true;
  for (const [nome, el] of Object.entries(campos)) {
    const vazio = el.value.trim() === '';
    el.classList.toggle('invalido', vazio);
    document.querySelector(`[data-erro="${nome}"]`).textContent = vazio ? 'Campo obrigatório' : '';
    if (vazio) ok = false;
  }
  if (!ok) return;
  registros.unshift({
    id: estado.proxId++, titulo: `Novo apontamento de ${campos.tipo.value}`, tipo: campos.tipo.value,
    operadorId: estado.usuario.id,
    km: metrosParaKm(Number(campos.distancia.value)), h: minutosParaHoras(Number(campos.tempo.value)),
    data: new Date(), curtidas: new Set(), comentarios: []
  });
  e.target.reset(); Object.assign(estado, { tela: 'feed', filtro: null, pagina: 1 }); render();
});

render();
