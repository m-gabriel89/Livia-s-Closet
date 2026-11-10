import { useSyncExternalStore } from 'react';
import { createClient } from '@supabase/supabase-js';
import { P as SEED, ADMIN_PIN } from './data';

/*
  Camada de dados da loja. Dois modos, escolhidos automaticamente:
  - Supabase (nuvem): quando VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas (veja .env.example).
  - Local: sem chaves, os dados ficam só no navegador (bom para testar).
  As telas só usam as funções exportadas aqui. Toda função de escrita devolve null (deu certo) ou um texto de erro.
*/
const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY_ = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isRemote = Boolean(URL_ && KEY_);
const sb = isRemote ? createClient(URL_, KEY_) : null;

const LKEY = 'lc-store-v1';
const BASE_CATS = ['Vestidos', 'Blusas', 'Calças', 'Conjuntos', 'Acessórios'];
const subs = new Set();

export const norm = (p) => {
  const cl = p.cl && p.cl.length ? p.cl : [['Única', '#e8c8b1']];
  return {
    id: p.id, sku: p.sku || '', n: p.n || '', c: p.c || BASE_CATS[0],
    p: Number(p.p) || 0, o: p.o ? Number(p.o) : undefined, t: p.t || '', d: p.d || '',
    cl, g: p.g || [cl[0][1], '#fbe0d6'],
    st: p.st && Object.keys(p.st).length ? p.st : { Único: 0 },
    img: Array.isArray(p.img) ? p.img : [], on: p.on !== false,
  };
};

const seed = () => ({
  cats: BASE_CATS,
  products: SEED.map((p, i) => norm({
    ...p, sku: 'LC-' + String(i + 1).padStart(3, '0'),
    st: p.c === 'Acessórios' ? { Único: 8 } : { P: 5, M: 5, G: 5, GG: 5 },
  })),
});

const lload = () => {
  try {
    const j = JSON.parse(localStorage.getItem(LKEY));
    if (j && Array.isArray(j.products)) return { cats: j.cats || BASE_CATS, products: j.products.map(norm), orders: j.orders || [], ready: true };
  } catch (e) { /* usa os exemplos */ }
  return { ...seed(), orders: [], ready: true };
};

let state = isRemote ? { cats: [], products: [], orders: [], ready: false } : lload();
const emit = () => subs.forEach((f) => f());
const set = (patch) => { state = { ...state, ...patch }; emit(); };

export const useStore = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);

/* ---------- login da equipe ---------- */
const asubs = new Set();
let auth = { ready: !isRemote, ok: false };
const setAuth = (a) => { auth = a; asubs.forEach((f) => f()); };
export const useAdminAuth = () =>
  useSyncExternalStore((f) => { asubs.add(f); return () => asubs.delete(f); }, () => auth);

/* ---------- modo local ---------- */
const lcommit = (patch) => {
  const prev = state;
  state = { ...state, ...patch };
  try { localStorage.setItem(LKEY, JSON.stringify({ cats: state.cats, products: state.products, orders: state.orders })); }
  catch (e) { state = prev; return 'Sem espaço para salvar. Remova ou reduza algumas fotos.'; }
  emit();
  return null;
};

const L = {
  saveProduct: async (p) => {
    const n = norm(p);
    const has = state.products.some((x) => x.id === n.id);
    return lcommit({ products: has ? state.products.map((x) => (x.id === n.id ? n : x)) : [...state.products, n] });
  },
  deleteProduct: async (id) => lcommit({ products: state.products.filter((x) => x.id !== id) }),
  setActive: async (id, on) => lcommit({ products: state.products.map((x) => (x.id === id ? { ...x, on } : x)) }),
  addCat: async (c) => (state.cats.includes(c) ? null : lcommit({ cats: [...state.cats, c] })),
  placeOrder: async (o) => lcommit({ orders: [{ ...o, id: Math.max(0, ...state.orders.map((x) => x.id)) + 1, status: 'novo', at: new Date().toISOString() }, ...state.orders] }),
  persistStocks: async (list) => lcommit({ products: state.products.map((p) => { const s = list.find((x) => x.id === p.id); return s ? { ...p, st: s.st } : p; }) }),
  persistOrderStatus: async (id, status) => lcommit({ orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)) }),
  uploadImage: async (d) => d,
  seed: async () => lcommit({ ...seed() }),
};

