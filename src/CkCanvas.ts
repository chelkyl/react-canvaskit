import type { Canvas as SkCanvas, CanvasKit } from 'canvaskit-wasm'
import type { ReactNode } from 'react'

import { isCkSurface } from './CkSurface'
import { toSkColor } from './SkiaElementMapping'
import type {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  Color,
} from './SkiaElementTypes'

export type CkCanvasProps = {
  clear?: Color | string
  rotate?: { degree: number; px?: number; py?: number }
  children?: ReactNode
} & CkElementProps<SkCanvas>

type CkCanvasChild = CkElement<'ck-surface'> | CkElement<'ck-text'>

export class CkCanvas implements CkElementContainer<'ck-canvas'> {
  skObject?: CkObjectTyping['ck-canvas']['type']
  get skObjectType(): CkObjectTyping['ck-canvas']['name'] {
    return 'SkCanvas'
  }
  get type(): 'ck-canvas' {
    return 'ck-canvas'
  }

  children: CkCanvasChild[] = []

  private deleted = false

  constructor(
    readonly canvasKit: CanvasKit,
    readonly props: CkObjectTyping['ck-canvas']['props'],
  ) {}

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error('BUG. canvas element deleted.')
    }

    if (parent.skObject && isCkSurface(parent)) {
      if (this.skObject === undefined) {
        this.skObject = parent.skObject.getCanvas()
      }
    } else {
      throw new Error('Expected an initialized ck-surface as parent of ck-canvas')
    }

    this.skObject.save()
    this.drawSelf(this.skObject)
    for (const child of this.children) child.render(this)
    this.skObject.restore()
    parent.skObject?.flush()
  }

  delete(): void {
    if (this.deleted) {
      return
    }
    this.deleted = true
    // The canvas object is 1-to-1 linked to the parent surface object, so deleting it means we could never recreate it.
    // this.skObject?.delete()
    this.skObject = undefined
  }

  private drawSelf(skCanvas: SkCanvas): void {
    const skColor = toSkColor(this.canvasKit, this.props.clear)
    if (skColor) {
      skCanvas.clear(skColor)
    }

    if (this.props.rotate) {
      const { degree, px, py } = this.props.rotate
      skCanvas.rotate(degree, px ?? 0, py ?? 0)
    }
  }
}

export function isCkCanvas(ckElement: CkElement<any>): ckElement is CkCanvas {
  return ckElement.type === 'ck-canvas'
}

export const createCkCanvas: CkElementCreator<'ck-canvas'> = (
  type,
  props,
  canvasKit: CanvasKit,
): CkElementContainer<'ck-canvas'> => new CkCanvas(canvasKit, props)
