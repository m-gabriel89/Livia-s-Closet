import { useState, useMemo, useEffect } from 'react';
import { useStore, useAdminAuth, signIn, signOut, isRemote, saveProduct, deleteProduct, setActive, addCat, setOrderStatus, uploadImage, exportJSON, importJSON, resetSeed, nextId, newSku } from '../store';
import { brl, LOGO } from '../data';
import './admin.css';

const SIZES = ['P', 'M', 'G', 'GG', 'Único'];
const TAGS = ['', 'Novo', 'Best-seller', 'Promoção', 'Últimas unidades'];
const LOW = 3; // até esta quantidade a peça aparece como "estoque baixo"
const total = (p) => Object.values(p.st).reduce((a, b) => a + b, 0);
const status = (p) => (total(p) === 0 ? 'out' : total(p) <= LOW ? 'low' : 'ok');
const LABEL = { ok: 'Em estoque', low: 'Estoque baixo', out: 'Esgotado' };

// Reduz a foto no próprio navegador para caber no armazenamento
const shrink = (file, max = 900) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onerror = rej;
  r.onload = () => {
    const im = new Image();
    im.onerror = rej;
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      x.drawImage(im, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    im.src = r.result;
  };
  r.readAsDataURL(file);
});

function Gate() {
  const [email, setEmail] = useState('');
  const [v, setV] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await signIn(email, v);
    setBusy(false);
    if (r) setErr(r);
  };
  return (
    <div className="ad-gate">
      <form onSubmit={go}>
        <img src={LOGO} alt="" />
        <h1>Área da equipe</h1>
        <p>{isRemote ? 'Entre com seu e-mail e senha.' : 'Digite a senha para gerenciar o estoque.'}</p>
        {isRemote && <input type="email" autoComplete="username" value={email} placeholder="E-mail" aria-label="E-mail" onChange={(e) => setEmail(e.target.value)} />}
        <input type="password" autoComplete="current-password" autoFocus={!isRemote} value={v} placeholder="Senha" aria-label="Senha"
          onChange={(e) => { setV(e.target.value); setErr(''); }} />
        {err && <small role="alert">{err}</small>}
        <button className="btn w" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <a href="#">Voltar à loja</a>
      </form>
    </div>
  );
}

