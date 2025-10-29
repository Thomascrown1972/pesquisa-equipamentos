import Anthropic from "@anthropic-ai/sdk";

/**
 * Type definitions for LLM messages and responses
 */
export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type Message = {
  role: Role;
  content: string | Array<ImageContent | TextContent | FileContent>;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoice =
  | "none"
  | "auto"
  | "required"
  | { type: "function"; function: { name: string } };

export type JsonSchema = {
  name: string;
  strict?: boolean;
  schema: Record<string, unknown>;
};

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

const ensureArray = (
  content: string | Array<ImageContent | TextContent | FileContent>
): Array<ImageContent | TextContent | FileContent> => {
  if (typeof content === "string") {
    return [{ type: "text", text: content }];
  }
  return content;
};

/**
 * Invoke LLM with messages and optional tools
 */
export async function invokeLLM({
  messages,
  tools,
  tool_choice,
  response_format,
  max_tokens = 4096,
  temperature = 1.0,
}: {
  messages: Message[];
  tools?: Tool[];
  tool_choice?: ToolChoice;
  response_format?: ResponseFormat;
  max_tokens?: number;
  temperature?: number;
}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY não está configurada nas variáveis de ambiente");
  }

  // Convert messages to Anthropic format
  const anthropicMessages: Anthropic.MessageParam[] = [];
  let systemMessage: string | undefined;

  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessage = typeof msg.content === "string" ? msg.content : (msg.content[0] && 'text' in msg.content[0] ? msg.content[0].text : "");
    } else if (msg.role === "user" || msg.role === "assistant") {
      const content = ensureArray(msg.content);
      anthropicMessages.push({
        role: msg.role,
        content: content.map((c) => {
          if (c.type === "text") {
            return { type: "text", text: c.text };
          } else if (c.type === "image_url") {
            return {
              type: "image" as const,
              source: {
                type: "url" as const,
                url: c.image_url.url,
              },
            };
          }
          return { type: "text", text: "" };
        }),
      });
    }
  }

  // Handle JSON schema response format
  if (response_format?.type === "json_schema") {
    const schema = response_format.json_schema;
    const jsonInstruction = `\n\nResponda APENAS com um objeto JSON válido que siga este schema:\n${JSON.stringify(schema.schema, null, 2)}`;
    
    if (systemMessage) {
      systemMessage += jsonInstruction;
    } else {
      systemMessage = jsonInstruction;
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens,
      temperature,
      system: systemMessage,
      messages: anthropicMessages,
    });

    // Convert response to OpenAI-like format
    const textContent = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as Anthropic.TextBlock).text)
      .join("");

    return {
      choices: [
        {
          message: {
            role: "assistant",
            content: textContent,
          },
          finish_reason: response.stop_reason,
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("[LLM] Error:", error);
    throw error;
  }
}
