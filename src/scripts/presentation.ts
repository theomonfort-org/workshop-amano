// プレゼンテーションモード + Mermaid レンダラー
// - P キーでトグル
// - h2 ごとに 1 スライド分割
// - ← / → でスライド移動、Esc で通常表示へ戻る
// - 左サイドバーに全エントリ目次（現エントリをハイライト）
// - ?present=1 が付いていれば初期表示でプレゼンを開く

import mermaid from 'mermaid';

interface TocEntry {
  id: string;
  title: string;
  icon: string;
  color: 'cyan' | 'magenta' | 'amber' | 'green';
}

interface TocData {
  current: string;
  entries: TocEntry[];
}

interface Slide {
  title: string | null;
  nodes: Node[];
}

const PRESENT_PARAM = 'present';

function readToc(): TocData | null {
  const el = document.getElementById('playbook-toc');
  if (!el || !el.textContent) return null;
  try {
    return JSON.parse(el.textContent) as TocData;
  } catch {
    return null;
  }
}

// Mermaid のコードブロック (<pre><code class="language-mermaid"> や
// Astro/Shiki の <pre data-language="mermaid"><code>...</code></pre>) を
// レンダリング可能な <div class="mermaid"> へ置換する。
function prepareMermaid(article: HTMLElement): HTMLElement[] {
  const blocks = article.querySelectorAll<HTMLPreElement>(
    'pre[data-language="mermaid"], pre:has(> code.language-mermaid)',
  );
  const targets: HTMLElement[] = [];
  blocks.forEach((pre) => {
    const codeEl = pre.querySelector('code');
    const source = codeEl?.textContent ?? pre.textContent ?? '';
    const wrapper = document.createElement('div');
    wrapper.className = 'mermaid';
    wrapper.textContent = source;
    pre.replaceWith(wrapper);
    targets.push(wrapper);
  });
  return targets;
}

async function renderMermaid(targets: HTMLElement[]) {
  if (targets.length === 0) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#1a0b2e',
      primaryTextColor: '#e8f4ff',
      primaryBorderColor: '#00f0ff',
      lineColor: '#ff2e88',
      secondaryColor: '#0a0e27',
      tertiaryColor: '#0a0e27',
      background: '#0a0e27',
      mainBkg: '#1a0b2e',
      nodeBorder: '#00f0ff',
      clusterBkg: 'rgba(0,240,255,0.05)',
      clusterBorder: '#00f0ff',
      titleColor: '#ff2e88',
      edgeLabelBackground: '#0a0e27',
      textColor: '#e8f4ff',
      fontFamily: '"IBM Plex Mono", monospace',
    },
  });
  try {
    await mermaid.run({ nodes: targets });
  } catch (err) {
    console.error('[mermaid] render error', err);
  }
}

// 記事本文を h2 単位でスライドに分割する。
function splitSlides(source: HTMLElement): Slide[] {
  const slides: Slide[] = [];
  let current: Slide = { title: null, nodes: [] };

  Array.from(source.childNodes).forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'H2') {
      // 現在のスライドが空でなければ確定
      if (current.nodes.length > 0 || current.title !== null) {
        slides.push(current);
      }
      current = {
        title: (node as HTMLElement).textContent?.trim() ?? '',
        nodes: [],
      };
    } else {
      current.nodes.push(node.cloneNode(true));
    }
  });

  if (current.nodes.length > 0 || current.title !== null) {
    slides.push(current);
  }

  return slides;
}

function colorClass(color: TocEntry['color']): string {
  switch (color) {
    case 'magenta':
      return 'text-neon-magenta';
    case 'amber':
      return 'text-crt-amber';
    case 'green':
      return 'text-gb-green';
    default:
      return 'text-neon-cyan';
  }
}

function buildSidebar(toc: TocData): HTMLElement {
  const aside = document.createElement('aside');
  aside.className = 'present-sidebar';
  const heading = document.createElement('h2');
  heading.textContent = '> PLAYBOOK';
  aside.appendChild(heading);

  const list = document.createElement('ol');
  toc.entries.forEach((entry) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    const isCurrent = entry.id === toc.current;
    a.href = `/playbook/${entry.id}/?${PRESENT_PARAM}=1`;
    if (isCurrent) a.classList.add('is-current');
    const icon = document.createElement('span');
    icon.className = `toc-icon ${colorClass(entry.color)}`;
    icon.textContent = entry.icon;
    const label = document.createElement('span');
    label.textContent = entry.title;
    a.appendChild(icon);
    a.appendChild(label);
    li.appendChild(a);
    list.appendChild(li);
  });
  aside.appendChild(list);
  return aside;
}

