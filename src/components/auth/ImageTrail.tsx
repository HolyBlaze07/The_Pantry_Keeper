import { gsap } from 'gsap'
import { type JSX, useEffect, useRef } from 'react'

import './ImageTrail.css'

function lerp(a: number, b: number, n: number): number {
  return (1 - n) * a + n * b
}

function getLocalPointerPos(
  event: MouseEvent | TouchEvent,
  rect: DOMRect,
): { x: number; y: number } {
  let clientX = 0
  let clientY = 0

  if ('touches' in event && event.touches.length > 0) {
    clientX = event.touches[0].clientX
    clientY = event.touches[0].clientY
  } else if ('clientX' in event) {
    clientX = event.clientX
    clientY = event.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

function getMouseDistance(
  first: { x: number; y: number },
  second: { x: number; y: number },
): number {
  const dx = first.x - second.x
  const dy = first.y - second.y
  return Math.hypot(dx, dy)
}

class ImageItem {
  public DOM: { el: HTMLDivElement; inner: HTMLDivElement | null } = {
    el: null as unknown as HTMLDivElement,
    inner: null,
  }

  public defaultStyle: gsap.TweenVars = {
    scale: 1,
    x: 0,
    y: 0,
    opacity: 0,
  }

  public rect: DOMRect | null = null
  private resize!: () => void

  constructor(DOMElement: HTMLDivElement) {
    this.DOM.el = DOMElement
    this.DOM.inner = this.DOM.el.querySelector('.content__img-inner')
    this.getRect()
    this.initEvents()
  }

  private initEvents() {
    this.resize = () => {
      gsap.set(this.DOM.el, this.defaultStyle)
      this.getRect()
    }

    window.addEventListener('resize', this.resize)
  }

  private getRect() {
    this.rect = this.DOM.el.getBoundingClientRect()
  }

  public destroy() {
    window.removeEventListener('resize', this.resize)
  }
}

class ImageTrailVariant1 {
  private container: HTMLDivElement
  private images: ImageItem[]
  private imagesTotal: number
  private imgPosition: number
  private zIndexVal: number
  private activeImagesCount: number
  private isIdle: boolean
  private threshold: number
  private mousePos: { x: number; y: number }
  private lastMousePos: { x: number; y: number }
  private cacheMousePos: { x: number; y: number }
  private rafId: number | null = null
  private destroyed = false
  private handlePointerMove!: (event: MouseEvent | TouchEvent) => void
  private initRender!: (event: MouseEvent | TouchEvent) => void

  constructor(container: HTMLDivElement) {
    this.container = container
    this.images = [...container.querySelectorAll('.content__img')].map(
      (imageElement) => new ImageItem(imageElement as HTMLDivElement),
    )
    this.imagesTotal = this.images.length
    this.imgPosition = 0
    this.zIndexVal = 1
    this.activeImagesCount = 0
    this.isIdle = true
    this.threshold = 60
    this.mousePos = { x: 0, y: 0 }
    this.lastMousePos = { x: 0, y: 0 }
    this.cacheMousePos = { x: 0, y: 0 }

    const handlePointerMove = (event: MouseEvent | TouchEvent) => {
      const rect = this.container.getBoundingClientRect()
      this.mousePos = getLocalPointerPos(event, rect)
    }

    this.container.addEventListener('mousemove', handlePointerMove)
    this.container.addEventListener('touchmove', handlePointerMove)

    const initRender = (event: MouseEvent | TouchEvent) => {
      const rect = this.container.getBoundingClientRect()
      this.mousePos = getLocalPointerPos(event, rect)
      this.cacheMousePos = { ...this.mousePos }
      this.rafId = requestAnimationFrame(() => this.render())
      this.container.removeEventListener('mousemove', initRender as EventListener)
      this.container.removeEventListener('touchmove', initRender as EventListener)
    }

    this.container.addEventListener('mousemove', initRender as EventListener)
    this.container.addEventListener('touchmove', initRender as EventListener)

    this.handlePointerMove = handlePointerMove
    this.initRender = initRender
  }

  private render() {
    if (this.destroyed) {
      return
    }

    const distance = getMouseDistance(this.mousePos, this.lastMousePos)
    this.cacheMousePos.x = lerp(this.cacheMousePos.x, this.mousePos.x, 0.12)
    this.cacheMousePos.y = lerp(this.cacheMousePos.y, this.mousePos.y, 0.12)

    if (distance > this.threshold) {
      this.showNextImage()
      this.lastMousePos = { ...this.mousePos }
    }

    if (this.isIdle && this.zIndexVal !== 1) {
      this.zIndexVal = 1
    }

    this.rafId = requestAnimationFrame(() => this.render())
  }

  private showNextImage() {
    ++this.zIndexVal
    this.imgPosition =
      this.imgPosition < this.imagesTotal - 1 ? this.imgPosition + 1 : 0

    const image = this.images[this.imgPosition]

    gsap.killTweensOf(image.DOM.el)
    gsap
      .timeline({
        onStart: () => this.onImageActivated(),
        onComplete: () => this.onImageDeactivated(),
      })
      .fromTo(
        image.DOM.el,
        {
          opacity: 1,
          scale: 1,
          zIndex: this.zIndexVal,
          x: this.cacheMousePos.x - (image.rect?.width ?? 0) / 2,
          y: this.cacheMousePos.y - (image.rect?.height ?? 0) / 2,
          rotation: gsap.utils.random(-8, 8),
        },
        {
          duration: 0.35,
          ease: 'power1.out',
          x: this.mousePos.x - (image.rect?.width ?? 0) / 2,
          y: this.mousePos.y - (image.rect?.height ?? 0) / 2,
        },
        0,
      )
      .to(
        image.DOM.el,
        {
          duration: 0.45,
          ease: 'power3.out',
          opacity: 0,
          scale: 0.25,
        },
        0.35,
      )
  }

  public destroy() {
    this.destroyed = true

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    this.container.removeEventListener(
      'mousemove',
      this.handlePointerMove as EventListener,
    )
    this.container.removeEventListener(
      'touchmove',
      this.handlePointerMove as EventListener,
    )
    this.container.removeEventListener('mousemove', this.initRender as EventListener)
    this.container.removeEventListener('touchmove', this.initRender as EventListener)

    this.images.forEach((image) => {
      gsap.killTweensOf(image.DOM.el)
      image.destroy()
    })
  }

  private onImageActivated() {
    this.activeImagesCount++
    this.isIdle = false
  }

  private onImageDeactivated() {
    this.activeImagesCount--
    if (this.activeImagesCount === 0) {
      this.isIdle = true
    }
  }
}

interface ImageTrailProps {
  items?: string[]
}

export default function ImageTrail({ items = [] }: ImageTrailProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || items.length === 0) {
      return
    }

    const instance = new ImageTrailVariant1(containerRef.current)

    return () => {
      instance.destroy()
    }
  }, [items])

  return (
    <div className="content" ref={containerRef}>
      {items.map((url, index) => (
        <div className="content__img" key={`${url}-${index}`}>
          <div className="content__img-inner" style={{ backgroundImage: `url(${url})` }} />
        </div>
      ))}
    </div>
  )
}
