import { useEffect, useRef, useState } from 'react'
import templates from './templates.json'

const WIDTHS = { desktop: 640, phone: 375 }
const THEMES = ['light', 'dark']
const GROUPS = [...new Set(templates.map((t) => t.group))]
const params = new URLSearchParams(window.location.search)

function initialSlug() {
  const t = params.get('t')
  return templates.some((x) => x.slug === t) ? t : templates[0].slug
}

// ?theme= wins, then the viewer's system setting.
function initialTheme() {
  const t = params.get('theme')
  if (THEMES.includes(t)) return t
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// The emails switch to dark inside @media (prefers-color-scheme: dark). Rewrite those rules' media text so they
// always match (dark) or never match (light), whatever the viewer's system setting is.
function applyTheme(doc, theme) {
  if (!doc) return
  doc.documentElement.style.colorScheme = theme
  for (const sheet of doc.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet (the Google Fonts link): unreadable, and it has no color-scheme rules
    }
    for (const rule of rules) {
      if (!(rule instanceof doc.defaultView.CSSMediaRule)) continue
      rule.__scheme ??= /prefers-color-scheme:\s*dark/.test(rule.media.mediaText)
      if (rule.__scheme) rule.media.mediaText = theme === 'dark' ? 'all' : 'not all'
    }
  }
}

export default function App() {
  const [slug, setSlug] = useState(initialSlug)
  const [device, setDevice] = useState('desktop')
  const [theme, setTheme] = useState(initialTheme)
  const [height, setHeight] = useState(800)
  const frame = useRef(null)
  const observer = useRef(null)
  const template = templates.find((t) => t.slug === slug)
  const src = `templates/${template.file}`

  // Keep ?t= and ?theme= in the URL so a link opens the same email in the same mode.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('t', slug)
    url.searchParams.set('theme', theme)
    window.history.replaceState(null, '', url)
  }, [slug, theme])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    applyTheme(frame.current?.contentDocument, theme)
  }, [theme])

  useEffect(() => () => observer.current?.disconnect(), [])

  // Size the iframe to its content so the page scrolls, not the frame. Images load late, so keep watching.
  function fit() {
    // Measure <body>, not <html>: <html> is never shorter than the frame, so it would only ever grow.
    const doc = frame.current?.contentDocument
    const body = doc?.body
    if (!body) return
    applyTheme(doc, theme)
    observer.current?.disconnect()
    const measure = () => setHeight(body.scrollHeight)
    observer.current = new ResizeObserver(measure)
    observer.current.observe(body)
    measure()
  }

  return (
    <>
      <header className="bar">
        <img
          className="logo"
          src={theme === 'dark' ? 'pinpaws-logo-white.png' : 'https://www.pinpaws.com/wp-content/uploads/2019/04/Pinpaws-logo.png'}
          alt="Pin Paws"
          height="36"
        />
        <span className="title">Email previews</span>

        <label className="picker">
          <span className="visually-hidden">Template</span>
          <select value={slug} onChange={(e) => setSlug(e.target.value)}>
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {templates.filter((t) => t.group === g).map((t) => (
                  <option key={t.slug} value={t.slug}>{t.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <div className="toggle" role="group" aria-label="Preview width">
          {Object.keys(WIDTHS).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)}>
              {d === 'desktop' ? 'Desktop' : 'Phone'}
            </button>
          ))}
        </div>

        <div className="toggle" role="group" aria-label="Color mode">
          {THEMES.map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>

        <a className="open" href={src} target="_blank" rel="noreferrer">Open in new tab</a>
      </header>

      <main className="stage">
        <article className="message" style={{ width: WIDTHS[device] }}>
          <div className="inbox">
            <p className="subject">{template.subject}</p>
            <p className="preheader">{template.preheader}</p>
          </div>
          <iframe
            key={slug}
            ref={frame}
            src={src}
            title={template.subject}
            onLoad={fit}
            style={{ height }}
          />
        </article>
      </main>
    </>
  )
}
