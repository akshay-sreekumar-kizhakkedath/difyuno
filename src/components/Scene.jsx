import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture, Environment, shaderMaterial, Stars } from '@react-three/drei';
import * as THREE from 'three';

// 2. Liquid / Ripple Shader Material
// This maps the image onto a 2D plane and uses a shader to create 
// a realistic water ripple / glass distortion effect when hovering.
const LiquidLogoMaterial = shaderMaterial(
  {
    uTexture: new THREE.Texture(),
    uTime: 0,
    uMouse: new THREE.Vector2(0.5, 0.5),
    uHover: 0,
  },
  // Vertex Shader (Bends the actual geometry)
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      // Calculate distance from mouse in UV space
      float dist = distance(uv, uMouse);
      
      // Create a wave effect that stems from the mouse position
      float wave = sin(dist * 40.0 - uTime * 8.0);
      
      // Apply the wave to the Z axis, dampened by distance and hover state
      float ripple = wave * 0.15 * uHover * smoothstep(0.5, 0.0, dist);
      pos.z += ripple;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader (Distorts the image pixels)
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      // Calculate distance from mouse in UV space
      float dist = distance(uv, uMouse);
      
      // Create a refractive distortion effect on the UV coordinates
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.03 * uHover * smoothstep(0.5, 0.0, dist);
      
      uv += vec2(ripple); // Apply distortion

      vec4 color = texture2D(uTexture, uv);

      // Key out the black background
      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05) {
        discard;
      }
      
      // Add a slight specular highlight on the ripples
      float highlight = smoothstep(0.9, 1.0, wave) * 0.2 * uHover * smoothstep(0.5, 0.0, dist);
      color.rgb += vec3(highlight);

      gl_FragColor = vec4(color.rgb, 1.0);
    }
  `
);

// Register the custom material
extend({ LiquidLogoMaterial });

function LiquidLogo() {
  const materialRef = useRef();
  const targetHover = useRef(0);
  const texture = useTexture('/assets/logo.png');

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      
      // Map screen pointer (-1 to 1) to UV coordinates (0 to 1)
      const targetX = state.pointer.x * 0.5 + 0.5;
      const targetY = state.pointer.y * 0.5 + 0.5;
      
      // Smoothly track mouse
      materialRef.current.uMouse.lerp(new THREE.Vector2(targetX, targetY), 0.1);
      
      // Smoothly transition the hover intensity
      materialRef.current.uHover = THREE.MathUtils.lerp(materialRef.current.uHover, targetHover.current, 0.1);
    }
  });

  return (
    <mesh 
      onPointerOver={() => (targetHover.current = 1)}
      onPointerOut={() => (targetHover.current = 0)}
    >
      {/* We need enough segments (128x128) so the vertex ripple looks smooth */}
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

export default function Scene() {
  const group = useRef();

  useFrame((state) => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1000;
    
    if (group.current) {
      // Calculate how many screens we have scrolled (1.0 = 100vh)
      const scrollProgress = scrollY / vh;
      
      // Move the logo upwards out of the camera view exactly as if it were 
      // a normal DOM element scrolling away. 
      // ~7.5 units equals roughly 1 screen height at this camera distance.
      const scrollOffset = scrollProgress * 8.0;

      // Start dead center (0), apply float, and push upwards based on scroll
      group.current.position.y = 0 + Math.sin(state.clock.getElapsedTime()) * 0.1 + scrollOffset;
      
      // Add a slight spin as it scrolls away
      group.current.rotation.y = scrollProgress * 1.5;
      
      // Slightly scale it down as it scrolls away
      const currentScale = Math.max(1.8 - scrollProgress * 0.8, 0.5);
      group.current.scale.set(currentScale, currentScale, currentScale);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffb86c" />
      <Environment preset="city" />

      {/* Main Logo Container - Increased scale significantly to dominate the first screen */}
      <group ref={group} scale={1.8}>
        <LiquidLogo />
      </group>

      {/* Atmospheric dust */}
      <Stars radius={50} depth={50} count={3000} factor={3} saturation={0} fade speed={1} />
    </>
  );
}