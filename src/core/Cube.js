export class Cube {
  constructor(size=8){
    this.size=size
    this.count=size*size*size
    this.colors = new Float32Array(this.count*3) // rgb 0-1
    this.brightness = new Float32Array(this.count)
    this.positions = [] // xyz world
    this.buildPositions()
  }
  buildPositions(){
    this.positions=[]
    const s=this.size
    const gap=1.4
    const offset=-(s-1)*gap/2
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      this.positions.push([x*gap+offset, y*gap+offset, z*gap+offset])
    }
  }
  resize(newSize){
    this.size=newSize
    this.count=newSize*newSize*newSize
    this.colors=new Float32Array(this.count*3)
    this.brightness=new Float32Array(this.count)
    this.buildPositions()
  }
  setVoxel(x,y,z,r,g,b){
    if(x<0||y<0||z<0||x>=this.size||y>=this.size||z>=this.size) return
    const i = this.xyzToIndex(x,y,z)
    this.colors[i*3]=r; this.colors[i*3+1]=g; this.colors[i*3+2]=b
  }
  getVoxel(x,y,z){
    const i=this.xyzToIndex(x,y,z)
    return [this.colors[i*3],this.colors[i*3+1],this.colors[i*3+2]]
  }
  xyzToIndex(x,y,z){ return z*this.size*this.size + y*this.size + x }
  indexToXyz(i){
    const s=this.size
    const x=i%s
    const y=Math.floor(i/s)%s
    const z=Math.floor(i/(s*s))
    return [x,y,z]
  }
  clear(){ this.colors.fill(0); this.brightness.fill(0) }
  fill(r,g,b){ for(let i=0;i<this.count;i++){ this.colors[i*3]=r; this.colors[i*3+1]=g; this.colors[i*3+2]=b } }
}
