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

// Flattened: gameState fields live alongside decision fields in ONE object.
const flatSchema = z.object({
  // game state
  currentArea: z.string().nullable(),
  inBattle: z.boolean().nullable(),
  inMenu: z.boolean().nullable(),
  inDialogue: z.boolean().nullable(),
  inTextEntry: z.boolean().nullable(),
  pokemonCount: z.number().nullable(),
  badges: z.number().nullable(),
  screenType: z.enum(['overworld', 'battle', 'menu', 'dialogue', 'textEntry', 'transition', 'unknown']).nullable(),
  estimatedPartyHP: z.number().min(0).max(100).nullable(),
  // decision
  screenAnalysis: z.string(),
  reasoning: z.string(),
  personality_comment: z.string().nullable(),
  buttonSequence: z.array(confidenceScoresSchema).min(1),
  progressConfidence: z.number().min(0).max(1),
  notes: z.object({
    currentObjective: z.string().nullable(), lastKnownLocation: z.string().nullable(), exitFound: z.string().nullable(),
    stuckMode: z.enum(['none', 'perimeter_scan', 'wall_hug', 'backtrack']).nullable(),
    failedAttempts: z.array(z.string()).max(5).nullable(), importantDiscovery: z.string().nullable(), general: z.string().nullable(),
  }).nullable(),
});

const models = ['openai/gpt-4o', 'openai/gpt-5', 'anthropic/claude-sonnet-5', 'anthropic/claude-opus-4.8', 'google/gemini-3-pro-preview', 'xai/grok-4.3'];

for (const model of models) {
  const start = Date.now();
  try {
    const result = await generateObject({
      model, schema: flatSchema, maxOutputTokens: 6000,
      messages: [
        { role: 'system', content: 'You are an AI playing Pokemon LeafGreen. Analyze the screen and return all fields.' },
        { role: 'user', content: [{ type: 'text', text: 'Analyze the current screen and provide your full structured decision.' }, { type: 'image', image: frame }] },
      ],
    });
    const o = result.object;
    console.log(`OK    ${model}  (${Date.now() - start}ms)  area=${o.currentArea} screenType=${o.screenType} btn=${Object.entries(o.buttonSequence[0]).sort((a,b)=>b[1]-a[1])[0][0]}`);
  } catch (err) {
    console.log(`FAIL  ${model}  (${Date.now() - start}ms)  ${String(err?.message).slice(0, 120)}`);
  }
}
