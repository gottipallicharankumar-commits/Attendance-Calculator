"use client";
import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef(null as HTMLDivElement | null);
  const ringRef = useRef(null as HTMLDivElement | null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
    };

    const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.35);
      ringY = lerp(ringY, mouseY, 0.35);
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      raf = requestAnimationFrame(animate);
    };

    const onEnterInteractive = () => {
      dot.classList.add('cursor-active');
      ring.classList.add('cursor-active-ring');
    };
    const onLeaveInteractive = () => {
      dot.classList.remove('cursor-active');
      ring.classList.remove('cursor-active-ring');
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseenter', onMove);
    raf = requestAnimationFrame(animate);

    // hover states for interactive elements
    const interactives = Array.from(document.querySelectorAll('a,button,input,textarea,select,label')) as HTMLElement[];
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnterInteractive);
      el.addEventListener('mouseleave', onLeaveInteractive);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseenter', onMove);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterInteractive);
        el.removeEventListener('mouseleave', onLeaveInteractive);
      });
    };
  }, []);

  return (
    <>
      <div ref={dotRef} id="cursor-dot" className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-50 w-3 h-3 rounded-full transition-all duration-200 shadow-lg" />
      <div ref={ringRef} id="cursor-ring" className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 z-40 w-8 h-8 rounded-full border border-black/30 transition-all duration-200" />
    </>
  );
}
