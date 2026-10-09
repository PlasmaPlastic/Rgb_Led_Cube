import { Cube } from './core/Cube.js'
import { Hardware } from './core/Hardware.js'
import { Mapping } from './core/Mapping.js'
import { Simulation } from './core/Simulation.js'
import { WebGLRenderer } from './renderer/WebGLRenderer.js'
import { UI } from './ui/UI.js'

const canvas=document.getElementById('glcanvas')
const cube=new Cube(8)
const hardware=new Hardware()
const mapping=new Mapping(8,'serpentine')
const simulation=new Simulation(cube)
const renderer=new WebGLRenderer(canvas, cube)
const ui=new UI(cube, hardware, mapping, simulation, renderer)

let running=true
let last=performance.now()
let frame=0

function loop(now){
  const dt=Math.min(0.05, (now-last)/1000)
  last=now
  if(running){
    const speed=parseFloat(document.getElementById('speed').value||'1')
    simulation.update(dt, speed)
    frame++
    if(frame%20===0){
      document.getElementById('frameInfo').textContent=frame
      hardware.estimatePower(cube)
    }
  }
  // auto rotate
  const auto=parseFloat(document.getElementById('autoRot').value||'0')
  if(auto>0){
    renderer.camera.theta+=dt*auto
  }
  renderer.render(now/1000)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

document.getElementById('btnPlay').addEventListener('click',()=>running=true)
document.getElementById('btnPause').addEventListener('click',()=>running=false)

// handle cube resize from renderer
const origUpdate=renderer.updateInstances.bind(renderer)
renderer.updateInstances=()=>{
  origUpdate()
}

// expose for debug
window.cube=cube
window.sim=simulation
