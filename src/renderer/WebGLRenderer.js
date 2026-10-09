import { vert, frag, lineVert, lineFrag } from './shaders.js'

function createShader(gl, type, src){
  const s=gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    console.error(gl.getShaderInfoLog(s))
    throw new Error('shader compile fail')
  }
  return s
}
function createProgram(gl, vsSrc, fsSrc){
  const vs=createShader(gl, gl.VERTEX_SHADER, vsSrc)
  const fs=createShader(gl, gl.FRAGMENT_SHADER, fsSrc)
  const p=gl.createProgram()
  gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p)
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(p)); throw new Error('link fail') }
  return p
}
function mat4Identity(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]) }
function mat4Perspective(out,fov,aspect,near,far){
  const f=1/Math.tan(fov/2)
  out[0]=f/aspect; out[1]=0; out[2]=0; out[3]=0
  out[4]=0; out[5]=f; out[6]=0; out[7]=0
  out[8]=0; out[9]=0; out[10]=(far+near)/(near-far); out[11]=-1
  out[12]=0; out[13]=0; out[14]=2*far*near/(near-far); out[15]=0
  return out
}
function mat4LookAt(out, eye, center, up){
  const ex=eye[0], ey=eye[1], ez=eye[2]
  const cx=center[0], cy=center[1], cz=center[2]
  const ux=up[0], uy=up[1], uz=up[2]
  let zx=ex-cx, zy=ey-cy, zz=ez-cz
  let len=Math.hypot(zx,zy,zz); if(len>0){zx/=len; zy/=len; zz/=len}
  let xx=uy*zz-uz*zy, xy=uz*zx-ux*zz, xz=ux*zy-uy*zx
  len=Math.hypot(xx,xy,xz); if(len>0){xx/=len; xy/=len; xz/=len}
  let yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx
  out[0]=xx; out[1]=yx; out[2]=zx; out[3]=0
  out[4]=xy; out[5]=yy; out[6]=zy; out[7]=0
  out[8]=xz; out[9]=yz; out[10]=zz; out[11]=0
  out[12]=-(xx*ex+xy*ey+xz*ez); out[13]=-(yx*ex+yy*ey+yz*ez); out[14]=-(zx*ex+zy*ey+zz*ez); out[15]=1
  return out
}

