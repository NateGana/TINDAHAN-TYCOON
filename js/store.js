// Store operations + cashier. Customers are generated from what is actually in stock.
let selected = null, paid = 0;
const queueCap = () => 3 + (state.level - 1) * 2;
const stockCap = () => [0, 50, 100, 150, 200, 300][state.level];
const clock = () => { const h = Math.floor(state.time / 60), m = state.time % 60; return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM'); };
const orderTotal = c => c.items.reduce((a, i) => a + i.qty * i.price, 0);
function newCustomer() {
  const avail = state.inv.filter(p => p.stock > 0); if (!avail.length) return null;
  const type = pick(TYPES), mult = type === 'Bulk Buyer' ? 2 : 1;
  const items = [...avail].sort(() => Math.random() - .5).slice(0, rnd(1, Math.min(3, avail.length))).map(p => ({id: p.id, name: p.name, qty: Math.min(p.stock, rnd(1, 3) * mult), price: p.price, cost: p.cost}));
  return {id: uid('C'), name: pick(NAMES), type, items, patience: 100, say: pick(LINES).replace('{p}', items.map(i => i.qty + ' ' + i.name).join(', ')), avatar: pick(['🧑','👩','👨','👧','🧒','👵','👴'])};
}
function callCustomer() {
  if (!state.open) return toast('The store is closed. Open it first!', true);
  if (state.queue.length >= queueCap()) return toast('Your queue is full.', true);
  const c = newCustomer(); if (!c) return toast('You are out of stock. Restock first!', true);
  state.queue.push(c); toast('A customer has arrived!'); render();
}
function toggleStore(v) { state.open = v; if (!v) state.queue = []; toast(v ? 'Store is open!' : 'Store closed.'); save(); render(); }
// Every few seconds customers may arrive on their own and slowly lose patience.
setInterval(() => {
  if (!window.state || !state.open) return;
  state.queue.forEach(c => c.patience -= 6);
  state.queue.filter(c => c.patience <= 0).forEach(c => { state.rep = Math.max(0, state.rep - 2); toast(c.name + ' got tired of waiting and left.', true); if (selected === c.id) selected = null; });
  state.queue = state.queue.filter(c => c.patience > 0);
  if (state.queue.length < queueCap() && Math.random() < .5) { const c = newCustomer(); if (c) state.queue.push(c); }
  if (page === 'store') render();
}, 4000);
function pay(a) { paid = a; render(); }
function checkout() {
  const c = state.queue.find(x => x.id === selected); if (!c) return;
  const total = orderTotal(c);
  if (paid < total) return toast('Payment is lower than the total!', true);
  // Re-check stock first so a failed checkout never changes money or inventory.
  for (const i of c.items) if (state.inv.find(p => p.id === i.id).stock < i.qty) return toast('Not enough ' + i.name + ' in stock.', true);
  c.items.forEach(i => { const p = state.inv.find(x => x.id === i.id); p.stock -= i.qty; p.sold += i.qty; if (p.category === 'Beverages') state.daily.bev += i.qty; if (p.stock <= p.reorder) toast('Your ' + p.name + ' inventory is running low.', true); });
  const profit = c.items.reduce((a, i) => a + i.qty * (i.price - i.cost), 0), change = paid - total;
  // Price and cost are snapshotted so later price edits don't change old records.
  state.tx.push({id: uid('T'), day: state.day, time: clock(), customer: c.name, items: c.items.map(i => ({...i})), total, paid, change, profit, cogs: total - profit});
  state.cash += total; state.daily.served++; state.daily.revenue += total; state.time = Math.min(state.time + 15, 1260);
  const r = state.customers[c.name] = state.customers[c.name] || {type: c.type, visits: 0, spent: 0, last: 0};
  r.visits++; r.spent += total; r.last = state.day; state.rep = Math.min(100, state.rep + 1); addXp(10);
  state.queue = state.queue.filter(x => x.id !== c.id); selected = null; paid = 0;
  toast('Sold! Profit ' + peso(profit) + '. Change given: ' + peso(change)); checkAchievements(); save(); render();
}
function storePage() {
  const c = state.queue.find(x => x.id === selected);
  const shelf = cat => state.inv.filter(p => p.category === cat).map(p => '<span title="' + p.name + '">' + p.icon + '</span>').join('');
  let h = '<h2>Store Operations <span class="tag ' + (state.open ? '' : 'out') + '">' + (state.open ? (state.queue.length > 3 ? 'Busy' : 'Open') : 'Closed') + '</span></h2>';
  h += '<div class="row"><button class="btn g" onclick="toggleStore(true)">Open Store</button><button class="btn r" onclick="toggleStore(false)">Close Store</button><button class="btn" onclick="callCustomer()">Call Next Customer</button><button class="btn" onclick="go(\'suppliers\')">Restock</button><button class="btn" onclick="cashRegister()">View Cash Register</button></div>';
  h += '<div class="grid w"><div><div class="shelf">🧺 ' + shelf('Snacks') + shelf('Instant Food') + '</div><div class="shelf" style="margin-top:6px">' + shelf('Beverages') + shelf('Household') + shelf('Daily Essentials') + '</div><div class="card" style="margin-top:8px">🧑‍🌾 Counter · 💰 Register: <b>' + peso(state.cash) + '</b></div>';
  h += '<h3>Customer queue (' + state.queue.length + '/' + queueCap() + ')</h3><div class="grid">' + (state.queue.map(q => '<div class="card cust ' + (q.id === selected ? 'sel' : '') + '" onclick="selected=\'' + q.id + '\';paid=0;render()">' + q.avatar + ' <b>' + q.name + '</b><div class="small">' + q.type + '</div><i class="small">“' + q.say + '”</i><div class="bar"><i style="width:' + q.patience + '%"></i></div></div>').join('') || '<p>No customers yet. ' + (state.open ? 'Call one or wait!' : 'Open the store to get customers.') + '</p>') + '</div></div>';
  h += '<div class="card"><h3>Cashier</h3>';
  if (!c) h += '<p>Select a customer to see their order.</p>';
  else { const t = orderTotal(c); h += '<table><tr><th>Item<th>Qty<th>Price<th>Sub</tr>' + c.items.map(i => '<tr><td>' + i.name + '<td>' + i.qty + '<td>' + peso(i.price) + '<td>' + peso(i.qty * i.price) + '</tr>').join('') + '</table><h3>Total: ' + peso(t) + '</h3><div class="row"><button class="btn sm" onclick="pay(' + t + ')">Exact</button>' + [20, 50, 100, 200, 500, 1000].map(a => '<button class="btn sm" onclick="pay(' + a + ')">₱' + a + '</button>').join('') + '</div><div class="row"><input id="cust" type="number" placeholder="Custom cash" style="width:120px"><button class="btn sm" onclick="pay(+$(\'cust\').value||0)">Set</button></div><p>Paid: <b>' + peso(paid) + '</b> · Change: <b>' + peso(Math.max(0, paid - t)) + '</b></p><button class="btn g big" onclick="checkout()">Process payment</button>'; }
  return h + '</div></div>';
}
function cashRegister() { openModal('<h2>Cash Register</h2><p>Cash: <b>' + peso(state.cash) + '</b></p><p>Today’s sales: ' + peso(state.daily.revenue) + ' from ' + state.daily.served + ' customers.</p>'); }
