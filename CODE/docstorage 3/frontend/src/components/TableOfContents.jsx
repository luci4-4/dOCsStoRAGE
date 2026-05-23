import { useEffect, useState } from 'react'
import Icon from './Icon'

export function buildTocFromMarkdown(text) {
  const items = []
  const lines = (text || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)/)
    if (m) {
      const level = m[1].length
      const title = m[2].trim()
      const id = title
        .toLowerCase()
        .replace(/[^\wа-яё]+/gi, '-')
        .replace(/^-|-$/g, '')
      items.push({ level, title, id })
    }
  }
  return items
}

export default function TableOfContents({ items }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    if (!items.length) {
      return
    }
    const onScroll = () => {
      const offsets = items
        .map((it) => {
          const el = document.getElementById(it.id)
          if (el) {
            return { id: it.id, top: el.getBoundingClientRect().top }
          }
          return null
        })
        .filter(Boolean)
      const current = offsets.filter((o) => o.top <= 120).pop()
      setActive(current?.id || items[0]?.id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  if (!items.length) {
    return null
  }

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <nav className="doc-toc card">
      <div className="doc-toc-title">
        <Icon name="list" size={14} /> Содержание
      </div>
      <ul className="toc">
        {items.map((it) => (
          <li
            key={it.id}
            className={`toc-l${it.level} ${active === it.id ? 'active' : ''}`}
            title={it.title}
          >
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(it.id)
              }}
            >
              {it.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
