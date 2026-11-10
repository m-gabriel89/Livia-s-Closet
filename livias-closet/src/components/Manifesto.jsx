import { useRef, useState, useEffect } from 'react';

function Manifesto(){
  const r=useRef();const txt='Cada peça nasce de um laço entre delicadeza e atitude. Tecidos que abraçam, cortes que lembram quem você é, e um closet pensado para brilhar em todos os dias.'.split(' ');
  const[k,setK]=useState(0);
  useEffect(()=>{const f=()=>{const b=r.current.getBoundingClientRect(),h=innerHeight;const p=Math.min(1,Math.max(0,(h*.85-b.top)/(b.height+h*.25)));setK(Math.round(p*txt.length*1.1))};f();addEventListener('scroll',f,{passive:true});return()=>removeEventListener('scroll',f)},[]);
  return <section className="man" ref={r}><p>{txt.map((w,i)=><span key={i} className={i<k?'l':''}>{w} </span>)}</p></section>;
}

export default Manifesto;
