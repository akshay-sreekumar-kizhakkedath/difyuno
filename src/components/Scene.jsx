import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, ContactShadows, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

export default function Scene() {
  const group = useRef();
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state) => {
    // Scroll-based rotation and translation
    const scrollY = window.scrollY;
    
    // Rotate the whole group based on scroll
    group.current.rotation.y = scrollY * 0.001;
    group.current.position.y = Math.sin(scrollY * 0.002) * 1;
    
    // Camera effect: Move the whole group towards the camera as you scroll down
    group.current.position.z = scrollY * 0.002;

    // Animate rings
    const t = state.clock.getElapsedTime();
    if(ring1.current) ring1.current.rotation.z = t * 0.5;
    if(ring2.current) ring2.current.rotation.z = -t * 0.3;
    if(ring3.current) ring3.current.rotation.z = t * 0.2;
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      {/* Golden/Warm lighting to match the logo vibe */}
      <directionalLight position={[10, 10, 5]} intensity={2} color="#ffb86c" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ffffff" />
      <spotLight position={[0, 5, 0]} intensity={2} color="#ffb86c" penumbra={1} />
      <Environment preset="night" />

      {/* Main 3D Container */}
      <group ref={group}>
        
        {/* Core Element - Representing the Figure in the Logo (Abstract Metallic Fluid/Shape) */}
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={[0, -1, 0]}>
            <capsuleGeometry args={[0.5, 1, 32, 64]} />
            <MeshDistortMaterial 
              color="#2a2220" 
              envMapIntensity={2} 
              clearcoat={1} 
              clearcoatRoughness={0.2} 
              metalness={0.9} 
              roughness={0.2} 
              distort={0.3} 
              speed={1.5} 
            />
          </mesh>
        </Float>

        {/* Concentric Glowing Rings inspired by the Logo */}
        <group position={[0, 1.5, 0]} rotation={[Math.PI / 2.5, 0, 0]}>
          <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
            {/* Inner Ring */}
            <mesh ref={ring1}>
              <torusGeometry args={[1.5, 0.03, 16, 100]} />
              <meshStandardMaterial color="#ffe8b3" emissive="#ffb86c" emissiveIntensity={2} metalness={1} roughness={0.1} />
            </mesh>
            {/* Middle Ring */}
            <mesh ref={ring2}>
              <torusGeometry args={[2.2, 0.02, 16, 100]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} metalness={1} roughness={0.2} />
            </mesh>
            {/* Outer Ring */}
            <mesh ref={ring3}>
              <torusGeometry args={[3, 0.04, 16, 100]} />
              <meshStandardMaterial color="#ffb86c" emissive="#ffb86c" emissiveIntensity={0.5} metalness={0.8} roughness={0.3} />
            </mesh>
          </Float>
        </group>

        {/* Floating Particles/Geometric dust */}
        <Sparkles count={150} scale={12} size={2} speed={0.4} opacity={0.5} color="#ffb86c" />
        
      </group>

      {/* Subtle Star background */}
      <Stars radius={50} depth={50} count={1000} factor={2} saturation={0} fade speed={1} />

      {/* Bottom shadow reflection */}
      <ContactShadows position={[0, -4, 0]} opacity={0.6} scale={30} blur={2.5} far={10} color="#000000" />
    </>
  );
}