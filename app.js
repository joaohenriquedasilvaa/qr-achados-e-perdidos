const KEY = 'alunos_qr_v1';
const $ = s => document.querySelector(s);
let alunos = [], editId = null;

function carregar() { try { alunos = JSON.parse(localStorage.getItem(KEY)) || []; } catch { alunos = []; } }
function persistir() { localStorage.setItem(KEY, JSON.stringify(alunos)); }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }

/* ---------- Telefone ---------- */
function mascara(v) {
  let d = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '').slice(0, 11);
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}
function validarTelefone(v) {
  const d = v.replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  if (d.length < 10 || d.length > 11) return null;
  if (!/^[1-9][1-9]/.test(d)) return null;           // DDD válido
  if (d.length === 11 && d[2] !== '9') return null;  // celular começa com 9
  return '55' + d;
}
const formatarTel = w => mascara(w.replace(/^55/, ''));

/* ---------- ID e link ---------- */
function gerarId() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let id;
  do { id = Array.from(crypto.getRandomValues(new Uint8Array(8)), n => a[n % a.length]).join(''); }
  while (alunos.some(x => x.id === id));
  return id;
}
// O QR Code abre direto o WhatsApp do aluno com a mensagem de objeto achado
const linkAluno = a => `https://wa.me/${a.whatsapp}?text=${encodeURIComponent('Olá! Achei seu objeto, ele está comigo.')}`;

/* ---------- QR Code ---------- */
function gerarQRCode(texto, tamanho = 1024) {
  const q = qrcode(0, 'M'); q.addData(texto, 'Byte'); q.make();
  const n = q.getModuleCount(), margem = 4, total = n + margem * 2, px = Math.max(1, Math.floor(tamanho / total));
  const c = document.createElement('canvas'); c.width = c.height = px * total;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000';
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect((k + margem) * px, (r + margem) * px, px, px);
  return c;
}
const qrDataUrl = a => gerarQRCode(linkAluno(a)).toDataURL('image/png');
const buscar = id => alunos.find(a => a.id === id);

