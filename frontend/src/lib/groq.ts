export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const DEFAULT_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'llama3-8b-8192',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
]

export async function askGroq(
  messages: GroqMessage[],
  apiKey: string,
): Promise<string> {
  const key = apiKey || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)

  if (!key) {
    throw new Error('Groq API Key is missing. Please provide your Groq API Key.')
  }

  let lastErrorMsg = ''

  for (const model of DEFAULT_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const reply = data.choices?.[0]?.message?.content
        if (reply) return reply
      } else {
        const errorData = await res.json().catch(() => ({}))
        lastErrorMsg = errorData?.error?.message || res.statusText || 'Groq API request failed.'
        if (res.status === 401) {
          throw new Error(`Invalid Groq API Key: ${lastErrorMsg}`)
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid Groq API Key')) throw err
      lastErrorMsg = err.message
    }
  }

  throw new Error(`Groq API Error: ${lastErrorMsg}`)
}
