import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { runFactCheck } from '../services/factcheck';
const router = Router();

router.post('/', authenticateJWT, async (req, res, next) => {
  try {
    const { claim, audio } = req.body;
    // If audio is present, transcribe it:
    let claimText = claim;
    if (audio) {
      const { transcribeAudio } = await import('../services/speech');
      claimText = await transcribeAudio(audio); // expects base64 or buffer
    }
    const result = await runFactCheck(claimText);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export { router as factCheckRouter };