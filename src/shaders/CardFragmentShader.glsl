varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform sampler2D uTexture;
uniform float uTime;
uniform float uFoilIntensity; // 0.0 for plain, 1.0 for foil

float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  
  if (texColor.a < 0.1) discard; // Alpha test
  
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  
  // Foil Effect - Dependent on view angle
  float fresnel = 1.0 - abs(dot(viewDir, normal));
  
  // Rainbow
  vec3 rainbow = 0.5 + 0.5 * cos(uTime * 0.5 + vUv.xyx * 3.0 + vec3(0,2,4));
  
  // Grain
  float grain = (random(vUv * uTime) - 0.5) * 0.1;
  
  // Mix
  vec3 finalColor = texColor.rgb;
  
  if (uFoilIntensity > 0.0) {
      finalColor += rainbow * fresnel * uFoilIntensity * 0.6;
  }
  
  finalColor += grain;
  
  gl_FragColor = vec4(finalColor, texColor.a);
}
