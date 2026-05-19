import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const playbook = defineCollection({
  loader: glob({ base: './src/content/playbook', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    summary: z.string(),
    icon: z.string(),
    color: z
      .enum(['cyan', 'magenta', 'amber', 'green'])
      .default('cyan'),
    order: z.number().default(999),
    category: z.string().optional(),
    related: z.array(z.string()).optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        }),
      )
      .optional(),
  }),
});

export const collections = { playbook };
