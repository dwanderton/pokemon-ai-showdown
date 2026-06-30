import { generateObject } from 'ai';
import { z } from 'zod';
import { readFileSync } from 'node:fs';

const b64 = readFileSync(new URL('./test-frame.png', import.meta.url)).toString('base64');
const frame = `data:image/png;base64,${b64}`;

const schema = z.object({ screenType: z.string(), description: z.string() });
const models = ['anthropic/claude-sonnet-5', 'anthropic/claude-opus-4.8', 'openai/gpt-4o'];

for (const model of models) {
  const start = Date.now();
  try {
    const result = await generateObject({
      model, schema, maxOutputTokens: 300,
      messages: [
        { role: 'system', content: 'Identify the Pokemon game screen.' },
        { role: 'user', content: [{ type: 'text', text: 'What is this screen?' }, { type: 'image', image: frame }] },
      ],
    });
    console.log(`OK    ${model}  (${Date.now() - start}ms)  ${result.object.screenType}`);
  } catch (err) {
    console.log(`FAIL  ${model}  (${Date.now() - start}ms)  ${err?.name}: ${String(err?.message).slice(0, 200)}`);
  }
}
