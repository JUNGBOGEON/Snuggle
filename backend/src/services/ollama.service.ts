import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export interface GeneratedTheme {
  message: string
  sections: {
    custom_css: string
  }
}

/**
 * Ollama 요청
 */
async function ollamaRequest(systemPrompt: string, userPrompt: string): Promise<string> {
  logger.info(`[Ollama] Requesting...`)

  const response = await fetch(`${env.ollama.baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.ollama.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      format: 'json',
      options: { temperature: 0.7, num_predict: 4000 },
    }),
  })

  if (!response.ok) throw new Error(`Ollama error: ${response.status}`)
  const data = await response.json() as { message?: { content?: string } }
  const content = data.message?.content || ''
  logger.info(`[Ollama] Response length: ${content.length}`)
  return content
}

/**
 * CSS만 생성 - HTML 구조는 유지하고 스타일만 변경
 */
async function generateCSS(userRequest: string): Promise<string> {
  const systemPrompt = `You are a CSS designer. Generate blog CSS based on user's style request.

IMPORTANT: Only generate CSS. The HTML structure is FIXED and will not change.
Your job is to style the existing HTML elements to match the user's vision.

OUTPUT FORMAT (JSON only):
{ "css": "your complete CSS code" }

=== USER REQUEST INTERPRETATION ===

COLOR KEYWORDS (한국어 → CSS colors):
- 보라/보라색/퍼플/purple → Primary: #7c3aed, Light: #f5f3ff, Border: #e9d5ff
- 파랑/파란색/블루/blue → Primary: #2563eb, Light: #eff6ff, Border: #bfdbfe
- 초록/초록색/그린/green → Primary: #16a34a, Light: #f0fdf4, Border: #bbf7d0
- 분홍/핑크/pink → Primary: #db2777, Light: #fdf2f8, Border: #fbcfe8
- 주황/오렌지/orange → Primary: #ea580c, Light: #fff7ed, Border: #fed7aa
- 빨강/레드/red → Primary: #dc2626, Light: #fef2f2, Border: #fecaca
- 노랑/옐로우/yellow → Primary: #ca8a04, Light: #fefce8, Border: #fef08a
- 다크/어두운/dark → Bg: #0f172a, Card: #1e293b, Text: #f1f5f9, Accent: #38bdf8
- 미니멀/깔끔/minimal → Bg: #fafafa, Card: #fff, Text: #18181b, Accent: #18181b

STYLE KEYWORDS:
- 미니멀/심플/minimal → thin borders, lots of whitespace, subtle shadows
- 모던/modern → sharp corners, bold fonts, geometric shapes
- 귀여운/cute → rounded corners (16px+), soft shadows, playful colors
- 레트로/retro → serif fonts, muted colors, vintage feel
- 다크모드/dark → dark backgrounds, light text, subtle glow effects

=== REQUIRED CSS STRUCTURE ===

:root {
  --blog-bg: [background color];
  --blog-fg: [text color];
  --blog-accent: [accent/brand color];
  --blog-muted: [secondary text color];
  --blog-border: [border color];
  --blog-card-bg: [card background];
}

/* Header - 헤더 영역 */
.blog-header { background: var(--blog-card-bg); border-bottom: 1px solid var(--blog-border); }
.blog-header .header-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; height: 64px; display: flex; align-items: center; justify-content: space-between; }
.blog-header .header-left { display: flex; align-items: center; gap: 0.5rem; }
.blog-header .logo { font-weight: 700; color: var(--blog-accent); text-decoration: none; }
.blog-header .divider { color: var(--blog-muted); }
.blog-header .blog-name { font-weight: 600; color: var(--blog-fg); text-decoration: none; }
.blog-header .header-right { display: flex; align-items: center; gap: 1.5rem; }
.blog-header .header-nav { display: flex; gap: 1rem; }
.blog-header .nav-link { color: var(--blog-muted); text-decoration: none; font-size: 0.875rem; }
.blog-header .nav-link:hover { color: var(--blog-accent); }
.blog-header .write-btn { background: var(--blog-accent); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; text-decoration: none; font-size: 0.875rem; }

/* Post List - 게시글 목록 */
.post-list { padding: 0; }
.post-list-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; }
.section-title { font-size: 1rem; font-weight: 600; color: var(--blog-accent); margin: 0; }
.post-count { font-size: 0.875rem; color: var(--blog-accent); }
.posts-container { border-top: 1px solid var(--blog-border); }

