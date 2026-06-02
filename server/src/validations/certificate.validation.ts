import { z } from 'zod';

export const generateCertificateSchema = z.object({
  body: z.object({
    courseId: z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid course id'),
  }),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>['body'];
