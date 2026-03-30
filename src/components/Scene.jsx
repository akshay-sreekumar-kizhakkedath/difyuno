import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, ContactShadows, Stars } from '@react-three/drei';

export default function Scene() {
  const group = useRef();

  useFrame(() => {
    // Scroll-based rotation and translation
    const scrollY = window.scrollY;
    
    // Smooth dampening could be added here, but direct mapping gives a nice locked-in feel for now
    group.current.rotation.y = scrollY * 0.001;
    group.current.rotation.x = scrollY * 0.0005;
    group.current.position.y = Math.sin(scrollY * 0.002) * 1;
    
    // Camera effect: Move the whole group towards the camera as you scroll down
    group.current.position.z = scrollY * 0.002;
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#6c6cff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#a78bfa" />
      <Environment preset="city" />

      {/* Main 3D Container */}
      <group ref={group}>
        
        {/* Core Element - Abstract Shape */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial 
              color="#101015" 
              metalness={0.9} 
              roughness={0.1} 
              wireframe={true} 
            />
          </mesh>
        </Float>

        {/* Liquid Distorted Blob */}
        <Float speed={3} rotationIntensity={1} floatIntensity={2}>
          <mesh position={[3.5, 1.5, -2]}>
            <sphereGeometry args={[1.2, 64, 64]} />
            <MeshDistortMaterial 
              color="#6c6cff" 
              envMapIntensity={1} 
              clearcoat={1} 
              clearcoatRoughness={0.1} 
              metalness={0.8} 
              roughness={0.2} 
              distort={0.5} 
              speed={2} 
            />
          </mesh>
        </Float>

        {/* Elegant Ring */}
        <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={[-3.5, -2, -1]} rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[1.2, 0.2, 16, 64]} />
            <meshStandardMaterial color="#a78bfa" metalness={0.8} roughness={0.1} />
          </mesh>
        </Float>

        {/* Floating Particles/Geometric dust */}
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh
            key={i}
            position={[
              (Math.random() - 0.5) * 25,
              (Math.random() - 0.5) * 25,
              (Math.random() - 0.5) * 15 - 5
            ]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          >
            <octahedronGeometry args={[0.15 + Math.random() * 0.2, 0]} />
            <meshStandardMaterial 
              color="#ffffff" 
              metalness={1} 
              roughness={0} 
              opacity={Math.random() * 0.5 + 0.1} 
              transparent 
            />
          </mesh>
        ))}
      </group>

      {/* Subtle Star background */}
      <Stars radius={50} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

      {/* Bottom shadow reflection */}
      <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={30} blur={2} far={10} />
    </>
  );
}