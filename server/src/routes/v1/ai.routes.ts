import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { aiLimiter } from '../../middleware/rateLimiter';
import { AIController } from '../../controllers/ai.controller';
import {
  tutorChatSchema,
  summarizeSchema,
  quizExplainSchema,
  assignmentFeedbackSchema,
} from '../../validations/ai.validation';

const router = Router();

// Every AI route requires an authenticated user.
router.use(authenticate);

router.get('/status', AIController.status);
router.get('/recommendations', AIController.recommendations);

// Generation endpoints are rate-limited (hosted providers are billed per call).
router.post('/tutor', aiLimiter, validate(tutorChatSchema), AIController.tutor);
router.post('/summarize', aiLimiter, validate(summarizeSchema), AIController.summarize);
router.post('/quiz-explain', aiLimiter, validate(quizExplainSchema), AIController.quizExplain);
router.post(
  '/assignment-feedback',
  aiLimiter,
  validate(assignmentFeedbackSchema),
  AIController.assignmentFeedback,
);

// Conversation history.
router.get('/conversations', AIController.listConversations);
router.get('/conversations/:id', AIController.getConversation);
router.delete('/conversations/:id', AIController.deleteConversation);

export default router;
