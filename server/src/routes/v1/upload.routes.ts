import { Router } from 'express';
import { z } from 'zod';
import { UploadController } from '../../controllers/upload.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireRole } from '../../middleware/requireRole';
import { validate } from '../../middleware/validate';

const signSchema = z.object({
  body: z.object({
    mimeType: z.string().min(1),
    fileSize: z.number().positive(),
    filename: z.string().min(1).max(255),
  }),
});

const deleteSchema = z.object({
  body: z.object({
    publicId: z.string().min(1),
    resourceType: z.enum(['video', 'image', 'raw']).default('image'),
  }),
});

const router = Router();

router.use(authenticate, requireRole('instructor', 'admin', 'superadmin'));

router.post('/sign-video', validate(signSchema), UploadController.signVideo);
router.post('/sign-image', validate(signSchema), UploadController.signImage);
router.post('/sign-document', validate(signSchema), UploadController.signDocument);
router.delete('/delete', validate(deleteSchema), UploadController.deleteAsset);

export default router;
