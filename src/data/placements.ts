/**
 * Where skins are shown (PLAN.md "Product mapping", finding 1).
 * The catalog lives in the `skins` content collection; these lists only say
 * which card goes in which Figma slot. Taglines are verbatim from each slot.
 * A "\n" in a tagline is an explicit Figma line break.
 */

export type CardVariant = 'black' | 'light';

/** 405x303 skin card (SkinCard.astro). */
export interface SkinSlot {
  kind: 'skin';
  /** Figma node id of the slot (data-figma). */
  figma: string;
  variant: CardVariant;
  tagline: string;
  /** Skin id ("0001"), matches a file in src/content/skins/. */
  skin: string;
}

/** Green "Dropping soon" crate card, 405x303 (CrateCard.astro). Links to #subscribe. */
export interface CrateSlot {
  kind: 'crate';
  figma: string;
}

/**
 * "Dropping Soon" image cards built by the Home page: skull (wide, 1232x359)
 * and dragon (large, 822x633). The CTA links to #subscribe.
 */
export interface DropSlot {
  kind: 'drop';
  figma: string;
  size: 'wide' | 'large';
  /** One label pill per entry. */
  heading: string[];
  text: string;
  cta: string;
}

export type HomeSlot = SkinSlot | CrateSlot | DropSlot;

const KNIFE = 'Keep your mouse sharp as a knife';
const drop = (figma: string, size: DropSlot['size']): DropSlot => ({
  kind: 'drop',
  figma,
  size,
  heading: ['Dropping', 'Soon'],
  text: 'Lorem ipsum',
  cta: 'Get notified here',
});

/** Home "Inventory" grid, Figma order. Card label: "/FD" + skin id. */
export const HOME_LABEL_PREFIX = '/FD';

export const homeGrid: HomeSlot[] = [
  { kind: 'skin', figma: '901:468', variant: 'black', tagline: KNIFE, skin: '0004' },
  {
    kind: 'skin',
    figma: '5036:733',
    variant: 'light',
    tagline: 'Make it shine\nlike a gem',
    skin: '0005',
  },
  { kind: 'crate', figma: '5036:748' },
  drop('5081:787', 'wide'),
  { kind: 'skin', figma: '5081:800', variant: 'light', tagline: KNIFE, skin: '0003' },
  { kind: 'crate', figma: '5081:807' },
  { kind: 'skin', figma: '5081:793', variant: 'black', tagline: KNIFE, skin: '0002' },
  { kind: 'skin', figma: '5036:1177', variant: 'black', tagline: KNIFE, skin: '0001' },
  drop('5036:863', 'large'),
  // 5 skins, 6 skin slots: repeats until skin 6 exists (PLAN.md).
  { kind: 'skin', figma: '5081:837', variant: 'light', tagline: KNIFE, skin: '0004' },
];

/** "You Might Also Like" (Item frame), Figma order. Card label: "/" + skin id. */
export const ALSO_LIKE_LABEL_PREFIX = '/';

/** Skin slots without a skin: filled with the other skins by `fillAlsoLike`. */
export type AlsoLikeSlot = Omit<SkinSlot, 'skin'> | CrateSlot;

export const alsoLike: AlsoLikeSlot[] = [
  { kind: 'skin', figma: '5190:1536', variant: 'black', tagline: KNIFE },
  { kind: 'skin', figma: '5190:1550', variant: 'light', tagline: KNIFE },
  { kind: 'crate', figma: '5190:1578' },
  { kind: 'skin', figma: '7036:796', variant: 'light', tagline: KNIFE },
  { kind: 'crate', figma: '7036:803' },
  { kind: 'skin', figma: '7036:789', variant: 'black', tagline: KNIFE },
];

/**
 * Fills the "You Might Also Like" skin slots with the skins other than
 * `currentId`, in id order. Throws when there are fewer other skins than
 * skin slots, so a missing skin is a build error, not an empty card.
 */
export function fillAlsoLike(
  currentId: string,
  allSkinIds: readonly string[],
): Array<SkinSlot | CrateSlot> {
  const others = [...allSkinIds].filter((id) => id !== currentId).sort();
  const needed = alsoLike.filter((s) => s.kind === 'skin').length;
  if (others.length < needed) {
    throw new Error(
      `fillAlsoLike: ${needed} skin slots but only ${others.length} other skins for ${currentId}`,
    );
  }
  let next = 0;
  return alsoLike.map((slot) =>
    slot.kind === 'crate' ? slot : { ...slot, skin: others[next++] as string },
  );
}
