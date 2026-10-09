export const vert = `#version 300 es
precision highp float;
in vec3 a_position;
in vec3 a_normal;
in vec3 a_instancePos;
in vec3 a_instanceColor;
uniform mat4 u_view;
uniform mat4 u_proj;
uniform float u_ledSize;
uniform float u_time;
out vec3 v_color;
out vec3 v_normal;
out vec3 v_worldPos;
out float v_depth;
void main(){
  vec3 pos = a_instancePos + a_position * u_ledSize;
  // slight bob for alive feel
  // pos.y += sin(u_time + a_instancePos.x*2.0)*0.02;
  vec4 world = vec4(pos,1.0);
  v_worldPos = pos;
  v_color = a_instanceColor;
  v_normal = a_normal;
  gl_Position = u_proj * u_view * world;
  v_depth = gl_Position.w;
}
`;

export const frag = `#version 300 es
precision highp float;
in vec3 v_color;
in vec3 v_normal;
in vec3 v_worldPos;
in float v_depth;
uniform float u_brightness;
uniform float u_time;
out vec4 outColor;
void main(){
  vec3 lightDir = normalize(vec3(0.8,1.2,0.9));
  float diff = max(dot(normalize(v_normal), lightDir), 0.0);
  float rim = pow(1.0 - max(dot(normalize(v_normal), vec3(0,0,1)),0.0), 2.0);
  // core color + lighting
  vec3 base = v_color * (0.35 + diff*0.65);
  // glow based on brightness
  float intensity = length(v_color);
  vec3 glow = v_color * (0.3 + rim*0.6) * intensity;
  vec3 finalCol = base + glow * 0.5;
  // add a little specular highlight
  finalCol += vec3(1.0)*pow(diff, 16.0)*0.25 * intensity;
  // fade distant LEDs slightly for depth
  float fog = clamp(v_depth/40.0, 0.0, 0.7);
  finalCol = mix(finalCol, vec3(0.02,0.05,0.15), fog*0.35);
  finalCol *= u_brightness;
  // HDR tonemap simple
  finalCol = finalCol / (finalCol + vec3(1.0));
  finalCol = pow(finalCol, vec3(1.0/2.2));
  outColor = vec4(finalCol, 1.0);
}
`;

export const lineVert = `#version 300 es
precision highp float;
in vec3 a_pos;
uniform mat4 u_view;
uniform mat4 u_proj;
void main(){
  gl_Position = u_proj * u_view * vec4(a_pos,1.0);
}
`;
export const lineFrag = `#version 300 es
precision lowp float;
uniform vec3 u_color;
out vec4 outColor;
void main(){
  outColor = vec4(u_color, 0.18);
}
`;
