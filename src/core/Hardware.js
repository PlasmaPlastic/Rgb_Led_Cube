export class Hardware {
  constructor(){
    this.type='ESP32'
    this.voltage=5
    this.protocol='WS2812B'
    this.fps=60
    this.currentEstimate=0
  }
  estimatePower(cube){
    // assume 60mA per LED white max, avg 20mA
    let sum=0
    for(let i=0;i<cube.count;i++){
      const r=cube.colors[i*3], g=cube.colors[i*3+1], b=cube.colors[i*3+2]
      sum += (r+g+b)/3
    }
    const avg = cube.count? sum/cube.count : 0
    const amps = cube.count * 0.06 * avg // 60mA max per LED
    this.currentEstimate=amps
    return amps
  }
  gpioState(pin, value){
    return {pin, value, time:performance.now()}
  }
}
