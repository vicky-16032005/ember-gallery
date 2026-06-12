import './style.css'
import * as THREE from 'three'
import gsap from 'gsap'
import { TILES, imgUrl } from './data.js'

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ============================== scene ================================ */

const RADIUS = 30
const COLS = 14
const ROWS = 5
const LAT_STEP = 0.31
const TILE_W = 10
const TILE_H = 8.1

const mount = document.getElementById('scene')
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
mount.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 120)
camera.rotation.order = 'YXZ'
scene.add(camera)

const MAX_ANISO = renderer.capabilities.getMaxAnisotropy()

/* ------------------- canvas label textures (shared) ------------------ */

const CAN_W = 640
const CAN_H = 520
const IMG_Y = 38
const IMG_H = 408

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawTile(ctx, tile, img) {
  ctx.clearRect(0, 0, CAN_W, CAN_H)
  ctx.textBaseline = 'alphabetic'

  // top labels: course left, name right
  ctx.font = '400 19px "Martian Mono", monospace'
  ctx.fillStyle = 'rgba(237,231,221,0.92)'
  ctx.fillText(tile.course, 2, 24)
  const name = tile.name.toUpperCase()
  ctx.font = '300 17px "Martian Mono", monospace'
  ctx.fillStyle = 'rgba(237,231,221,0.6)'
  let label = name
  while (ctx.measureText(label).width > 360 && label.length > 4) label = label.slice(0, -2)
  if (label !== name) label += '…'
  ctx.fillText(label, CAN_W - ctx.measureText(label).width - 2, 24)

  // image area
  if (img) {
    const scale = Math.max(CAN_W / img.width, IMG_H / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, IMG_Y, CAN_W, IMG_H)
    ctx.clip()
    ctx.drawImage(img, (CAN_W - dw) / 2, IMG_Y + (IMG_H - dh) / 2, dw, dh)
    ctx.restore()
  } else {
    ctx.fillStyle = '#15120f'
    ctx.fillRect(0, IMG_Y, CAN_W, IMG_H)
  }

  // bottom: tag chips left, price/year right
  ctx.font = '300 16px "Martian Mono", monospace'
  let x = 0
  const chipY = IMG_Y + IMG_H + 14
  for (const tag of tile.tags) {
    const w = ctx.measureText(tag).width + 22
    ctx.strokeStyle = 'rgba(237,231,221,0.35)'
    ctx.lineWidth = 1.5
    roundRect(ctx, x + 1, chipY, w, 34, 17)
    ctx.stroke()
    ctx.fillStyle = 'rgba(237,231,221,0.78)'
    ctx.fillText(tag, x + 12, chipY + 23)
    x += w + 9
  }
  ctx.fillStyle = 'rgba(237,231,221,0.6)'
  ctx.fillText(tile.right, CAN_W - ctx.measureText(tile.right).width - 2, chipY + 23)
}

const textures = TILES.map((tile) => {
  const canvas = document.createElement('canvas')
  canvas.width = CAN_W
  canvas.height = CAN_H
  const ctx = canvas.getContext('2d')
  drawTile(ctx, tile, null)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = MAX_ANISO
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    drawTile(ctx, tile, img)
    tex.needsUpdate = true
  }
  img.src = imgUrl(tile.img, 640)
  return tex
})

/* --------------------------- tile meshes ----------------------------- */

const wall = new THREE.Group()
scene.add(wall)

const geometry = new THREE.PlaneGeometry(TILE_W, TILE_H)
const meshes = []

