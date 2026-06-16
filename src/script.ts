// ---- Types ----

interface CardDescriptor {
  icon: string
  label: string
  value: string
  hint: string
  featured?: boolean
  id?: string
}

// Extends standard types with non-standard / experimental fields
interface NavigatorExtended extends Navigator {
  deviceMemory?: number
}

// ---- Helpers ----

const mq = (q: string): boolean => window.matchMedia(q).matches

// Display color gamut
function colorGamut(): string {
  if (mq('(color-gamut: rec2020)')) return 'Rec. 2020'
  if (mq('(color-gamut: p3)')) return 'DCI-P3'
  if (mq('(color-gamut: srgb)')) return 'sRGB'
  return 'невідомо'
}

function dynamicRange(): string {
  return mq('(dynamic-range: high)') ? 'HDR' : 'SDR'
}

function getOrientation(): string {
  const o = screen.orientation && screen.orientation.type
  if (!o) return mq('(orientation: portrait)') ? 'портретна' : 'альбомна'
  return o.includes('portrait') ? 'портретна' : 'альбомна'
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

function aspectRatio(w: number, h: number): string {
  const d = gcd(w, h)
  return `${w / d}:${h / d}`
}

// Measures the screen refresh rate via requestAnimationFrame
function measureRefreshRate(cb: (hz: number) => void): void {
  let frames = 0
  const start = performance.now()
  function tick(now: number): void {
    frames++
    if (now - start >= 1000) {
      cb(Math.round((frames * 1000) / (now - start)))
    } else {
      requestAnimationFrame(tick)
    }
  }
  requestAnimationFrame(tick)
}

// ---- Card definitions ----

function buildCards(): CardDescriptor[] {
  const nav = navigator as NavigatorExtended
  const dpr = window.devicePixelRatio || 1
  const w = screen.width
  const h = screen.height
  const physW = Math.round(w * dpr)
  const physH = Math.round(h * dpr)

  return [
    {
      icon: '🖥️',
      label: 'Роздільна здатність',
      featured: true,
      value: `${w} × ${h}`,
      hint: `Фізична (з урахуванням DPR): ${physW} × ${physH} px`,
    },
    {
      icon: '🔍',
      label: 'Масштаб системи (DPR)',
      value: `${dpr}×`,
      hint:
        dpr > 1
          ? 'Дисплей із підвищеною щільністю пікселів (Retina/HiDPI)'
          : 'Стандартна щільність пікселів',
    },
    {
      icon: '📐',
      label: 'Область перегляду',
      value: `${window.innerWidth} × ${window.innerHeight}`,
      hint: 'Видима частина вікна (viewport)',
    },
    {
      icon: '🗔',
      label: 'Доступна область',
      value: `${screen.availWidth} × ${screen.availHeight}`,
      hint: 'Екран без панелі завдань / док-панелі',
    },
    {
      icon: '🎞️',
      label: 'Частота оновлення',
      value: '…',
      id: 'refresh',
      hint: 'Вимірюється у реальному часі',
    },
    {
      icon: '🎨',
      label: 'Глибина кольору',
      value: `${screen.colorDepth}-біт`,
      hint: `${Math.pow(2, screen.colorDepth).toLocaleString('uk')} кольорів`,
    },
    {
      icon: '🌈',
      label: 'Колірний охват',
      value: colorGamut(),
      hint: `Динамічний діапазон: ${dynamicRange()}`,
    },
    {
      icon: '🔄',
      label: 'Орієнтація',
      value: getOrientation(),
      hint: `Співвідношення сторін: ${aspectRatio(w, h)}`,
    },
    {
      icon: '👆',
      label: 'Сенсорний ввід',
      value: navigator.maxTouchPoints > 0 ? 'Так' : 'Ні',
      hint:
        navigator.maxTouchPoints > 0
          ? `Точок дотику: ${navigator.maxTouchPoints}`
          : 'Дотик не підтримується',
    },
    {
      icon: '🌓',
      label: 'Тема системи',
      value: mq('(prefers-color-scheme: dark)') ? 'Темна' : 'Світла',
      hint: mq('(prefers-reduced-motion: reduce)')
        ? 'Зменшений рух увімкнено'
        : 'Анімації дозволені',
    },
    {
      icon: '💻',
      label: 'Платформа',
      value: navigator.platform || 'невідомо',
      hint: `Ядер CPU: ${navigator.hardwareConcurrency || '?'}${nav.deviceMemory ? ' · ОЗП: ~' + nav.deviceMemory + ' ГБ' : ''}`,
    },
  ]
}

// ---- Render ----

const grid = document.getElementById('grid') as HTMLElement

// Per-card DOM references and last-seen text, keyed by label, so live updates
// can patch text in place instead of rebuilding the whole grid.
const cardEls: Record<string, HTMLElement> = {}
const valueEls: Record<string, HTMLElement> = {}
const hintEls: Record<string, HTMLElement> = {}
const prevValues: Record<string, string> = {}
const prevHints: Record<string, string> = {}

// Restart the flash animation on a card element.
function flash(el: HTMLElement): void {
  el.classList.remove('flash')
  // The entrance stagger set an inline animation-delay; clear it so the flash
  // plays immediately instead of inheriting that delay.
  el.style.animationDelay = '0s'
  void el.offsetWidth // force reflow so the animation can replay
  el.classList.add('flash')
}

// Build the grid once. The set of cards is static; only their values change
// afterwards, so we keep the nodes and never recreate them.
function buildGrid(): void {
  const frag = document.createDocumentFragment()
  buildCards().forEach((c, i) => {
    const el = document.createElement('div')
    el.className = 'card' + (c.featured ? ' featured' : '')
    el.style.animationDelay = i * 45 + 'ms'

    const icon = document.createElement('div')
    icon.className = 'icon'
    icon.textContent = c.icon

    const label = document.createElement('div')
    label.className = 'label'
    label.textContent = c.label

    const value = document.createElement('div')
    value.className = 'value'
    if (c.id) value.id = c.id
    value.textContent = c.value

    const hint = document.createElement('div')
    hint.className = 'hint'
    hint.textContent = c.hint

    el.append(icon, label, value, hint)
    frag.appendChild(el)

    cardEls[c.label] = el
    valueEls[c.label] = value
    hintEls[c.label] = hint
    prevValues[c.label] = c.value
    prevHints[c.label] = c.hint
  })
  grid.appendChild(frag)
}

// Patch only the cards whose value or hint changed, and flash just those.
// The refresh-rate card is skipped: its value is filled in asynchronously by
// measureRefreshRate, while buildCards only carries a placeholder for it.
function update(): void {
  buildCards().forEach(c => {
    if (c.id === 'refresh') return

    let changed = false
    if (prevValues[c.label] !== c.value) {
      valueEls[c.label].textContent = c.value
      prevValues[c.label] = c.value
      changed = true
    }
    if (prevHints[c.label] !== c.hint) {
      hintEls[c.label].textContent = c.hint
      prevHints[c.label] = c.hint
      changed = true
    }
    if (changed) flash(cardEls[c.label])
  })
}

// Measure the refresh rate once on load. It is intentionally not re-measured on
// resize: re-running the ~1s rAF probe on every mobile scroll would waste CPU,
// and the rate does not change while the page is open.
function showRefreshRate(): void {
  measureRefreshRate(hz => {
    const el = document.getElementById('refresh')
    if (el) el.textContent = `${hz} Гц`
  })
}

buildGrid()
showRefreshRate()

// Live update on window resize / zoom / orientation change. Only changed card
// values are patched and flashed; the grid is never rebuilt, so cards no longer
// disappear and re-animate when mobile browser chrome shows/hides on scroll.
let t: ReturnType<typeof setTimeout>
function refresh(): void {
  clearTimeout(t)
  t = setTimeout(update, 120)
}
window.addEventListener('resize', refresh)
window.addEventListener('orientationchange', refresh)
if (screen.orientation) screen.orientation.addEventListener('change', refresh)

// Footer line
const uaEl = document.getElementById('ua')
if (uaEl) {
  const browser =
    navigator.userAgent.match(
      /(Firefox|Edg|OPR|Chrome|Safari)\/[\d.]+/g,
    )?.[0] || 'Браузер'
  uaEl.textContent = `${browser} · оновлено ${new Date().toLocaleTimeString('uk')}`
}
