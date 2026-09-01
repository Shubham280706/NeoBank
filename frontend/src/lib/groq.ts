export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function askGroq(
  messages: GroqMessage[],
  apiKey: string,
  model = 'llama-3.3-70b-versatile',
): Promise<string> {
  const key = apiKey || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)

  if (!key) {
    throw new Error('Groq API Key is missing. Please provide your Groq API Key.')
  }

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

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const msg = errorData?.error?.message || res.statusText || 'Failed to communicate with Groq API.'
    throw new Error(`Groq API Error: ${msg}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response generated.'
}