for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLS; col++) {
    const idx = (col * 7 + row * 3) % TILES.length
    const lon = (col / COLS) * Math.PI * 2
    const lat = (row - (ROWS - 1) / 2) * LAT_STEP
    const material = new THREE.MeshBasicMaterial({
      map: textures[idx],
      transparent: true,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(
      RADIUS * Math.cos(lat) * Math.sin(lon),
      RADIUS * Math.sin(lat),
      -RADIUS * Math.cos(lat) * Math.cos(lon),
    )
    mesh.lookAt(0, 0, 0)
    const jitter = 0.92 + (((col * 13 + row * 29) % 8) / 8) * 0.14
    mesh.scale.setScalar(jitter)
    mesh.userData = { tile: TILES[idx], lon, lat, baseScale: jitter }
    wall.add(mesh)
    meshes.push(mesh)
  }
}

/* =========================== interaction ============================= */

const LAT_LIMIT = 0.62
const view = { lon: REDUCED ? 0 : -0.55, lat: 0 }
const target = { lon: 0, lat: 0 }

let dragging = false
let moved = 0
let lastX = 0
let lastY = 0
let velX = 0
let velY = 0
let lastInteraction = performance.now()

const DRAG_K = 0.0021

function clampLat() {
  target.lat = Math.max(-LAT_LIMIT, Math.min(LAT_LIMIT, target.lat))
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  dragging = true
  moved = 0
  lastX = e.clientX
  lastY = e.clientY
  velX = 0
  velY = 0
  lastInteraction = performance.now()
  mount.classList.add('is-dragging')
  renderer.domElement.setPointerCapture(e.pointerId)
})

renderer.domElement.addEventListener('pointermove', (e) => {
  if (dragging) {
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    lastX = e.clientX
    lastY = e.clientY
    moved += Math.abs(dx) + Math.abs(dy)
    target.lon -= dx * DRAG_K
    target.lat += dy * DRAG_K
    clampLat()
    velX = velX * 0.65 + dx * 0.35
    velY = velY * 0.65 + dy * 0.35
    lastInteraction = performance.now()
  } else {
    updateHover(e)
  }
})

renderer.domElement.addEventListener('pointerup', (e) => {
  dragging = false
  mount.classList.remove('is-dragging')
  lastInteraction = performance.now()
  if (moved < 7) {
    pick(e)
  } else {
    // momentum fling: lerp toward a further target gives lenis-style ease-out
    target.lon -= velX * 0.045
    target.lat += velY * 0.045
    clampLat()
  }
})

renderer.domElement.addEventListener('pointercancel', () => {
  dragging = false
  mount.classList.remove('is-dragging')
})

window.addEventListener(
  'wheel',
  (e) => {
    if (overlayOpen()) return
    target.lon += e.deltaX * 0.0011
    target.lat -= e.deltaY * 0.0011
    clampLat()
    lastInteraction = performance.now()
  },
  { passive: true },
)

/* ------------------------- hover + picking --------------------------- */

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
let hovered = null

function intersectAt(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(meshes)
  return hits.length ? hits[0].object : null
}

function updateHover(e) {
  const hit = intersectAt(e)
  if (hit === hovered) return
  if (hovered) {
    gsap.to(hovered.scale, {
      x: hovered.userData.baseScale,
      y: hovered.userData.baseScale,
      duration: REDUCED ? 0.01 : 0.45,
      ease: 'power2.out',
    })
  }
  hovered = hit
  mount.classList.toggle('is-hovering', !!hit)
  if (hit) {
    const s = hit.userData.baseScale * 1.045
    gsap.to(hit.scale, { x: s, y: s, duration: REDUCED ? 0.01 : 0.45, ease: 'power2.out' })
  }
}

function pick(e) {
  const hit = intersectAt(e)
  if (hit) openDetail(hit)
}

/* ========================== detail overlay =========================== */

const detailEl = document.getElementById('detail')
const detailImg = document.getElementById('detail-img')
const detailName = document.getElementById('detail-name')
const detailCourse = document.getElementById('detail-course')
const detailDesc = document.getElementById('detail-desc')
const detailMeta = document.getElementById('detail-meta')
const listEl = document.getElementById('list')

function overlayOpen() {
  return !detailEl.hidden || !listEl.hidden
}

