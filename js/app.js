// Router, dashboard, finance, upgrades, missions, day cycle and game start.
let state = null, page = 'dashboard';
const PAGES = {dashboard: 'Dashboard', store: 'Store Operations', inventory: 'Inventory', suppliers: 'Suppliers & Restocking', customers: 'Customers', finance: 'Finance', upgrades: 'Store Upgrades', missions: 'Missions & Achievements', settings: 'Settings'};
const xpNeeded = () => state.level * 100 + 100;
function go(p) { page = p; $('side').classList.remove('open'); render(); }
function addXp(n) { state.xp += n; }
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => { if (!state.ach.includes(a.id) && a.ok(state)) { state.ach.push(a.id); addXp(50); toast('Achievement unlocked: ' + a.text); } });
}
function render(keep) {
  if (keep) { const el = document.activeElement, v = el && el.value, pos = el && el.selectionStart; innerRender(); const n = $('view').querySelector('input'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
  innerRender();
}
function innerRender() {
  $('nav').innerHTML = Object.keys(PAGES).map(k => '<button class="' + (k === page ? 'on' : '') + '" onclick="go(\'' + k + '\')">' + PAGES[k] + '</button>').join('');
  $('hStore').textContent = state.player.store; $('hDay').textContent = 'Day ' + state.day + ' · ' + clock(); $('hCash').textContent = peso(state.cash); $('hN').textContent = state.notifs.length;
  const pages = {dashboard: dashPage, store: storePage, inventory: inventoryPage, suppliers: suppliersPage, customers: customersPage, finance: financePage, upgrades: upgradesPage, missions: missionsPage, settings: settingsPage};
  $('view').innerHTML = pages[page]();
}
const todayTx = () => state.tx.filter(t => t.day === state.day);
function dashPage() {
  const t = todayTx(), sales = t.reduce((a, x) => a + x.total, 0), profit = t.reduce((a, x) => a + x.profit, 0), low = state.inv.filter(p => p.stock <= p.reorder);
  const stat = (l, v) => '<div class="card stat">' + l + '<b>' + v + '</b></div>';
  let h = '<div class="card" style="background:linear-gradient(120deg,var(--ly),#fff)"><h2>Welcome back, ' + state.player.owner + '!</h2>🏪 ' + state.player.store + ' · ' + state.player.loc + '</div><br><div class="grid">' + stat('Cash', peso(state.cash)) + stat('Today’s sales', peso(sales) + ' (' + t.length + ')') + stat('Today’s profit', peso(profit)) + stat('Total customers', state.tx.length) + stat('Reputation', state.rep + '/100') + stat('Store level', state.level) + '</div><br>';
  h += '<div class="row"><button class="btn g" onclick="toggleStore(true);go(\'store\')">Open Store</button><button class="btn" onclick="go(\'store\')">Serve Customer</button><button class="btn" onclick="go(\'suppliers\')">Restock Products</button><button class="btn" onclick="go(\'inventory\')">View Inventory</button><button class="btn" onclick="go(\'upgrades\')">Upgrade Store</button><button class="btn r" onclick="endDay()">End Business Day</button></div><div class="grid w">';
  h += '<div class="card"><h3>Store status: ' + (state.open ? 'Open' : 'Closed') + '</h3>XP ' + state.xp + '/' + xpNeeded() + '<div class="bar"><i style="width:' + Math.min(100, state.xp / xpNeeded() * 100) + '%"></i></div></div>';
  h += '<div class="card"><h3>Inventory alerts</h3>' + (low.map(p => '<div>' + p.icon + ' ' + p.name + ': ' + p.stock + '</div>').join('') || 'All stocked up!') + '</div>';
  h += '<div class="card"><h3>Recent transactions</h3>' + (state.tx.slice(-5).reverse().map(x => '<div>' + x.customer + ' · ' + peso(x.total) + '</div>').join('') || 'No sales yet - open the store!') + '</div>';
  h += '<div class="card"><h3>Daily missions</h3>' + MISSIONS.map(m => '<div>' + (state.claimed.includes(m.id + state.day) ? '✅ ' : '⬜ ') + m.text + ' (' + Math.min(state.daily[m.key], m.goal) + '/' + m.goal + ')</div>').join('') + '</div></div>';
  return h;
}
function customersPage() {
  const lvl = v => v >= 10 ? 'VIP Customer' : v >= 5 ? 'Loyal Customer' : v >= 2 ? 'Regular Customer' : 'New Customer';
  return '<h2>Customers</h2><div class="tw"><table><tr><th>Name<th>Type<th>Visits<th>Spent<th>Last visit<th>Loyalty</tr>' + Object.entries(state.customers).map(([n, c]) => '<tr><td>' + n + '<td>' + c.type + '<td>' + c.visits + '<td>' + peso(c.spent) + '<td>Day ' + c.last + '<td>' + lvl(c.visits) + '</tr>').join('') + '</table></div>' + (Object.keys(state.customers).length ? '' : '<p>No customers yet. Serve someone to start your list!</p>');
}
// Same formulas everywhere: Revenue - COGS = Gross, Gross - operating expenses = Net. Supplier purchases are NOT expenses.
function totals() { const revenue = rev(state), cogs = state.tx.reduce((a, t) => a + t.cogs, 0), opex = state.expenses.reduce((a, e) => a + e.amount, 0), bought = state.purchases.reduce((a, p) => a + p.total, 0);
  return {revenue, cogs, gross: revenue - cogs, opex, net: revenue - cogs - opex, bought}; }
function financePage() {
  const t = totals(), s = (l, v) => '<div class="card stat">' + l + '<b>' + peso(v) + '</b></div>';
  const byDay = {}; state.tx.forEach(x => byDay[x.day] = (byDay[x.day] || 0) + x.total); const max = Math.max(1, ...Object.values(byDay));
  return '<h2>Finance</h2><div class="grid">' + s('Starting capital', state.startCash) + s('Cash balance', state.cash) + s('Revenue', t.revenue) + s('Cost of goods sold', t.cogs) + s('Gross profit', t.gross) + s('Operating expenses', t.opex) + s('Net profit', t.net) + s('Inventory purchases', t.bought) + '</div><h3>Daily sales</h3>' + (Object.entries(byDay).map(([d, v]) => '<div class="small">Day ' + d + ' ' + peso(v) + '</div><div class="bar"><i style="width:' + v / max * 100 + '%"></i></div>').join('') || '<p>No sales yet.</p>') +
   '<h3>Record an expense</h3><div class="row"><select id="eCat" style="width:170px"><option>Electricity</option><option>Water</option><option>Rent</option><option>Staff Salary</option><option>Store Maintenance</option><option>Transportation</option><option>Other</option></select><input id="eAmt" type="number" placeholder="Amount" style="width:120px"><button class="btn sm" onclick="addExpense()">Add</button><button class="btn sm" onclick="exportCsv()">Export CSV</button></div><div class="tw"><table><tr><th>ID<th>Day/Time<th>Customer<th>Items<th>Total<th>Paid<th>Change<th>Profit</tr>' + state.tx.slice().reverse().slice(0, 20).map(x => '<tr><td>' + x.id + '<td>D' + x.day + ' ' + x.time + '<td>' + x.customer + '<td>' + x.items.map(i => i.qty + 'x ' + i.name).join(', ') + '<td>' + peso(x.total) + '<td>' + peso(x.paid) + '<td>' + peso(x.change) + '<td>' + peso(x.profit) + '</tr>').join('') + '</table></div>';
}
function addExpense(cat, amt) {
  cat = cat || $('eCat').value; amt = amt || parseFloat($('eAmt').value);
  if (!(amt > 0)) return toast('Enter an expense amount.', true);
  if (amt > state.cash) return toast('You do not have enough cash for this.', true);
  state.cash -= amt; state.expenses.push({day: state.day, cat, amount: amt}); save(); render();
}
function exportCsv() {
  const rows = [['ID', 'Day', 'Time', 'Customer', 'Items', 'Total', 'Paid', 'Change', 'Profit']].concat(state.tx.map(x => [x.id, x.day, x.time, x.customer, '"' + x.items.map(i => i.qty + 'x ' + i.name).join('; ') + '"', x.total, x.paid, x.change, x.profit]));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], {type: 'text/csv'})); a.download = 'transactions.csv'; a.click();
}
function upgradesPage() {
  return '<h2>Store Upgrades</h2><p>Current level: <b>' + state.level + '</b> · Queue capacity ' + queueCap() + ' · Stock cap ' + stockCap() + '</p><div class="grid w">' + UPGRADES.map(u => '<div class="card"><h3>Level ' + u.lvl + ': ' + u.name + '</h3>' + u.desc + '<br><b>' + u.benefit + '</b><p>' + peso(u.cost) + '</p>' + (state.level >= u.lvl ? '<span class="tag">Owned</span>' : '<button class="btn" ' + (u.lvl !== state.level + 1 ? 'disabled' : '') + ' onclick="buyUpgrade(' + u.lvl + ')">Upgrade</button>') + '</div>').join('') + '</div>';
}
function buyUpgrade(l) {
  const u = UPGRADES.find(x => x.lvl === l); if (u.cost > state.cash) return toast('You do not have enough cash for this upgrade.', true);
  state.cash -= u.cost; state.upgradesPaid += u.cost; state.level = l; toast('Your store has reached Level ' + l + '!'); checkAchievements(); save(); render();
}
function missionsPage() {
  return '<h2>Daily Missions</h2>' + MISSIONS.map(m => { const k = m.id + state.day, done = state.daily[m.key] >= m.goal; return '<div class="card row">' + m.text + ' (' + Math.min(state.daily[m.key], m.goal) + '/' + m.goal + ') <button class="btn sm g" ' + (!done || state.claimed.includes(k) ? 'disabled' : '') + ' onclick="claim(\'' + m.id + '\')">' + (state.claimed.includes(k) ? 'Claimed' : 'Claim ' + peso(m.cash) + ' + ' + m.xp + 'XP') + '</button></div>'; }).join('') + '<h2>Achievements</h2><div class="grid">' + ACHIEVEMENTS.map(a => '<div class="card">' + (state.ach.includes(a.id) ? '🏆 ' : '🔒 ') + a.text + '</div>').join('') + '</div>';
}
function claim(id) { const m = MISSIONS.find(x => x.id === id), k = id + state.day; if (state.claimed.includes(k) || state.daily[m.key] < m.goal) return; state.claimed.push(k); state.cash += m.cash; addXp(m.xp); toast('You completed a mission! +' + peso(m.cash)); save(); render(); }
function settingsPage() { return '<h2>Settings</h2><div class="row"><button class="btn" onclick="exportSave()">Export save (JSON)</button><label class="btn">Import save<input type="file" accept=".json" hidden onchange="importSave(this.files[0])"></label><button class="btn r" onclick="resetGame()">Reset game</button></div>'; }
function endDay() {
  if (state.open) toggleStore(false);
  addExpense('Electricity', 40); // fixed daily utility cost
  const t = todayTx(), rv = t.reduce((a, x) => a + x.total, 0), cg = t.reduce((a, x) => a + x.cogs, 0), ex = state.expenses.filter(e => e.day === state.day).reduce((a, e) => a + e.amount, 0);
  openModal('<h2>Day ' + state.day + ' summary</h2><p>Customers served: ' + t.length + '<br>Revenue: ' + peso(rv) + '<br>COGS: ' + peso(cg) + '<br>Gross profit: ' + peso(rv - cg) + '<br>Expenses: ' + peso(ex) + '<br>Net profit: ' + peso(rv - cg - ex) + '<br>Need restocking: ' + (state.inv.filter(p => p.stock <= p.reorder).map(p => p.name).join(', ') || 'none') + '</p><button class="btn g" onclick="nextDay()">Start next day</button>');
}
function nextDay() { state.day++; state.time = 480; state.queue = []; state.daily = {served: 0, revenue: 0, restocked: 0, bev: 0}; while (state.xp >= xpNeeded() && false); save(); closeModal(); render(); toast('Day ' + state.day + ' begins!'); }
function startGame() {
  const store = $('sStore').value.trim(), owner = $('sOwner').value.trim() || 'Boss';
  if (!store) return toast('Please name your store.', true);
  state = blankState(); state.player = {store, owner, loc: $('sLoc').value}; state.store.theme = $('sTheme').value; save(); showGame();
  openModal('<h2>How to play</h2><ol><li>Open the store.</li><li>Call a customer.</li><li>Review their order.</li><li>Pick payment and process it.</li><li>Check inventory.</li><li>Restock from suppliers.</li><li>End the day.</li><li>Upgrade your store.</li></ol>');
}
function showGame() { $('welcome').classList.add('hidden'); $('game').classList.remove('hidden'); render(); }
document.addEventListener('DOMContentLoaded', () => { state = load(); if (state) showGame(); else $('welcome').classList.remove('hidden'); });
