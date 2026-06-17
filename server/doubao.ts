/**
 * 豆包 API 服务端客户端
 *
 * 说明：服务端调用火山方舟 API，不受浏览器 CORS 限制
 * 支持流式响应 (SSE) 和非流式调用
 */

import type { ApiSettings } from '../shared/types'

export interface DoubaoMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onDelta: (chunk: string, fullText: string) => void
  onDone: (fullText: string) => void
  onError: (err: Error | string) => void
}

/**
 * 调用豆包 API (兼容 OpenAI Chat Completions 协议)
 */
export async function callDoubaoStream(
  messages: DoubaoMessage[],
  settings: ApiSettings,
  signal?: AbortSignal | null,
): Promise<string> {
  const endpoint = settings.endpoint || 'https://ark.cn-beijing.volces.com/api/v3'
  const apiKey = settings.apiKey
  const model = settings.modelName || 'doubao-pro-250615'

  const url = endpoint.endsWith('/chat/completions')
    ? endpoint
    : endpoint.replace(/\/?$/, '/chat/completions')

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: settings.temperature ?? 0.7,
      max_tokens: settings.maxTokens ?? 2048,
      top_p: settings.topP ?? 0.9,
      stream: false,
    }),
    signal: signal || undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`豆包 API ${res.status}: ${text || res.statusText}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content
  return typeof content === 'string' ? content : ''
}

/**
 * 流式调用豆包 API
 * 返回 Promise<void>，通过 cb 逐块返回内容
 */
export async function callDoubaoStreaming(
  messages: DoubaoMessage[],
  settings: ApiSettings,
  cb: StreamCallbacks,
  signal?: AbortSignal | null,
): Promise<void> {
  const endpoint = settings.endpoint || 'https://ark.cn-beijing.volces.com/api/v3'
  const apiKey = settings.apiKey
  const model = settings.modelName || 'doubao-pro-250615'

  const url = endpoint.endsWith('/chat/completions')
    ? endpoint
    : endpoint.replace(/\/?$/, '/chat/completions')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: settings.temperature ?? 0.7,
        max_tokens: settings.maxTokens ?? 2048,
        top_p: settings.topP ?? 0.9,
        stream: true,
      }),
      signal: signal || undefined,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`豆包 API ${res.status}: ${text || res.statusText}`)
    }

    // 解析 SSE 流
    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error('浏览器不支持流式响应')
    }

    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      // SSE 以 \n\n 分隔事件
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const evt of events) {
        const lines = evt.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const delta = json?.choices?.[0]?.delta?.content
            if (delta && typeof delta === 'string') {
              fullText += delta
              cb.onDelta(delta, fullText)
            }
          } catch {
            // 忽略非法 JSON 片段
          }
        }
      }
    }

    cb.onDone(fullText)
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      cb.onDone('')
      return
    }
    cb.onError(err?.message ?? String(err))
  }
}

/**
 * 检查 API 配置是否可用
 */
export function hasValidApiConfig(settings: ApiSettings): boolean {
  return Boolean(
    settings.endpoint && settings.endpoint.trim() !== '' &&
    settings.apiKey && settings.apiKey.trim() !== '' &&
    settings.apiKey.trim().length >= 8 &&
    settings.modelName && settings.modelName.trim() !== ''
  )
}
