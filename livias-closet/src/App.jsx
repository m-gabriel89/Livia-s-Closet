import React, { useState, useEffect, useMemo } from 'react';
import { LOGO, WA, brl, CATS, P, SZ } from './data';
import Reveal from './components/Reveal';
import Card from './components/Card';
import Manifesto from './components/Manifesto';

const WaIcon=<svg viewBox="0 0 24 24"><path d="M4 20l1.2-4.2A8 8 0 1 1 8.2 18.8L4 20z"/></svg>;
const waMessage=({num,cart,f,sub,cok,ship,total})=>{
  const cp=cok?sub*.1:0, px=f.pay==='Pix'?(sub-cp)*.05:0;
  const itens=cart.map(i=>{const p=P.find(x=>x.id===i.id);return `• ${i.q}x ${p.n} (Tam. ${i.size}, ${p.cl[i.color][0]}) – ${brl(p.p*i.q)}`}).join('\n');
  return [
    `*Novo pedido – Livia’s Closet* 🌸`,`Pedido: ${num}`,'',
    `*Cliente:* ${f.nome}`,`*WhatsApp:* ${f.zap}`,`*Entrega:* ${f.end} – CEP ${f.cep}`,'',
    `*Itens:*`,itens,'',
    `Subtotal: ${brl(sub)}`,
    cp>0&&`Cupom LIVIA10 (10%): -${brl(cp)}`,
    px>0&&`Desconto Pix (5%): -${brl(px)}`,
    `Frete: ${ship?brl(ship):'Grátis'}`,
    `*Total: ${brl(total)}*`,'',
    `*Pagamento:* ${f.pay==='Pix'?'Pix':'Cartão (até 6x sem juros)'}`,'',
    `Olá! Gostaria de confirmar meu pedido.`
  ].filter(l=>l!==false).join('\n');
};

