import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Sparkles, Send, MessageCircle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Halo! Saya DealFinder AI. Saya bisa membantu Anda mencari produk, membandingkan harga, dan memutuskan kapan waktu terbaik untuk beli. Coba tanya: "Laptop apa yang worth it di budget Rp15 juta?"',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setLoading(true)

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ message: userMsg }),
      })

      if (!response.ok) throw new Error('AI request failed')

      const data = await response.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || 'Maaf, saya tidak bisa memproses permintaan Anda saat ini.' }])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Maaf, AI assistant sedang tidak tersedia. Silakan gunakan fitur pencarian untuk menemukan produk.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    'Laptop apa yang worth it di budget Rp15 juta?',
    'iPhone 17 Pro vs Samsung S26 Ultra, mana yang lebih bagus deal-nya?',
    'TV 65 inch terbaik di bawah Rp15 juta?',
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 flex flex-col" style={{ minHeight: 'calc(100vh - 4rem)' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">DealFinder AI</h1>
          <p className="text-xs text-neutral-500">Asisten belanja cerdas Anda</p>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-neutral-100 text-neutral-800'
                }`}
              >
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-neutral-100 rounded-2xl px-4 py-3 flex gap-1">
                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:border-primary-300 hover:bg-primary-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="border-t border-neutral-200 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya apa saja tentang produk..."
            className="input flex-1"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary px-4 disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="mt-3 flex items-start gap-2 text-xs text-neutral-400">
        <MessageCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <p>AI menggunakan data produk dari database DealFinder. Semua harga dan informasi berasal dari data nyata, tidak dibuat-buat oleh AI.</p>
      </div>
    </div>
  )
}
