export class Simulation {
  constructor(cube){
    this.cube=cube
    this.t=0
    this.mode='rainbow'
  }
  setMode(m){ this.mode=m }
  update(dt, speed){
    this.t += dt*speed
    const c=this.cube
    const s=c.size
    switch(this.mode){
      case 'rainbow': this.rainbow(this.t); break
      case 'wave': this.wave(this.t); break
      case 'rain': this.rain(this.t); break
      case 'spiral': this.spiral(this.t); break
      case 'fire': this.fire(this.t); break
      case 'heart': this.heart(this.t); break
      case 'plane': this.plane(this.t); break
      case 'text': this.textScroller(this.t); break
      case 'off': c.clear(); break
      default: this.rainbow(this.t)
    }
  }
  hsv2rgb(h,s,v){
    let r,g,b
    let i=Math.floor(h*6)
    let f=h*6 - i
    let p=v*(1-s)
    let q=v*(1-f*s)
    let t=v*(1-(1-f)*s)
    switch(i%6){
      case 0: r=v,g=t,b=p;break
      case 1: r=q,g=v,b=p;break
      case 2: r=p,g=v,b=t;break
      case 3: r=p,g=q,b=v;break
      case 4: r=t,g=p,b=v;break
      case 5: r=v,g=p,b=q;break
    }
    return [r,g,b]
  }
  rainbow(t){
    const c=this.cube, s=c.size
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const d=Math.sqrt((x-s/2)**2 + (y-s/2)**2 + (z-s/2)**2)
      const h=(d*0.12 + t*0.3)%1
      const [r,g,b]=this.hsv2rgb(h,1,1)
      c.setVoxel(x,y,z,r,g,b)
    }
  }
  wave(t){
    const c=this.cube, s=c.size
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const v = Math.sin(x*0.6 + t*2) + Math.cos(y*0.6 + t*1.7) + Math.sin(z*0.6 + t*2.3)
      const h=(v*0.1 + t*0.2)%1
      const br = (Math.sin(v)+1)/2 *0.8+0.2
      const [r,g,b]=this.hsv2rgb((h+1)%1,0.9,br)
      c.setVoxel(x,y,z,r,g,b)
    }
  }
  rain(t){
    const c=this.cube, s=c.size
    c.clear()
    const drops= s*3
    for(let i=0;i<drops;i++){
      const x=Math.floor((Math.sin(i*1.7+t*0.7)*0.5+0.5)*s)%s
      const y=Math.floor((Math.cos(i*2.3+t*0.5)*0.5+0.5)*s)%s
      const z = (s-1) - Math.floor((t*5 + i*3)%s)
      // trail
      for(let k=0;k<3;k++){
        const zz=z+k
        if(zz>=0 && zz<s){
          const fade=1 - k*0.35
          c.setVoxel(x,y,zz,0,0.5*fade,1*fade)
        }
      }
    }
  }
  spiral(t){
    const c=this.cube, s=c.size
    c.clear()
    const mid=s/2
    for(let z=0;z<s;z++){
      const ang = t*2 + z*0.6
      const rad = (Math.sin(t*0.5)+1.5)* (s/4)
      const x = mid + Math.cos(ang)*rad
      const y = mid + Math.sin(ang)*rad
      const xi=Math.round(x), yi=Math.round(y)
      const [r,g,b]=this.hsv2rgb((z/s + t*0.1)%1,1,1)
      for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) c.setVoxel(xi+dx, yi+dy, z, r,g,b)
    }
  }
  fire(t){
    const c=this.cube, s=c.size
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const nz = z/s
      const noise = Math.sin(x*0.9 + t*2) * Math.cos(y*0.9 + t*1.5) * Math.sin(z*0.7)
      const heat = (1-nz) * (0.5 + noise*0.5) + Math.random()*0.1
      let r=0,g=0,b=0
      if(heat>0.6){ r=1; g=heat*0.6; b=0 }
      else if(heat>0.3){ r=heat*1.5; g=heat*0.3; b=0 }
      else { r=0; g=0; b=0 }
      c.setVoxel(x,y,z,r,g,b)
    }
  }
  heart(t){
    const c=this.cube, s=c.size
    c.clear()
    const scale = Math.sin(t*2)*0.15+1
    const mid=s/2
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const nx=(x-mid)/ (s/2) *2 *scale
      const ny=(y-mid)/ (s/2) *2 *scale
      const nz=(z-mid)/ (s/2) *1.2
      // 3D heart implicit: (x^2 + 9/4 y^2 + z^2 -1)^3 - x^2 z^3 - 9/80 y^2 z^3 =0
      const a = nx*nx + 2.25*ny*ny + nz*nz -1
      const v = a*a*a - nx*nx*nz*nz*nz - 0.1125*ny*ny*nz*nz*nz
      if(v<0.05){
        const pulse = Math.sin(t*3)*0.3+0.7
        c.setVoxel(x,y,z,1*pulse,0.1,0.25*pulse)
      }
    }
  }
  plane(t){
    const c=this.cube, s=c.size
    c.clear()
    const pz = Math.floor((Math.sin(t*0.8)*0.5+0.5)*(s-1))
    const [r,g,b]=this.hsv2rgb((t*0.1)%1,1,1)
    for(let y=0;y<s;y++) for(let x=0;x<s;x++) c.setVoxel(x,y,pz,r,g,b)
  }
  textScroller(t){
    const c=this.cube, s=c.size
    c.clear()
    const idx=Math.floor(t*2)%4
    const patterns=[
      [[1,1,1],[1,0,0],[1,1,1],[1,0,0],[1,1,1]], // E
      [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]], // H?
    ]
    // just moving dot matrix
    const offset=Math.floor(t*3)%(s*2)
    for(let y=0;y<s;y++) for(let z=0;z<s;z++){
      if((x,y,z) => {}){
      }
      const x = (s-1) - (offset - z)
      if(x>=0 && x<s){
        const br = Math.sin(y*0.8 + z*0.5 + t*2)*0.5+0.5
        c.setVoxel(x,y,z,br,br*0.3,0.8)
      }
    }
  }
}
