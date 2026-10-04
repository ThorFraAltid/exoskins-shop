/**
 * Copy of the About page (/about/).
 *
 * DRAFT, written from the brief, not by Simon. There is no Figma design and no
 * text from Simon for this page. Every statement is limited to what the brief
 * states about eXo: the grip tape skin, the four hero labels (precision cut,
 * nano thin, sweatproof, adds grip), the four compatible mice, sales through
 * Amazon, and new skins dropping over time. No biography, dates, numbers or
 * customer claims have been added. The first-person parts and the quote are
 * written in Simon's voice: Simon must approve or rewrite them before launch.
 */

export const ABOUT_TITLE = 'About eXo';

export const ABOUT_DESCRIPTION =
  'Why eXo exists: grip tape skins that take the skins from games like Counter-Strike onto the gaming mouse in your hand.';

/** Opening statement, one entry per line (each line eases in on its own). */
export const ABOUT_STATEMENT = ['Skins from the game.', 'On the mouse in your hand.'];

export const STORY_HEADING = 'The story';

export interface StoryBlock {
  heading: string;
  paragraphs: string[];
}

/** Founder story in Simon's voice: why, what, how. */
export const STORY: StoryBlock[] = [
  {
    heading: 'Why',
    paragraphs: [
      'In games like Counter-Strike, the skins in your inventory are something you care about. Then you look down at the desk, and the mouse that does all the work is a boring piece of plastic.',
      'I started eXo to close that gap: to take digital culture from the game out into the real world.',
    ],
  },
  {
    heading: 'What',
    paragraphs: [
      'An eXo skin is a fine grip tape you put on your gaming mouse. It turns the plastic into something that looks like a real skin from the game.',
      'It fits the Logitech Super Light 1 and 2 and the Razer DeathAdder V3 Pro and V4 Pro. You buy it on Amazon, and new skins drop over time.',
    ],
  },
  {
    heading: 'How',
    paragraphs: [
      'Every skin is precision cut for the mouse it is made for. It is nano thin and sweatproof, and it adds grip.',
    ],
  },
];

/** Founder block: no photo exists, so the block is type only. */
export const FOUNDER = {
  name: 'Simon',
  role: 'Founder',
  quote: 'I wanted the mouse in my hand to look like the skins I care about in the game.',
} as const;

export const VALUES_HEADING = 'What we stand for';

/**
 * The four hero labels (public/media/usp/*.svg, the same files as the Home
 * hero), in hero order. `alt` is the plain name; the SVG shows the label as
 * the hero does (e.g. "/grip_add_aim").
 */
export interface Value {
  id: 'grip' | 'sweatproof' | 'cut' | 'thin';
  alt: string;
  text: string;
}

export const VALUES: Value[] = [
  {
    id: 'grip',
    alt: 'Adds grip',
    text: 'It is grip tape first: it adds grip where your fingers hold the mouse.',
  },
  {
    id: 'sweatproof',
    alt: 'Sweatproof',
    text: 'Hands get warm in a close round. The skin is sweatproof.',
  },
  {
    id: 'cut',
    alt: 'Precision cut',
    text: 'Each skin is precision cut for one mouse, so it follows that shape.',
  },
  {
    id: 'thin',
    alt: 'Nano thin',
    text: 'Nano thin: you get the look of the skin on your mouse, not a thick layer.',
  },
];

export const CLOSING = {
  heading: 'Find your skin',
  text: 'Pick a skin from the inventory, or leave your email and hear about the next drop first.',
  primary: { label: 'Go to skins', href: '/#inventory' },
  secondary: { label: 'Get notified here', href: '#subscribe' },
} as const;