function App(){
  const[cat,setCat]=useState('Todos');
  const[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('lc-cart')||'[]')}catch(e){return[]}});
  const[favs,setFavs]=useState([]);
  const[drawer,setDrawer]=useState(false);const[step,setStep]=useState('cart');
  const[mnav,setMnav]=useState(false);const[sel,setSel]=useState(null);
  const[size,setSize]=useState('');const[color,setColor]=useState(0);
  const[toast,setToast]=useState('');const[scrolled,setScrolled]=useState(false);
  const[coupon,setCoupon]=useState('');const[cok,setCok]=useState(false);
  const[f,setF]=useState({nome:'',zap:'',cep:'',end:'',pay:'Pix'});
  const[order,setOrder]=useState(null);const[mail,setMail]=useState(false);

  useEffect(()=>{try{localStorage.setItem('lc-cart',JSON.stringify(cart))}catch(e){}},[cart]);
  useEffect(()=>{let t=false;const f=()=>{if(t)return;t=true;requestAnimationFrame(()=>{const y=scrollY,m=document.documentElement.scrollHeight-innerHeight;const s=document.documentElement.style;s.setProperty('--sy',Math.min(y,1400));s.setProperty('--p',m>0?y/m:0);setScrolled(y>30);t=false})};f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[]);
  useEffect(()=>{document.body.style.overflow=(drawer||sel||mnav)?'hidden':''},[drawer,sel,mnav]);

  const list=useMemo(()=>cat==='Todos'?P:P.filter(p=>p.c===cat),[cat]);
  const count=cart.reduce((a,i)=>a+i.q,0);
  const sub=cart.reduce((a,i)=>a+i.q*P.find(p=>p.id===i.id).p,0);
  const disc=(cok?sub*.1:0)+(f.pay==='Pix'&&step!=='cart'?(sub-(cok?sub*.1:0))*.05:0);
  const ship=sub>=299||sub===0?0:24.9;
  const total=sub-disc+ship;
  const say=m=>{setToast(m);setTimeout(()=>setToast(''),2200)};

  const open=p=>{setSel(p);setSize(SZ(p)[0]==='Único'?'Único':'');setColor(0)};
  const add=()=>{
    if(!size){say('Escolha um tamanho');return}
    const key=sel.id+size+color;
    setCart(c=>c.find(i=>i.key===key)?c.map(i=>i.key===key?{...i,q:i.q+1}:i):[...c,{key,id:sel.id,size,color,q:1}]);
    setSel(null);say('Adicionada à sacola');
  };
  const qty=(key,d)=>setCart(c=>c.map(i=>i.key===key?{...i,q:i.q+d}:i).filter(i=>i.q>0));
  const toggleFav=id=>setFavs(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const applyCoupon=()=>{if(coupon.trim().toUpperCase()==='LIVIA10'){setCok(true);say('Cupom aplicado: 10% off')}else say('Cupom inválido')};
  const finish=e=>{
    e.preventDefault();
    const num='LC'+Math.floor(10000+Math.random()*89999);
    const url=`https://wa.me/${WA}?text=${encodeURIComponent(waMessage({num,cart,f,sub,cok,ship,total}))}`;
    setOrder({num,url});setCart([]);setStep('done');
    window.open(url,'_blank','noopener');
  };
  const closeDrawer=()=>{setDrawer(false);setTimeout(()=>{if(step==='done')setStep('cart')},400)};

  return <>
    <div className="bar"/>
    <header className={scrolled?'s':''}>
      <a className="brand" href="#top" style={{textDecoration:'none',color:'inherit'}}><img src={LOGO} alt=""/>Livia’s Closet</a>
      <nav><a href="#colecao">Coleção</a><a href="#historia">Nossa história</a><a href="#beneficios">Benefícios</a><a href="#news">Novidades</a></nav>
      <div style={{display:'flex',gap:4}}>
        <button className="ico" aria-label="Abrir sacola" onClick={()=>setDrawer(true)}><svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/></svg>{count>0&&<span className="cnt">{count}</span>}</button>
        <button className="ico menu" aria-label="Menu" onClick={()=>setMnav(!mnav)} style={{zIndex:46}}><svg viewBox="0 0 24 24">{mnav?<path d="M5 5l14 14M19 5L5 19"/>:<path d="M4 8h16M4 16h16"/>}</svg></button>
      </div>
    </header>
    <div className={'mnav'+(mnav?' o':'')} onClick={()=>setMnav(false)}><a href="#colecao">Coleção</a><a href="#historia">Nossa história</a><a href="#beneficios">Benefícios</a><a href="#news">Novidades</a></div>

    <main id="top">
      <div className="hero">
        <div>
          <h1 className="foil">Livia’s<br/>Closet</h1>
          <p>Moda feminina com delicadeza e design. Peças que se entrelaçam com o seu jeito de ser, da manhã à noite.</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'inherit'}}><a className="btn" href="#colecao">Ver coleção</a><a className="btn o" href="#historia">Nossa história</a></div>
        </div>
        <div className="knot"><span className="ring"/><span className="ring"/><img src={LOGO} alt="Monograma Livia’s Closet"/></div>
      </div>
      <div className="mq" aria-hidden="true"><div>{[0,1].map(k=><React.Fragment key={k}>{['Frete grátis acima de R$ 299','Pix com 5% off','Troca em até 30 dias','Cupom LIVIA10: 10% na primeira compra','Em até 6x sem juros'].map(t=><span key={t+k}>{t}</span>)}</React.Fragment>)}</div></div>

      <section id="colecao">
        <div className="head"><h2>Coleção <span className="foil">Verão</span></h2>
          <div className="chips" role="tablist">{CATS.map(c=><button key={c} className={'chip'+(c===cat?' a':'')} onClick={()=>setCat(c)}>{c}</button>)}</div></div>
        <div className="grid">{list.map((p,i)=><Reveal key={p.id} d={(i%4)*90}><Card p={p} fav={favs.includes(p.id)} onFav={toggleFav} onOpen={open}/></Reveal>)}</div>
      </section>

      <div id="historia"><Manifesto/></div>

      <section id="beneficios"><div className="perks">
        {[['Frete grátis','Compras acima de R$ 299 chegam sem custo.'],['Pix com 5% off','Pague na hora e ganhe desconto extra.'],['Troca fácil','30 dias para trocar sem burocracia.'],['Até 6x sem juros','No cartão, em todas as peças.']].map(([a,b],i)=><Reveal key={a} d={i*120}><h3>{a}</h3><p>{b}</p></Reveal>)}
      </div></section>

      <section className="news" id="news"><Reveal>
        <h2>Entre para o <span className="foil">closet</span></h2>
        {mail?<p>Cadastro feito. Seu cupom é LIVIA10.</p>:<form onSubmit={e=>{e.preventDefault();setMail(true)}}><input type="email" required placeholder="Seu melhor e-mail" aria-label="E-mail"/><button className="btn">Quero meu cupom</button></form>}
      </Reveal></section>
    </main>
    <footer>© 2026 Livia’s Closet. Feito com carinho.</footer>

    <div className={'ov'+((drawer||sel)?' o':'')} onClick={()=>{closeDrawer();setSel(null)}}/>

    {sel&&<div className="mo o" role="dialog" aria-modal="true" aria-label={sel.n}>
      <div className="ph" style={{background:`linear-gradient(145deg,${sel.cl[color][1]},${sel.g[1]})`}}><img src={LOGO} alt="" style={{width:'38%'}}/><b>{sel.c}</b></div>
      <div className="mb">
        <button className="ico" style={{justifySelf:'end'}} aria-label="Fechar" onClick={()=>setSel(null)}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>
        <h2>{sel.n}</h2>
        <div className="pr" style={{fontSize:'1.4rem'}}>{brl(sel.p)}{sel.o&&<s>{brl(sel.o)}</s>}<span style={{fontSize:'.85rem',color:'var(--mut)'}}>ou 6x de {brl(sel.p/6)}</span></div>
        <div><p style={{marginBottom:6}}>Cor: {sel.cl[color][0]}</p><div className="opts">{sel.cl.map((c,i)=><button key={c[0]} className={'sw'+(i===color?' a':'')} style={{background:c[1]}} aria-label={c[0]} onClick={()=>setColor(i)}/>)}</div></div>
        <div><p style={{marginBottom:6}}>Tamanho</p><div className="opts">{SZ(sel).map(s=><button key={s} className={'sz'+(s===size?' a':'')} onClick={()=>setSize(s)}>{s}</button>)}</div></div>
        <button className="btn" onClick={add}>Adicionar à sacola</button>
      </div>
    </div>}

    <aside className={'dr'+(drawer?' o':'')} aria-label="Sacola">
      <div className="dh"><h2>{step==='checkout'?'Finalizar pedido':step==='done'?'Pedido feito':'Sua sacola'}</h2><button className="ico" aria-label="Fechar" onClick={closeDrawer}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button></div>
      {step==='done'&&order?<div className="ok"><img src={LOGO} alt=""/><h2>Obrigada, {f.nome.split(' ')[0]}!</h2><p>Seu pedido {order.num} foi enviado para a nossa atendente. Se o WhatsApp não abriu, toque no botão abaixo e envie a mensagem.</p><a className="btn wa" href={order.url} target="_blank" rel="noopener">{WaIcon} Abrir WhatsApp</a></div>
      :step==='checkout'?<form className="fm" onSubmit={finish}>
        <input required placeholder="Nome completo" value={f.nome} onChange={e=>setF({...f,nome:e.target.value})}/>
        <input required inputMode="tel" placeholder="WhatsApp com DDD" value={f.zap} onChange={e=>setF({...f,zap:e.target.value})}/>
        <input required inputMode="numeric" placeholder="CEP" value={f.cep} onChange={e=>setF({...f,cep:e.target.value})}/>
        <input required placeholder="Endereço e número" value={f.end} onChange={e=>setF({...f,end:e.target.value})}/>
        <div className="pay">{['Pix','Cartão'].map(m=><button type="button" key={m} className={'chip'+(f.pay===m?' a':'')} onClick={()=>setF({...f,pay:m})}>{m==='Pix'?'Pix (5% off)':'Cartão até 6x'}</button>)}</div>
        <div className="ft"><div className="row"><span>Subtotal</span><span>{brl(sub)}</span></div>{disc>0&&<div className="row"><span>Descontos</span><span>-{brl(disc)}</span></div>}<div className="row"><span>Frete</span><span>{ship?brl(ship):'Grátis'}</span></div><div className="row tot"><span>Total</span><span>{brl(total)}</span></div></div>
        <button className="btn w wa">{WaIcon} Enviar pedido pelo WhatsApp</button>
        <button type="button" className="chip" onClick={()=>setStep('cart')}>Voltar à sacola</button>
      </form>
      :cart.length===0?<div className="ok"><p>Sua sacola está vazia. Escolha uma peça da coleção.</p><a className="btn" href="#colecao" onClick={closeDrawer}>Ver coleção</a></div>
      :<>
        <div className="ship">{sub>=299?'Você ganhou frete grátis.':`Faltam ${brl(299-sub)} para o frete grátis.`}<div className="pb"><i style={{width:Math.min(100,sub/299*100)+'%'}}/></div></div>
        <div className="dl" style={{marginTop:16}}>{cart.map(i=>{const p=P.find(x=>x.id===i.id);return <div className="it" key={i.key}>
          <div className="t" style={{background:`linear-gradient(145deg,${p.cl[i.color][1]},${p.g[1]})`}}/>
          <div className="n"><div className="serif" style={{fontSize:'1.2rem'}}>{p.n}</div><small>{i.size} · {p.cl[i.color][0]}</small><div className="q"><button aria-label="Diminuir" onClick={()=>qty(i.key,-1)}>−</button>{i.q}<button aria-label="Aumentar" onClick={()=>qty(i.key,1)}>+</button></div></div>
          <div>{brl(p.p*i.q)}</div></div>})}</div>
        <div className="ft">
          <div style={{display:'flex',gap:8}}><input placeholder="Cupom de desconto" value={coupon} onChange={e=>setCoupon(e.target.value)}/><button className="chip a" onClick={applyCoupon}>Aplicar</button></div>
          <div className="row"><span>Subtotal</span><span>{brl(sub)}</span></div>{cok&&<div className="row"><span>Cupom</span><span>-{brl(sub*.1)}</span></div>}
          <div className="row tot"><span>Total</span><span>{brl(sub-(cok?sub*.1:0)+ship)}</span></div>
          <button className="btn w" onClick={()=>setStep('checkout')}>Continuar</button>
        </div>
      </>}
    </aside>
    <div className={'toast'+(toast?' o':'')} role="status">{toast}</div>
  </>;
}

export default App;
