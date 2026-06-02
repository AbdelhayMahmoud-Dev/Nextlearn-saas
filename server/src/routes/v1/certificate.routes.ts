import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { CertificateController } from '../../controllers/certificate.controller';
import { generateCertificateSchema } from '../../validations/certificate.validation';

const router = Router();

// Public verification — must be declared before the authenticate guard.
router.get('/verify/:number', CertificateController.verify);

router.use(authenticate);
router.post('/generate', validate(generateCertificateSchema), CertificateController.generate);
router.get('/my', CertificateController.my);

export default router;
