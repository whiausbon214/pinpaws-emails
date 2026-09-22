// Copies the built emails from ../email-templates into public/templates/ and writes src/templates.json.
// Run `python3 build.py` in email-templates first, then `npm run sync` here.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KIT = join(ROOT, '..', 'email-templates')
const OUT = join(ROOT, 'public', 'templates')

const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '’')

function meta(html) {
  const subject = decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim()
  // The hidden preheader div, cut at the first &#8199; spacer that pads it out.
  const raw = html.match(/<div[^>]*style="display:none;[^"]*"[^>]*>([^<]*)/)?.[1] ?? ''
  const preheader = decode(raw.split('&#8199;')[0]).trim()
  return { subject, preheader }
}

const sources = [
  ...readdirSync(join(KIT, 'emails')).filter((f) => f.endsWith('.html')).map((f) => join(KIT, 'emails', f)),
  join(KIT, 'pinpaws-template.html'),
]

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const GROUPS = ['PackWISE welcomes', 'Lifecycle emails', 'Reference']
const templates = sources.map((src) => {
  const file = src.split('/').pop()
  const slug = file.replace(/\.html$/, '')
  copyFileSync(src, join(OUT, file))
  const { subject, preheader } = meta(readFileSync(src, 'utf8'))
  const group = slug.startsWith('packwise-') ? GROUPS[0] : slug === 'pinpaws-template' ? GROUPS[2] : GROUPS[1]
  // Dropdown label: the subject, except where two emails share one (the PackWISE welcomes) or it's the reference sheet.
  const label = group === GROUPS[0] ? `${slug.includes('preferred') ? 'Preferred' : 'Basic'} welcome`
    : group === GROUPS[2] ? 'Component sheet' : subject
  return { slug, file, label, subject, preheader, group }
})

templates.sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.slug.localeCompare(b.slug))
writeFileSync(join(ROOT, 'src', 'templates.json'), JSON.stringify(templates, null, 2) + '\n')
console.log(`synced ${templates.length} templates`)
