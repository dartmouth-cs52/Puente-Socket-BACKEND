import { Router } from 'express';
import {
  createCoLearningSession,
  formatError,
  getCoLearningSession,
  getScriptLessonById,
  getSessionScript,
  joinCoLearningSession,
  listScriptLessons,
} from './coLearningService.js';

const router = Router();

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

router.get('/', (_req, res) => {
  res.json({ message: 'welcome to (new) puente api!' });
});

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Puente API' });
});

router.get(
  '/api/co-learning/scripts',
  asyncHandler(async (_req, res) => {
    const scripts = await listScriptLessons();
    res.json(scripts);
  }),
);

router.get(
  '/api/co-learning/scripts/:scriptId',
  asyncHandler(async (req, res) => {
    const script = await getScriptLessonById(req.params.scriptId);
    res.json(script);
  }),
);

router.post(
  '/api/co-learning/sessions',
  asyncHandler(async (req, res) => {
    const session = await createCoLearningSession(req.body || {});
    res.status(201).json(session);
  }),
);

router.get(
  '/api/co-learning/sessions/:sessionId',
  asyncHandler(async (req, res) => {
    const session = await getCoLearningSession(req.params.sessionId, false);
    res.json(session);
  }),
);

router.post(
  '/api/co-learning/sessions/:sessionId/join',
  asyncHandler(async (req, res) => {
    const session = await joinCoLearningSession({
      sessionId: req.params.sessionId,
      ...(req.body || {}),
    });
    res.json(session);
  }),
);

router.post(
  '/api/co-learning/sessions/join',
  asyncHandler(async (req, res) => {
    const session = await joinCoLearningSession(req.body || {});
    res.json(session);
  }),
);

// Frontend compatibility route used by join-game-code flow.
router.post(
  '/api/lobbies/join',
  asyncHandler(async (req, res) => {
    const gameCode = String(req.body?.gameCode || '').trim();
    const displayName = String(req.body?.displayName || '').trim();

    const session = await joinCoLearningSession({
      roomCode: gameCode,
      displayName,
    });

    const players = (session.participants || []).map((participant) => ({
      userId: participant.userId,
      displayName: participant.displayName,
    }));

    res.json({
      gameType: 'co-learning',
      roomId: session.sessionId,
      sessionId: session.sessionId,
      roomCode: session.roomCode,
      gameCode: session.roomCode,
      maxPlayers: 2,
      status: session.status,
      participants: session.participants,
      players,
    });
  }),
);

router.get(
  '/api/co-learning/sessions/:sessionId/script',
  asyncHandler(async (req, res) => {
    const payload = await getSessionScript(req.params.sessionId);
    res.json(payload);
  }),
);

// Compatibility aliases for earlier scaffold route names.
router.get(
  '/api/dialogues',
  asyncHandler(async (_req, res) => {
    const scripts = await listScriptLessons();
    const dialogueSummaries = scripts.map((script) => ({
      id: script.scriptId,
      title: script.title,
      topic: script.topic,
      lineCount: script.lineCount || 0,
    }));
    res.json(dialogueSummaries);
  }),
);

router.get(
  '/api/dialogues/:scriptId',
  asyncHandler(async (req, res) => {
    const script = await getScriptLessonById(req.params.scriptId);
    res.json(script);
  }),
);

router.use((err, _req, res, _next) => {
  const formatted = formatError(err);
  res.status(formatted.status).json(formatted.body);
});

export default router;
