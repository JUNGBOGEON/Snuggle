'use client'

import { useState, useRef, useEffect } from 'react'
import type { CustomSkinUpdateData } from '@/lib/api/skins'

interface AIChatPanelProps {
  onApplyDesign: (sections: Record<string, string>) => void
  isOpen: boolean
  onToggle: () => void
  currentSections?: CustomSkinUpdateData
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function AIChatPanel({
  onApplyDesign,
  isOpen,
  onToggle,
  currentSections = {},
}: AIChatPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Get auth token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        throw new Error('로그인이 필요합니다')
      }

      // Filter out boolean properties, only send string sections
      const stringSections: Record<string, string> = {}
      if (currentSections) {
        for (const [key, value] of Object.entries(currentSections)) {
          if (typeof value === 'string') {
            stringSections[key] = value
          }
        }
      }

      console.log('[AI] Sending request...')
      console.log('[AI] User input:', userInput)
      console.log('[AI] Current sections:', stringSections)
      console.log('[AI] Current code length:', JSON.stringify(stringSections).length)

      // Use streaming endpoint but it now returns complete response
      const response = await fetch(`${API_URL}/api/ollama/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: userInput }],
          currentCode: JSON.stringify(stringSections),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'AI 응답을 받지 못했습니다')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('응답을 읽을 수 없습니다')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        console.log('[AI] Received chunk:', chunk)

        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

        for (const line of lines) {
          const data = line.replace(/^data:\s*/, '')
          if (!data) continue

          try {
            const event = JSON.parse(data)
            console.log('[AI] Event:', event.type)

            if (event.type === 'chunk' && event.content) {
              fullContent = event.content // Replace, not append (content is complete JSON)
            } else if (event.type === 'progress') {
              console.log('[AI] Progress:', event.message)
            } else if (event.type === 'error') {
              throw new Error(event.error || 'AI 처리 중 오류 발생')
            }
          } catch (parseError) {
            console.log('[AI] Failed to parse event:', data)
          }
        }
      }

      console.log('[AI] Full content:', fullContent)

      if (!fullContent) {
        throw new Error('AI 응답이 비어있습니다')
      }

      // Parse JSON response from AI
      let parsed
      try {
        // Try direct parse first
        parsed = JSON.parse(fullContent)
      } catch {
        // Try to extract JSON from response
        const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('JSON 파싱 실패')
        }
      }

      console.log('[AI] Parsed response:', parsed)
      console.log('[AI] Sections:', parsed.sections)

      if (parsed.sections) {
        const sectionCount = Object.keys(parsed.sections).length
        console.log(`[AI] Applying ${sectionCount} sections`)
        onApplyDesign(parsed.sections)

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: parsed.message || '디자인을 적용했어요! ✨',
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('AI 응답에 sections가 없습니다')
      }
    } catch (error) {
      console.error('[AI] Error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: error instanceof Error ? error.message : '오류가 발생했어요. 다시 시도해주세요.',
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
    inputRef.current?.focus()
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-violet-700 hover:shadow-xl"
        title="AI 디자이너"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
            <svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-neutral-900 dark:text-white">AI 디자이너</span>
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3" style={{ maxHeight: '320px' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
              원하는 디자인을 말해주세요
            </p>
            <div className="w-full space-y-2">
              <button
                onClick={() => handleQuickPrompt('보라색 테마로 꾸며줘')}
                className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                💜 보라색 테마로 꾸며줘
              </button>
              <button
                onClick={() => handleQuickPrompt('미니멀하고 깔끔하게')}
                className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                ✨ 미니멀하고 깔끔하게
              </button>
              <button
                onClick={() => handleQuickPrompt('다크 모드로 바꿔줘')}
                className="w-full rounded-lg bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600 transition-colors hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                🌙 다크 모드로 바꿔줘
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-neutral-100 p-3 dark:border-neutral-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="어떤 스타일로 꾸밀까요?"
            disabled={isLoading}
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-violet-400 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-violet-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700 disabled:opacity-50"
          >
            {isLoading ? '...' : '전송'}
          </button>
        </div>
      </form>
    </div>
  )
}
