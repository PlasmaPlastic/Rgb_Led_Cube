export class UI {
  constructor(cube, hardware, mapping, simulation, renderer){
    this.cube=cube; this.hardware=hardware; this.mapping=mapping; this.simulation=simulation; this.renderer=renderer
    this.bind()
    this.updateStats()
  }
  bind(){
    document.querySelectorAll('[data-size]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('[data-size]').forEach(b=>b.classList.remove('primary'))
        btn.classList.add('primary')
        const size=parseInt(btn.dataset.size)
        this.cube.resize(size)
        this.mapping.setSize(size)
        this.renderer.updateInstances()
        this.updateStats()
      })
    })
    document.getElementById('animSelect').addEventListener('change', e=>{ this.simulation.setMode(e.target.value) })
    document.getElementById('wiring').addEventListener('change', e=>{ this.mapping.setMode(e.target.value); document.getElementById('mapInfo').textContent='XYZ → '+e.target.value })
    document.getElementById('speed').addEventListener('input', e=>{ document.getElementById('speedVal').textContent=e.target.value+'x' })
    document.getElementById('brightness').addEventListener('input', e=>{
      document.getElementById('brightVal').textContent=Math.round(e.target.value*100)+'%'
      this.renderer.brightness=parseFloat(e.target.value)
    })
    document.getElementById('ledSize').addEventListener('input', e=>{ this.renderer.ledSize=parseFloat(e.target.value) })
    document.getElementById('autoRot').addEventListener('input', e=>{ this.autoRot=parseFloat(e.target.value) })

    document.getElementById('btnCopyCode').addEventListener('click',()=>{
      const code=document.getElementById('codeBox').textContent
      navigator.clipboard.writeText(code)
      alert('Code copied to clipboard')
    })
    document.getElementById('btnDownloadINO').addEventListener('click',()=>this.downloadINO())
    document.getElementById('btnExport').addEventListener('click',()=>this.exportJSON())
  }
  updateStats(){
    const c=this.cube
    document.getElementById('ledCount').textContent = `${c.count} LEDs (${c.size}³)`
    const amps=this.hardware.estimatePower(c)
    document.getElementById('powerEst').textContent = `~${amps.toFixed(1)}A @ 5V`
    document.getElementById('pwr').textContent = `${(amps*1.3).toFixed(0)}W PSU Recommended`
    document.getElementById('stats').innerHTML = `
      <div class="kv"><b>Voxels</b><span>${c.count}</span></div>
      <div class="kv"><b>Dimensions</b><span>${c.size} × ${c.size} × ${c.size}</span></div>
      <div class="kv"><b>Est. Max Current</b><span>${(c.count*0.06).toFixed(1)}A</span></div>
      <div class="kv"><b>Est. Avg Current</b><span>${amps.toFixed(2)}A</span></div>
      <div class="kv"><b>Wires</b><span>${(c.size-1)*3*c.size*c.size} segments</span></div>
      <div class="kv"><b>Memory</b><span>${(c.count*3*4/1024).toFixed(1)}KB colors</span></div>
    `
    // mini preview power graph
    const mini=document.getElementById('mini')
    const ctx=mini.getContext('2d')
    mini.width=300; mini.height=80
    ctx.clearRect(0,0,300,80)
    ctx.strokeStyle='#6d8cff55'; ctx.beginPath()
    for(let i=0;i<300;i++){ const v=Math.sin(i*0.04)*20+40; if(i===0) ctx.moveTo(i,v); else ctx.lineTo(i,v) }
    ctx.stroke()
  }
  downloadINO(){
    const s=this.cube.size
    const code=`#include <FastLED.h>
#define DATA_PIN 5
#define SIZE ${s}
#define NUM_LEDS ${s*s*s}
CRGB leds[NUM_LEDS];

int xyzToIndex(int x,int y,int z){
  // serpentine mapping - same as simulator
  int s=SIZE;
  if(z%2==0) return z*s*s + y*s + (y%2==0? x : s-1-x);
  else return z*s*s + (s-1-y)*s + ((s-1-y)%2==0? x : s-1-x);
}

void setup(){
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(128);
}

void rainbowWave(){
  static float t=0; t+=0.02;
  for(int z=0;z<SIZE;z++) for(int y=0;y<SIZE;y++) for(int x=0;x<SIZE;x++){
    int i=xyzToIndex(x,y,z);
    float d=sqrt(pow(x-SIZE/2,2)+pow(y-SIZE/2,2)+pow(z-SIZE/2,2));
    float hue=fmod(d*0.12 + t*0.3, 1.0);
    leds[i]=CHSV(hue*255,255,255);
  }
  FastLED.show();
}

void loop(){ rainbowWave(); delay(16); }
`
    const blob=new Blob([code],{type:'text/plain'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`LED_Cube_${s}x${s}x${s}.ino`; a.click()
  }
  exportJSON(){
    const data={ size:this.cube.size, count:this.cube.count, mapping:this.mapping.mode, leds: Array.from(this.cube.colors), timestamp:Date.now() }
    const blob=new Blob([JSON.stringify(data)],{type:'application/json'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`cube_${this.cube.size}.json`; a.click()
  }
}
