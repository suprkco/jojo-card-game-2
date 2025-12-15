varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uRandom;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // "Le Souffle" - Breathing effect
  vec3 pos = position;
  
  // Sine wave on Z based on Time and random offset
  float breath = sin(uTime * 2.0 + uRandom * 15.0) * 0.02;
  // Also twist slightly
  pos.z += breath;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