/* Post Item - 개별 게시글 */
.post-item { border-bottom: 1px solid var(--blog-border); }
.post-item .post-link { display: flex; gap: 1rem; padding: 1.25rem 0; text-decoration: none; color: inherit; }
.post-item:hover { background: rgba(0,0,0,0.02); }
.post-item .post-content { flex: 1; min-width: 0; }
.post-item .post-title { font-size: 1.125rem; font-weight: 600; color: var(--blog-fg); margin: 0 0 0.5rem; }
.post-item .post-excerpt { font-size: 0.875rem; color: var(--blog-muted); margin: 0 0 0.5rem; line-height: 1.5; }
.post-item .post-meta { display: flex; gap: 0.5rem; font-size: 0.75rem; color: var(--blog-muted); }
.post-item .post-thumbnail { width: 120px; height: 80px; border-radius: 8px; overflow: hidden; flex-shrink: 0; }
.post-item .post-thumbnail img { width: 100%; height: 100%; object-fit: cover; }

/* Sidebar - 사이드바 */
.blog-sidebar { padding: 0; }
.profile-card { background: var(--blog-card-bg); border-radius: 16px; padding: 1.5rem; text-align: center; border: 1px solid var(--blog-border); }
.profile-image { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--blog-accent); margin-bottom: 1rem; }
.profile-name { font-size: 1.125rem; font-weight: 700; color: var(--blog-accent); margin: 0 0 0.75rem; }
.subscribe-btn { background: var(--blog-accent); color: white; border: none; padding: 0.625rem 1.5rem; border-radius: 9999px; font-weight: 500; cursor: pointer; margin-bottom: 0.75rem; }
.subscribe-btn:hover { opacity: 0.9; }
.profile-desc { font-size: 0.875rem; color: var(--blog-muted); margin: 0 0 1rem; }
.profile-stats { display: flex; justify-content: center; gap: 1.5rem; }
.stat-item { text-align: center; }
.stat-value { display: block; font-size: 1.125rem; font-weight: 700; color: var(--blog-fg); }
.stat-label { font-size: 0.75rem; color: var(--blog-muted); }

/* Footer - 푸터 */
.blog-footer { text-align: center; padding: 2rem; border-top: 1px solid var(--blog-border); color: var(--blog-muted); font-size: 0.875rem; }

/* Empty State */
.empty-state { text-align: center; padding: 3rem; color: var(--blog-muted); }

=== CREATIVE GUIDELINES ===

1. Start with :root variables that match the user's color request
2. Use the accent color for interactive elements (buttons, links, highlights)
3. Keep text readable (dark text on light bg, light text on dark bg)
4. Add hover effects for interactive elements
5. Make buttons and important elements stand out with the accent color

Generate CSS that EXACTLY matches what the user asked for. If they said "보라색", the theme MUST be purple.`

  const result = await ollamaRequest(systemPrompt, `Style request: "${userRequest}"`)

  try {
    const parsed = JSON.parse(result)
    return parsed.css || ''
  } catch {
    const match = result.match(/"css"\s*:\s*"([\s\S]*?)(?:"\s*}|"\s*,)/)?.[1]
    return match?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || ''
  }
}

/**
 * 테마 생성 - CSS만 생성 (HTML은 프론트엔드에서 기본 템플릿 유지)
 */
export async function generateTheme(userRequest: string): Promise<GeneratedTheme> {
  logger.info(`\n========================================`)
  logger.info(`🎨 Theme Request: "${userRequest}"`)
  logger.info(`========================================\n`)

  // CSS만 생성
  logger.info(`[Generating CSS...]`)
  const css = await generateCSS(userRequest)
  logger.info(`[CSS Done!] ${css.length} chars\n`)

  if (!css) {
    throw new Error('CSS 생성 실패')
  }

  logger.info(`========================================`)
  logger.info(`✅ Theme generation complete!`)
  logger.info(`========================================\n`)

  return {
    message: `"${userRequest}" 스타일을 적용했어요!`,
    sections: {
      custom_css: css,
    },
  }
}

/**
 * Ollama 헬스체크
 */
export async function checkOllamaHealth(): Promise<{
  available: boolean
  model: string
  modelLoaded: boolean
}> {
  try {
    const response = await fetch(`${env.ollama.baseUrl}/api/tags`)
    if (!response.ok) return { available: false, model: env.ollama.model, modelLoaded: false }

    const tags = await response.json() as { models?: { name: string }[] }
    const modelLoaded = (tags.models || []).some(
      (m) => m.name === env.ollama.model || m.name.startsWith(`${env.ollama.model}:`)
    )

    return { available: true, model: env.ollama.model, modelLoaded }
  } catch {
    return { available: false, model: env.ollama.model, modelLoaded: false }
  }
}
