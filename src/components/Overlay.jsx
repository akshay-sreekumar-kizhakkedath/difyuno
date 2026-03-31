import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const customStyles = `
  .awwwards-btn {
    position: relative;
    overflow: hidden;
    /* Avoid 'transition: all' so it doesn't fight GSAP transform animations */
    transition: color 0.4s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.4s, box-shadow 0.4s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    background: transparent;
    cursor: pointer;
  }
  .awwwards-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: #ffb86c;
    transition: left 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: -1;
  }
  .awwwards-btn:hover::before {
    left: 0;
  }
  .awwwards-btn:hover {
    color: #000 !important;
    border-color: #ffb86c;
    box-shadow: 0 0 20px rgba(255, 184, 108, 0.5);
    transform: translateY(-4px) scale(1.02);
  }
  .awwwards-btn:active {
    transform: translateY(0) scale(0.98);
  }
  
  .link-underline {
    position: relative;
    display: inline-block;
    transition: color 0.3s ease;
  }
  .link-underline:hover {
    color: #ffb86c;
  }
  .link-underline::after {
    content: '';
    position: absolute;
    width: 100%;
    transform: scaleX(0);
    height: 1px;
    bottom: -2px;
    left: 0;
    background-color: #ffb86c;
    transform-origin: bottom right;
    transition: transform 0.4s cubic-bezier(0.86, 0, 0.07, 1);
  }
  .link-underline:hover::after {
    transform: scaleX(1);
    transform-origin: bottom left;
  }
  
  .glass-card {
    position: relative;
    overflow: hidden;
  }
  .glass-card::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,184,108,0.1) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-25deg);
    transition: left 0.6s ease-in-out;
  }
  .glass-card:hover::before {
    left: 200%;
  }
`;

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
        className="fixed top-0 left-0 w-10 h-10 border border-primary/50 rounded-full z-[100] -translate-x-1/2 -translate-y-1/2 mix-blend-screen pointer-events-none"
        style={{ pointerEvents: 'none' }}
      />
      {/* Inner glowing dot */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full z-[100] -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#ffb86c] pointer-events-none"
        style={{ pointerEvents: 'none' }}
      />
    </>
  );
}

