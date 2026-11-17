// Saving and loading. State is split across the tindahan_* keys.
const KEYS = {player: 'tindahan_player', store: 'tindahan_store', inventory: 'tindahan_inventory', customers: 'tindahan_customers',
  transactions: 'tindahan_transactions', expenses: 'tindahan_expenses', missions: 'tindahan_missions', achievements: 'tindahan_achievements', notifications: 'tindahan_notifications'};
function blankState() { return {player: null, store: {theme: ''}, level: 1, day: 1, time: 480, open: false, startCash: 10000, cash: 10000, xp: 0, rep: 50,
  inv: SEED_PRODUCTS.map(p => ({...p})), customers: {}, tx: [], expenses: [], purchases: [], upgradesPaid: 0, queue: [], daily: {served: 0, revenue: 0, restocked: 0, bev: 0}, claimed: [], ach: [], notifs: []}; }
function save() {
  const s = state;
  localStorage.setItem(KEYS.player, JSON.stringify({player: s.player, xp: s.xp, rep: s.rep}));
  localStorage.setItem(KEYS.store, JSON.stringify({level: s.level, day: s.day, time: s.time, cash: s.cash, startCash: s.startCash, upgradesPaid: s.upgradesPaid, daily: s.daily, theme: s.store.theme}));
  localStorage.setItem(KEYS.inventory, JSON.stringify(s.inv)); localStorage.setItem(KEYS.customers, JSON.stringify(s.customers));
  localStorage.setItem(KEYS.transactions, JSON.stringify(s.tx)); localStorage.setItem(KEYS.expenses, JSON.stringify({expenses: s.expenses, purchases: s.purchases}));
  localStorage.setItem(KEYS.missions, JSON.stringify(s.claimed)); localStorage.setItem(KEYS.achievements, JSON.stringify(s.ach)); localStorage.setItem(KEYS.notifications, JSON.stringify(s.notifs));
}
function load() {
  try {
    const g = k => JSON.parse(localStorage.getItem(KEYS[k])); if (!g('player')) return null;
    const s = blankState(), p = g('player'), st = g('store'), e = g('expenses');
    Object.assign(s, {player: p.player, xp: p.xp, rep: p.rep}, {level: st.level, day: st.day, time: st.time, cash: st.cash, startCash: st.startCash, upgradesPaid: st.upgradesPaid, daily: st.daily});
    s.store.theme = st.theme; s.inv = g('inventory'); s.customers = g('customers'); s.tx = g('transactions'); s.expenses = e.expenses; s.purchases = e.purchases;
    s.claimed = g('missions') || []; s.ach = g('achievements') || []; s.notifs = g('notifications') || []; return s;
  } catch (err) { console.warn('Save data was unreadable', err); return null; }
}
function exportSave() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], {type: 'application/json'})); a.download = 'tindahan-save.json'; a.click(); }
function importSave(file) {
  const r = new FileReader(); r.onload = () => {
    try { const d = JSON.parse(r.result); // validate before applying
      if (!d.player || !Array.isArray(d.inv) || !Array.isArray(d.tx) || typeof d.cash !== 'number') throw 0;
      state = Object.assign(blankState(), d); state.queue = []; state.open = false; save(); location.reload();
    } catch (e) { toast('That file is not a valid Tindahan Tycoon save.', true); } };
  r.readAsText(file);
}
function resetGame() { if (confirm('Erase all progress and start over?')) { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); location.reload(); } }