function shortestTo(angle, from) {
  return from + ((((angle - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
}

function openDetail(mesh) {
  const tile = mesh.userData.tile
  detailImg.src = imgUrl(tile.img, 1200)
  detailImg.alt = tile.name
  detailCourse.textContent = tile.course
  detailName.textContent = tile.name
  detailDesc.textContent = tile.desc
  detailMeta.textContent = `${tile.tags.join(' · ')}\n${/^\d{4}$/.test(tile.right) ? 'SINCE ' + tile.right : tile.right + ' USD'}`
  detailEl.hidden = false

  // swing the camera to face the tile, zoom slightly, then page in
  target.lon = shortestTo(mesh.userData.lon, target.lon)
  target.lat = mesh.userData.lat * 0.9
  clampLat()

  if (REDUCED) {
    gsap.set(detailEl, { opacity: 1 })
    return
  }
  gsap.to(camera, {
    fov: 46,
    duration: 0.9,
    ease: 'power3.inOut',
    onUpdate: () => camera.updateProjectionMatrix(),
  })
  gsap
    .timeline()
    .fromTo(detailEl, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.18)
    .fromTo(
      '.detail-media',
      { clipPath: 'inset(12% 8% 12% 8%)', scale: 1.06 },
      { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 0.9, ease: 'power3.out' },
      0.28,
    )
    .fromTo(
      '.detail-copy > *',
      { y: 26, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, ease: 'power3.out' },
      0.4,
    )
}

function closeDetail() {
  if (detailEl.hidden) return
  if (REDUCED) {
    detailEl.hidden = true
    return
  }
  gsap.to(camera, {
    fov: 62,
    duration: 0.8,
    ease: 'power3.inOut',
    onUpdate: () => camera.updateProjectionMatrix(),
  })
  gsap.to(detailEl, {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete: () => {
      detailEl.hidden = true
      gsap.set(detailEl, { opacity: 1 })
    },
  })
}

document.getElementById('detail-close').addEventListener('click', closeDetail)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeDetail()
    closeList()
  }
})

/* ============================ list view ============================== */

const rowsEl = document.getElementById('list-rows')
rowsEl.innerHTML = TILES.map(
  (t, i) => `
  <button class="list-row" data-i="${i}">
    <span class="mono-label list-course">${t.course}</span>
    <span class="list-name">${t.name}</span>
    <span class="mono-label list-right">${t.right}</span>
  </button>`,
).join('')

rowsEl.addEventListener('click', (e) => {
  const row = e.target.closest('.list-row')
  if (!row) return
  const tile = TILES[Number(row.dataset.i)]
  const mesh = meshes.find((m) => m.userData.tile === tile)
  closeList()
  openDetail(mesh)
})

const viewSphereBtn = document.getElementById('view-sphere')
const viewListBtn = document.getElementById('view-list')

function setViewButtons(listActive) {
  viewSphereBtn.classList.toggle('is-active', !listActive)
  viewSphereBtn.setAttribute('aria-pressed', String(!listActive))
  viewListBtn.classList.toggle('is-active', listActive)
  viewListBtn.setAttribute('aria-pressed', String(listActive))
}

function openList() {
  closeDetail()
  listEl.hidden = false
  listEl.scrollTop = 0
  setViewButtons(true)
  if (!REDUCED) {
    gsap.fromTo(listEl, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' })
    gsap.fromTo(
      '.list-row',
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.025, ease: 'power3.out' },
    )
  }
}

function closeList() {
  if (listEl.hidden) return
  listEl.hidden = true
  setViewButtons(false)
}

viewListBtn.addEventListener('click', openList)
viewSphereBtn.addEventListener('click', () => {
  closeList()
  closeDetail()
})

/* ============================== sound ================================ */

let audio = null
const soundBtn = document.getElementById('sound')

function setSoundLabel(on) {
  soundBtn.textContent = on ? 'SOUND [ON]' : 'SOUND [OFF]'
  soundBtn.setAttribute('aria-pressed', String(on))
}

function startFire() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain()
  master.gain.value = 0.0
  master.connect(ctx.destination)
  const handle = { ctx, master }

  // bed: looped brown noise through a low rumble filter
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let lastOut = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    data[i] = lastOut * 3.2
  }
  const bed = ctx.createBufferSource()
  bed.buffer = buf
  bed.loop = true
  const bedFilter = ctx.createBiquadFilter()
  bedFilter.type = 'lowpass'
  bedFilter.frequency.value = 320
  bed.connect(bedFilter).connect(master)
  bed.start()

  // crackle: short bandpassed bursts at random intervals
  function pop() {
    if (audio !== handle) return
    const dur = 0.03 + Math.random() * 0.05
    const src = ctx.createBufferSource()
    const pbuf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate)
    const pdata = pbuf.getChannelData(0)
    for (let i = 0; i < pdata.length; i++) pdata[i] = (Math.random() * 2 - 1) * (1 - i / pdata.length)
    src.buffer = pbuf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 900 + Math.random() * 2200
    const g = ctx.createGain()
    g.gain.value = 0.25 + Math.random() * 0.5
    src.connect(bp).connect(g).connect(master)
    src.start()
    setTimeout(pop, 60 + Math.random() * 420)
  }
  pop()

  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 1.2)

  // autoplay policy: a context created without a gesture starts suspended,
  // so playback actually begins on the first interaction
  if (ctx.state === 'suspended') {
    const resume = () => {
      ctx.resume()
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
  }
  return handle
}

