interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqCompletionRequest {
  messages: GroqMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
}

interface GroqCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY)
}

export async function createGroqChatCompletion({
  messages,
  model = process.env.GROQ_MODEL || DEFAULT_MODEL,
  temperature = 0.3,
  maxTokens = 1800,
}: GroqCompletionRequest): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  const data = (await response.json()) as GroqCompletionResponse

  if (!response.ok) {
    const errorMessage = data?.error?.message || `Groq request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Groq returned an empty completion')
  }

  return content
}
