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
  userAgentData?: { platform?: string }
}

// ---- Helpers ----

const mq = (q: string): boolean => window.matchMedia(q).matches

// Inline Lucide icons (https://lucide.dev) so they render identically on every
// device instead of relying on per-OS emoji fonts. Each entry is trusted SVG
// markup wrapped once with shared attributes and injected via innerHTML.
function svg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#icon-gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
}

const icons = {
  monitor: svg(
    '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  ),
  zoomIn: svg(
    '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/>',
  ),
  eye: svg(
    '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  ),
  maximize: svg(
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  ),
  gauge: svg('<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>'),
  palette: svg(
    '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  ),
  rainbow: svg(
    '<path d="M22 17a10 10 0 0 0-20 0"/><path d="M6 17a6 6 0 0 1 12 0"/><path d="M10 17a2 2 0 0 1 4 0"/>',
  ),
  rotate: svg(
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  ),
  pointer: svg(
    '<path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/><path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1"/><path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>',
  ),
  sunMoon: svg(
    '<path d="M12 8a2.83 2.83 0 0 0 4 4 4 4 0 1 1-4-4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>',
  ),
  cpu: svg(
    '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  ),
}

// Display color gamut
function colorGamut(): string {
  if (mq('(color-gamut: rec2020)')) return 'Rec. 2020'
  if (mq('(color-gamut: p3)')) return 'DCI-P3'
  if (mq('(color-gamut: srgb)')) return 'sRGB'
  return 'unknown'
}

function dynamicRange(): string {
  return mq('(dynamic-range: high)') ? 'HDR' : 'SDR'
}

function getOrientation(): string {
  const o = screen.orientation && screen.orientation.type
  if (!o) return mq('(orientation: portrait)') ? 'portrait' : 'landscape'
  return o.includes('portrait') ? 'portrait' : 'landscape'
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a
}

function aspectRatio(w: number, h: number): string {
  const d = gcd(w, h)
  return `${w / d}:${h / d}`
}

// Friendly OS name. navigator.platform is misleading (it returns "MacIntel"
// even on Apple Silicon and "Win32" on 64-bit Windows), so prefer the modern
// navigator.userAgentData.platform ("macOS" / "Windows" / ...) when available
// and otherwise normalize the legacy string.
function platformName(): string {
  const uaData = (navigator as NavigatorExtended).userAgentData
  if (uaData?.platform) return uaData.platform

  const p = navigator.platform
  if (/mac/i.test(p)) return 'macOS'
  if (/win/i.test(p)) return 'Windows'
  if (/iphone|ipad|ipod/i.test(p)) return 'iOS'
  if (/android/i.test(p)) return 'Android'
  if (/linux/i.test(p)) return 'Linux'
  return p || 'unknown'
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// Tracks the display refresh rate live. There is no browser API that exposes it
// (it would be a fingerprinting vector), so we sample requestAnimationFrame
// frame intervals. The first second after load is janky (entrance animations,
// font/layout work), which is why a one-shot average came out wrong; instead we
// report the median of a rolling window of frame deltas and keep updating until
// the estimate holds steady, then stop so the page can idle.
function trackRefreshRate(onHz: (hz: number) => void): void {
  const deltas: number[] = []
  let last = performance.now()
  let shown = 0
  let stableMs = 0

  function tick(now: number): void {
    const dt = now - last
    last = now

    // Ignore frame gaps from background tabs or GC pauses.
    if (dt > 1 && dt < 100) {
      deltas.push(dt)
      if (deltas.length > 150) deltas.shift()
    }

    if (deltas.length >= 10) {
      const hz = Math.round(1000 / median(deltas))
      if (hz !== shown) {
        shown = hz
        stableMs = 0
        onHz(hz)
      } else {
        stableMs += dt
      }
    }

    // Keep sampling until the value has held steady for ~2s, then stop.
    if (stableMs < 2000) requestAnimationFrame(tick)
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
  const cores = navigator.hardwareConcurrency || '?'
  const colors = Math.pow(2, screen.colorDepth).toLocaleString()

  return [
    {
      icon: icons.monitor,
      label: 'Resolution',
      featured: true,
      value: `${w} × ${h}`,
      hint: `Physical (with DPR): ${physW} × ${physH} px`,
    },
    {
      icon: icons.zoomIn,
      label: 'System scale (DPR)',
      // devicePixelRatio is floating point (e.g. 1.100000023841858 at 110%
      // zoom); round to 2 decimals for display only.
      value: `${Math.round(dpr * 100) / 100}×`,
      hint:
        dpr > 1
          ? 'High-density display (Retina/HiDPI)'
          : 'Standard pixel density',
    },
    {
      icon: icons.eye,
      label: 'Viewport',
      value: `${window.innerWidth} × ${window.innerHeight}`,
      hint: 'Visible part of the window',
    },
    {
      icon: icons.maximize,
      label: 'Available area',
      value: `${screen.availWidth} × ${screen.availHeight}`,
      hint: 'Screen without taskbar / dock',
    },
    {
      icon: icons.gauge,
      label: 'Refresh rate',
      value: '…',
      id: 'refresh',
      hint: 'Measured in real time',
    },
    {
      icon: icons.palette,
      label: 'Color depth',
      value: `${screen.colorDepth}-bit`,
      hint: `${colors} colors`,
    },
    {
      icon: icons.rainbow,
      label: 'Color gamut',
      value: colorGamut(),
      hint: `Dynamic range: ${dynamicRange()}`,
    },
    {
      icon: icons.rotate,
      label: 'Orientation',
      value: getOrientation(),
      hint: `Aspect ratio: ${aspectRatio(w, h)}`,
    },
    {
      icon: icons.pointer,
      label: 'Touch input',
      value: navigator.maxTouchPoints > 0 ? 'Yes' : 'No',
      hint:
        navigator.maxTouchPoints > 0
          ? `Touch points: ${navigator.maxTouchPoints}`
          : 'Touch is not supported',
    },
    {
      icon: icons.sunMoon,
      label: 'System theme',
      value: mq('(prefers-color-scheme: dark)') ? 'Dark' : 'Light',
      hint: mq('(prefers-reduced-motion: reduce)')
        ? 'Reduced motion is on'
        : 'Animations allowed',
    },
    {
      icon: icons.cpu,
      label: 'Platform',
      value: platformName(),
      hint:
        `CPU cores: ${cores}` +
        (nav.deviceMemory ? ` · RAM: ~${nav.deviceMemory} GB` : ''),
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
    icon.innerHTML = c.icon // trusted inline SVG from the icons table

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

// Fill in the refresh-rate card live as the estimate converges. It is not tied
// to resize: the rate does not change while the page is open, and the tracker
// stops on its own once the value is stable.
function showRefreshRate(): void {
  const el = document.getElementById('refresh')
  if (!el) return
  trackRefreshRate(hz => {
    el.textContent = `${hz} Hz`
  })
}

buildGrid()
showRefreshRate()

// Live update on window resize / zoom / orientation change. Only changed card
// values are patched and flashed; the grid is never rebuilt, so cards no longer
// disappear and re-animate when mobile browser chrome shows/hides on scroll.
let resizeTimer: ReturnType<typeof setTimeout>
function refresh(): void {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(update, 120)
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
    )?.[0] || 'Browser'
  uaEl.textContent = `${browser} · updated ${new Date().toLocaleTimeString()}`
}
