import { useEffect, useRef, useState } from 'react'
import templates from './templates.json'

const WIDTHS = { desktop: 640, phone: 375 }
const GROUPS = [...new Set(templates.map((t) => t.group))]

function initialSlug() {
  const t = new URLSearchParams(window.location.search).get('t')
  return templates.some((x) => x.slug === t) ? t : templates[0].slug
}

export default function App() {
  const [slug, setSlug] = useState(initialSlug)
  const [device, setDevice] = useState('desktop')
  const [height, setHeight] = useState(800)
  const frame = useRef(null)
  const observer = useRef(null)
  const template = templates.find((t) => t.slug === slug)
  const src = `templates/${template.file}`

  // Keep ?t= in the URL so a link opens the same email.
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('t', slug)
    window.history.replaceState(null, '', url)
  }, [slug])

  useEffect(() => () => observer.current?.disconnect(), [])

  // Size the iframe to its content so the page scrolls, not the frame. Images load late, so keep watching.
  function fit() {
    // Measure <body>, not <html>: <html> is never shorter than the frame, so it would only ever grow.
    const body = frame.current?.contentDocument?.body
    if (!body) return
    observer.current?.disconnect()
    const measure = () => setHeight(body.scrollHeight)
    observer.current = new ResizeObserver(measure)
    observer.current.observe(body)
    measure()
  }

  return (
    <>
      <header className="bar">
        <picture>
          <source
            media="(prefers-color-scheme: dark)"
            srcSet="pinpaws-logo-white.png"
          />
          <img
            className="logo"
            src="https://www.pinpaws.com/wp-content/uploads/2019/04/Pinpaws-logo.png"
            alt="Pin Paws"
            height="36"
          />
        </picture>
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
