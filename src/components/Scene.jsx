import { useRef, useMemo } from 'react';
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
  `
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float dist = distance(uv, uMouse);
      
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.15 * uHover * smoothstep(0.5, 0.0, dist);
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
      
      float wave = sin(dist * 40.0 - uTime * 8.0);
      float ripple = wave * 0.03 * uHover * smoothstep(0.5, 0.0, dist);
      
      uv += vec2(ripple);

      vec4 color = texture2D(uTexture, uv);

      float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      if (brightness < 0.05) {
        discard;
      }
      
      float highlight = smoothstep(0.9, 1.0, wave) * 0.2 * uHover * smoothstep(0.5, 0.0, dist);
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
      
      float influenceRadius = 5.0; 
      if(dist < influenceRadius) {
         vec3 dir = normalize(pos - uMouse);
         float pushStrength = (influenceRadius - dist) * 0.8; 
         
         pos.x += dir.x * pushStrength;
         pos.y += dir.y * pushStrength;
         pos.z += dir.z * pushStrength;
      }

      pos.x += sin(uTime * 0.3 + pos.y) * 0.05;
      pos.y += cos(uTime * 0.2 + pos.x) * 0.05;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = 3.0 * (1.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      float centerDist = length(pos.xy);
      vAlpha = smoothstep(35.0, 0.0, centerDist) * 0.5;
    }
  `,
  `
    varying float vAlpha;
    void main() {
      float d = distance(gl_PointCoord, vec2(0.5));
      if(d > 0.5) discard;
      gl_FragColor = vec4(1.0, 0.95, 0.85, vAlpha * (1.0 - (d * 2.0)));
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
  const { camera } = useThree();
  const vec = new THREE.Vector3();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const count = 30000;
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
  const { viewport } = useThree();

  useFrame(() => {
    const scrollY = window.scrollY;
    const vh = window.innerHeight || 1000;
    
    if (group.current) {
      // scrollProgress: 0 = top of page, 1 = scrolled one full screen down
      const scrollProgress = THREE.MathUtils.clamp(scrollY / vh, 0, 1);
      
      // We want to interpolate between:
      // START (center of screen, huge)
      // END (top-left corner of screen, small)

      // 1. Calculate Target Scale (shrinks as we scroll)
      const startScale = 1.8;
      const endScale = 0.25; 
      const currentScale = THREE.MathUtils.lerp(startScale, endScale, scrollProgress);
      group.current.scale.set(currentScale, currentScale, currentScale);

      // 2. Calculate Target Position
      // Start pos: center (0, 0)
      // End pos: top left. We use viewport width/height to find the exact corner.
      // (viewport.width/2 is the right edge, so -viewport.width/2 is the left edge)
      // We add some padding so it acts like a navbar logo.
      
      // Calculate top-left coordinate in 3D space
      const paddingX = viewport.width * 0.05; // 5vw padding left
      const paddingY = viewport.height * 0.05; // 5vh padding top
      
      const endX = -(viewport.width / 2) + paddingX + (2.0); // 2.0 offsets the logo's internal width
      const endY = (viewport.height / 2) - paddingY - (1.0);

      // Interpolate from 0 to target position
      const currentX = THREE.MathUtils.lerp(0, endX, scrollProgress);
      const currentY = THREE.MathUtils.lerp(0, endY, scrollProgress);

      group.current.position.set(currentX, currentY, 0);

      // 3. Keep the logo completely flat and still, so it perfectly matches a 2D DOM element at the end
      group.current.rotation.set(0, 0, 0);
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
      <group ref={group}>
        <LiquidLogo />
      </group>
    </>
  );
}