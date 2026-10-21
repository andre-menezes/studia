import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  it('renders basic Markdown', () => {
    const html = renderMarkdown('# Título\n\n- **um**\n- dois')
    expect(html).toContain('<h1>Título</h1>')
    expect(html).toContain('<strong>um</strong>')
    expect(html).toContain('<li>dois</li>')
  })

  it('escapes raw HTML instead of rendering it', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('keeps http(s) links and opens them safely in a new tab', () => {
    const html = renderMarkdown('[docs](https://vuejs.org)')
    expect(html).toContain('href="https://vuejs.org"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })

  it.each(['javascript:alert(1)', 'data:text/html,hi', 'vbscript:x', '/relative'])(
    'drops links to %s',
    (url) => {
      expect(renderMarkdown(`[x](${url})`)).not.toContain('<a')
    },
  )

  it('does not render images', () => {
    expect(renderMarkdown('![x](https://evil.example/p.png)')).not.toContain('<img')
  })

  it('linkifies bare URLs and drops javascript: autolinks', () => {
    expect(renderMarkdown('veja www.vuejs.org')).toContain('href="http://www.vuejs.org"')
    expect(renderMarkdown('<javascript:alert(1)>')).not.toContain('<a')
  })
})
