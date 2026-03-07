-- CreateEnum
CREATE TYPE "CoLearningSessionStatus" AS ENUM ('waiting', 'active', 'completed');

-- CreateTable
CREATE TABLE "CoLearningScriptLesson" (
    "scriptId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "objective" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoLearningScriptLesson_pkey" PRIMARY KEY ("scriptId")
);

-- CreateTable
CREATE TABLE "CoLearningScriptLine" (
    "lineId" TEXT NOT NULL,
    "scriptId" INTEGER NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT,
    "pronunciationHint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoLearningScriptLine_pkey" PRIMARY KEY ("lineId")
);

-- CreateTable
CREATE TABLE "CoLearningSession" (
    "sessionId" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "CoLearningSessionStatus" NOT NULL DEFAULT 'waiting',
    "scriptId" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoLearningSession_pkey" PRIMARY KEY ("sessionId")
);

-- CreateTable
CREATE TABLE "CoLearningParticipant" (
    "participantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoLearningParticipant_pkey" PRIMARY KEY ("participantId")
);

-- CreateTable
CREATE TABLE "CoLearningTurn" (
    "turnId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "inputLanguage" TEXT NOT NULL,
    "feedbackScore" DOUBLE PRECISION,
    "feedbackNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoLearningTurn_pkey" PRIMARY KEY ("turnId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoLearningScriptLine_scriptId_lineNumber_key" ON "CoLearningScriptLine"("scriptId", "lineNumber");

-- CreateIndex
CREATE INDEX "CoLearningScriptLine_scriptId_lineNumber_idx" ON "CoLearningScriptLine"("scriptId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CoLearningSession_roomCode_key" ON "CoLearningSession"("roomCode");

-- CreateIndex
CREATE UNIQUE INDEX "CoLearningParticipant_sessionId_userId_key" ON "CoLearningParticipant"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "CoLearningParticipant_sessionId_idx" ON "CoLearningParticipant"("sessionId");

-- CreateIndex
CREATE INDEX "CoLearningTurn_sessionId_createdAt_idx" ON "CoLearningTurn"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoLearningScriptLine" ADD CONSTRAINT "CoLearningScriptLine_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "CoLearningScriptLesson"("scriptId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoLearningSession" ADD CONSTRAINT "CoLearningSession_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "CoLearningScriptLesson"("scriptId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoLearningParticipant" ADD CONSTRAINT "CoLearningParticipant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoLearningSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoLearningTurn" ADD CONSTRAINT "CoLearningTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CoLearningSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;
