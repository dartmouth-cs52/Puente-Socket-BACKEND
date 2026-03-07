import { randomUUID } from 'node:crypto';
import prisma from './db.js';

const DEFAULT_SCRIPTS = [
  {
    scriptId: 101,
    title: 'Family Introductions',
    topic: 'Introductions',
    objective: 'Practice greetings and introducing family members.',
    lines: [
      {
        lineNumber: 1,
        speaker: 'Parent',
        text: 'Hi, I am Rosa. This is my daughter, Lucia.',
        translation: 'Hola, soy Rosa. Esta es mi hija, Lucia.',
      },
      {
        lineNumber: 2,
        speaker: 'Child',
        text: 'Nice to meet you. I speak English and Spanish.',
        translation: 'Mucho gusto. Yo hablo ingles y espanol.',
      },
      {
        lineNumber: 3,
        speaker: 'Parent',
        text: 'We are practicing together at home.',
        translation: 'Estamos practicando juntos en casa.',
      },
      {
        lineNumber: 4,
        speaker: 'Child',
        text: 'Yes, learning together is fun.',
        translation: 'Si, aprender juntos es divertido.',
      },
    ],
  },
  {
    scriptId: 102,
    title: 'Ordering Food',
    topic: 'Ordering Food',
    objective: 'Practice simple restaurant ordering phrases.',
    lines: [
      {
        lineNumber: 1,
        speaker: 'Server',
        text: 'Hi, what would you like to order?',
        translation: 'Hola, que te gustaria pedir?',
      },
      {
        lineNumber: 2,
        speaker: 'Parent',
        text: 'I would like two tacos and a water, please.',
        translation: 'Me gustaria dos tacos y un agua, por favor.',
      },
      {
        lineNumber: 3,
        speaker: 'Child',
        text: 'Can I have a small juice?',
        translation: 'Puedo tomar un jugo pequeno?',
      },
      {
        lineNumber: 4,
        speaker: 'Server',
        text: 'Of course. Your order will be ready soon.',
        translation: 'Claro. Su orden estara lista pronto.',
      },
    ],
  },
];

let didSeedDefaultScripts = false;
const MAX_CO_LEARNING_PARTICIPANTS = 2;

const sessionInclude = {
  participants: {
    orderBy: { joinedAt: 'asc' },
  },
};

const sessionWithScriptInclude = {
  ...sessionInclude,
  script: {
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  },
};

export class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeString(value, fallback) {
  const next = String(value ?? '').trim();
  return next || fallback;
}

function requireSessionReference(sessionReference) {
  const normalized = normalizeString(sessionReference, '');
  if (!normalized) {
    throw new ApiError(400, 'MISSING_SESSION_REFERENCE', 'sessionId or roomCode is required.');
  }
  return normalized;
}

function parseScriptId(scriptId) {
  const raw = normalizeString(scriptId, '');
  const numericId = Number.parseInt(raw, 10);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new ApiError(400, 'INVALID_SCRIPT_ID', 'scriptId must be a positive integer.');
  }
  return numericId;
}

function mapScriptLine(line) {
  return {
    lineId: line.lineId,
    lineNumber: line.lineNumber,
    speaker: line.speaker,
    text: line.text,
    translation: line.translation,
    pronunciationHint: line.pronunciationHint,
  };
}

function mapScriptLesson(script, includeLines = true) {
  const payload = {
    scriptId: script.scriptId,
    title: script.title,
    topic: script.topic,
    objective: script.objective,
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
  };

  if (includeLines) {
    payload.lines = (script.lines || []).map(mapScriptLine);
  }

  if (typeof script._count?.lines === 'number') {
    payload.lineCount = script._count.lines;
  }

  return payload;
}

function mapSessionParticipant(participant) {
  return {
    userId: participant.userId,
    displayName: participant.displayName,
    joinedAt: participant.joinedAt,
  };
}

function mapSession(session, includeScript = false) {
  const payload = {
    sessionId: session.sessionId,
    roomCode: session.roomCode,
    topic: session.topic,
    status: session.status,
    scriptId: session.scriptId,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    participants: (session.participants || []).map(mapSessionParticipant),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };

  if (includeScript && session.script) {
    payload.script = mapScriptLesson(session.script, true);
  }

  return payload;
}

