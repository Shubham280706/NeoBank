export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Active supported Groq models (deprecated models removed)
const ACTIVE_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it',
]

export async function askGroq(
  messages: GroqMessage[],
  apiKey: string,
): Promise<string> {
  const key = apiKey || (import.meta.env.VITE_GROQ_API_KEY as string | undefined)

  if (!key || !key.trim()) {
    throw new Error('Groq API Key is missing. Please click the 🔑 key icon at the top right to enter your Groq API Key.')
  }

  let lastErrorMsg = ''

  for (const model of ACTIVE_MODELS) {
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
      }

      const errorData = await res.json().catch(() => ({}))
      const msg = errorData?.error?.message || res.statusText || 'Groq API request failed.'
      lastErrorMsg = msg

      if (res.status === 401 || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('unauthorized')) {
        throw new Error(`Invalid Groq API Key. Please click the 🔑 key icon to update your key.\nDetails: ${msg}`)
      }

      // If it's a model deprecation/not-found error, try the next active model in the loop
      if (msg.includes('decommissioned') || msg.includes('does not exist')) {
        continue
      }
    } catch (err: any) {
      if (err.message.includes('Invalid Groq API Key')) throw err
      lastErrorMsg = err.message
    }
  }

  throw new Error(`Groq API Error: ${lastErrorMsg}`)
}
