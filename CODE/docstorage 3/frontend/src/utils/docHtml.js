function headingText(el) {
  const clone = el.cloneNode(true)
  clone.querySelectorAll(
    '.mdx-header-anchor, a[aria-label], svg, button',
  ).forEach((node) => node.remove())
  return clone.textContent.replace(/\s+/g, ' ').trim()
}

function slugify(text, fallback = 'section') {
  const slug = text
    .toLowerCase()
    .replace(/[^\wа-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function uniqueId(base, used) {
  let id = base
  let n = 1
  while (used.has(id)) {
    id = `${base}-${n}`
    n += 1
  }
  used.add(id)
  return id
}

export function buildTocFromHtml(html) {
  if (!html) {
    return []
  }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const used = new Set()
  const items = []

  doc.querySelectorAll('h1, h2, h3, h4').forEach((h, index) => {
    const title = headingText(h)
    if (!title) {
      return
    }
    const level = parseInt(h.tagName[1], 10)
    let id = h.getAttribute('id')
    if (!id || used.has(id)) {
      id = uniqueId(slugify(title, `h-${index}`), used)
    } else {
      used.add(id)
    }
    items.push({ id, title, level })
  })

  return items
}

export function prepareScrapedHtml(html) {
  if (!html) {
    return { html: '', toc: [] }
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  doc.querySelectorAll('link, style, script').forEach((el) => el.remove())
  doc.querySelectorAll('.sandpack--playground, .mdx-header-anchor').forEach((el) => el.remove())

  doc.querySelectorAll('button').forEach((btn) => {
    const label = (btn.textContent || '').toLowerCase()
    if (label.includes('copy')) {
      btn.remove()
    }
  })

  const used = new Set()
  const toc = []

  doc.querySelectorAll('h1, h2, h3, h4').forEach((h, index) => {
    const title = headingText(h)
    if (!title) {
      return
    }

    const level = parseInt(h.tagName[1], 10)
    let id = h.getAttribute('id')
    if (!id || used.has(id)) {
      id = uniqueId(slugify(title, `section-${index}`), used)
    } else {
      used.add(id)
    }
    h.setAttribute('id', id)
    h.classList.add('doc-heading-anchor')
    toc.push({ id, title, level })
  })

  return { html: doc.body.innerHTML, toc }
}
