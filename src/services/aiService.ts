import OpenAI from "openai";

let openAiClient: OpenAI | null = null;

export function getOpenAIClient() {
  if (!openAiClient) {
    const key = process.env.OPENAI_API_KEY;
    if (key && key.trim().length > 0) {
      openAiClient = new OpenAI({
        apiKey: key,
      });
    }
  }
  return openAiClient;
}

export async function generateAIInsights(prompt: string): Promise<any> {
  const client = getOpenAIClient();
  if (!client) return null;

  const aiPromise = client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "insights_schema",
        schema: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Allowed values: 'positive', 'warning', 'suggestion'."
                  },
                  title: {
                    type: "string",
                    description: "Short catchy heading for the insight (5-8 words)."
                  },
                  content: {
                    type: "string",
                    description: "Detailed description of the insight, recommendation or analysis (20-45 words)."
                  }
                },
                required: ["type", "title", "content"],
                additionalProperties: false
              }
            }
          },
          required: ["insights"],
          additionalProperties: false
        },
        strict: true
      }
    }
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("OpenAI API call timed out after 7000ms"));
    }, 7000);
  });

  const aiRes = await Promise.race([aiPromise, timeoutPromise]);
  return aiRes;
}
