import type { TemplateKey } from '@/types/skin'

export const TEMPLATE_SECTIONS: { key: TemplateKey; label: string; icon: string; description: string }[] = [
  { key: 'html_head', label: 'Head', icon: '🔧', description: '메타태그, 폰트' },
  { key: 'html_header', label: '헤더', icon: '📌', description: '상단 영역' },
  { key: 'html_post_list', label: '목록', icon: '📋', description: '게시글 목록' },
  { key: 'html_post_item', label: '아이템', icon: '📝', description: '반복 아이템' },
  { key: 'html_post_detail', label: '상세', icon: '📄', description: '게시글 상세' },
  { key: 'html_sidebar', label: '사이드바', icon: '📊', description: '사이드바' },
  { key: 'html_footer', label: '푸터', icon: '📎', description: '하단 영역' },
  { key: 'custom_css', label: 'CSS', icon: '🎨', description: '스타일시트' },
]
