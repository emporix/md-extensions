import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

type RichMarkdownProps = {
  readonly text: string
}

const SAFE_LINK_PREFIXES = ['https://', 'mailto:'] as const

const isSafeLinkUrl = (href: string | undefined): href is string => {
  if (!href) {
    return false
  }

  const normalized = Array.from(href.trim())
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 32 && code !== 127
    })
    .join('')
  const lower = normalized.toLowerCase()
  return SAFE_LINK_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

const MarkdownAnchor: Components['a'] = ({ href, children }) => {
  if (!isSafeLinkUrl(href)) {
    return <span>{children}</span>
  }

  return (
    <a href={href.trim()} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

const MarkdownImage: Components['img'] = ({ src, alt }) => {
  const source = typeof src === 'string' ? src : undefined
  if (!isSafeLinkUrl(source)) {
    return <span>{alt ?? ''}</span>
  }

  return (
    <a href={source.trim()} target="_blank" rel="noopener noreferrer">
      {alt || source}
    </a>
  )
}

export const RichMarkdown = ({ text }: RichMarkdownProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
    components={{ a: MarkdownAnchor, img: MarkdownImage }}
  >
    {text}
  </ReactMarkdown>
)