function stopFire() {
  const a = audio
  audio = null
  const t = a.ctx.currentTime
  a.master.gain.cancelScheduledValues(t)
  a.master.gain.setValueAtTime(a.master.gain.value, t)
  a.master.gain.linearRampToValueAtTime(0, t + 0.4)
  setTimeout(() => a.ctx.close(), 600)
}

soundBtn.addEventListener('click', () => {
  if (audio) {
    stopFire()
    setSoundLabel(false)
  } else {
    audio = startFire()
    setSoundLabel(true)
  }
})

// sound is on by default; the toggle turns it off
audio = startFire()
setSoundLabel(true)

/* ============================== clock ================================ */

const clockEl = document.getElementById('clock')
function tickClock() {
  const d = new Date()
  const offset = -d.getTimezoneOffset() / 60
  const gmt = `GMT${offset >= 0 ? '+' : ''}${offset}`
  clockEl.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${gmt}`
}
tickClock()
setInterval(tickClock, 30_000)

/* ============================ intro + loop =========================== */

const intro = document.getElementById('intro')

function removeIntro() {
  const el = document.getElementById('intro')
  if (el) el.remove()
}

// The intro must never gate the gallery: hard fallback even if tweens stall
// (hidden tab, rAF throttling).
setTimeout(removeIntro, 3500)

document.fonts.ready.then(() => {
  // redraw labels with the real mono font once it's available
  textures.forEach((tex, i) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      drawTile(tex.image.getContext('2d'), TILES[i], img)
      tex.needsUpdate = true
    }
    img.src = imgUrl(TILES[i].img, 640)
  })

  if (REDUCED || document.hidden) {
    removeIntro()
    return
  }
  gsap.to(intro, { opacity: 0, duration: 0.7, delay: 0.9, ease: 'power2.in', onComplete: removeIntro })
  meshes.forEach((mesh) => {
    mesh.material.opacity = 0
    const s = mesh.userData.baseScale
    mesh.scale.setScalar(s * 0.7)
    const delay = 1.0 + Math.random() * 0.9
    gsap.to(mesh.material, { opacity: 1, duration: 0.9, delay, ease: 'power2.out' })
    gsap.to(mesh.scale, { x: s, y: s, z: s, duration: 1.2, delay, ease: 'power3.out' })
  })
})

function frame() {
  // lenis-style critically-damped chase
  view.lon += (target.lon - view.lon) * 0.075
  view.lat += (target.lat - view.lat) * 0.075

  // slow drift when idle
  if (!REDUCED && !dragging && !overlayOpen() && performance.now() - lastInteraction > 4000) {
    target.lon += 0.00035
  }

  camera.rotation.set(view.lat, -view.lon, 0)
  renderer.render(scene, camera)
}

// gsap.ticker (not raw rAF) so the loop keeps a low-rate fallback in hidden
// tabs and shares one clock with the tweens.
gsap.ticker.add(frame)
frame()

// verification hook for driving the scene from devtools
window.__ember = { view, target, meshes, camera, frame, openDetail, gsap }

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})