if (!isRemote) {
  addEventListener('storage', (e) => { if (e.key === LKEY) { state = lload(); emit(); } });
  try { auth = { ready: true, ok: sessionStorage.getItem('lc-admin') === '1' }; } catch (e) { /* ok */ }
}

/* ---------- modo Supabase ---------- */
const fromRow = (r) => norm({
  id: r.id, sku: r.sku, n: r.name, c: r.category, p: r.price, o: r.old_price || undefined,
  t: r.tag, d: r.description, cl: r.colors, st: r.stock, img: r.images, on: r.active,
});
const toRow = (p) => ({
  sku: p.sku, name: p.n, category: p.c, price: p.p, old_price: p.o ?? null, tag: p.t, description: p.d,
  colors: p.cl, stock: p.st, images: p.img, active: p.on, updated_at: new Date().toISOString(),
});
const fromOrder = (r) => ({
  id: r.id, code: r.code, customer: r.customer || {}, items: r.items || [], subtotal: r.subtotal, discount: r.discount,
  shipping: r.shipping, total: Number(r.total), payment: r.payment, status: r.status, at: r.created_at,
});
const dataUrlToBlob = (d) => {
  const [h, b] = d.split(',');
  const bin = atob(b);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return new Blob([u], { type: (h.match(/:(.*?);/) || [])[1] || 'image/jpeg' });
};

const reload = async () => {
  const [pr, ct] = await Promise.all([
    sb.from('products').select('*').order('id'),
    sb.from('categories').select('name').order('position'),
  ]);
  const patch = { ready: true };
  if (!pr.error) patch.products = pr.data.map(fromRow);
  if (!ct.error || !pr.error) {
    const names = ct.error ? [] : ct.data.map((c) => c.name);
    patch.cats = [...new Set([...names, ...(patch.products || state.products).map((p) => p.c)])];
  }
  if (auth.ok) {
    const o = await sb.from('orders').select('*').order('id', { ascending: false });
    if (!o.error) patch.orders = o.data.map(fromOrder);
  } else patch.orders = [];
  set(patch);
};
let timer;
const soon = () => { clearTimeout(timer); timer = setTimeout(reload, 250); };
const done = async (error) => { if (error) return error.message; await reload(); return null; };

