import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.min.css'

function slug(text) {
  const s = String(text).replace(/[^\wа-яё\s-]/gi, '').trim().toLowerCase()
  return s.replace(/\s+/g, '-')
}

function heading(Tag) {
  return function Heading({ children, ...props }) {
    const id = slug(children)
    return <Tag id={id} {...props}>{children}</Tag>
  }
}

const mdComponents = {
  h1: heading('h1'),
  h2: heading('h2'),
  h3: heading('h3'),
  h4: heading('h4'),
}

export default function MarkdownView({ content, className = '' }) {
  if (!content) {
    return null
  }
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={mdComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
