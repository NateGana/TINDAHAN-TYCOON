// Inventory page and the supplier/restock page.
let fSearch = '', fCat = '', fSort = '';
const statusOf = p => p.stock <= 0 ? 'out' : p.stock <= p.reorder ? 'low' : '';
const statusText = p => ({out: 'Out of Stock', low: 'Low Stock', '': 'In Stock'})[statusOf(p)];
function inventoryPage() {
  let list = state.inv.filter(p => p.name.toLowerCase().includes(fSearch.toLowerCase()) && (!fCat || p.category === fCat || (fCat === 'low' && p.stock <= p.reorder) || (fCat === 'out' && p.stock <= 0)));
  if (fSort === 'price') list.sort((a, b) => a.price - b.price); if (fSort === 'stock') list.sort((a, b) => a.stock - b.stock);
  const cats = [...new Set(state.inv.map(p => p.category))];
  let h = '<h2>Inventory</h2><p class="small">Sample products and prices are fictional demo values - edit them freely.</p><div class="row"><input style="width:180px" placeholder="Search" value="' + fSearch + '" oninput="fSearch=this.value;render(\'keep\')"><select style="width:170px" onchange="fCat=this.value;render()"><option value="">All</option>' + cats.map(c => '<option ' + (fCat === c ? 'selected' : '') + '>' + c + '</option>').join('') + '<option value="low" ' + (fCat === 'low' ? 'selected' : '') + '>Low stock</option><option value="out" ' + (fCat === 'out' ? 'selected' : '') + '>Out of stock</option></select><select style="width:150px" onchange="fSort=this.value;render()"><option value="">Sort</option><option value="price">Price</option><option value="stock">Quantity</option></select><button class="btn sm" onclick="addProduct()">+ Add product</button></div><div class="grid">';
  h += list.map(p => { const u = p.price - p.cost, m = (u / p.price * 100).toFixed(0), warn = p.price < p.cost ? '⚠ Below cost!' : p.price > p.suggested * 1.5 ? '⚠ Far above suggested ' + peso(p.suggested) : p.price > p.cost * 3 ? '⚠ Very high markup' : '';
    return '<div class="card"><div style="font-size:2.4rem">' + p.icon + '</div><b>' + p.name + '</b> <span class="tag ' + statusOf(p) + '">' + statusText(p) + '</span><div class="small">' + p.category + ' · ' + p.id + '</div><p>Stock: <b>' + p.stock + '</b> ' + p.unit + ' (reorder ' + p.reorder + ')<br>Cost ' + peso(p.cost) + ' → Sell ' + peso(p.price) + '<br>Profit ' + peso(u) + ' (' + m + '%) · Sold ' + p.sold + '</p><div class="small" style="color:var(--r)">' + warn + '</div><button class="btn sm" onclick="editPrice(\'' + p.id + '\')">Edit</button> <button class="btn sm r" onclick="removeProduct(\'' + p.id + '\')">Remove</button></div>'; }).join('') || '<p>No products match. Try another search!</p>';
  return h + '</div>';
}
function editPrice(id) {
  const p = state.inv.find(x => x.id === id), v = prompt('New selling price for ' + p.name + ' (cost ' + peso(p.cost) + ')', p.price);
  if (v === null) return; const n = parseFloat(v); if (!(n > 0)) return toast('Enter a valid price.', true);
  p.price = n; save(); render();
}
function addProduct() {
  const name = prompt('Product name?'); if (!name) return;
  const cost = parseFloat(prompt('Supplier cost?')), price = parseFloat(prompt('Selling price?'));
  if (!(cost > 0) || !(price > 0)) return toast('Cost and price must be numbers.', true);
  state.inv.push({id: uid('P'), name, category: prompt('Category?', 'Snacks') || 'Snacks', icon: '📦', cost, price, stock: 0, reorder: 5, unit: 'pc', sold: 0, suggested: price});
  save(); render();
}
function removeProduct(id) { if (confirm('Remove this product?')) { state.inv = state.inv.filter(p => p.id !== id); save(); render(); } }
function suppliersPage() {
  let h = '<h2>Suppliers & Restocking</h2><p class="small">Demo suppliers - not real businesses. Wholesale = 92% of cost (editable sample). Stock cap: ' + stockCap() + ' per product.</p><div class="grid w">';
  SUPPLIERS.forEach(s => { h += '<div class="card"><h3>' + s.name + '</h3><div class="small">' + s.contact + '</div><table>' + state.inv.filter(p => s.cats.includes(p.category)).map(p => '<tr><td>' + p.icon + ' ' + p.name + ' (' + p.stock + ')<td>' + peso(wholesale(p)) + '<td><input id="q' + p.id + '" type="number" min="1" value="10" style="width:60px"><td><button class="btn sm" onclick="buyStock(\'' + p.id + '\')">Buy</button></tr>').join('') + '</table></div>'; });
  h += '</div><h3>Purchase history</h3><div class="tw"><table><tr><th>Day<th>Item<th>Qty<th>Total</tr>' + state.purchases.slice().reverse().slice(0, 15).map(r => '<tr><td>' + r.day + '<td>' + r.name + '<td>' + r.qty + '<td>' + peso(r.total) + '</tr>').join('') + '</table></div>';
  return h;
}
const wholesale = p => Math.round(p.cost * 0.92 * 100) / 100;
function buyStock(id) {
  const p = state.inv.find(x => x.id === id), q = parseInt($('q' + id).value), total = q * wholesale(p);
  if (!(q > 0)) return toast('Enter a quantity.', true);
  if (p.stock + q > stockCap()) return toast('Not enough storage. Upgrade your store for more space.', true);
  // Check the available cash before allowing the player to restock.
  if (total > state.cash) return toast('You do not have enough cash for this purchase.', true);
  state.cash -= total; p.stock += q; state.daily.restocked++; state.purchases.push({day: state.day, name: p.name, qty: q, total});
  toast('Bought ' + q + ' ' + p.name + ' for ' + peso(total)); save(); render();
}