async function ensureDefaultScripts() {
  if (didSeedDefaultScripts) {
    return;
  }

  for (const script of DEFAULT_SCRIPTS) {
    await prisma.coLearningScriptLesson.upsert({
      where: { scriptId: script.scriptId },
      update: {
        title: script.title,
        topic: script.topic,
        objective: script.objective,
      },
      create: {
        scriptId: script.scriptId,
        title: script.title,
        topic: script.topic,
        objective: script.objective,
      },
    });

    for (const line of script.lines) {
      await prisma.coLearningScriptLine.upsert({
        where: {
          scriptId_lineNumber: {
            scriptId: script.scriptId,
            lineNumber: line.lineNumber,
          },
        },
        update: {
          speaker: line.speaker,
          text: line.text,
          translation: line.translation ?? null,
          pronunciationHint: line.pronunciationHint ?? null,
        },
        create: {
          scriptId: script.scriptId,
          lineNumber: line.lineNumber,
          speaker: line.speaker,
          text: line.text,
          translation: line.translation ?? null,
          pronunciationHint: line.pronunciationHint ?? null,
        },
      });
    }
  }

  didSeedDefaultScripts = true;
}

async function findScriptForTopic(topic) {
  const normalizedTopic = normalizeString(topic, '');
  if (normalizedTopic) {
    const byTopic = await prisma.coLearningScriptLesson.findFirst({
      where: {
        OR: [
          { topic: { contains: normalizedTopic, mode: 'insensitive' } },
          { title: { contains: normalizedTopic, mode: 'insensitive' } },
        ],
      },
      orderBy: { title: 'asc' },
    });
    if (byTopic) return byTopic;
  }

  return prisma.coLearningScriptLesson.findFirst({
    orderBy: { title: 'asc' },
  });
}

function nextRandomRoomCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

async function generateUniqueSessionIdentity() {
  for (let attempts = 0; attempts < 25; attempts += 1) {
    const roomCode = nextRandomRoomCode();
    const sessionId = `cl_${roomCode}`;

    const existing = await prisma.coLearningSession.findFirst({
      where: {
        OR: [{ sessionId }, { roomCode }],
      },
      select: { sessionId: true },
    });

    if (!existing) {
      return { sessionId, roomCode };
    }
  }

  throw new ApiError(500, 'SESSION_CODE_GENERATION_FAILED', 'Could not allocate a unique room code.');
}

async function requireSessionRecord(sessionReference, includeScript = false) {
  const include = includeScript ? sessionWithScriptInclude : sessionInclude;
  const normalizedReference = requireSessionReference(sessionReference);

  let session = await prisma.coLearningSession.findUnique({
    where: { sessionId: normalizedReference },
    include,
  });

  if (!session) {
    session = await prisma.coLearningSession.findUnique({
      where: { roomCode: normalizedReference },
      include,
    });
  }

  if (!session) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', `Session ${normalizedReference} was not found.`);
  }

  return session;
}

export function formatError(error) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details || {},
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Unexpected server error.',
        details: {},
      },
    },
  };
}

