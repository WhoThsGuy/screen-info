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

// Estimates the page zoom level in the browser
function pageZoom(): number {
  // outerWidth / innerWidth gives an approximate window zoom level
  const z = Math.round((window.outerWidth / window.innerWidth) * 100)
  return isFinite(z) && z > 0 ? z : 100
}

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
      icon: '🔎',
      label: 'Масштаб сторінки',
      value: `${pageZoom()}%`,
      hint: 'Рівень зуму у вікні браузера',
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
const prevValues: Record<string, string> = {}

function render(): void {
  const cards = buildCards()
  grid.innerHTML = ''
  cards.forEach((c, i) => {
    const el = document.createElement('div')
    el.className = 'card' + (c.featured ? ' featured' : '')
    el.style.animationDelay = i * 45 + 'ms'

    const changed =
      prevValues[c.label] !== undefined && prevValues[c.label] !== c.value
    el.innerHTML = `
      <div class="icon">${c.icon}</div>
      <div class="label">${c.label}</div>
      <div class="value${changed ? ' changed' : ''}"${c.id ? ` id="${c.id}"` : ''}>${c.value}</div>
      <div class="hint">${c.hint}</div>`
    grid.appendChild(el)
    prevValues[c.label] = c.value
  })

  // Refresh rate is measured asynchronously
  measureRefreshRate(hz => {
    const r = document.getElementById('refresh')
    if (r) r.textContent = `${hz} Гц`
  })
}

render()

// Live update on window resize / zoom / orientation change
let t: ReturnType<typeof setTimeout>
function refresh(): void {
  clearTimeout(t)
  t = setTimeout(render, 120)
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
