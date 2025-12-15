varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform float uRandom;
uniform float uDirection; // 1.0 or -1.0

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // "Le Souffle" - Breathing effect
  vec3 pos = position;
  
  // Sine wave on Z based on Time and random offset
  // Multiply by uDirection so back-face moves in sync with front-face (World Space sync)
  float breath = sin(uTime * 2.0 + uRandom * 15.0) * 0.02 * uDirection;
  // Also twist slightly
  pos.z += breath;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
