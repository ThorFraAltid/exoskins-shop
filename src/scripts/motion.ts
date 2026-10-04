/**
 * Page motion: scroll reveal, floating card images, typewriter id labels.
 * Runs only when the visitor allows motion; otherwise the page stays static.
 * The styles live in src/styles/global.css under "Motion".
 */
const motionAllowed = window.matchMedia('(prefers-reduced-motion: no-preference)');

/** Labels that are typed out: "/FD0005", "/0003". */
const ID_LABEL = /^\/[A-Z]*\d+$/;
const TYPE_INTERVAL_MS = 85;
const TYPE_START_DELAY_MS = 350;
const REVEAL_STAGGER_MS = 90;

function prepareTypewriter(pill: HTMLElement) {
  const text = (pill.textContent ?? '').trim();
  // Screen readers get the whole label once; the typed characters are visual only.
  const full = document.createElement('span');
  full.className = 'visually-hidden';
  full.textContent = text;
  pill.dataset.typewriter = '';
  pill.replaceChildren(
    full,
    ...[...text].map((char) => {
      const span = document.createElement('span');
      span.className = 'tw-char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = char;
      return span;
    }),
  );
}

function type(pill: HTMLElement) {
  const chars = [...pill.querySelectorAll<HTMLElement>('.tw-char')];
  let i = 0;
  pill.classList.add('is-typing');
  const step = () => {
    chars[i - 1]?.classList.remove('is-caret');
    if (i === chars.length) {
      pill.classList.remove('is-typing');
      return;
    }
    chars[i]!.classList.add('is-typed', 'is-caret');
    i += 1;
    window.setTimeout(step, TYPE_INTERVAL_MS);
  };
  window.setTimeout(step, TYPE_START_DELAY_MS);
}

function start() {
  document.documentElement.classList.add('motion');

  // Reveal targets: every Figma section and card, except elements that hold the
  // mobile menu (a moving ancestor would displace its fixed panel).
  const revealTargets = [...document.querySelectorAll<HTMLElement>('[data-figma]')].filter(
    (el) => !el.querySelector('[data-menu]') && !el.closest('header'),
  );
  for (const el of revealTargets) el.dataset.reveal = '';

  const revealObserver = new IntersectionObserver(
    (entries) => {
      const entering = entries.filter((e) => e.isIntersecting);
      entering.forEach((entry, i) => {
        const el = entry.target as HTMLElement;
        el.style.setProperty('--reveal-delay', `${i * REVEAL_STAGGER_MS}ms`);
        el.classList.add('is-revealed');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.12 },
  );
  for (const el of revealTargets) revealObserver.observe(el);

  // Float: offset each image so the cards do not move in step.
  document
    .querySelectorAll<HTMLElement>('.skin-card__mouse, .crate-card__ill img')
    .forEach((el, i) => el.style.setProperty('--float-delay', `${-((i * 1.3) % 5.5)}s`));

  // Typewriter on id labels.
  const pills = [...document.querySelectorAll<HTMLElement>('.hl__pill')].filter((pill) =>
    ID_LABEL.test((pill.textContent ?? '').trim()),
  );
  const typeObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        type(entry.target as HTMLElement);
        typeObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  for (const pill of pills) {
    prepareTypewriter(pill);
    typeObserver.observe(pill);
  }
}

if (motionAllowed.matches) start();
