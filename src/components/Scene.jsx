import { useRef, useMemo, useState } from 'react';
import { useFrame, extend, useThree } from '@react-three/fiber';
import { useTexture, Environment, shaderMaterial, Float, Edges } from '@react-three/drei';
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
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float dist = distance(uv, uMouse);
      
      // Much stronger and continuous wave
      float wave = sin(dist * 30.0 - uTime * 5.0);
      // Severely limit the radius and strength so it only wobbles when cursor is directly over it
      float ripple = wave * 0.05 * smoothstep(0.3, 0.0, dist) * uHover;
      pos.z += ripple;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;
      
      float dist = distance(uv, uMouse);
      
      float wave = sin(dist * 30.0 - uTime * 5.0);
      float ripple = wave * 0.02 * smoothstep(0.3, 0.0, dist) * uHover;
      
      uv += vec2(ripple);

      vec4 color = texture2D(uTexture, uv);

      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05) {
        discard;
      }
      
      float highlight = smoothstep(0.9, 1.0, wave) * 0.15 * smoothstep(0.3, 0.0, dist) * uHover;
      color.rgb += vec3(highlight);

      gl_FragColor = vec4(color.rgb, 1.0);
    }
  `
);

// --------------------------------------------------------
// 2. SCATTERING GRAINS MATERIAL
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
      
      float dist = distance(pos, uMouse);
      
      float influenceRadius = 6.0; // Reduced interaction radius
      if(dist < influenceRadius) {
         vec3 dir = normalize(pos - uMouse);
         float pushStrength = (influenceRadius - dist) * 2.0; // Slightly snappier push but much smaller radius
         
         pos.x += dir.x * pushStrength;
         pos.y += dir.y * pushStrength;
         pos.z += dir.z * pushStrength;
      }

      pos.x += sin(uTime * 0.3 + pos.y) * 0.05;
      pos.y += cos(uTime * 0.2 + pos.x) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      // Increased point size to make grains clearly visible
      gl_PointSize = 16.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      float centerDist = length(pos.xy);
      // Pushed alpha multiplier past 1.0 for stronger additive blending / brightness
      vAlpha = smoothstep(50.0, 0.0, centerDist) * 2.0;
    }
  `,
  `
    varying float vAlpha;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;
      // Made grains brighter and core more solid so they show up on low brightness
      gl_FragColor = vec4(1.0, 0.9, 0.7, vAlpha * (1.0 - d));
    }
  `
);

extend({ LiquidLogoMaterial, InteractiveGrainMaterial });

// --------------------------------------------------------
// COMPONENTS
// --------------------------------------------------------

