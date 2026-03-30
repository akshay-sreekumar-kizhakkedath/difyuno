import { useRef, useMemo } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { useTexture, Environment, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --------------------------------------------------------
// 1. PARTICLE + LIQUID LOGO MATERIAL (Mixed Options 1 & 2)
// --------------------------------------------------------
const ParticleLiquidLogoMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uScroll: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uHover: 0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform float uScroll;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;
    
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float dist = distance(uv, uMouse);
      
      // -- LIQUID RIPPLE EFFECT --
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.15 * uHover * smoothstep(0.5, 0.0, dist);
      pos.z += ripple;

      // -- PARTICLE SCATTER ON HOVER --
      float repel = smoothstep(0.12, 0.0, dist) * uHover;
      float randX = random(vUv) - 0.5;
      float randY = random(vUv + 1.0) - 0.5;
      
      pos.x += randX * repel * 1.5;
      pos.y += randY * repel * 1.5;
      pos.z += repel * 0.5; // Push outwards slightly

      // -- SCROLL DISPERSION --
      float scrollFactor = min(uScroll * 0.001, 2.0);
      pos.x += randX * scrollFactor * 5.0;
      pos.y += randY * scrollFactor * 5.0;
      pos.z += sin(vUv.x * 20.0 + uTime) * scrollFactor;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Point size is dynamic based on depth
      gl_PointSize = 4.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // Slight UV distortion for the liquid look
      float dist = distance(uv, uMouse);
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.02 * uHover * smoothstep(0.5, 0.0, dist);
      uv += vec2(ripple);

      vec4 color = texture2D(uTexture, uv);

      // Key out the black background of the logo
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05 || color.a < 0.1) {
        discard;
      }
      
      // Add a liquid specular highlight
      float highlight = smoothstep(0.9, 1.0, wave) * 0.2 * uHover * smoothstep(0.5, 0.0, dist);
      color.rgb += vec3(highlight);

      gl_FragColor = vec4(color.rgb * 1.3, color.a);
    }
  `
);

// --------------------------------------------------------
// 2. INTERACTIVE BACKGROUND GRAINS MATERIAL
// --------------------------------------------------------
const InteractiveGrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector3(0, 0, 0),
  },
  `
    uniform float uTime;
    uniform vec3 uMouse;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      
      // Distance from the 3D mouse position
      float dist = distance(pos, uMouse);
      
      // Scatter grains strongly when cursor is near
      float influenceRadius = 5.0; 
      if(dist < influenceRadius) {
         vec3 dir = normalize(pos - uMouse);
         float pushStrength = (influenceRadius - dist) * 0.8; 
         
         pos.x += dir.x * pushStrength;
         pos.y += dir.y * pushStrength;
         pos.z += dir.z * pushStrength;
      }

      // Natural subtle drift
      pos.x += sin(uTime * 0.3 + pos.y) * 0.05;
      pos.y += cos(uTime * 0.2 + pos.x) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 3.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      // Fade out edges
      float centerDist = length(pos.xy);
      vAlpha = smoothstep(35.0, 0.0, centerDist) * 0.5;
    }
  `,
  `
    varying float vAlpha;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;
      // Warm golden/white grain
      gl_FragColor = vec4(1.0, 0.95, 0.85, vAlpha * (1.0 - (d * 2.0)));
    }
  `
);

extend({ ParticleLiquidLogoMaterial, InteractiveGrainMaterial });

// --------------------------------------------------------
// COMPONENTS
// --------------------------------------------------------

function MixedLogo() {
  const materialRef = useRef();
  const targetHover = useRef(0);
  const texture = useTexture('/assets/logo.png');
  
  // Dense grid for the particle system
  const geometry = useMemo(() => new THREE.PlaneGeometry(8, 8, 250, 250), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uScroll = window.scrollY;
      
      const targetX = state.pointer.x * 0.5 + 0.5;
      const targetY = state.pointer.y * 0.5 + 0.5;
      
      materialRef.current.uMouse.lerp(new THREE.Vector2(targetX, targetY), 0.1);
      materialRef.current.uHover = THREE.MathUtils.lerp(materialRef.current.uHover, targetHover.current, 0.1);
    }
  });

  return (
    <group 
      onPointerOver={() => (targetHover.current = 1)}
      onPointerOut={() => (targetHover.current = 0)}
    >
      {/* Invisible plane to reliably catch mouse hover events over the particles */}
      <mesh visible={false}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      <points geometry={geometry}>
        <particleLiquidLogoMaterial 
          ref={materialRef} 
          uTexture={texture} 
          transparent={true}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

function InteractiveGrains() {
  const pointsRef = useRef();
  const materialRef = useRef();
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  // Generate 30,000 points evenly distributed
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 30000;
    const positions = new Float32Array(count * 3);
    
    for(let i=0; i<count*3; i+=3) {
      positions[i]   = (Math.random() - 0.5) * 60; // X spread
      positions[i+1] = (Math.random() - 0.5) * 60; // Y spread
      positions[i+2] = -8 - Math.random() * 6;     // Z depth (behind logo)
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      
      // Calculate mouse position exactly at the depth of the grains (z = -10)
      vec.set(state.pointer.x, state.pointer.y, 0.5);
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      const distance = (-10 - camera.position.z) / vec.z;
      const pos = camera.position.clone().add(vec.multiplyScalar(distance));
      
      materialRef.current.uMouse.copy(pos);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <interactiveGrainMaterial 
        ref={materialRef} 
        transparent={true} 
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Scene() {
  const group = useRef();

  useFrame(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1000;
    
    if (group.current) {
      const scrollProgress = scrollY / vh;
      const scrollOffset = scrollProgress * 8.0;

      // Stopped oscillation. Moved down visually. Moves up on scroll.
      group.current.position.y = -0.5 + scrollOffset;
      
      // Slight rotation and scaling on scroll
      group.current.rotation.y = scrollProgress * 1.5;
      const currentScale = Math.max(1.8 - scrollProgress * 0.8, 0.5);
      group.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffb86c" />
      <Environment preset="city" />

      {/* Interactive Background Grains */}
      <InteractiveGrains />

      {/* Main Logo Container */}
      <group ref={group} scale={1.8}>
        <MixedLogo />
      </group>
    </>
  );
}