import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { accountsApi, budgetsApi, transactionsApi } from '@/lib/api'
import { askAI, type AIProvider, type AIMessage } from '@/lib/aiProvider'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  Bot,
  X,
  Send,
  Sparkles,
  Key,
  Loader2,
  ChevronDown,
  User,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

export function ChatbotWidget() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)

  const [provider, setProvider] = useState<AIProvider>(() => {
    return (localStorage.getItem('ai_provider') as AIProvider) || 'groq'
  })

  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('groq_api_key') || '')
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '')
  const [openrouterKey, setOpenrouterKey] = useState(() => localStorage.getItem('openrouter_api_key') || '')

  const [tempKey, setTempKey] = useState('')
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${profile?.first_name || 'there'}! 👋 I'm **NeoBot**, your AI Financial Assistant.\n\nI can analyze your balance, spending, budgets, and answer financial questions using **Groq**, **Google Gemini**, or **OpenRouter**!`,
    },
  ])

  const chatEndRef = useRef<HTMLDivElement>(null)

  // Fetch financial context
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list, enabled: open })
  const budgetsQuery = useQuery({ queryKey: ['budgets'], queryFn: budgetsApi.list, enabled: open })
  const transactionsQuery = useQuery({ queryKey: ['transactions', { pageSize: 5 }], queryFn: () => transactionsApi.list({ pageSize: 5 }), enabled: open })

  const accounts = accountsQuery.data || []
  const budgets = budgetsQuery.data || []
  const transactions = transactionsQuery.data?.data || []
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0)

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  const getActiveKey = (p = provider): string => {
    if (p === 'gemini') return geminiKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || ''
    if (p === 'openrouter') return openrouterKey || (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined) || ''
    return groqKey || (import.meta.env.VITE_GROQ_API_KEY as string | undefined) || ''
  }

  const saveKeySettings = (newProvider: AIProvider, newKey: string) => {
    setProvider(newProvider)
    localStorage.setItem('ai_provider', newProvider)

    if (newProvider === 'gemini') {
      localStorage.setItem('gemini_api_key', newKey.trim())
      setGeminiKey(newKey.trim())
    } else if (newProvider === 'openrouter') {
      localStorage.setItem('openrouter_api_key', newKey.trim())
      setOpenrouterKey(newKey.trim())
    } else {
      localStorage.setItem('groq_api_key', newKey.trim())
      setGroqKey(newKey.trim())
    }

    setShowKeyModal(false)
  }

  const buildSystemPrompt = (): string => {
    const contextData = {
      userName: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User',
      totalBalance,
      accounts: accounts.map((a) => ({
        number: a.account_number,
        type: a.account_type,
        balance: a.balance,
      })),
      budgets: budgets.map((b) => ({
        category: b.category,
        limit: b.amount,
        spent: b.spent || 0,
        percentUsed: b.percentUsed || 0,
      })),
      recentTransactions: transactions.map((t) => ({
        description: t.merchant || t.description || 'Transaction',
        amount: t.amount,
        type: t.type,
        category: t.category,
        date: t.created_at,
      })),
    }

    return `You are NeoBot, an expert AI Financial Advisor and Customer Assistant for NeoBank.
You have access to the user's real-time financial snapshot:
${JSON.stringify(contextData, null, 2)}

Instructions:
1. Answer questions about account balances, spending, budgets, transactions, or banking advice clearly and accurately.
2. Format monetary amounts in INR (₹).
3. Keep responses friendly, concise, professional, and well-formatted using markdown bullet points and bolding.
4. Never reveal confidential security tokens or internal database IDs.`
  }

  const handleSendMessage = async (textToSend?: string) => {
    const userText = (textToSend || inputMessage).trim()
    if (!userText || isLoading) return

    const activeKey = getActiveKey()
    if (!activeKey) {
      setTempKey('')
      setShowKeyModal(true)
      return
    }

    const userMsgId = `user-${Date.now()}`
    const updatedMessages = [...messages, { id: userMsgId, role: 'user' as const, content: userText }]
    setMessages(updatedMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      const aiMessages: AIMessage[] = [
        { role: 'system', content: buildSystemPrompt() },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ]

      const aiReply = await askAI(aiMessages, provider, activeKey)
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', content: aiReply },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Error**: ${err.message || 'Failed to communicate with AI provider.'}\n\nPlease click the 🔑 key icon at top right to check your API key.`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const presetPrompts = [
    '📊 Analyze my spending',
    '💳 What is my balance?',
    '🎬 Check Entertainment budget',
    '💡 Savings advice',
  ]

  const providerLabels: Record<AIProvider, { name: string; badge: string; link: string; placeholder: string }> = {
    groq: {
      name: 'Groq Cloud',
      badge: 'Groq ⚡',
      link: 'https://console.groq.com/keys',
      placeholder: 'gsk_...',
    },
    gemini: {
      name: 'Google Gemini',
      badge: 'Gemini ♊',
      link: 'https://aistudio.google.com/app/apikey',
      placeholder: 'AIzaSy...',
    },
    openrouter: {
      name: 'OpenRouter',
      badge: 'OpenRouter 🔀',
      link: 'https://openrouter.ai/keys',
      placeholder: 'sk-or-v1-...',
    },
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Open AI Assistant"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
          </span>
          {open ? <ChevronDown size={26} /> : <Sparkles size={26} className="animate-pulse" />}
        </button>
      </div>

      {/* Floating Chat Modal */}
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex h-[530px] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-2xl transition-all md:bottom-24 md:right-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                <Bot className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-white text-sm">NeoBot AI</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 border border-emerald-500/30">
                    {providerLabels[provider].badge}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80">Your Smart Banking Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setTempKey(getActiveKey())
                  setShowKeyModal(true)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white transition-all"
                title="Configure AI Provider & Keys"
              >
                <Key size={16} />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-indigo-200 hover:bg-white/20 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Key Configuration Banner Modal */}
          {showKeyModal ? (
            <div className="flex-1 p-5 flex flex-col justify-between overflow-y-auto bg-[var(--color-surface)] space-y-4">
              <div className="space-y-3">
                <div className="text-center space-y-1">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                    <Key size={20} />
                  </div>
                  <h4 className="font-bold text-[var(--color-text)] text-sm">Select AI Model & API Key</h4>
                  <p className="text-xs text-[var(--color-text-muted)]">Choose your provider and enter your free API key</p>
                </div>

                {/* Provider Selector Tabs */}
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-2)] p-1 text-xs">
                  {(['groq', 'gemini', 'openrouter'] as AIProvider[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setProvider(p)
                        setTempKey(getActiveKey(p))
                      }}
                      className={`rounded-lg py-1.5 font-medium transition-all text-center ${
                        provider === p
                          ? 'bg-[var(--color-primary)] text-white shadow-sm'
                          : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      {p === 'groq' ? '⚡ Groq' : p === 'gemini' ? '♊ Gemini' : '🔀 OpenRouter'}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-[var(--color-text)]">
                    {providerLabels[provider].name} API Key
                  </label>
                  <Input
                    type="password"
                    placeholder={providerLabels[provider].placeholder}
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    className="font-mono text-xs"
                  />
                  <a
                    href={providerLabels[provider].link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] hover:underline pt-0.5"
                  >
                    <span>Get free {providerLabels[provider].name} API Key</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 text-xs" onClick={() => setShowKeyModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 text-xs bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => saveKeySettings(provider, tempKey)}>
                  <CheckCircle2 size={14} className="mr-1" /> Save & Activate
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                        m.role === 'user'
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-[var(--color-primary)] text-white rounded-tr-none'
                          : 'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    <span>NeoBot ({providerLabels[provider].name}) is analyzing your finances...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Preset Prompts */}
              <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50 no-scrollbar">
                {presetPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-[11px] font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2 p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <Input
                  placeholder={`Ask NeoBot (${providerLabels[provider].name})...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 text-xs"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 h-9 w-9 shrink-0 rounded-xl"
                >
                  <Send size={15} />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  )
}
