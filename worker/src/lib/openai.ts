const MAX_RETRIES = 3;
const BASE_DELAY = 500;

export async function callOpenAI(
  apiKey: string,
  messages: { role: string; content: string }[],
  options: { temperature?: number; response_format?: object } = {},
): Promise<string | null> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages,
          response_format: options.response_format || { type: 'json_object' },
          temperature: options.temperature ?? 0.3,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const status = response.status;
        if ((status === 429 || status >= 500) && attempt < MAX_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, BASE_DELAY * Math.pow(2, attempt)));
          continue;
        }
        return null;
      }

      const result = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return result.choices?.[0]?.message?.content || null;
    } catch {
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, BASE_DELAY * Math.pow(2, attempt)));
        continue;
      }
      return null;
    }
  }
  return null;
}
