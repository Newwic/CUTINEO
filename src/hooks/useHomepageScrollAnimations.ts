import { useLayoutEffect, type RefObject } from 'react';
import { gsap, prefersReducedMotion, registerScrollTrigger, ScrollTrigger } from '../animation/gsapScroll';

type RevealDirection = 'up' | 'left' | 'right' | 'scale';

function selectAll<T extends Element>(root: Element, selector: string) {
  return Array.from(root.querySelectorAll<T>(selector));
}

function revealFrom(direction: RevealDirection) {
  if (direction === 'left') return { x: -48, y: 0, scale: 1 };
  if (direction === 'right') return { x: 48, y: 0, scale: 1 };
  if (direction === 'scale') return { x: 0, y: 20, scale: .92 };
  return { x: 0, y: 48, scale: 1 };
}

function formatCounter(value: number, element: HTMLElement) {
  const decimals = Number(element.dataset.counterDecimals ?? 0);
  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString('en-US');
  return `${formatted}${element.dataset.counterSuffix ?? ''}`;
}

export function useHomepageScrollAnimations(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    if (prefersReducedMotion()) {
      root.classList.add('motion-reduced');
      const progress = root.querySelector<HTMLElement>('[data-scroll-progress] > span');
      if (progress) progress.style.transform = 'scaleX(1)';
      return () => root.classList.remove('motion-reduced');
    }

    registerScrollTrigger();
    root.classList.add('motion-gsap-ready');

    const context = gsap.context(() => {
      const progress = root.querySelector<HTMLElement>('[data-scroll-progress] > span');
      if (progress) {
        gsap.set(progress, { scaleX: 0, transformOrigin: 'left center' });
        ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: (self) => {
            gsap.set(progress, { scaleX: self.progress });
            progress.parentElement?.setAttribute('aria-valuenow', String(Math.round(self.progress * 100)));
          },
        });
      }

      const pageHeaderLogo = root.querySelector<HTMLElement>('[data-hero-logo]');
      const hero = root.querySelector<HTMLElement>('[data-scroll-hero]');
      const heroVisual = root.querySelector<HTMLElement>('[data-hero-item="visual"]');
      const heroCopy = root.querySelector<HTMLElement>('[data-hero-copy]');
      const heroBadge = root.querySelector<HTMLElement>('[data-hero-item="badge"]');
      const heroHeadline = hero?.querySelector<HTMLElement>('h1');
      const heroSubtitle = hero?.querySelector<HTMLElement>('[class*="heroLead"]');
      const heroCta = hero?.querySelector<HTMLElement>('[class*="heroActions"]');
      const heroTrust = hero?.querySelector<HTMLElement>('[class*="trustRow"]');

      const introTargets = [heroBadge, heroHeadline, heroSubtitle, heroCta, heroTrust, heroVisual].filter((element): element is HTMLElement => Boolean(element));
      if (pageHeaderLogo) gsap.set(pageHeaderLogo, { autoAlpha: 0, y: -10 });
      gsap.set(introTargets, { autoAlpha: 0 });

      const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: .08 });
      if (pageHeaderLogo) intro.to(pageHeaderLogo, { autoAlpha: 1, y: 0, duration: .5 });
      if (heroBadge) intro.fromTo(heroBadge, { y: 18 }, { autoAlpha: 1, y: 0, duration: .55 }, '-=.18');
      if (heroHeadline) intro.fromTo(heroHeadline, { y: 38 }, { autoAlpha: 1, y: 0, duration: .72 }, '-=.28');
      if (heroSubtitle) intro.fromTo(heroSubtitle, { y: 24 }, { autoAlpha: 1, y: 0, duration: .6 }, '-=.4');
      if (heroCta) intro.fromTo(heroCta, { y: 18, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: .55 }, '-=.34');
      if (heroTrust) intro.fromTo(heroTrust, { y: 12 }, { autoAlpha: 1, y: 0, duration: .45 }, '-=.32');
      if (heroVisual) intro.fromTo(heroVisual, { y: 48, scale: .92, rotateX: 6, transformPerspective: 1000 }, { autoAlpha: 1, y: 0, scale: 1, rotateX: 0, duration: .95 }, '-=.16');

      if (hero && heroVisual) {
        gsap.to(heroVisual, {
          yPercent: -4,
          scale: 1.035,
          rotateX: 0,
          transformPerspective: 1000,
          immediateRender: false,
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 },
        });
      }

      if (hero && heroCopy) {
        gsap.to(heroCopy, {
          yPercent: -3,
          autoAlpha: .78,
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .8 },
        });
      }

      selectAll<HTMLElement>(root, '[data-parallax]').forEach((element) => {
        const amount = Number(element.dataset.parallax ?? 12);
        const trigger = element.closest<HTMLElement>('[data-scroll-section], section') ?? hero ?? element;
        gsap.to(element, {
          yPercent: -amount,
          scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: 1.1 },
        });
      });

      if (hero && window.matchMedia('(min-width: 1024px)').matches) {
        const hub = hero.querySelector<HTMLElement>('[data-channel-hub]');
        const channels = selectAll<HTMLElement>(hero, '[data-channel-orbit]');
        if (hub && channels.length) {
          const hubRect = hub.getBoundingClientRect();
          const hubX = hubRect.left + hubRect.width / 2;
          const hubY = hubRect.top + hubRect.height / 2;
          channels.forEach((channel, index) => {
            const rect = channel.getBoundingClientRect();
            const multiplier = .48 + (index % 3) * .06;
            gsap.to(channel, {
              x: (hubX - (rect.left + rect.width / 2)) * multiplier,
              y: (hubY - (rect.top + rect.height / 2)) * multiplier,
              scale: .76,
              opacity: .3,
              ease: 'none',
              scrollTrigger: { trigger: hero, start: 'top top', end: '+=620', scrub: 1 },
            });
          });
        }
      }

      selectAll<HTMLElement>(root, '[data-scroll-reveal]').forEach((element) => {
        const direction = (element.dataset.scrollReveal as RevealDirection | undefined) ?? 'up';
        gsap.fromTo(element, {
          autoAlpha: 0,
          ...revealFrom(direction),
        }, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: .78,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%', toggleActions: 'play none none reverse' },
        });
      });

      selectAll<HTMLElement>(root, '[data-scroll-stagger]').forEach((group) => {
        const children = Array.from(group.children) as HTMLElement[];
        children.forEach((child, index) => gsap.set(child, {
          autoAlpha: 0,
          x: index % 2 === 0 ? 24 : -24,
          y: index % 3 === 0 ? 0 : 24,
        }));
        gsap.to(children, {
          autoAlpha: 1,
          x: 0,
          y: 0,
          duration: .62,
          stagger: .09,
          ease: 'power3.out',
          scrollTrigger: { trigger: group, start: 'top 84%', toggleActions: 'play none none reverse' },
        });
      });

      selectAll<HTMLElement>(root, '[data-text-reveal], [class*="sectionHeading"] h2, [class*="finalCtaInner"] h2').forEach((element) => {
        gsap.fromTo(element, { autoAlpha: 0, y: 22, clipPath: 'inset(100% 0 0 0)' }, {
          autoAlpha: 1,
          y: 0,
          clipPath: 'inset(0% 0 0 0)',
          duration: .9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 84%', toggleActions: 'play none none reverse' },
        });
      });

      selectAll<HTMLElement>(root, '[data-image-reveal], [class*="finalOrb"]').forEach((element) => {
        gsap.fromTo(element, { autoAlpha: 0, scale: .94, y: 28 }, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: .9,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 86%', toggleActions: 'play none none reverse' },
        });
      });

      const chatSection = root.querySelector<HTMLElement>('[data-chat-animation]');
      if (chatSection) {
        gsap.fromTo(selectAll<HTMLElement>(chatSection, '[data-chat-bubble]'), { autoAlpha: 0, y: 20 }, {
          autoAlpha: 1,
          y: 0,
          duration: .52,
          stagger: .22,
          ease: 'power3.out',
          scrollTrigger: { trigger: chatSection, start: 'top 82%', toggleActions: 'play none none reverse' },
        });
      }

      const story = root.querySelector<HTMLElement>('[data-sticky-demo]');
      if (story) {
        const stage = story.querySelector<HTMLElement>('[data-story-stage]');
        const portalGlows = selectAll<HTMLElement>(story, '[data-story-parallax]');
        if (stage) {
          gsap.fromTo(stage, { scale: 1.025, filter: 'saturate(.82)' }, {
            scale: 1,
            filter: 'saturate(1)',
            ease: 'none',
            scrollTrigger: { trigger: story, start: 'top 90%', end: 'top 32%', scrub: .8 },
          });
        }
        portalGlows.forEach((glow, index) => {
          gsap.to(glow, {
            yPercent: index % 2 ? -12 : 10,
            xPercent: index % 2 ? 6 : -5,
            scrollTrigger: { trigger: story, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
          });
        });
      }

      selectAll<HTMLElement>(root, '[data-counter]').forEach((element) => {
        const target = Number(element.dataset.counterValue ?? 0);
        const state = { value: 0 };
        ScrollTrigger.create({
          trigger: element,
          start: 'top 88%',
          once: true,
          onEnter: () => gsap.to(state, {
            value: target,
            duration: 1.25,
            ease: 'power2.out',
            onUpdate: () => { element.textContent = formatCounter(state.value, element); },
            onComplete: () => { element.textContent = formatCounter(target, element); },
          }),
        });
      });

      const finalCta = root.querySelector<HTMLElement>('[data-scroll-cta], [class*="finalCtaInner"]');
      if (finalCta) {
        gsap.fromTo(finalCta, { autoAlpha: 0, scale: .92, y: 34 }, {
          autoAlpha: 1,
          scale: 1,
          y: 0,
          duration: .95,
          ease: 'power3.out',
          scrollTrigger: { trigger: finalCta, start: 'top 85%', toggleActions: 'play none none reverse' },
        });
      }
    }, root);

    const refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      root.classList.remove('motion-gsap-ready');
      context.revert();
    };
  }, [rootRef]);
}
