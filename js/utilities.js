// Small helpers shared by every other script.
const $ = id => document.getElementById(id);
const peso = n => '₱' + Number(n).toLocaleString('en-PH', {minimumFractionDigits: 0, maximumFractionDigits: 2});
const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const pick = a => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function toast(msg, bad) {
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = msg;
  $('toasts').appendChild(t); setTimeout(() => t.remove(), 3200);
  if (window.state) { state.notifs.unshift((bad ? '⚠ ' : '') + msg); state.notifs = state.notifs.slice(0, 30); $('hN').textContent = state.notifs.length; }
}
function openModal(html) { $('modalBox').innerHTML = html + '<p><button class="btn sm" onclick="closeModal()">Close</button></p>'; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }
function showNotifs() { openModal('<h2>Notifications</h2>' + (state.notifs.map(n => '<p>' + n + '</p>').join('') || '<p>Nothing yet. Open your store to get started!</p>')); }