export default function Overlay() {
  const overlayRef = useRef();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // The 3D logo finishes scaling/moving when scrollY reaches 100vh
      if (window.scrollY >= window.innerHeight) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Load Animations
      gsap.fromTo('.nav-container', 
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.2 }
      );
      
      gsap.fromTo('.scroll-indicator',
        { opacity: 0 },
        { opacity: 1, duration: 2, delay: 1.5 }
      );

      gsap.to('.scroll-indicator', {
        opacity: 0,
        scrollTrigger: {
          trigger: '.scroll-indicator',
          start: "top 90%",
          end: "top 50%",
          scrub: true
        }
      });

      // 2. Staggered Fade Up for Content Sections
      gsap.utils.toArray('.stagger-fade-up').forEach(container => {
        // Animate direct children sequentially
        const elements = container.children;
        gsap.fromTo(elements, 
          { opacity: 0, y: 60 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // 3. Pop-in animation for Glass Cards
      gsap.utils.toArray('.cards-container').forEach(container => {
        const cards = container.querySelectorAll('.glass-card');
        gsap.fromTo(cards,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1, y: 0, scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: container,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // 4. Parallax Elements
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
      <style>{customStyles}</style>
      <CustomCursor />

      {/* Navigation */}
      <nav className={`nav-container fixed top-0 left-0 w-full p-4 md:p-6 md:px-12 flex justify-between items-center pointer-events-none z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-black/40 backdrop-blur-md border-b border-white/10 pointer-events-auto" 
          : "mix-blend-difference"
      }`}>
        <div className="flex items-center gap-3 shrink-0">
          {/* Added an ID here so the 3D scene can track its exact position */}
          <div 
            id="logo-placeholder" 
            className="w-24 md:w-48 h-8 md:h-10 cursor-pointer pointer-events-auto shrink-0"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Back to top"
          ></div>
        </div>
        <div className="flex gap-4 md:gap-6 items-center pointer-events-auto shrink-0">
          <a href="#services" className="hidden md:block text-sm uppercase tracking-widest link-underline transition-colors pointer-events-auto">Services</a>
          <a href="#work" className="hidden md:block text-sm uppercase tracking-widest link-underline transition-colors pointer-events-auto">Work</a>
          <a href="#contact" className="awwwards-btn z-[1] px-4 py-2 md:px-6 md:py-2.5 border border-white/20 rounded-full text-xs md:text-sm tracking-widest uppercase backdrop-blur-md pointer-events-auto relative whitespace-nowrap">
            Start Building
          </a>
        </div>
      </nav>

      {/* Screen 1: Pure 3D Logo Stage */}
      {/* Removed pointer-events-auto from the massive section wrapper so the 3D canvas underneath can receive mouse movements! */}
      <section className="h-screen flex flex-col justify-end items-center pb-12">
        <div className="scroll-indicator text-white/30 text-xs uppercase tracking-[0.3em] animate-pulse pointer-events-none">
          Scroll to discover
        </div>
      </section>

      {/* Screen 2: Hero Content */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 pt-20 pointer-events-none">
        {/* Only the content block gets pointer-events-auto */}
        <div className="pointer-events-auto stagger-fade-up relative z-10">
          <div className="mb-4 text-primary tracking-[0.3em] text-xs md:text-sm uppercase font-semibold">
            01 — Who We Are
          </div>
          <h1 className="text-[12vw] md:text-[8vw] font-bold leading-[0.9] tracking-normal uppercase mb-6 drop-shadow-2xl text-white">
            We Build <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Outcomes
            </span>
          </h1>
          <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed">
            The next generation of business won't be built on templates. <br className="hidden md:block" />
            They'll be built on intelligence.
          </p>
          
          <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:bg-primary/20 hover:border-primary/50 hover:-translate-y-1 hover:scale-105 active:scale-95 active:translate-y-0 group">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#ffb86c] group-hover:bg-white group-hover:shadow-[0_0_10px_#fff] transition-colors"></span>
            <span className="text-xs uppercase tracking-wider text-white/80 group-hover:text-white transition-colors">Available for new projects</span>
          </div>
        </div>
      </section>

      <div className="h-[20vh]"></div>

      {/* Services Intro Section */}
      <section id="services" className="min-h-screen flex items-center px-8 md:px-24">
        <div className="max-w-3xl pointer-events-auto">
          <div className="stagger-fade-up">
            <div className="mb-6 text-accent tracking-[0.3em] text-xs uppercase font-semibold">
              02 — What We Do
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-normal leading-tight text-white hover:text-primary transition-colors duration-500">
              Intelligence <br/>at Scale.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-10 font-light">
              Turn your "what if" into a functional AI reality in 14 days. We leverage cutting-edge WebGL, React Three Fiber, and high-performance engineering to build award-winning experiences.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 cards-container">
            <div className="glass-card p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:-translate-y-2 hover:border-primary/50 transition-all duration-300">
              <h3 className="text-2xl font-semibold mb-3 text-white">AI-Powered MVP</h3>
              <p className="text-white/50 text-sm leading-relaxed">Stop waiting months. We use Vibe Coding to ship full-stack AI-integrated MVPs in 14 days.</p>
            </div>
            <div className="glass-card p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:-translate-y-2 hover:border-primary/50 transition-all duration-300">
              <h3 className="text-2xl font-semibold mb-3 text-white">Workflow Agents</h3>
              <p className="text-white/50 text-sm leading-relaxed">Digital employees that handle leads, manage CRM, and automate repetitive tasks automatically.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-[20vh]"></div>

      {/* Immersive 3D Text Parallax Section */}
      <section className="min-h-screen flex items-center justify-end px-8 md:px-24 text-right">
        <div className="max-w-2xl pointer-events-auto">
          <div className="stagger-fade-up">
            <div className="mb-6 text-primary tracking-[0.3em] text-xs uppercase font-semibold">
              03 — The Philosophy
            </div>
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-normal text-white hover:text-accent transition-colors duration-500">
              Immersive <br/>Experiences.
            </h2>
            <p className="text-xl md:text-2xl text-white/60 leading-relaxed mb-10 font-light">
              Break out of the 2D grid. Interactive storytelling creates memory and drives conversion. Minimum clicks. Maximum impact.
            </p>
          </div>
          
          <div className="gsap-parallax mt-12 w-fit ml-auto">
            <button className="awwwards-btn z-[1] px-10 py-5 border border-white/20 text-white font-bold uppercase tracking-widest text-sm rounded-full backdrop-blur-md cursor-pointer">
              View Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA / Footer */}
      <section id="contact" className="min-h-screen flex items-center justify-center px-6 md:px-24 py-24 relative overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none z-0"></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto pointer-events-auto stagger-fade-up grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">
          
          {/* Left Side: Copy */}
          <div className="text-left">
            <h2 className="text-6xl md:text-8xl font-bold mb-6 tracking-normal text-white">Let's <br/>Build.</h2>
            <p className="text-xl md:text-2xl text-white/50 mb-8 font-light leading-relaxed">
              Fourteen days. One outcome. Zero excuses.<br/>Send us a message and we'll get back to you within 24 hours.
            </p>
          </div>

          {/* Right Side: Glass Form */}
          <div className="glass-card p-8 md:p-10 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
            {/* Subtle glow behind form */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

            <form className="flex flex-col gap-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-2">
                 <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Name</label>
                 <input 
                   type="text" 
                   className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/10 transition-colors" 
                   placeholder="John Doe" 
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Email</label>
                   <input 
                     type="email" 
                     className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/10 transition-colors" 
                     placeholder="john@example.com" 
                   />
                </div>
                <div className="flex flex-col gap-2">
                   <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Phone</label>
                   <input 
                     type="tel" 
                     className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/10 transition-colors" 
                     placeholder="+1 (555) 000-0000" 
                   />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                 <label className="text-xs uppercase tracking-widest text-white/50 font-semibold">Message</label>
                 <textarea 
                   rows="4" 
                   className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/10 transition-colors resize-none" 
                   placeholder="Tell us about your project..."
                 ></textarea>
              </div>
              
              <button className="awwwards-btn w-full py-4 mt-2 border border-white/20 text-white font-bold uppercase tracking-widest text-sm rounded-lg backdrop-blur-md cursor-pointer text-center">
                 Send Message
              </button>
            </form>
          </div>

        </div>
      </section>

      <footer className="py-8 text-center text-white/30 text-xs tracking-widest uppercase border-t border-white/5 bg-black/50 backdrop-blur-lg pointer-events-auto">
        <p>© 2026 Difyuno. Engineered for the future.</p>
      </footer>
    </div>
  );
}