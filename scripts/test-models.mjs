import { generateObject } from 'ai';
import { z } from 'zod';

const models = [
  'openai/gpt-4o',
  'anthropic/claude-sonnet-5',
  'anthropic/claude-opus-4.8',
  'openai/gpt-5',
  'google/gemini-3-pro-preview',
  'xai/grok-4.3',
];

const schema = z.object({
  button: z.enum(['A', 'B', 'UP', 'DOWN', 'LEFT', 'RIGHT', 'WAIT']),
  reasoning: z.string(),
});

for (const model of models) {
  const start = Date.now();
  try {
    const result = await generateObject({
      model,
      schema,
      maxOutputTokens: 1000,
      messages: [
        { role: 'system', content: 'You are playing Pokemon. Pick a button.' },
        { role: 'user', content: 'You are at the title screen. What button do you press?' },
      ],
    });
    console.log(`OK    ${model}  (${Date.now() - start}ms)  button=${result.object.button}  tokens=${result.usage?.totalTokens}`);
  } catch (err) {
    console.log(`FAIL  ${model}  (${Date.now() - start}ms)  ${err?.name}: ${err?.message?.slice(0, 200)}`);
  }
}
