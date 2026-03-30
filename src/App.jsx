import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import Scene from './components/Scene';
import Overlay from './components/Overlay';

export default function App() {
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
    <div className="relative w-full">
      {/* 3D Canvas Background */}
      <div className="fixed top-0 left-0 w-full h-screen z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <Scene />
        </Canvas>
      </div>

      {/* HTML Foreground Overlay */}
      <Overlay />
    </div>
  );
}