function Form({ item, cats, onClose, notify }) {
  const isNew = !item;
  const [f, setF] = useState(() => item
    ? { ...item, p: String(item.p).replace('.', ','), o: item.o ? String(item.o).replace('.', ',') : '' }
    : { id: nextId(), sku: newSku(), n: '', c: cats[0], p: '', o: '', t: '', d: '', cl: [['', '#e8a58f']], st: { P: 0, M: 0, G: 0, GG: 0 }, img: [], on: true });
  const [newCat, setNewCat] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setColor = (i, k, v) => set('cl', f.cl.map((c, j) => (j === i ? (k === 'n' ? [v, c[1]] : [c[0], v]) : c)));
  const toggleSize = (s) => { const st = { ...f.st }; if (s in st) delete st[s]; else st[s] = 0; set('st', st); };

  const addImgs = async (files) => {
    try {
      const out = await Promise.all(files.slice(0, 4 - f.img.length).map((x) => shrink(x).then(uploadImage)));
      setF((s) => ({ ...s, img: [...s.img, ...out].slice(0, 4) }));
    } catch (e) { setErr(e.message || 'Não foi possível enviar essa imagem.'); }
  };

  const submit = async (e) => {
    e.preventDefault();
    const price = parseFloat(String(f.p).replace(',', '.'));
    const old = f.o === '' ? undefined : parseFloat(String(f.o).replace(',', '.'));
    if (!f.n.trim()) return setErr('Informe o nome da peça.');
    if (!(price > 0)) return setErr('Informe um preço válido.');
    if (old !== undefined && !(old > price)) return setErr('O preço “De” precisa ser maior que o preço atual.');
    const cl = f.cl.filter((c) => c[0].trim()).map((c) => [c[0].trim(), c[1]]);
    if (!cl.length) return setErr('Adicione pelo menos uma cor, com nome.');
    if (!Object.keys(f.st).length) return setErr('Marque pelo menos um tamanho.');
    if (f.c === '__new' && !newCat.trim()) return setErr('Digite o nome da nova categoria.');
    setErr(''); setBusy(true);
    let cat = f.c;
    if (cat === '__new') {
      cat = newCat.trim();
      const ce = await addCat(cat);
      if (ce) { setBusy(false); return setErr(ce); }
    }
    const se = await saveProduct({ ...f, n: f.n.trim(), c: cat, p: price, o: old, cl, g: undefined });
    setBusy(false);
    if (se) return setErr(se);
    notify(isNew ? 'Peça cadastrada' : 'Alterações salvas');
    onClose();
  };

  return (
    <div className="ad-ov" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="ad-mo" onSubmit={submit} noValidate>
        <div className="ad-mh">
          <h2>{isNew ? 'Nova peça' : 'Editar peça'}</h2>
          <button type="button" className="ad-x" aria-label="Fechar" onClick={onClose}>×</button>
        </div>
        <div className="ad-g">
          <label className="ad-f full">Nome da peça
            <input value={f.n} placeholder="Ex.: Vestido Aurora Midi" onChange={(e) => set('n', e.target.value)} /></label>
          <label className="ad-f">Código (SKU)
            <input value={f.sku} onChange={(e) => set('sku', e.target.value)} /></label>
          <label className="ad-f">Categoria
            <select value={f.c} onChange={(e) => set('c', e.target.value)}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value="__new">+ Nova categoria…</option>
            </select></label>
          {f.c === '__new' && <label className="ad-f full">Nome da nova categoria
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)} /></label>}
          <label className="ad-f">Preço (R$)
            <input inputMode="decimal" placeholder="0,00" value={f.p} onChange={(e) => set('p', e.target.value)} /></label>
          <label className="ad-f">Preço “De” (opcional)
            <input inputMode="decimal" placeholder="Preço antes da promoção" value={f.o} onChange={(e) => set('o', e.target.value)} /></label>
          <label className="ad-f">Etiqueta
            <select value={f.t} onChange={(e) => set('t', e.target.value)}>
              {TAGS.map((t) => <option key={t} value={t}>{t || 'Nenhuma'}</option>)}
            </select></label>
          <label className="ad-f full">Descrição
            <textarea rows={3} placeholder="Tecido, caimento, cuidados…" value={f.d} onChange={(e) => set('d', e.target.value)} /></label>
        </div>

        <fieldset className="ad-fs"><legend>Cores</legend>
          {f.cl.map((c, i) => (
            <div className="ad-cr" key={i}>
              <input type="color" value={c[1]} aria-label="Escolher cor" onChange={(e) => setColor(i, 'h', e.target.value)} />
              <input value={c[0]} placeholder="Nome da cor" onChange={(e) => setColor(i, 'n', e.target.value)} />
              {f.cl.length > 1 && <button type="button" className="ad-x" aria-label="Remover cor" onClick={() => set('cl', f.cl.filter((_, j) => j !== i))}>×</button>}
            </div>
          ))}
          <button type="button" className="ad-btn" onClick={() => set('cl', [...f.cl, ['', '#d8b392']])}>+ Adicionar cor</button>
        </fieldset>

        <fieldset className="ad-fs"><legend>Tamanhos e estoque</legend>
          <div className="ad-sz">
            {SIZES.map((s) => {
              const on = s in f.st;
              return (
                <div key={s} className={'ad-s' + (on ? ' on' : '')}>
                  <label><input type="checkbox" checked={on} aria-label={'Tamanho ' + s} onChange={() => toggleSize(s)} />{s}</label>
                  {on && <input type="number" min="0" inputMode="numeric" value={f.st[s]} aria-label={'Estoque ' + s}
                    onChange={(e) => set('st', { ...f.st, [s]: Math.max(0, parseInt(e.target.value, 10) || 0) })} />}
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="ad-fs"><legend>Fotos (até 4)</legend>
          <div className="ad-im">
            {f.img.map((s, i) => (
              <div key={i} style={{ backgroundImage: `url("${s}")` }}>
                <button type="button" className="x" aria-label="Remover foto" onClick={() => set('img', f.img.filter((_, j) => j !== i))}>×</button>
                {i === 0 ? <span className="cap">Capa</span>
                  : <button type="button" className="cap b" onClick={() => set('img', [s, ...f.img.filter((_, j) => j !== i)])}>Tornar capa</button>}
              </div>
            ))}
            {f.img.length < 4 && (
              <label className="ad-add">+ Foto
                <input type="file" accept="image/*" multiple hidden onChange={(e) => { addImgs([...e.target.files]); e.target.value = ''; }} />
              </label>
            )}
          </div>
        </fieldset>

        <label className="ad-chk"><input type="checkbox" checked={f.on} onChange={(e) => set('on', e.target.checked)} /> Visível na loja</label>
        {err && <p className="ad-err" role="alert">{err}</p>}
        <div className="ad-fo">
          <button type="button" className="ad-btn" onClick={onClose}>Cancelar</button>
          <button className="ad-btn p" disabled={busy}>{busy ? 'Salvando…' : 'Salvar peça'}</button>
        </div>
      </form>
    </div>
  );
}

const waLink = (z) => { const d = String(z || '').replace(/\D/g, ''); return 'https://wa.me/' + (d.length <= 11 ? '55' + d : d); };
const when = (s) => { try { return new Date(s).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return ''; } };
const OLABEL = { novo: 'Novo', confirmado: 'Confirmado', cancelado: 'Cancelado' };

function Orders({ orders, act }) {
  if (!orders.length) return <p className="ad-empty">{isRemote ? 'Nenhum pedido ainda.' : 'No modo local os pedidos só aparecem no navegador onde foram feitos. Conecte o Supabase para receber todos aqui.'}</p>;
  return (
    <div className="ad-list">
      {orders.map((o) => (
        <article key={o.id} className="ad-row ad-or">
          <div className="ad-in">
            <h3>{o.code} <span className={'ad-b o-' + o.status}>{OLABEL[o.status]}</span></h3>
            <small>{when(o.at)} · {o.customer.nome} · {o.payment}</small>
            <ul>{o.items.map((i, k) => <li key={k}>{i.q}x {i.name} ({i.size}, {i.color})</li>)}</ul>
          </div>
          <div className="ad-pr">{brl(o.total)}</div>
          <div className="ad-ac">
            <a href={waLink(o.customer.zap)} target="_blank" rel="noopener">WhatsApp</a>
            {o.status === 'novo' && <button onClick={() => act(setOrderStatus(o, 'confirmado'), 'Pedido confirmado e estoque atualizado')}>Confirmar e dar baixa</button>}
            {o.status === 'novo' && <button className="d" onClick={() => act(setOrderStatus(o, 'cancelado'), 'Pedido cancelado')}>Cancelar</button>}
            {o.status === 'confirmado' && <button className="d" onClick={() => act(setOrderStatus(o, 'cancelado'), 'Pedido cancelado e estoque devolvido')}>Cancelar e devolver estoque</button>}
            {o.status === 'cancelado' && <button onClick={() => act(setOrderStatus(o, 'novo'), 'Pedido reaberto')}>Reabrir</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

function Panel({ onExit }) {
  const { products, cats, orders, ready } = useStore();
  const [tab, setTab] = useState('estoque');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('Todas');
  const [flt, setFlt] = useState('all');
  const [edit, setEdit] = useState(null); // null | 'new' | produto
  const [toast, setToast] = useState('');
  const [del, setDel] = useState(null);
  const [rs, setRs] = useState(false);
  const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };
  const act = async (promise, ok) => { const e = await promise; notify(e || ok); };

  const stats = useMemo(() => ({
    n: products.length,
    units: products.reduce((a, p) => a + total(p), 0),
    value: products.reduce((a, p) => a + total(p) * p.p, 0),
    low: products.filter((p) => status(p) === 'low').length,
    out: products.filter((p) => status(p) === 'out').length,
  }), [products]);
  const novos = orders.filter((o) => o.status === 'novo').length;

  const list = useMemo(() => products.filter((p) =>
    (cat === 'Todas' || p.c === cat) &&
    (flt === 'all' || (flt === 'low' && status(p) === 'low') || (flt === 'out' && status(p) === 'out') || (flt === 'off' && !p.on)) &&
    (p.n + ' ' + p.sku).toLowerCase().includes(q.toLowerCase())), [products, q, cat, flt]);

  const exportFile = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([exportJSON()], { type: 'application/json' }));
    a.download = 'livias-closet-backup.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const importFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => notify((await importJSON(String(r.result))) || 'Backup importado');
    r.readAsText(file);
  };

  return (
    <div className="ad">
      <div className="ad-top">
        <div className="ad-brand"><img src={LOGO} alt="" /><div><h1>Gestão de estoque</h1><small>Livia’s Closet · área da equipe</small></div></div>
        <div className="ad-tb">
          <a className="ad-btn" href="#">← Voltar à loja</a>
          <button className="ad-btn" onClick={onExit}>Sair</button>
        </div>
      </div>

      <div className="ad-tabs">
        <button className={'chip' + (tab === 'estoque' ? ' a' : '')} onClick={() => setTab('estoque')}>Estoque</button>
        <button className={'chip' + (tab === 'pedidos' ? ' a' : '')} onClick={() => setTab('pedidos')}>Pedidos{novos > 0 ? ` (${novos} novo${novos > 1 ? 's' : ''})` : ''}</button>
      </div>

      {tab === 'pedidos' ? <Orders orders={orders} act={act} /> : <>
        <div className="ad-stats">
          <div className="ad-stat"><b>{stats.n}</b><span>Peças cadastradas</span></div>
          <div className="ad-stat"><b>{stats.units}</b><span>Unidades em estoque</span></div>
          <div className="ad-stat"><b>{brl(stats.value)}</b><span>Valor em estoque</span></div>
          <div className="ad-stat"><b>{stats.low}</b><span>Estoque baixo</span></div>
          <div className="ad-stat"><b>{stats.out}</b><span>Esgotadas</span></div>
        </div>

        <div className="ad-bar">
          <input type="search" placeholder="Buscar por nome ou código" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <select aria-label="Categoria" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option>Todas</option>{cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button className="ad-btn p" onClick={() => setEdit('new')}>+ Nova peça</button>
        </div>
        <div className="chips ad-ch">
          {[['all', 'Todas'], ['low', 'Estoque baixo'], ['out', 'Esgotadas'], ['off', 'Ocultas']].map(([k, l]) =>
            <button key={k} className={'chip' + (flt === k ? ' a' : '')} onClick={() => setFlt(k)}>{l}</button>)}
        </div>

        <div className="ad-list">
          {!ready && <p className="ad-empty">Carregando…</p>}
          {ready && list.length === 0 && <p className="ad-empty">Nenhuma peça encontrada.</p>}
          {list.map((p) => (
            <article key={p.id} className={'ad-row' + (p.on ? '' : ' off')}>
              <div className="ad-th" style={p.img[0] ? { backgroundImage: `url("${p.img[0]}")` } : { background: `linear-gradient(145deg,${p.g[0]},${p.g[1]})` }}>
                {!p.img[0] && <img src={LOGO} alt="" />}
              </div>
              <div className="ad-in">
                <h3>{p.n}</h3>
                <small>{p.sku} · {p.c}{p.t ? ' · ' + p.t : ''}{p.on ? '' : ' · oculta'}</small>
                <div className="ad-st">{Object.entries(p.st).map(([s, n]) => <span key={s} className={n === 0 ? 'z' : n <= LOW ? 'l' : ''}>{s}: {n}</span>)}</div>
              </div>
              <div className="ad-pr">{brl(p.p)}{p.o && <s>{brl(p.o)}</s>}<span className={'ad-b ' + status(p)}>{LABEL[status(p)]}</span></div>
              <div className="ad-ac">
                <button onClick={() => setEdit(p)}>Editar</button>
                <button onClick={() => act(setActive(p.id, !p.on), p.on ? 'Peça oculta na loja' : 'Peça visível na loja')}>{p.on ? 'Ocultar' : 'Mostrar'}</button>
                <button onClick={() => act(saveProduct({ ...p, id: nextId(), sku: newSku(), n: p.n + ' (cópia)', on: false }), 'Peça duplicada (oculta)')}>Duplicar</button>
                <button className="d" onClick={() => {
                  if (del === p.id) { act(deleteProduct(p.id), 'Peça excluída'); setDel(null); }
                  else { setDel(p.id); setTimeout(() => setDel(null), 3000); }
                }}>{del === p.id ? 'Confirmar exclusão' : 'Excluir'}</button>
              </div>
            </article>
          ))}
        </div>

        <div className="ad-tools">
          <button className="ad-btn" onClick={exportFile}>Exportar backup</button>
          {!isRemote && <label className="ad-btn">Importar backup
            <input type="file" accept="application/json" hidden onChange={(e) => { importFile(e.target.files[0]); e.target.value = ''; }} /></label>}
          {!isRemote && <button className="ad-btn d" onClick={() => {
            if (rs) { act(resetSeed(), 'Exemplos restaurados'); setRs(false); }
            else { setRs(true); setTimeout(() => setRs(false), 3000); }
          }}>{rs ? 'Confirmar: apaga tudo' : 'Restaurar exemplos'}</button>}
          {isRemote && ready && products.length === 0 && <button className="ad-btn p" onClick={() => act(resetSeed(), 'Peças de exemplo carregadas')}>Carregar peças de exemplo</button>}
        </div>
        <p className="ad-note">{isRemote ? 'Conectado ao Supabase: o que você salva aparece para todas as clientes.' : 'Modo local: os dados ficam salvos só neste navegador. Exporte um backup com frequência.'}</p>
      </>}

      {edit && <Form item={edit === 'new' ? null : edit} cats={cats} notify={notify} onClose={() => setEdit(null)} />}
      <div className={'toast' + (toast ? ' o' : '')} role="status">{toast}</div>
    </div>
  );
}

export default function Admin() {
  const a = useAdminAuth();
  useEffect(() => { const t = document.title; document.title = 'Gestão · Livia’s Closet'; return () => { document.title = t; }; }, []);
  if (!a.ready) return <div className="ad-gate"><p>Carregando…</p></div>;
  return a.ok ? <Panel onExit={signOut} /> : <Gate />;
}
