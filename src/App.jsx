import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import { Analytics } from '@vercel/analytics/react';
import Scene from './components/Scene';
import Overlay from './components/Overlay';

export default function App() {
  const containerRef = useRef();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Analytics />
      {/* HTML Foreground Overlay (Nav and content) */}
      <Overlay />

      {/* 3D Canvas Background */}
      {/* Force pointer-events-none completely so it never intercepts hovers/clicks */}
      <div className="fixed top-0 left-0 w-full h-screen z-50 pointer-events-none" style={{ pointerEvents: 'none' }}>
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 50 }}
          style={{ pointerEvents: 'none' }}
          eventSource={containerRef}
          eventPrefix="client"
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <Scene />
        </Canvas>
      </div>
    </div>
  );
}