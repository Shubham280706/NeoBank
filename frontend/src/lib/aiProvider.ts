export type AIProvider = 'groq' | 'gemini' | 'openrouter'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function askAI(
  messages: AIMessage[],
  provider: AIProvider,
  apiKey: string,
): Promise<string> {
  const key = apiKey.trim()
  if (!key) {
    throw new Error(`API key for ${provider.toUpperCase()} is missing. Please click the 🔑 key icon to set your key.`)
  }

  if (provider === 'gemini') {
    return askGemini(messages, key)
  }

  if (provider === 'openrouter') {
    return askOpenRouter(messages, key)
  }

  return askGroq(messages, key)
}

// ---------- 1. Google Gemini API ----------
async function askGemini(messages: AIMessage[], apiKey: string): Promise<string> {
  const systemMsg = messages.find((m) => m.role === 'system')?.content || ''
  const chatMsgs = messages.filter((m) => m.role !== 'system')

  const contents = [
    ...(systemMsg ? [{ role: 'user', parts: [{ text: `[SYSTEM CONTEXT]:\n${systemMsg}` }] }] : []),
    ...chatMsgs.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ]

  const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
  let lastErr = ''

  for (const model of modelsToTry) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents }),
        },
      )

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text
      } else {
        const errorData = await res.json().catch(() => ({}))
        lastErr = errorData?.error?.message || res.statusText
        if (res.status === 400 && lastErr.includes('API_KEY_INVALID')) {
          throw new Error('Invalid Gemini API Key. Please get a free key from aistudio.google.com')
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid Gemini API Key')) throw err
      lastErr = err.message
    }
  }

  throw new Error(`Gemini API Error: ${lastErr}`)
}

// ---------- 2. OpenRouter API ----------
async function askOpenRouter(messages: AIMessage[], apiKey: string): Promise<string> {
  const modelsToTry = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-r1:free',
    'qwen/qwen-2.5-72b-instruct:free',
  ]

  let lastErr = ''

  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NeoBank AI',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) return text
      } else {
        const errorData = await res.json().catch(() => ({}))
        lastErr = errorData?.error?.message || res.statusText
      }
    } catch (err: any) {
      lastErr = err.message
    }
  }

  throw new Error(`OpenRouter API Error: ${lastErr}`)
}

// ---------- 3. Groq API ----------
async function askGroq(messages: AIMessage[], apiKey: string): Promise<string> {
  const modelsToTry = ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'gemma2-9b-it']
  let lastErr = ''

  for (const model of modelsToTry) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
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
        lastErr = errorData?.error?.message || res.statusText
        if (res.status === 401) {
          throw new Error('Invalid Groq API Key. Please get a free key from console.groq.com')
        }
      }
    } catch (err: any) {
      if (err.message.includes('Invalid Groq API Key')) throw err
      lastErr = err.message
    }
  }

  throw new Error(`Groq API Error: ${lastErr}`)
}
