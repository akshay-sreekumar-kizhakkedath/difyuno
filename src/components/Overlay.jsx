import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Custom Cursor Component
function CustomCursor() {
  const cursorRef = useRef();
  const followerRef = useRef();

  useEffect(() => {
    const onMouseMove = (e) => {
      // Move dot instantly
      gsap.to(cursorRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0,
      });
      // Move follower with slight delay
      gsap.to(followerRef.current, {
        x: e.clientX,
        y: e.clientY,
        duration: 0.6,
        ease: "power3.out",
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <>
      {/* Outer trailing circle */}
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-10 h-10 border border-primary/50 rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 mix-blend-screen"
      />
      {/* Inner glowing dot */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[100] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#ffb86c]"
      />
    </>
  );
}

export default function Overlay() {
  const overlayRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.gsap-fade-up').forEach(element => {
        gsap.fromTo(element, 
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      gsap.utils.toArray('.gsap-parallax').forEach(element => {
        gsap.to(element, {
          y: -100,
          ease: "none",
          scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      });
    }, overlayRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={overlayRef} className="relative z-10 w-full pointer-events-none">
      
      <CustomCursor />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 md:px-12 flex justify-between items-center mix-blend-difference pointer-events-auto z-50">
        <div className="flex items-center gap-3">
          <div className="w-32 h-8"></div>
        </div>
        <div className="flex gap-6 items-center">
          <a href="#services" className="hidden md:block text-sm uppercase tracking-widest hover:text-primary transition-colors">Services</a>
          <a href="#work" className="hidden md:block text-sm uppercase tracking-widest hover:text-primary transition-colors">Work</a>
          <a href="#contact" className="px-6 py-2.5 border border-white/20 rounded-full hover:bg-white hover:text-black transition-all text-sm tracking-widest uppercase backdrop-blur-md bg-white/5">
            Start Building
          </a>
        </div>
      </nav>

      {/* Screen 1: Pure 3D Logo Stage */}
      {/* Removed pointer-events-auto from the massive section wrapper so the 3D canvas underneath can receive mouse movements! */}
      <section className="h-screen flex flex-col justify-end items-center pb-12">
        <div className="text-white/30 text-xs uppercase tracking-[0.3em] animate-pulse pointer-events-none">
          Scroll to discover
        </div>
      </section>

      {/* Screen 2: Hero Content */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20">
        {/* Only the content block gets pointer-events-auto */}
        <div className="pointer-events-auto gsap-fade-up">
          <div className="mb-4 text-primary tracking-[0.3em] text-xs md:text-sm uppercase font-semibold">
            01 — Who We Are
          </div>
          <h1 className="text-[12vw] md:text-[8vw] font-bold leading-[0.9] tracking-tighter uppercase mb-6 drop-shadow-2xl text-white">
            We Build <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Outcomes
            </span>
          </h1>
          <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
            The next generation of business won't be built on templates. <br className="hidden md:block" />
            They'll be built on intelligence.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#ffb86c]"></span>
            <span className="text-xs uppercase tracking-wider text-white/80">Available for new projects</span>
          </div>
        </div>
      </section>

      <div className="h-[20vh]"></div>

      {/* Services Intro Section */}
      <section id="services" className="min-h-screen flex items-center px-8 md:px-24">
        <div className="max-w-3xl pointer-events-auto">
          <div className="gsap-fade-up">
            <div className="mb-6 text-accent tracking-[0.3em] text-xs uppercase font-semibold">
              02 — What We Do
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight leading-tight text-white hover:text-primary transition-colors duration-500">
              Intelligence <br/>at Scale.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-10 font-light">
              Turn your "what if" into a functional AI reality in 14 days. We leverage cutting-edge WebGL, React Three Fiber, and high-performance engineering to build award-winning experiences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:-translate-y-2 hover:border-primary/50 transition-all duration-300">
                <h3 className="text-2xl font-semibold mb-3 text-white">AI-Powered MVP</h3>
                <p className="text-white/50 text-sm leading-relaxed">Stop waiting months. We use Vibe Coding to ship full-stack AI-integrated MVPs in 14 days.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:-translate-y-2 hover:border-primary/50 transition-all duration-300">
                <h3 className="text-2xl font-semibold mb-3 text-white">Workflow Agents</h3>
                <p className="text-white/50 text-sm leading-relaxed">Digital employees that handle leads, manage CRM, and automate repetitive tasks automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-[20vh]"></div>

      {/* Immersive 3D Text Parallax Section */}
      <section className="min-h-screen flex items-center justify-end px-8 md:px-24 text-right">
        <div className="max-w-2xl pointer-events-auto">
          <div className="gsap-fade-up">
            <div className="mb-6 text-primary tracking-[0.3em] text-xs uppercase font-semibold">
              03 — The Philosophy
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white hover:text-accent transition-colors duration-500">
              Immersive <br/>Experiences.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-10 font-light">
              Break out of the 2D grid. Interactive storytelling creates memory and drives conversion. Minimum clicks. Maximum impact.
            </p>
          </div>
          
          <div className="gsap-parallax mt-12">
            <button className="px-10 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,184,108,0.3)] hover:shadow-[0_0_60px_rgba(255,184,108,0.6)] cursor-pointer">
              View Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA / Footer */}
      <section id="contact" className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none z-0"></div>
        <div className="relative z-10 max-w-4xl pointer-events-auto gsap-fade-up">
          <h2 className="text-6xl md:text-9xl font-bold mb-8 tracking-tighter text-white">Ready?</h2>
          <p className="text-xl md:text-2xl text-white/50 mb-12 font-light">
            Fourteen days. One outcome. Zero excuses.<br/>Let's turn your idea into something real.
          </p>
          <a href="mailto:hello@difyuno.com" className="inline-block px-12 py-6 bg-gradient-to-r from-primary to-accent text-black font-bold uppercase tracking-widest text-sm rounded-full hover:scale-105 hover:shadow-[0_0_60px_rgba(255,184,108,0.5)] transition-all cursor-pointer">
            Start Your 14-Day Build
          </a>
        </div>
      </section>

      <footer className="py-8 text-center text-white/30 text-xs tracking-widest uppercase border-t border-white/5 bg-black/50 backdrop-blur-lg pointer-events-auto">
        <p>© 2026 Difyuno. Engineered for the future.</p>
      </footer>
    </div>
  );
}