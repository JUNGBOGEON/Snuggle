import type { TemplateKey } from '@/types/skin'

export const TEMPLATE_SECTIONS: { key: TemplateKey; label: string; icon: string; description: string }[] = [
  { key: 'html_template', label: 'HTML', icon: '📄', description: '전체 HTML 템플릿' },
  { key: 'custom_css', label: 'CSS', icon: '🎨', description: '스타일시트' },
]