function buildMain(): {
  main: HTMLElement;
  slideHost: HTMLElement;
  indicator: HTMLElement;
} {
  const main = document.createElement('section');
  main.className = 'present-main';

  const slideHost = document.createElement('div');
  slideHost.className = 'present-slide';
  main.appendChild(slideHost);

  const footer = document.createElement('div');
  footer.className = 'present-footer';
  const indicator = document.createElement('span');
  indicator.className = 'indicator';
  const hint = document.createElement('span');
  hint.className = 'hint';
  hint.textContent = '← / → 移動  ·  P or Esc で復帰';
  footer.appendChild(indicator);
  footer.appendChild(hint);
  main.appendChild(footer);

  return { main, slideHost, indicator };
}

class Presenter {
  private root: HTMLElement;
  private slides: Slide[];
  private slideHost: HTMLElement;
  private indicator: HTMLElement;
  private index = 0;

  constructor(root: HTMLElement, slides: Slide[], slideHost: HTMLElement, indicator: HTMLElement) {
    this.root = root;
    this.slides = slides.length > 0 ? slides : [{ title: '（コンテンツがありません）', nodes: [] }];
    this.slideHost = slideHost;
    this.indicator = indicator;
  }

  open(initialIndex = 0) {
    this.index = Math.max(0, Math.min(initialIndex, this.slides.length - 1));
    this.root.classList.add('is-active');
    this.root.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    this.render();
    this.syncUrl(true);
  }

  close() {
    this.root.classList.remove('is-active');
    this.root.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    this.syncUrl(false);
  }

  isOpen(): boolean {
    return this.root.classList.contains('is-active');
  }

  next() {
    if (this.index < this.slides.length - 1) {
      this.index += 1;
      this.render();
    }
  }

  prev() {
    if (this.index > 0) {
      this.index -= 1;
      this.render();
    }
  }

  private render() {
    const slide = this.slides[this.index];
    this.slideHost.innerHTML = '';
    if (slide.title) {
      const h2 = document.createElement('h2');
      h2.textContent = slide.title;
      this.slideHost.appendChild(h2);
    }
    const body = document.createElement('div');
    body.className = 'playbook-article';
    slide.nodes.forEach((n) => body.appendChild(n.cloneNode(true)));
    this.slideHost.appendChild(body);
    this.indicator.textContent = `${this.index + 1} / ${this.slides.length}`;
    this.slideHost.scrollTop = 0;
  }

  private syncUrl(active: boolean) {
    const url = new URL(window.location.href);
    if (active) {
      url.searchParams.set(PRESENT_PARAM, '1');
    } else {
      url.searchParams.delete(PRESENT_PARAM);
    }
    window.history.replaceState({}, '', url.toString());
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

async function init() {
  const article = document.getElementById('playbook-article') as HTMLElement | null;
  const root = document.getElementById('presentation-mode') as HTMLElement | null;
  if (!article || !root) return;

  // Mermaid を先に通常表示で描画する（プレゼン側にもクローン反映させるため）。
  const mermaidTargets = prepareMermaid(article);
  await renderMermaid(mermaidTargets);

  // スライド分割（Mermaid 置換後の DOM をもとに行う）
  const slides = splitSlides(article);

  // サイドバー + メイン領域を構築
  const toc = readToc();
  if (toc) {
    root.appendChild(buildSidebar(toc));
  }
  const { main, slideHost, indicator } = buildMain();
  root.appendChild(main);

  const presenter = new Presenter(root, slides, slideHost, indicator);

  // ?present=1 で初期起動
  const params = new URLSearchParams(window.location.search);
  if (params.get(PRESENT_PARAM) === '1') {
    presenter.open(0);
  }

  window.addEventListener('keydown', (event) => {
    if (isTypingTarget(event.target)) return;
    const key = event.key;
    if (key === 'p' || key === 'P') {
      event.preventDefault();
      if (presenter.isOpen()) presenter.close();
      else presenter.open(0);
      return;
    }
    if (!presenter.isOpen()) return;
    if (key === 'Escape') {
      event.preventDefault();
      presenter.close();
    } else if (key === 'ArrowRight' || key === ' ') {
      event.preventDefault();
      presenter.next();
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      presenter.prev();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}
