export function clamp(v,a,b){ return Math.max(a, Math.min(b,v)) }
export function lerp(a,b,t){ return a+(b-a)*t }
export function hsvToRgb(h,s,v){ 
  let r,g,b; let i=Math.floor(h*6); let f=h*6-i; let p=v*(1-s); let q=v*(1-f*s); let tt=v*(1-(1-f)*s);
  switch(i%6){ case 0: r=v,g=tt,b=p;break; case 1: r=q,g=v,b=p;break; case 2: r=p,g=v,b=tt;break; case 3: r=p,g=q,b=v;break; case 4: r=tt,g=p,b=v;break; case 5: r=v,g=p,b=q;break; }
  return [r,g,b]
}
export function now(){ return performance.now()/1000 }