export class WebGLRenderer {
  constructor(canvas, cube){
    this.canvas=canvas
    this.cube=cube
    this.gl=canvas.getContext('webgl2', {antialias:true, alpha:false})
    if(!this.gl) throw new Error('WebGL2 not supported')
    const gl=this.gl
    this.program=createProgram(gl, vert, frag)
    this.lineProgram=createProgram(gl, lineVert, lineFrag)
    this.initGeometry()
    this.initInstanceBuffers()
    // camera
    this.camera={theta:0.8, phi:-0.6, dist:18, target:[0,0,0], pan:[0,0]}
    this.viewMat=new Float32Array(16)
    this.projMat=new Float32Array(16)
    this.ledSize=0.55
    this.brightness=1.0
    this.time=0
    this.setupEvents()
    this.resize()
    window.addEventListener('resize',()=>this.resize())
  }
  initGeometry(){
    const gl=this.gl
    // cube with normals: 36 vertices
    // each face 2 triangles
    const positions=[]
    const normals=[]
    function face(n, v0,v1,v2,v3){
      // two triangles v0,v1,v2 and v0,v2,v3
      positions.push(...v0,...v1,...v2, ...v0,...v2,...v3)
      for(let i=0;i<6;i++) normals.push(...n)
    }
    const s=0.5
    // +X
    face([1,0,0], [s,-s,-s],[s,-s,s],[s,s,s],[s,s,-s])
    // -X
    face([-1,0,0], [-s,-s,s],[-s,-s,-s],[-s,s,-s],[-s,s,s])
    // +Y
    face([0,1,0], [-s,s,-s],[s,s,-s],[s,s,s],[-s,s,s])
    // -Y
    face([0,-1,0], [-s,-s,s],[s,-s,s],[s,-s,-s],[-s,-s,-s])
    // +Z
    face([0,0,1], [-s,-s,s],[-s,s,s],[s,s,s],[s,-s,s])
    // -Z
    face([0,0,-1], [s,-s,-s],[s,s,-s],[-s,s,-s],[-s,-s,-s])
    this.cubeVerts=new Float32Array(positions)
    this.cubeNorms=new Float32Array(normals)

    this.vboPos=gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPos)
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeVerts, gl.STATIC_DRAW)

    this.vboNorm=gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNorm)
    gl.bufferData(gl.ARRAY_BUFFER, this.cubeNorms, gl.STATIC_DRAW)

    // instance buffers
    this.instancePosBuf=gl.createBuffer()
    this.instanceColBuf=gl.createBuffer()

    // wireframe grid for structure: lines between neighboring voxels
    this.wireBuf=gl.createBuffer()
  }
  initInstanceBuffers(){
    this.updateInstances()
  }
  updateInstances(){
    const gl=this.gl
    const count=this.cube.count
    const posArr=new Float32Array(count*3)
    for(let i=0;i<count;i++){
      const p=this.cube.positions[i]
      posArr[i*3]=p[0]; posArr[i*3+1]=p[1]; posArr[i*3+2]=p[2]
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuf)
    gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW)

    // colors
    const colArr=this.cube.colors // already Float32Array
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColBuf)
    gl.bufferData(gl.ARRAY_BUFFER, colArr, gl.DYNAMIC_DRAW)

    // wires: create lines for cube edges and internal connections
    const s=this.cube.size
    const gap=1.4
    const offset=-(s-1)*gap/2
    const lines=[]
    function addLine(ax,ay,az,bx,by,bz){ lines.push(ax,ay,az,bx,by,bz) }
    // only draw outer cage + internal vertical wires for readability
    for(let z=0;z<s;z++) for(let y=0;y<s;y++) for(let x=0;x<s;x++){
      const px=x*gap+offset, py=y*gap+offset, pz=z*gap+offset
      if(x < s-1) addLine(px,py,pz, px+gap,py,pz)
      if(y < s-1) addLine(px,py,pz, px,py+gap,pz)
      if(z < s-1) addLine(px,py,pz, px,py,pz+gap)
    }
    this.wireCount=lines.length/3
    gl.bindBuffer(gl.ARRAY_BUFFER, this.wireBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW)
  }
  setupEvents(){
    let dragging=false, last=[0,0], shift=false
    this.canvas.addEventListener('mousedown', e=>{ dragging=true; last=[e.clientX,e.clientY]; shift=e.shiftKey })
    window.addEventListener('mouseup',()=>dragging=false)
    window.addEventListener('mousemove', e=>{
      if(!dragging) return
      const dx=e.clientX-last[0], dy=e.clientY-last[1]
      last=[e.clientX,e.clientY]
      if(e.shiftKey || shift){
        // pan
        this.camera.pan[0]+=dx*0.02
        this.camera.pan[1]-=dy*0.02
      } else {
        this.camera.theta+=dx*0.01
        this.camera.phi+=dy*0.01
        this.camera.phi=Math.max(-1.5, Math.min(1.5, this.camera.phi))
      }
    })
    this.canvas.addEventListener('wheel', e=>{
      e.preventDefault()
      this.camera.dist*= (1+ e.deltaY*0.001)
      this.camera.dist=Math.max(3, Math.min(60, this.camera.dist))
    }, {passive:false})
  }
  resize(){
    const dpr=window.devicePixelRatio||1
    const rect=this.canvas.getBoundingClientRect()
    this.canvas.width=rect.width*dpr
    this.canvas.height=rect.height*dpr
    this.gl.viewport(0,0,this.canvas.width,this.canvas.height)
  }
  render(t){
    const gl=this.gl
    this.time=t
    // update color buffer each frame
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColBuf)
    gl.bufferData(gl.ARRAY_BUFFER, this.cube.colors, gl.DYNAMIC_DRAW)

    // camera
    const th=this.camera.theta, ph=this.camera.phi, dist=this.camera.dist
    const eye=[Math.cos(th)*Math.cos(ph)*dist + this.camera.pan[0], Math.sin(ph)*dist + this.camera.pan[1], Math.sin(th)*Math.cos(ph)*dist]
    const target=[this.camera.pan[0]*0.3, this.camera.pan[1]*0.3, 0]
    mat4LookAt(this.viewMat, eye, target, [0,1,0])
    mat4Perspective(this.projMat, Math.PI/4, this.canvas.width/this.canvas.height, 0.1, 200)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.clearColor(0.04,0.06,0.12,1)
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)

    // draw wires first (faint)
    {
      const p=this.lineProgram
      gl.useProgram(p)
      const locView=gl.getUniformLocation(p,'u_view')
      const locProj=gl.getUniformLocation(p,'u_proj')
      const locColor=gl.getUniformLocation(p,'u_color')
      gl.uniformMatrix4fv(locView,false,this.viewMat)
      gl.uniformMatrix4fv(locProj,false,this.projMat)
      gl.uniform3f(locColor, 0.25,0.32,0.55)
      const aPos=gl.getAttribLocation(p,'a_pos')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.wireBuf)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0)
      gl.drawArrays(gl.LINES, 0, this.wireCount)
    }

    // draw LEDs instanced
    {
      const p=this.program
      gl.useProgram(p)
      const locView=gl.getUniformLocation(p,'u_view')
      const locProj=gl.getUniformLocation(p,'u_proj')
      const locSize=gl.getUniformLocation(p,'u_ledSize')
      const locBright=gl.getUniformLocation(p,'u_brightness')
      const locTime=gl.getUniformLocation(p,'u_time')
      gl.uniformMatrix4fv(locView,false,this.viewMat)
      gl.uniformMatrix4fv(locProj,false,this.projMat)
      gl.uniform1f(locSize, this.ledSize)
      gl.uniform1f(locBright, this.brightness)
      gl.uniform1f(locTime, t)

      // a_position
      const aPos=gl.getAttribLocation(p,'a_position')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vboPos)
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos,3,gl.FLOAT,false,0,0)
      // a_normal
      const aNorm=gl.getAttribLocation(p,'a_normal')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vboNorm)
      gl.enableVertexAttribArray(aNorm)
      gl.vertexAttribPointer(aNorm,3,gl.FLOAT,false,0,0)
      // instance pos
      const aInstPos=gl.getAttribLocation(p,'a_instancePos')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePosBuf)
      gl.enableVertexAttribArray(aInstPos)
      gl.vertexAttribPointer(aInstPos,3,gl.FLOAT,false,0,0)
      gl.vertexAttribDivisor(aInstPos,1)
      // instance color
      const aInstCol=gl.getAttribLocation(p,'a_instanceColor')
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColBuf)
      gl.enableVertexAttribArray(aInstCol)
      gl.vertexAttribPointer(aInstCol,3,gl.FLOAT,false,0,0)
      gl.vertexAttribDivisor(aInstCol,1)

      gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, this.cube.count)

      // cleanup divisors
      gl.vertexAttribDivisor(aInstPos,0)
      gl.vertexAttribDivisor(aInstCol,0)
    }
  }
}
