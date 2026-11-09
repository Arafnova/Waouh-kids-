/* =========================================================
   Waouh Kids — navigation par onglets + réservation
   ---------------------------------------------------------
   À PERSONNALISER
   - whatsappNumber : numéro WhatsApp de Waouh Kids (format 229XXXXXXXXXX)
   - webhookUrl     : adresse du scénario d'automatisation (Make, n8n, Zapier…)
                      qui envoie automatiquement les alertes WhatsApp + e-mail
                      au client et à l'équipe. Vide = mode démonstration.
   ========================================================= */
const CONFIG = {
  whatsappNumber: '229XXXXXXXXXX',
  webhookUrl: '',
  openHour: 8,
  closeHour: 23
};

const TYPES = {
  jeu:   { label: 'Espace de jeu',       color: '#1E9BE9', strong: '#0B6FB8', tint: '#E6F4FE', ink: '#0B5E9C',
           slots: ['8h – 10h', '10h – 12h', '12h – 14h', '14h – 16h', '16h – 18h', '18h – 20h', '20h – 22h'] },
  resto: { label: 'Restaurant',          color: '#E8572A', strong: '#C2410C', tint: '#FFF1D6', ink: '#8A3B0A',
           slots: ['8h30', '12h00', '13h00', '16h00', '19h00', '20h00', '21h00'] },
  fete:  { label: 'Salle de fête',       color: '#7B4BC4', strong: '#7B4BC4', tint: '#F1EAFB', ink: '#5B2E9E',
           slots: ['Matin · 9h – 12h', 'Après-midi · 14h – 18h', 'Soirée · 18h – 22h'] }
};

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const today = new Date();
const dayAt = (i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);

