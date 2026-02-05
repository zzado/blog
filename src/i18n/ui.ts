export const languages = {
  ko: '한국어',
  en: 'English',
};

export const defaultLang = 'ko';

export const ui = {
  ko: {
    'nav.posts': '포스트',
    'nav.about': '소개',
    'hero.title': '짜도의 개발 블로그',
    'hero.desc': 'Astro 5.0과 Tailwind 4.0으로 만든 개발과 일상 이야기.',
    'hero.button': '블로그 읽기',
    'posts.title': '블로그 포스트',
    'posts.empty': '등록된 포스트가 없습니다.',
    'posts.search_placeholder': '검색어를 입력하세요...',
    '404.title': '페이지를 찾을 수 없습니다',
    '404.desc': '요청하신 페이지가 존재하지 않습니다.',
    '404.button': '홈으로 돌아가기',
    'footer.copyright': 'Zzado. All rights reserved.',
    'lang.toggle': '🇺🇸 English'
  },
  en: {
    'nav.posts': 'Posts',
    'nav.about': 'About',
    'hero.title': "Zzado's Dev Blog",
    'hero.desc': 'Sharing thoughts, code, and developer life. Built with Astro 5.0 and Tailwind 4.0.',
    'hero.button': 'Read Blog',
    'posts.title': 'Blog Posts',
    'posts.empty': 'No posts found.',
    'posts.search_placeholder': 'Search posts...',
    '404.title': 'Page Not Found',
    '404.desc': "We can't find that page.",
    '404.button': 'Go back home',
    'footer.copyright': 'Zzado. All rights reserved.',
    'lang.toggle': '🇰🇷 한국어'
  },
} as const;
