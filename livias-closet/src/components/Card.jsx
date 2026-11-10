import { LOGO, brl, grad } from '../data';
import Heart from './Heart';

function Card({p,fav,onFav,onOpen}){
  const soldOut=!Object.values(p.st).some(n=>n>0);
  const mv=e=>{const b=e.currentTarget.getBoundingClientRect();const x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;e.currentTarget.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg)`};
  return <div className="card" onMouseMove={mv} onMouseLeave={e=>e.currentTarget.style.transform=''} onClick={()=>onOpen(p)} role="button" tabIndex={0} onKeyDown={e=>e.key==='Enter'&&onOpen(p)} aria-label={p.n}>
    <div className="ph" style={p.img?.[0]?{background:`center/cover url("${p.img[0]}")`}:{background:grad(p)}}>
      {!p.img?.[0]&&<img src={LOGO} alt=""/>}
      {(soldOut||p.t)&&<span className="tag">{soldOut?'Esgotado':p.t}</span>}
      <button className={'fav'+(fav?' on':'')} aria-label="Favoritar" onClick={e=>{e.stopPropagation();onFav(p.id)}}><Heart/></button>
      <b>{p.c}</b>
    </div>
    <div className="info"><h3>{p.n}</h3><div className="pr">{brl(p.p)}{p.o&&<s>{brl(p.o)}</s>}</div></div>
  </div>;
}

export default Card;
