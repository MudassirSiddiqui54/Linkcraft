
import { z } from 'zod';

const safeHttpUrl = z
  .string()
  .trim()
  .min(1, 'Destination URL is required.')
  .max(2048, 'URL is too long.')
  .url('Enter a valid URL including https://')
  .refine((value) => {
    try {
      const url = new URL(value);

      return (
        ['http:', 'https:'].includes(url.protocol) &&
        Boolean(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, 'Only valid HTTP and HTTPS destinations are allowed.');

const alias = z
  .string()
  .trim()
  .min(4, 'Alias must be at least 4 characters.')
  .max(40, 'Alias must be 40 characters or fewer.')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Alias may contain letters, numbers, hyphens and underscores only.'
  );

const expiry = z
  .union([
    z.string().datetime({ offset: true }),
    z.literal(''),
    z.null(),
  ])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === '' || value === null) return null;

    return new Date(value);
  })
  .refine(
    (value) => value == null || value.getTime() > Date.now(),
    'Expiry must be in the future.'
  );

export const createLinkSchema = z.object({
  destination: safeHttpUrl,
  alias: alias.optional().or(z.literal('')),
  title: z.string().trim().max(100).optional().default(''),
  expiresAt: expiry,
});

export const updateLinkSchema = z
  .object({
    destination: safeHttpUrl.optional(),
    title: z.string().trim().max(100).optional(),
    expiresAt: expiry,
    enabled: z.boolean().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'Provide at least one field to update.'
  );

export function normalizeDestination(value) {
  return new URL(value).toString();
}
