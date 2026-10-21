import MarkdownIt from 'markdown-it'

/** Raw HTML and images are off and only http(s) links survive (FEATURE-0003 §7). */
const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

// Remote images would load from any host (tracking pixels); out of scope for notes.
md.disable('image')

md.validateLink = (url) => /^https?:\/\//i.test(url.trim())

const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer nofollow')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(content: string) {
  return md.render(content)
}