const R = isRemote ? {
  saveProduct: async (p) => {
    const n = norm(p);
    const row = toRow(n);
    const has = state.products.some((x) => x.id === n.id);
    const { error } = has ? await sb.from('products').update(row).eq('id', n.id) : await sb.from('products').insert(row);
    return done(error);
  },
  deleteProduct: async (id) => done((await sb.from('products').delete().eq('id', id)).error),
  setActive: async (id, on) => done((await sb.from('products').update({ active: on }).eq('id', id)).error),
  addCat: async (c) => done((await sb.from('categories').upsert({ name: c, position: state.cats.length }, { onConflict: 'name' })).error),
  placeOrder: async (o) => {
    const { error } = await sb.from('orders').insert({
      code: o.code, customer: o.customer, items: o.items, subtotal: o.subtotal,
      discount: o.discount, shipping: o.shipping, total: o.total, payment: o.payment,
    });
    return error ? error.message : null;
  },
  persistStocks: async (list) => {
    for (const s of list) {
      const { error } = await sb.from('products').update({ stock: s.st }).eq('id', s.id);
      if (error) return error.message;
    }
    await reload();
    return null;
  },
  persistOrderStatus: async (id, status) => done((await sb.from('orders').update({ status }).eq('id', id)).error),
  uploadImage: async (d) => {
    const path = `${crypto.randomUUID()}.jpg`;
    const { error } = await sb.storage.from('products').upload(path, dataUrlToBlob(d), { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw new Error(error.message);
    return sb.storage.from('products').getPublicUrl(path).data.publicUrl;
  },
  seed: async () => {
    const s = seed();
    const c = await sb.from('categories').upsert(s.cats.map((name, position) => ({ name, position })), { onConflict: 'name' });
    if (c.error) return c.error.message;
    return done((await sb.from('products').insert(s.products.map(toRow))).error);
  },
} : null;

const B = isRemote ? R : L;

if (isRemote) {
  reload();
  try { sb.channel('lc-live').on('postgres_changes', { event: '*', schema: 'public' }, soon).subscribe(); } catch (e) { /* sem tempo real */ }
  const check = async (session) => {
    if (!session) { setAuth({ ready: true, ok: false }); reload(); return; }
    const { data } = await sb.rpc('is_staff');
    setAuth({ ready: true, ok: !!data });
    reload();
  };
  sb.auth.getSession().then(({ data }) => check(data.session));
  sb.auth.onAuthStateChange((_e, s) => { setTimeout(() => check(s), 0); });
}

export const signIn = async (email, pass) => {
  if (!isRemote) {
    if (pass !== ADMIN_PIN) return 'Senha incorreta.';
    try { sessionStorage.setItem('lc-admin', '1'); } catch (e) { /* ok */ }
    setAuth({ ready: true, ok: true });
    return null;
  }
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
  if (error) return 'E-mail ou senha incorretos.';
  const { data } = await sb.rpc('is_staff');
  if (!data) { await sb.auth.signOut(); return 'Este usuário não tem permissão da equipe.'; }
  setAuth({ ready: true, ok: true });
  reload();
  return null;
};
export const signOut = async () => {
  if (isRemote) await sb.auth.signOut();
  else { try { sessionStorage.removeItem('lc-admin'); } catch (e) { /* ok */ } }
  setAuth({ ready: true, ok: false });
  if (isRemote) reload();
};

/* ---------- operações usadas pelas telas ---------- */
export const nextId = () => Math.max(0, ...state.products.map((p) => p.id)) + 1;
export const newSku = () => 'LC-' + String(nextId()).padStart(3, '0');
export const saveProduct = (p) => B.saveProduct(p);
export const deleteProduct = (id) => B.deleteProduct(id);
export const setActive = (id, on) => B.setActive(id, on);
export const addCat = (c) => B.addCat(c);
export const placeOrder = (o) => B.placeOrder(o);
export const uploadImage = (d) => B.uploadImage(d);
export const resetSeed = () => B.seed();

// Confirmar um pedido dá baixa no estoque; cancelar um pedido confirmado devolve.
export const setOrderStatus = async (o, status) => {
  const was = o.status === 'confirmado';
  const will = status === 'confirmado';
  if (was !== will) {
    const sign = will ? -1 : 1;
    const list = state.products.filter((p) => o.items.some((i) => i.id === p.id)).map((p) => {
      const st = { ...p.st };
      o.items.filter((i) => i.id === p.id).forEach((i) => { if (i.size in st) st[i.size] = Math.max(0, st[i.size] + sign * i.q); });
      return { id: p.id, st };
    });
    const e = await B.persistStocks(list);
    if (e) return e;
  }
  return B.persistOrderStatus(o.id, status);
};

export const exportJSON = () => JSON.stringify({ cats: state.cats, products: state.products, orders: state.orders }, null, 1);
export const importJSON = async (txt) => {
  if (isRemote) return 'Importação disponível só no modo local.';
  try {
    const j = JSON.parse(txt);
    if (!Array.isArray(j.products)) return 'Arquivo de backup inválido.';
    return lcommit({ cats: j.cats || BASE_CATS, products: j.products.map(norm), orders: j.orders || state.orders });
  } catch (e) { return 'Arquivo de backup inválido.'; }
};
