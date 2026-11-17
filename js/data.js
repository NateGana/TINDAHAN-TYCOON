// Demo data. All names and prices are fictional sample values you can edit - not real market prices.
const SEED_PRODUCTS = [
 ['Chippy','Snacks','🌽',6,10],['Piattos','Snacks','🥔',12,18],['Nova','Snacks','🍿',11,17],['SkyFlakes','Snacks','🍘',5,8],['Candy Pack','Snacks','🍬',1,2],
 ['Lucky Me Pancit Canton','Instant Food','🍜',11,16],['Cup Noodles','Instant Food','🍲',18,26],['Sardines','Instant Food','🥫',16,22],
 ['Coca-Cola','Beverages','🥤',14,20],['Sprite','Beverages','🥤',14,20],['Bottled Water','Beverages','💧',8,12],['3-in-1 Coffee','Beverages','☕',3,5],['Milk','Beverages','🥛',12,18],
 ['Detergent','Household','🧼',9,14],['Shampoo Sachet','Household','🧴',3,5],['Toothpaste','Household','🪥',18,26],
 ['Rice (1 kilo)','Daily Essentials','🍚',45,55],['Egg','Daily Essentials','🥚',8,10],['Cooking Oil','Daily Essentials','🫗',15,22],['Soy Sauce','Daily Essentials','🍶',10,15]
].map((p, i) => ({id: 'P' + (i + 1), name: p[0], category: p[1], icon: p[2], cost: p[3], price: p[4], stock: rnd(15, 30), reorder: 8, unit: 'pc', sold: 0, suggested: p[4], demo: true}));
const SUPPLIERS = [
 {name: 'Demo Grocery Wholesaler', cats: ['Instant Food', 'Daily Essentials'], contact: '0900-000-0001 (sample)'},
 {name: 'Demo Beverage Distributor', cats: ['Beverages'], contact: '0900-000-0002 (sample)'},
 {name: 'Demo Snack & Household Supply', cats: ['Snacks', 'Household'], contact: '0900-000-0003 (sample)'}];
const UPGRADES = [
 {lvl: 2, name: 'Improved Store', cost: 3000, desc: 'More shelves and better lights.', benefit: 'Queue +2, stock cap 100'},
 {lvl: 3, name: 'Established Store', cost: 8000, desc: 'Beverage refrigerator.', benefit: 'Queue +2, stock cap 150'},
 {lvl: 4, name: 'Mini Convenience Store', cost: 18000, desc: 'Second cashier station.', benefit: 'Queue +2, stock cap 200'},
 {lvl: 5, name: 'Neighborhood Favorite', cost: 35000, desc: 'Premium storefront.', benefit: 'Queue +2, stock cap 300'}];
const NAMES = ['Aling Rosa','Kuya Ben','Mika','Jomar','Lola Pacing','Ate Joy','Paolo','Bea','Mang Tonyo','Carla','Migo','Tita Lyn'];
const TYPES = ['Regular Customer','Student','Neighbor','Parent','Snack Lover','Bulk Buyer'];
const LINES = ['Ate, may {p} po?','Kuya, pabili po ng {p}.','May {p} po ba?','Pabili po ng {p}, pakibilisan po.','Magandang araw po! {p} po sa akin.','Ate, pabili nga po ng {p}.'];
const MISSIONS = [
 {id: 'm1', text: 'Serve 5 customers', key: 'served', goal: 5, xp: 30, cash: 100},
 {id: 'm2', text: 'Earn ₱300 in revenue', key: 'revenue', goal: 300, xp: 40, cash: 150},
 {id: 'm3', text: 'Restock 3 products', key: 'restocked', goal: 3, xp: 30, cash: 100},
 {id: 'm4', text: 'Sell 5 beverages', key: 'bev', goal: 5, xp: 30, cash: 80}];
const rev = s => s.tx.reduce((a, t) => a + t.total, 0);
const ACHIEVEMENTS = [
 {id: 'a1', text: 'First Sale', ok: s => s.tx.length >= 1}, {id: 'a2', text: 'First ₱1,000 Revenue', ok: s => rev(s) >= 1000},
 {id: 'a3', text: '10 Customers Served', ok: s => s.tx.length >= 10}, {id: 'a4', text: 'First Store Upgrade', ok: s => s.level >= 2},
 {id: 'a5', text: '₱10,000 Total Revenue', ok: s => rev(s) >= 10000}, {id: 'a6', text: 'Tindahan Tycoon (Level 5)', ok: s => s.level >= 5}];
