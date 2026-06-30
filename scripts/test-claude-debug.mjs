import { generateObject } from 'ai';
import { z } from 'zod';
import { readFileSync } from 'node:fs';

const frame = `data:image/png;base64,${readFileSync(new URL('./test-frame.png', import.meta.url)).toString('base64')}`;

const confidenceScoresSchema = z.object({
  A: z.number().min(0).max(1), B: z.number().min(0).max(1), START: z.number().min(0).max(1),
  SELECT: z.number().min(0).max(1), UP: z.number().min(0).max(1), DOWN: z.number().min(0).max(1),
  LEFT: z.number().min(0).max(1), RIGHT: z.number().min(0).max(1), L: z.number().min(0).max(1),
  R: z.number().min(0).max(1), WAIT: z.number().min(0).max(1),
});
const decisionSchema = z.object({
  screenAnalysis: z.string(), reasoning: z.string(), personality_comment: z.string().nullable(),
  buttonSequence: z.array(confidenceScoresSchema).min(1), progressConfidence: z.number().min(0).max(1),
  notes: z.object({
    currentObjective: z.string().nullable(), lastKnownLocation: z.string().nullable(), exitFound: z.string().nullable(),
    stuckMode: z.enum(['none', 'perimeter_scan', 'wall_hug', 'backtrack']).nullable(),
    failedAttempts: z.array(z.string()).max(5).nullable(), importantDiscovery: z.string().nullable(), general: z.string().nullable(),
  }).nullable(),
});
const gameStateSchema = z.object({
  currentArea: z.string().nullable(), inBattle: z.boolean().nullable(), inMenu: z.boolean().nullable(),
  inDialogue: z.boolean().nullable(), inTextEntry: z.boolean().nullable(), pokemonCount: z.number().nullable(),
  badges: z.number().nullable(),
  screenType: z.enum(['overworld', 'battle', 'menu', 'dialogue', 'textEntry', 'transition', 'unknown']).nullable(),
  estimatedPartyHP: z.number().min(0).max(100).nullable(),
});

try {
  const result = await generateObject({
    model: 'anthropic/claude-sonnet-5',
    schema: z.object({ gameState: gameStateSchema, decision: decisionSchema }),
    maxOutputTokens: 6000,
    messages: [
      { role: 'system', content: 'You are an AI playing Pokemon LeafGreen. You MUST return BOTH a top-level `gameState` object (currentArea, inBattle, inMenu, inDialogue, inTextEntry, pokemonCount, badges, screenType, estimatedPartyHP) AND a `decision` object. Never omit gameState.' },
      { role: 'user', content: [{ type: 'text', text: 'Analyze the current screen and provide your full structured decision, including the gameState object.' }, { type: 'image', image: frame }] },
    ],
  });
  console.log('OK', JSON.stringify(result.object).slice(0, 300));
} catch (err) {
  console.log('NAME:', err?.name);
  console.log('TEXT:', String(err?.text).slice(0, 2000));
  console.log('CAUSE:', String(err?.cause?.message ?? err?.cause).slice(0, 1000));
}
