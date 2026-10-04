import type { ImageMetadata } from 'astro';
import xplLogo from '../assets/partners/xpl.png';

/**
 * Site-wide content. Every value here is verbatim from the Figma file
 * (R3y0iSFbggXv7vRS4b3I4M) or a decision recorded in PLAN.md.
 */

export const SITE_NAME = 'eXo';
export const SITE_TITLE = 'eXoskins.shop';
export const SITE_DESCRIPTION =
  'Get your skin for your favorite mouse right here. More are dropping soon.';

/**
 * Amazon store. PLAN.md decisions 1 and 2: every "Buy now" and the
 * "Shopping basket" button point here until Simon supplies listing URLs.
 * `bun run check:launch` fails while a skin still uses this value.
 */
export const AMAZON_STORE_URL = 'https://www.amazon.com/';

/**
 * Newsletter endpoint (PLAN.md finding 6). Empty: the subscribe form opens a
 * prefilled mail to CONTACT.email. When set, the form POSTs `email` here.
 */
export const NEWSLETTER_ENDPOINT = '';

/**
 * A link that exists in the design but has no destination yet.
 * `pending: true` links render as designed, without href, and are listed
 * by `bun run check:launch` (PLAN.md finding 5).
 */
export type SiteLink =
  | { label: string; pending: true; href?: undefined; external?: undefined }
  | { label: string; pending?: false; href: string; external?: boolean };

/** Paths are passed through `url()` by the components that render them. */
export const NAV_ITEMS: SiteLink[] = [
  { label: 'About eXo', href: '/about/' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Go to skins', href: '/#inventory' },
];

export const BASKET_LINK: SiteLink = {
  label: 'Shopping basket',
  href: AMAZON_STORE_URL,
  external: true,
};

export const PRIVACY_LINK: SiteLink = { label: 'Privacy Policy', href: '/privacy/' };

export const LINKEDIN_LINK: SiteLink = { label: 'LinkedIn', pending: true };

/** Anchor of the footer subscribe form (crate "See more", "Get notified here"). */
export const SUBSCRIBE_ANCHOR = '/#subscribe';

/** Footer "Contact us:" block (Figma 901:772). */
export const CONTACT = {
  email: 'hi@exoskins.shop',
  phone: '+45 6061 6041',
  /** E.164 form for the tel: link */
  phoneHref: '+4560616041',
  addressLines: ['Glimvej 17', '2650 Hvidovre', 'Denmark'],
} as const;

export const COPYRIGHT = '© 2026 eXo. All Rights Reserved.';

/**
 * "Compatible with" list (Figma Item 5205:984). PLAN.md: shown on every skin
 * page from this one site-level list.
 */
export const COMPATIBLE_WITH = [
  'Logitech Super Light 1',
  'Logitech Super Light 2',
  'Razer DeathAdder V3 Pro',
  'Razer DeathAdder V4 Pro',
] as const;

/**
 * Partner logos (Figma "Logotypes" 901:459), in Figma order. The row repeats
 * the two logos three times; only the first of each is meaningful, the rest
 * are decorative (`decorative: true` -> render with aria-hidden, alt="").
 */
export type PartnerLogo = {
  name: string;
  width: number;
  height: number;
  decorative: boolean;
} & (
  | { kind: 'svg'; src: string } // public path, pass through url()
  | { kind: 'image'; src: ImageMetadata } // render with astro:assets <Image>
);

const amazon = {
  name: 'Amazon',
  kind: 'svg',
  src: '/media/partners/amazon.svg',
  width: 146,
  height: 44,
} as const;
const xpl = { name: 'XPL', kind: 'image', src: xplLogo, width: 123, height: 45 } as const;

export const PARTNER_LOGOS: PartnerLogo[] = [
  { ...amazon, decorative: false },
  { ...xpl, decorative: false },
  { ...amazon, decorative: true },
  { ...xpl, decorative: true },
  { ...amazon, decorative: true },
  { ...xpl, decorative: true },
];
