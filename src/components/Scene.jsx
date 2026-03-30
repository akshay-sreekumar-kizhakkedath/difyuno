import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture, Environment, shaderMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

// 1. Particle Shader Material
// This shader maps the logo texture onto a grid of particles,
// discards the black background, and adds scroll/mouse dispersion.
const LogoParticleMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uScroll: 0,
    uMouse: new THREE.Vector2(0, 0),
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uMouse;
    varying vec2 vUv;
    
    // Simple noise function
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;

      // 1. Mouse Interaction (Repel particles)
      // Map mouse from [-1, 1] to UV space [0, 1] roughly
      vec2 mouseUv = uMouse * 0.5 + 0.5;
      float dist = distance(vUv, mouseUv);
      float repel = smoothstep(0.15, 0.0, dist);
      
      // Add random scatter based on distance
      float randX = random(vUv) - 0.5;
      float randY = random(vUv + 1.0) - 0.5;
      
      pos.x += randX * repel * 2.0;
      pos.y += randY * repel * 2.0;
      pos.z += repel * 1.5; // Push outwards

      // 2. Scroll Interaction (Break apart on scroll)
      float scrollFactor = min(uScroll * 0.001, 2.0); // Limit dispersion
      pos.x += randX * scrollFactor * 5.0;
      pos.y += randY * scrollFactor * 5.0;
      pos.z += sin(vUv.x * 20.0 + uTime) * scrollFactor;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Point size depends on screen resolution and depth
      gl_PointSize = 4.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(uTexture, vUv);
      
      // Discard pure black or highly transparent pixels
      // Since the logo has a black background, this leaves only the text/figure
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05 || color.a < 0.1) {
        discard;
      }
      
      // Add slight glow
      gl_FragColor = vec4(color.rgb * 1.5, color.a);
    }
  `
);

// Register it so we can use <logoParticleMaterial />
extend({ LogoParticleMaterial });

function ParticleLogo() {
  const materialRef = useRef();
  const pointsRef = useRef();
  const texture = useTexture('/assets/logo.png');
  
  // Create a dense grid of points
  const geometry = useMemo(() => {
    // 250x250 grid gives 62,500 particles. Enough for high resolution without killing performance.
    return new THREE.PlaneGeometry(8, 8, 250, 250); 
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uScroll = window.scrollY;
      
      // Smoothly track mouse
      materialRef.current.uMouse.lerp(
        new THREE.Vector2(
          (state.pointer.x * state.viewport.width) / 8, // scale to match plane size roughly
          (state.pointer.y * state.viewport.height) / 8
        ),
        0.1
      );
    }
    
    // Slight float effect on the whole logo
    if (pointsRef.current) {
      pointsRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <logoParticleMaterial 
        ref={materialRef} 
        uTexture={texture} 
        transparent={true}
        depthWrite={false}
      />
    </points>
  );
}

export default function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffb86c" />
      <Environment preset="city" />

      {/* Move the logo up and scale it slightly so it floats above the text */}
      <group position={[0, 1.8, 0]} scale={0.85}>
        <ParticleLogo />
      </group>

      {/* Atmospheric dust */}
      <Stars radius={50} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
    </>
  );
}