/* ---------- Statut ouvert / fermé ---------- */
(function () {
  const h = new Date().getHours();
  const open = h >= CONFIG.openHour && h < CONFIG.closeHour;
  $$('[data-status-dot]').forEach(d => d.classList.toggle('is-open', open));
  $$('[data-status-label]').forEach(l => l.textContent = open ? 'Ouvert en ce moment · jusqu’à 23h' : 'Fermé · ouverture à 8h');
  $('#year').textContent = today.getFullYear();
  const wa = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent('Bonjour Waouh Kids ! J’aimerais avoir des informations.')}`;
  $$('[data-wa-contact]').forEach(a => a.href = wa);
})();

/* ---------- Horaires ---------- */
$('#hours').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(n => {
  const on = n === today.getDay();
  return `<li class="${on ? 'is-today' : ''}"><span>${cap(DAYS_LONG[n])}${on ? ' · aujourd’hui' : ''}</span><span>8h – 23h</span></li>`;
}).join('');

/* =========================================================
   Navigation par onglets (#accueil, #univers-jeu, #horaires, #reservation-fete…)
   ========================================================= */
const VIEWS = ['accueil', 'univers', 'horaires', 'reservation'];
let currentView = null;

function route() {
  const [view, sub] = (location.hash.replace('#', '') || 'accueil').split('-');
  const v = VIEWS.includes(view) ? view : 'accueil';

  $$('.view').forEach(el => el.hidden = el.dataset.view !== v);
  $$('[data-nav]').forEach(a => a.dataset.nav === v ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));

  if (v === 'univers') showPanel(TYPES[sub] ? sub : (currentPanel || 'jeu'));
  if (v === 'reservation') {
    if (TYPES[sub]) setType(sub);
    showForm();
  }

  if (currentView !== v || v === 'univers') window.scrollTo({ top: 0, behavior: currentView ? 'smooth' : 'auto' });
  document.title = (v === 'accueil' ? '' : cap(v === 'univers' ? 'Nos univers' : v) + ' · ') + 'Waouh Kids — Le royaume de jeu et de joie';
  currentView = v;
}

let currentPanel = null;
function showPanel(key) {
  currentPanel = key;
  $$('[data-panel]').forEach(p => p.hidden = p.dataset.panel !== key);
  $$('[data-sub]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.sub === key)));
}

window.addEventListener('hashchange', route);

/* =========================================================
   Réservation
   ========================================================= */
const state = { rtype: 'jeu', dateIdx: 0, slot: null, kids: 2, adults: 1 };

function setType(key) {
  if (state.rtype !== key) state.slot = null;
  state.rtype = key;
  renderTypes(); renderSlots();
}

function renderTypes() {
  $('#types').innerHTML = Object.entries(TYPES).map(([k, t]) => {
    const on = state.rtype === k;
    return `<button type="button" class="chip chip--type" data-type="${k}" aria-pressed="${on}"
      style="border-color:${on ? t.strong : t.color};background:${on ? t.strong : t.tint};color:${on ? '#fff' : t.ink}">${t.label}</button>`;
  }).join('');
}
$('#types').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b) setType(b.dataset.type); });

function renderDates() {
  let html = '';
  for (let i = 0; i < 14; i++) {
    const d = dayAt(i);
    html += `<button type="button" class="chip chip--date" data-date="${i}" aria-pressed="${state.dateIdx === i}"
      aria-label="${cap(DAYS_LONG[d.getDay()])} ${d.getDate()} ${MONTHS[d.getMonth()]}">
      <span class="d1">${i === 0 ? 'Auj.' : DAYS[d.getDay()]}</span><span class="d2">${d.getDate()}</span><span class="d3">${MONTHS[d.getMonth()]}</span></button>`;
  }
  $('#dates').innerHTML = html;
}
$('#dates').addEventListener('click', (e) => {
  const b = e.target.closest('[data-date]'); if (!b) return;
  state.dateIdx = +b.dataset.date;
  $$('[data-date]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
});

function renderSlots() {
  $('#slots').innerHTML = TYPES[state.rtype].slots.map(s =>
    `<button type="button" class="chip chip--slot" data-slot="${s}" aria-pressed="${state.slot === s}">${s}</button>`).join('');
}
$('#slots').addEventListener('click', (e) => {
  const b = e.target.closest('[data-slot]'); if (!b) return;
  state.slot = b.dataset.slot;
  $$('[data-slot]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  hideError();
});

$$('[data-count]').forEach(b => b.addEventListener('click', () => {
  const k = b.dataset.count, step = +b.dataset.step;
  const max = k === 'kids' ? (state.rtype === 'fete' ? 80 : 30) : 40;
  const min = k === 'kids' ? 1 : 0;
  state[k] = Math.min(max, Math.max(min, state[k] + step));
  $('#' + k).textContent = state[k];
}));

['name', 'phone', 'email'].forEach(id => $('#' + id).addEventListener('input', (e) => e.target.classList.remove('is-invalid')));

function showError(msg, field) {
  const el = $('#error'); el.textContent = msg; el.hidden = false;
  if (field) { field.classList.add('is-invalid'); field.focus(); }
  else el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function hideError() { $('#error').hidden = true; }

function showForm() { $('#confirm').hidden = true; $('#form').hidden = false; }

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $('#name').value.trim(), phone = $('#phone').value.trim(), email = $('#email').value.trim();
  if (!state.slot) return showError('Choisissez un créneau.');
  if (!name) return showError('Indiquez le nom du parent.', $('#name'));
  if (phone.replace(/\D/g, '').length < 8) return showError('Indiquez un numéro WhatsApp valide.', $('#phone'));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showError('Indiquez une adresse e-mail valide.', $('#email'));
  hideError();

  const d = dayAt(state.dateIdx);
  const booking = {
    univers: TYPES[state.rtype].label,
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    date_texte: cap(`${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`),
    creneau: state.slot,
    enfants: state.kids,
    adultes: state.adults,
    nom: name, whatsapp: phone, email,
    envoye_le: new Date().toISOString()
  };

  const btn = $('#submitBtn');
  btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Envoi en cours…';
  try {
    if (CONFIG.webhookUrl) {
      const res = await fetch(CONFIG.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(booking) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    } else {
      await new Promise(r => setTimeout(r, 700)); // mode démonstration
    }
    $('#confirmTitle').textContent = `Merci ${name.split(/\s+/)[0]} !`;
    $('#form').hidden = true;
    $('#confirm').hidden = false;
    $('#confirm').classList.remove('pop'); void $('#confirm').offsetWidth; $('#confirm').classList.add('pop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showError('L’envoi a échoué. Réessayez ou écrivez-nous sur WhatsApp.');
  } finally {
    btn.removeAttribute('aria-busy'); btn.textContent = 'Envoyer ma demande';
  }
});

$('#reset').addEventListener('click', () => {
  state.slot = null; renderSlots();
  $('#form').reset();
  showForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- Démarrage ---------- */
renderTypes(); renderDates(); renderSlots();
route();