function NeuralNetwork({ globalMousePos }) {
  const groupRef = useRef();
  const linesRef = useRef();
  const pointsRef = useRef();
  
  // Configuration - Reduce heavily on mobile to preserve frame rate
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const particleCount = isMobile ? 40 : 150;
  const maxDistance = isMobile ? 6 : 5;
  const radius = 15;
  
  // Generate random points in a sphere
  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = [];
    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      // Random velocity
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
      ));
    }
    return [pos, vel];
  }, [particleCount, radius]);

  // Pre-allocate arrays for line segments (max possible connections)
  // We'll update the draw range dynamically
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const maxLines = (particleCount * (particleCount - 1)) / 2;
    const linePositions = new Float32Array(maxLines * 6); // 2 vertices per line, 3 coords each
    const lineOpacities = new Float32Array(maxLines * 2); // 1 opacity per vertex
    geo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    geo.setAttribute('opacity', new THREE.BufferAttribute(lineOpacities, 1)); // We might not use custom attribute if we just use basic material, but let's stick to basic for now.
    return geo;
  }, [particleCount]);

  useFrame(() => {
    if (!groupRef.current || !pointsRef.current || !linesRef.current) return;
    
    const pos = pointsRef.current.geometry.attributes.position.array;
    const linePos = linesRef.current.geometry.attributes.position.array;
    
    let lineIndex = 0;
    
    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      let x = pos[i * 3];
      let y = pos[i * 3 + 1];
      let z = pos[i * 3 + 2];
      
      const v = velocities[i];
      x += v.x;
      y += v.y;
      z += v.z;
      
      // Keep within bounds (bounce)
      if (Math.abs(x) > radius) v.x *= -1;
      if (Math.abs(y) > radius) v.y *= -1;
      if (Math.abs(z) > radius) v.z *= -1;
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      
      // Check connections with other particles
      for (let j = i + 1; j < particleCount; j++) {
        const dx = x - pos[j * 3];
        const dy = y - pos[j * 3 + 1];
        const dz = z - pos[j * 3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < maxDistance * maxDistance) {
          // Add line segment
          linePos[lineIndex++] = x;
          linePos[lineIndex++] = y;
          linePos[lineIndex++] = z;
          
          linePos[lineIndex++] = pos[j * 3];
          linePos[lineIndex++] = pos[j * 3 + 1];
          linePos[lineIndex++] = pos[j * 3 + 2];
        }
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, lineIndex / 3);
    
    // Slowly rotate the whole network
    groupRef.current.rotation.y += 0.002;
    groupRef.current.rotation.x += 0.001;
    
    // Subtle mouse interaction
    if (globalMousePos.current) {
       groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, globalMousePos.current.x * 0.1, 0.05);
       groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, globalMousePos.current.y * 0.1, 0.05);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -25]}>
      {/* The Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute 
            attach="attributes-position" 
            count={particleCount} 
            array={positions} 
            itemSize={3} 
          />
        </bufferGeometry>
        {/* Glowy Orange/Gold nodes representing data points */}
        <pointsMaterial size={0.3} color="#ffb86c" transparent opacity={0.8} sizeAttenuation={true} />
      </points>
      
      {/* The Connecting Lines */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial color="#e6c387" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

function LiquidLogo() {
  const materialRef = useRef();
  const texture = useTexture(`${import.meta.env.BASE_URL}assets/logo.png`);
  const [hovered, setHovered] = useState(false);
  const targetHover = useRef(0);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      
      targetHover.current = THREE.MathUtils.lerp(targetHover.current, hovered ? 1 : 0, 0.1);
      materialRef.current.uHover = targetHover.current;
    }
  });

  return (
    <mesh 
      onPointerOver={() => setHovered(true)} 
      onPointerOut={() => setHovered(false)}
      onPointerMove={(e) => {
        if(materialRef.current) {
          materialRef.current.uMouse.copy(e.uv);
        }
      }}
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

function InteractiveGrains({ globalMousePos }) {
  const pointsRef = useRef();
  const materialRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const count = isMobile ? 8000 : 30000;
    const positions = new Float32Array(count * 3);
    
    for(let i=0; i<count*3; i+=3) {
      positions[i]   = (Math.random() - 0.5) * 60; 
      positions[i+1] = (Math.random() - 0.5) * 60; 
      positions[i+2] = -8 - Math.random() * 6;     
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uTime = state.clock.getElapsedTime();
      materialRef.current.uMouse.copy(globalMousePos.current);
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
  const { viewport, camera } = useThree();
  
  // Track mouse globally without relying on raycasting intersection
  const globalMousePos = useRef(new THREE.Vector3(0, 0, 0));
  const vec = new THREE.Vector3();

  useFrame((state) => {
    // 1. Calculate global mouse position continuously
    vec.set(state.pointer.x, state.pointer.y, 0.5);
    vec.unproject(camera);
    vec.sub(camera.position).normalize();
    const distance = (-10 - camera.position.z) / vec.z;
    globalMousePos.current.copy(camera.position.clone().add(vec.multiplyScalar(distance)));

    // 2. Scroll logic
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1000;
    
    if (group.current) {
      const scrollProgress = THREE.MathUtils.clamp(scrollY / vh, 0, 1);
      
      // Dynamic start scale to ensure logo fits 85% of the smallest screen dimension
      const baseSize = 8.0; 
      const startScale = (Math.min(viewport.width, viewport.height) * 0.85) / baseSize;
      
      // Calculate exact position based on the actual DOM element
      const placeholder = document.getElementById('logo-placeholder');
      let posAtZZero = new THREE.Vector3(0, 0, 0);
      let endScale = 0.25;

      if (placeholder) {
        const rect = placeholder.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Target center of the placeholder in screen coordinates
        const targetScreenX = rect.left + rect.width / 2;
        
        // Fix vertical alignment: explicitly use the center of the entire navbar element
        // instead of just the placeholder div, so it strictly aligns with the right-side buttons.
        const navElement = placeholder.closest('nav');
        let targetScreenY = rect.top + rect.height / 2;
        
        if (navElement) {
           const navRect = navElement.getBoundingClientRect();
           // Decreased the visual offset slightly to nudge the logo up just a bit.
           const visualVerticalOffset = 20; 
           targetScreenY = (navRect.top + navRect.height / 2) + visualVerticalOffset;
        }

        // Convert screen coordinates to normalized device coordinates (-1 to +1)
        const ndcX = (targetScreenX / winW) * 2 - 1;
        const ndcY = -(targetScreenY / winH) * 2 + 1;

        // Unproject to find the world position at z=0
        const vector = new THREE.Vector3(ndcX, ndcY, 0);
        vector.unproject(camera);
        
        const dir = vector.sub(camera.position).normalize();
        const distanceToZZero = -camera.position.z / dir.z;
        posAtZZero = camera.position.clone().add(dir.multiplyScalar(distanceToZZero));

        // Calculate world units per pixel at z=0
        const vFov = (camera.fov * Math.PI) / 180;
        const visibleHeightAtZZero = 2 * Math.tan(vFov / 2) * camera.position.z;
        const visibleWidthAtZZero = visibleHeightAtZZero * camera.aspect;
        const unitsPerPixel = visibleWidthAtZZero / winW;
        
        // Because the PNG logo image has some transparent padding around it,
        // we need to multiply its final size to visually match the placeholder box.
        // Reduced to 1.0 to make the final logo slightly smaller
        const visualCompensation = 1.0; 
        const desiredWorldWidth = rect.width * unitsPerPixel * visualCompensation;
        endScale = desiredWorldWidth / baseSize;
      }

      const currentScale = THREE.MathUtils.lerp(startScale, endScale, scrollProgress);
      group.current.scale.set(currentScale, currentScale, currentScale);

      // Position the center of the logo
      const currentX = THREE.MathUtils.lerp(0, posAtZZero.x, scrollProgress);
      const currentY = THREE.MathUtils.lerp(0, posAtZZero.y, scrollProgress);

      group.current.position.set(currentX, currentY, 0);

      // 3. Parallax effect - Very subtle 3D tilt
      // We fade this out as they scroll down so it locks cleanly into the navbar
      const parallaxFactor = 1.0 - scrollProgress;
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, (state.pointer.x * 0.1) * parallaxFactor, 0.05);
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, (state.pointer.y * -0.1) * parallaxFactor, 0.05);
      
      // Also add subtle positional parallax
      group.current.position.x += (state.pointer.x * 0.02) * parallaxFactor;
      group.current.position.y += (state.pointer.y * 0.02) * parallaxFactor;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffb86c" />
      <Environment preset="city" />

      {/* Interactive Background Grains */}
      <InteractiveGrains globalMousePos={globalMousePos} />

      {/* Deep Tech AI Constellation */}
      <NeuralNetwork globalMousePos={globalMousePos} />

      {/* Main Logo Container */}
      <group ref={group}>
        <LiquidLogo />
      </group>
    </>
  );
}