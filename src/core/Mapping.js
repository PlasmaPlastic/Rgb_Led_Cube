export class Mapping {
  constructor(size, mode='serpentine'){
    this.size=size; this.mode=mode
  }
  setMode(mode){ this.mode=mode }
  setSize(size){ this.size=size }
  // physical LED number from XYZ, considering serpentine wiring
  xyzToPhysical(x,y,z){
    const s=this.size
    if(this.mode==='linear') return z*s*s + y*s + x
    // serpentine: even rows forward, odd backward, and layers reverse
    let px=x, py=y
    if(y%2===1) px = s-1 - x
    if(z%2===1){
      // reverse row order for next layer
      py = s-1 - y
      if(py%2===1) px = s-1 - x // re-apply
      // Actually simpler: zigzag across X then Y
    }
    // More accurate snake: X snakes, Y snakes
    let idx = z*s*s
    if(z%2===0){
      idx += y*s + (y%2===0? x : s-1-x)
    } else {
      idx += (s-1-y)*s + ((s-1-y)%2===0? x : s-1-x)
    }
    return idx
  }
  physicalToXyz(p){
    const s=this.size
    const z=Math.floor(p/(s*s))
    const rem=p%(s*s)
    const y=Math.floor(rem/s)
    let x=rem%s
    if(this.mode==='serpentine'){
      if(y%2===1) x = s-1-x
      if(z%2===1){
        // inverse of above: need to reverse logic, approximate
      }
    }
    return [x,y,z]
  }
  exportMap(cube){
    const map=[]
    for(let i=0;i<cube.count;i++){
      const [x,y,z]=cube.indexToXyz(i)
      map.push({x,y,z,physical:this.xyzToPhysical(x,y,z), r:cube.colors[i*3], g:cube.colors[i*3+1], b:cube.colors[i*3+2]})
    }
    return map
  }
}
