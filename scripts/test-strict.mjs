import { generateObject } from 'ai';
import { z } from 'zod';

const cases = {
  'number-min-max': z.object({ x: z.number().min(0).max(1) }),
  'array-min-max': z.object({ x: z.array(z.string()).max(5) }),
  'nullable-required': z.object({ a: z.string(), b: z.string().nullable() }),
  'enum-nullable': z.object({ m: z.enum(['none', 'a', 'b']).nullable() }),
};

for (const [name, schema] of Object.entries(cases)) {
  try {
    const r = await generateObject({
      model: 'openai/gpt-4o', schema, maxOutputTokens: 200,
      messages: [{ role: 'user', content: 'Return a valid example object.' }],
    });
    console.log(`OK    ${name}  ${JSON.stringify(r.object)}`);
  } catch (err) {
    console.log(`FAIL  ${name}  ${String(err?.message).slice(0, 160)}`);
  }
}
