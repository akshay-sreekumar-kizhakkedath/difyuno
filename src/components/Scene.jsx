import { useRef, useMemo, useState } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { useTexture, Environment, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

// --------------------------------------------------------
// 1. LIQUID LOGO MATERIAL
// --------------------------------------------------------
const LiquidLogoMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uHover: 0,
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float dist = distance(uv, uMouse);
      
      // Liquid wave effect 
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.15 * uHover * smoothstep(0.5, 0.0, dist);
      pos.z += ripple;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
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
      
      float dist = distance(uv, uMouse);
      
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.03 * uHover * smoothstep(0.5, 0.0, dist);
      
      uv += vec2(ripple);

      vec4 color = texture2D(uTexture, uv);

      // Key out black background
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05) {
        discard;
      }
      
      // Specular highlight
      float highlight = smoothstep(0.9, 1.0, wave) * 0.2 * uHover * smoothstep(0.5, 0.0, dist);
      color.rgb += vec3(highlight);

      gl_FragColor = vec4(color.rgb, 1.0);
    }
  `
);

// --------------------------------------------------------
// 2. INTERACTIVE GRAIN/STAR PARTICLES MATERIAL
// --------------------------------------------------------
const InteractiveGrainMaterial = shaderMaterial(
  {
    uTime: 0,
    uMouse: new THREE.Vector3(0, 0, 0), // 3D world pos of mouse
  },
  // Vertex Shader
  `
    uniform float uTime;
    uniform vec3 uMouse;
    varying float vAlpha;

    void main() {
      vec3 pos = position;
      
      // Calculate distance from world mouse to this particle
      // We assume mouse is at z=0 plane roughly
      float dist = distance(vec3(pos.x, pos.y, 0.0), uMouse);
      
      // If mouse is near, push particle away radially
      float influenceRadius = 4.0; // How big the cursor scatter brush is
      if(dist < influenceRadius) {
         // Direction vector from mouse to particle
         vec3 dir = normalize(vec3(pos.x, pos.y, 0.0) - uMouse);
         
         // Push amount based on how close it is (closer = pushed harder)
         float pushStrength = (influenceRadius - dist) * 0.5; 
         
         pos.x += dir.x * pushStrength;
         pos.y += dir.y * pushStrength;
         pos.z += dir.z * pushStrength;
      }

      // Add a tiny bit of natural twinkle/drift to all particles over time
      pos.x += sin(uTime * 0.5 + pos.y) * 0.02;
      pos.y += cos(uTime * 0.3 + pos.x) * 0.02;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      
      // Make them look like fine grains based on depth
      gl_PointSize = 2.5 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      // Alpha depends on distance from center to fade out edges
      float centerDist = length(pos.xy);
      vAlpha = smoothstep(30.0, 0.0, centerDist) * 0.4; // Max opacity 0.4 for subtlety
    }
  `,
  // Fragment Shader
  `
    varying float vAlpha;
    void main() {
      // Create soft circle for grain
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;
      
      // Warm golden/white grain color
      gl_FragColor = vec4(1.0, 0.9, 0.8, vAlpha * (1.0 - (d * 2.0)));
    }
  `
);

extend({ LiquidLogoMaterial, InteractiveGrainMaterial });

// --------------------------------------------------------
// COMPONENTS
// --------------------------------------------------------

function LiquidLogo() {
  const materialRef = useRef();
  const targetHover = useRef(0);
  const texture = useTexture('/assets/logo.png');

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      
      const targetX = state.pointer.x * 0.5 + 0.5;
      const targetY = state.pointer.y * 0.5 + 0.5;
      
      materialRef.current.uMouse.lerp(new THREE.Vector2(targetX, targetY), 0.1);
      materialRef.current.uHover = THREE.MathUtils.lerp(materialRef.current.uHover, targetHover.current, 0.1);
    }
  });

  return (
    <mesh 
      onPointerOver={() => (targetHover.current = 1)}
      onPointerOut={() => (targetHover.current = 0)}
    >
      <planeGeometry args={[8, 8, 128, 128]} />
      <liquidLogoMaterial 
        ref={materialRef} 
        uTexture={texture} 
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function InteractiveGrains() {
  const pointsRef = useRef();
  const materialRef = useRef();
  const { viewport, camera } = useThree();
  const vec = new THREE.Vector3();

  // Generate 15,000 random points distributed across a wide plane
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 15000;
    const positions = new Float32Array(count * 3);
    
    for(let i=0; i<count*3; i+=3) {
      // Spread across x:-25 to 25, y:-25 to 25
      positions[i]   = (Math.random() - 0.5) * 50; 
      positions[i+1] = (Math.random() - 0.5) * 50;
      // Z depth from -5 (behind logo) to -15 (far back)
      positions[i+2] = -5 - Math.random() * 10; 
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      
      // Calculate real world position of mouse on z=0 plane to pass to shader
      vec.set(state.pointer.x, state.pointer.y, 0.5);
      vec.unproject(camera);
      vec.sub(camera.position).normalize();
      const distance = -camera.position.z / vec.z;
      const pos = camera.position.clone().add(vec.multiplyScalar(distance));
      
      // Update mouse uniform for scattering
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

  useFrame((state) => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1000;
    
    if (group.current) {
      const scrollProgress = scrollY / vh;
      const scrollOffset = scrollProgress * 8.0;

      // REMOVED math.sin oscillation. 
      // Adjusted base Y from 0 to -0.8 to move it down visually.
      group.current.position.y = -0.8 + scrollOffset;
      
      // Maintain scroll behavior
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
        <LiquidLogo />
      </group>
    </>
  );
}