import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Skins catalog (PLAN.md finding 1 and 12, "Product mapping").
 * One JSON file per skin in src/content/skins/, file name = skin id ("0003").
 * Where a skin is shown (card variant, tagline) lives in src/data/placements.ts.
 * Image paths in the JSON are relative to the JSON file.
 */
const publicMedia = z
  .string()
  .regex(/^\/media\/.+/, 'must be a path under public/media, starting with /media/');

/**
 * Where a gallery image sits in its box (main view or thumbnail), as Figma
 * places it: 'cover', or the image box in percent of the outer box
 * (x/y = left/top offset, w/h = size; the image is stretched to that box,
 * exactly like the Figma crop).
 */
const placement = z.union([
  z.literal('cover'),
  z.object({ x: z.number(), y: z.number(), w: z.number().positive(), h: z.number().positive() }),
]);

const skins = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/skins' }),
  schema: ({ image }) =>
    z.object({
      /** Skin name from PLAN.md "Product mapping"; used in alt text and titles. */
      name: z.string().min(1),
      /** Image on the 405x303 cards. */
      card: z.discriminatedUnion('kind', [
        /** Optimized image from src/assets (rendered with astro:assets). */
        z.object({ kind: z.literal('image'), src: image() }),
        /** Still frame under public/media (video poster), used as is. */
        z.object({
          kind: z.literal('poster'),
          src: publicMedia,
          width: z.number().int().positive(),
          height: z.number().int().positive(),
        }),
      ]),
      /** Optional live effect drawn over the card image, limited to the mask area. */
      effect: z
        .object({ kind: z.literal('lightning'), mask: publicMedia })
        .optional(),
      /**
       * Product page gallery. Media order: the video (optional) first, then the
       * images. One thumbnail per media item; a video's thumbnail is its poster.
       */
      gallery: z
        .object({
          video: z
            .object({
              src: publicMedia,
              poster: publicMedia,
              width: z.number().int().positive(),
              height: z.number().int().positive(),
            })
            .optional(),
          images: z.array(
            z.object({
              /** Image shown in the main view. */
              src: image(),
              /** Different still for the thumbnail (Figma Item: thumb 1 shows another view). */
              thumb: image().optional(),
              /** Placement in the main view; default: ProductGallery DEFAULT_MAIN. */
              main: placement.optional(),
              /** Placement in the thumbnail; default: ProductGallery DEFAULT_THUMB. */
              thumbPlacement: placement.optional(),
              /** Mask (skin area) for the skin's `effect` on this image in the main view. */
              fxMask: publicMedia.optional(),
            }),
          ),
        })
        .refine((g) => g.video !== undefined || g.images.length > 0, {
          message: 'gallery needs a video or at least one image',
        }),
      /** Spec lines from the Figma Item frame. Only skins with verified specs have them. */
      specs: z
        .object({
          condition: z.string().min(1),
          patternTemplate: z.string().min(1),
          wearRating: z.string().min(1),
        })
        .optional(),
      /** "Buy now" target. AMAZON_STORE_URL until Simon supplies listing URLs. */
      amazonUrl: z.url(),
    }),
});

/**
 * Testimonials, verbatim from Figma node 901:681, in Figma order (left to right).
 * `placeholder: true` marks template copy (e.g. "John Smith", "Navn Navnesen")
 * that `bun run check:launch` reports.
 */
const testimonials = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/testimonials' }),
  schema: z.object({
    order: z.number().int().nonnegative(),
    quote: z.string().min(1),
    name: z.string().min(1),
    role: z.string().min(1),
    placeholder: z.boolean(),
  }),
});

export const collections = { skins, testimonials };