function baixarQRCode(id) {
  const a = buscar(id); if (!a) return;
  const l = document.createElement('a');
  l.href = qrDataUrl(a); l.download = `qr-${norm(a.nome).replace(/[^a-z0-9]+/g, '-')}-${a.id}.png`; l.click();
}
async function copiarLink(id) {
  const a = buscar(id); if (!a) return; const url = linkAluno(a);
  try { await navigator.clipboard.writeText(url); }
  catch { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  toast('Link copiado!');
}
function imprimirQRCode(id) {
  const a = buscar(id); if (!a) return;
  const w = window.open('', '_blank'); if (!w) return toast('Permita pop-ups para imprimir');
  w.document.write(`<!DOCTYPE html><title>QR ${esc(a.nome)}</title><style>body{font-family:sans-serif;text-align:center;padding:30px}img{width:9cm;height:9cm}h2{margin:10px 0 0}p{color:#555;margin:4px}@page{margin:1cm}</style><img src="${qrDataUrl(a)}"><h2>${esc(a.nome)}</h2><p>ID: ${a.id}</p><script>onload=()=>{print()}<\/script>`);
  w.document.close();
}

function htmlQR(a, sucesso) {
  return `<div class="qrbox">${sucesso ? '<p class="ok"><i class="fa-solid fa-circle-check"></i> Aluno cadastrado com sucesso!</p>' : ''}
  <h2>${esc(a.nome)}</h2><p class="muted">ID: <b>${a.id}</b></p>
  <img alt="QR Code de ${esc(a.nome)}" src="${qrDataUrl(a)}">
  <p class="link">${esc(linkAluno(a))}</p>
  <div class="row"><button class="btn" onclick="baixarQRCode('${a.id}')"><i class="fa-solid fa-download"></i> Baixar PNG</button>
  <button class="btn ghost" onclick="imprimirQRCode('${a.id}')"><i class="fa-solid fa-print"></i> Imprimir</button>
  <button class="btn ghost" onclick="copiarLink('${a.id}')"><i class="fa-solid fa-link"></i> Copiar link</button></div></div>`;
}
function verQR(id) { const a = buscar(id); if (!a) return; $('#modalConteudo').innerHTML = htmlQR(a); $('#modal').classList.add('on'); }
function fecharModal() { $('#modal').classList.remove('on'); }

/* ---------- CRUD ---------- */
function salvarAluno(e) {
  e.preventDefault();
  const nome = $('#nome').value.trim().replace(/\s+/g, ' '), w = validarTelefone($('#whats').value);
  $('#eNome').textContent = nome.length < 3 || !/\s/.test(nome) ? 'Informe o nome completo.' : '';
  $('#eWhats').textContent = w ? '' : 'Informe um WhatsApp válido com DDD, ex.: (45) 99999-9999.';
  if ($('#eNome').textContent || $('#eWhats').textContent) return;
  let a;
  if (editId) { a = buscar(editId); a.nome = nome; a.whatsapp = w; }
  else { a = { id: gerarId(), nome, whatsapp: w, criado: new Date().toISOString() }; alunos.unshift(a); }
  const edit = !!editId; persistir(); cancelarEdicao();
  $('#resultado').innerHTML = htmlQR(a, true);
  if (edit) toast('Aluno atualizado');
  listarAlunos();
}
function editarAluno(id) {
  const a = buscar(id); if (!a) return; editId = id;
  $('#nome').value = a.nome; $('#whats').value = formatarTel(a.whatsapp);
  $('#tituloForm').textContent = 'Editar aluno'; $('#btnSalvar').textContent = 'Salvar alterações';
  mostrar('cadastro');
}
function cancelarEdicao() {
  editId = null; $('#form').reset(); $('#eNome').textContent = $('#eWhats').textContent = '';
  $('#tituloForm').textContent = 'Cadastrar aluno'; $('#btnSalvar').textContent = 'Cadastrar aluno';
}
function excluirAluno(id) {
  const a = buscar(id);
  if (!a || !confirm(`Excluir ${a.nome}? Os QR Codes já impressos continuarão funcionando.`)) return;
  alunos = alunos.filter(x => x.id !== id); persistir(); listarAlunos(); toast('Aluno excluído');
}
function listarAlunos() {
  const n = norm($('#buscaNome').value.trim()), t = $('#buscaTel').value.replace(/\D/g, '');
  const f = alunos.filter(a => norm(a.nome).includes(n) && a.whatsapp.includes(t));
  $('#lista').innerHTML = f.length ? f.map(a => `<tr><td>${esc(a.nome)}</td><td>${formatarTel(a.whatsapp)}</td><td>${a.id}</td><td>
    <button class="btn sm" title="Ver QR Code" onclick="verQR('${a.id}')"><i class="fa-solid fa-qrcode"></i></button>
    <button class="btn sm ghost" title="Baixar PNG" onclick="baixarQRCode('${a.id}')"><i class="fa-solid fa-download"></i></button>
    <button class="btn sm ghost" title="Imprimir" onclick="imprimirQRCode('${a.id}')"><i class="fa-solid fa-print"></i></button>
    <button class="btn sm ghost" title="Copiar link" onclick="copiarLink('${a.id}')"><i class="fa-solid fa-link"></i></button>
    <button class="btn sm ghost" title="Editar" onclick="editarAluno('${a.id}')"><i class="fa-solid fa-pen"></i></button>
    <button class="btn sm red" title="Excluir" onclick="excluirAluno('${a.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')
    : `<tr><td colspan="4" class="muted">${alunos.length ? 'Nenhum aluno encontrado.' : 'Nenhum aluno ainda. Use Cadastro para adicionar o primeiro.'}</td></tr>`;
  const hoje = new Date().toDateString();
  $('#stTotal').textContent = alunos.length;
  $('#stHoje').textContent = alunos.filter(a => new Date(a.criado).toDateString() === hoje).length;
  $('#stUlt').textContent = alunos[0] ? alunos[0].nome.split(' ')[0] : '—';
}

/* ---------- Navegação ---------- */
function mostrar(v) {
  document.querySelectorAll('.view').forEach(e => e.classList.toggle('on', e.id === v));
  document.querySelectorAll('.nav').forEach(e => e.classList.toggle('on', e.dataset.view === v));
  if (v !== 'cadastro' && editId) cancelarEdicao();
}
document.querySelectorAll('.nav').forEach(b => b.onclick = () => mostrar(b.dataset.view));
$('#form').addEventListener('submit', salvarAluno);
$('#whats').addEventListener('input', e => e.target.value = mascara(e.target.value));
$('#buscaNome').addEventListener('input', listarAlunos);
$('#buscaTel').addEventListener('input', listarAlunos);
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') fecharModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

carregar(); listarAlunos();