export async function listScriptLessons() {
  await ensureDefaultScripts();

  const scripts = await prisma.coLearningScriptLesson.findMany({
    include: {
      _count: {
        select: {
          lines: true,
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  return scripts.map((script) => mapScriptLesson(script, false));
}

export async function getScriptLessonById(scriptId) {
  await ensureDefaultScripts();

  const normalizedScriptId = parseScriptId(scriptId);

  const script = await prisma.coLearningScriptLesson.findUnique({
    where: { scriptId: normalizedScriptId },
    include: {
      lines: {
        orderBy: { lineNumber: 'asc' },
      },
    },
  });

  if (!script) {
    throw new ApiError(404, 'SCRIPT_NOT_FOUND', `Script ${normalizedScriptId} was not found.`);
  }

  return mapScriptLesson(script, true);
}

export async function createCoLearningSession(payload = {}) {
  await ensureDefaultScripts();

  const topic = normalizeString(payload.topic, 'Family Language Practice');
  const hasScriptId =
    payload.scriptId !== undefined &&
    payload.scriptId !== null &&
    String(payload.scriptId).trim() !== '';
  let scriptId = hasScriptId ? parseScriptId(payload.scriptId) : null;

  if (scriptId !== null) {
    const script = await prisma.coLearningScriptLesson.findUnique({ where: { scriptId } });
    if (!script) {
      throw new ApiError(400, 'SCRIPT_NOT_FOUND', `Script ${scriptId} was not found.`);
    }
  } else {
    const script = await findScriptForTopic(topic);
    scriptId = script?.scriptId || null;
  }

  const { sessionId, roomCode } = await generateUniqueSessionIdentity();

  const session = await prisma.coLearningSession.create({
    data: {
      sessionId,
      roomCode,
      topic,
      status: 'waiting',
      scriptId,
    },
    include: sessionInclude,
  });

  return mapSession(session, false);
}

export async function getCoLearningSession(sessionId, includeScript = false) {
  const session = await requireSessionRecord(sessionId, includeScript);
  return mapSession(session, includeScript);
}

export async function joinCoLearningSession(payload = {}) {
  const sessionId = normalizeString(payload.sessionId, '');
  const roomCode = normalizeString(payload.roomCode, '');
  const displayName = normalizeString(payload.displayName, '');
  const userId = normalizeString(payload.userId, '');

  if (!sessionId && !roomCode) {
    throw new ApiError(400, 'MISSING_SESSION_REFERENCE', 'sessionId or roomCode is required.');
  }

  const session = sessionId
    ? await prisma.coLearningSession.findUnique({ where: { sessionId }, include: sessionInclude })
    : await prisma.coLearningSession.findUnique({ where: { roomCode }, include: sessionInclude });

  if (!session) {
    throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session was not found.');
  }

  if (session.status === 'completed') {
    throw new ApiError(409, 'SESSION_ALREADY_COMPLETED', 'Session is already completed.');
  }

  if (session.status === 'active') {
    throw new ApiError(409, 'SESSION_ALREADY_ACTIVE', 'Session has already started.');
  }

  const normalizedUserId = userId || `u_${randomUUID().slice(0, 8)}`;
  const existingParticipant = session.participants.find(
    (participant) => participant.userId === normalizedUserId,
  );

  if (!existingParticipant && session.participants.length >= MAX_CO_LEARNING_PARTICIPANTS) {
    throw new ApiError(409, 'SESSION_FULL', 'Session already has the maximum number of participants.', {
      maxParticipants: MAX_CO_LEARNING_PARTICIPANTS,
    });
  }

  const normalizedDisplayName =
    displayName || existingParticipant?.displayName || `Player ${session.participants.length + 1}`;

  await prisma.coLearningParticipant.upsert({
    where: {
      sessionId_userId: {
        sessionId: session.sessionId,
        userId: normalizedUserId,
      },
    },
    update: {
      displayName: normalizedDisplayName,
    },
    create: {
      sessionId: session.sessionId,
      userId: normalizedUserId,
      displayName: normalizedDisplayName,
    },
  });

  const refreshedSession = await requireSessionRecord(session.sessionId, false);
  return mapSession(refreshedSession, false);
}

export async function getSessionScript(sessionId) {
  await ensureDefaultScripts();
  let session = await requireSessionRecord(sessionId, true);

  if (!session.scriptId) {
    const matchedScript = await findScriptForTopic(session.topic);
    if (!matchedScript) {
      throw new ApiError(404, 'SCRIPT_NOT_FOUND', 'No co-learning scripts are available.');
    }

    session = await prisma.coLearningSession.update({
      where: { sessionId: session.sessionId },
      data: { scriptId: matchedScript.scriptId },
      include: sessionWithScriptInclude,
    });
  }

  if (!session.script) {
    throw new ApiError(404, 'SCRIPT_NOT_FOUND', 'Session script was not found.');
  }

  return {
    sessionId: session.sessionId,
    roomCode: session.roomCode,
    status: session.status,
    script: mapScriptLesson(session.script, true),
  };
}
