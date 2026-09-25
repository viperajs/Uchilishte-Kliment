'use client';

import { useEffect } from 'react';

const revealTargets = [
  '.quick-links > a',
  '.mission-picture',
  '.mission-copy',
  '.section-heading',
  '.admission-grid > a',
  '.news-card',
  '.stem-feature',
  '.timeline-controls',
  '.timeline-detail',
  '.history-stats > div',
  '.story-item',
  '.history-cta',
  '.home-milestones > a',
].join(', ');

export default function ScrollAnimations() {
  useEffect(() => {
    const main = document.getElementById('main');
    if (!main || !('IntersectionObserver' in window)) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const revealed = new WeakSet<Element>();
    const animations = new Map<Element, Animation>();
    let observer: IntersectionObserver | undefined;

    function stop() {
      observer?.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }

    function start() {
      stop();
      if (preference.matches) return;

      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target;
          observer?.unobserve(target);
          revealed.add(target);
          if (target.contains(document.activeElement)) continue;

          const siblings = Array.from(target.parentElement?.children ?? []);
          const staggered = target.matches('.quick-links > a, .admission-grid > a, .news-card, .history-stats > div, .home-milestones > a');
          const delay = staggered ? Math.min(siblings.indexOf(target), 3) * 75 : 0;
          const animation = target.animate([
            { opacity: 0, transform: 'translateY(24px)' },
            { opacity: 1, transform: 'translateY(0)' },
          ], { duration: 650, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
          animations.set(target, animation);
          animation.onfinish = () => animations.delete(target);
        }
      }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

      main?.querySelectorAll(revealTargets).forEach(target => {
        // Keep the initial viewport and restored scroll positions immediately readable.
        if (target.getBoundingClientRect().top < window.innerHeight) revealed.add(target);
        if (!revealed.has(target)) observer?.observe(target);
      });
    }

    function revealFocused(event: FocusEvent) {
      for (const [target, animation] of animations) {
        if (event.target instanceof Node && target.contains(event.target)) {
          animation.cancel();
          animations.delete(target);
        }
      }
    }

    start();
    preference.addEventListener('change', start);
    main.addEventListener('focusin', revealFocused);
    return () => {
      stop();
      preference.removeEventListener('change', start);
      main.removeEventListener('focusin', revealFocused);
    };
  }, []);

  return null;
}
