import { useRef, useState, useEffect } from 'react';

function Reveal({children,d=0}){
  const r=useRef();const[v,setV]=useState(false);
  useEffect(()=>{const o=new IntersectionObserver(([e])=>{if(e.isIntersecting){setV(true);o.disconnect()}},{threshold:.12});o.observe(r.current);return()=>o.disconnect()},[]);
  return <div ref={r} className={'rv'+(v?' in':'')} style={{transitionDelay:d+'ms'}}>{children}</div>;
}

export default Reveal;
