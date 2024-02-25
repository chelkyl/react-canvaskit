import type { CanvasKit, Canvas as SkCanvas, Paint as SkPaint, Surface as SkSurface } from 'canvaskit-wasm'
import type { ReactElement } from 'react'

import type { CkCanvasProps } from './CkCanvas'
import { isCkCanvas } from './CkCanvas'
import { toSkPaint } from './SkiaElementMapping'
import type {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  Paint,
} from './SkiaElementTypes'

export type CkSurfaceProps = {
  width: number
  height: number
  dx?: number
  dy?: number
  paint?: Paint

  children?: ReactElement<CkCanvasProps> | ReactElement<CkCanvasProps>[]
} & CkElementProps<SkSurface>

export class CkSurface implements CkElementContainer<'ck-surface'> {
  skObject?: CkObjectTyping['ck-surface']['type']
  get skObjectType(): CkObjectTyping['ck-surface']['name'] {
    return 'SkSurface'
  }
  get type(): 'ck-surface' {
    return 'ck-surface'
  }
  children: CkElementContainer<'ck-canvas'>[] = []

  deleted = false

  readonly defaultPaint: SkPaint
  private renderPaint?: SkPaint

  constructor(
    readonly canvasKit: CanvasKit,
    readonly props: CkObjectTyping['ck-surface']['props'],
  ) {
    this.defaultPaint = new this.canvasKit.Paint()
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error('BUG. surface element deleted.')
    }

    if (parent.skObject && isCkCanvas(parent)) {
      if (this.skObject === undefined) {
        const { width, height } = this.props
        this.skObject = this.canvasKit.MakeSurface(width, height) ?? undefined
        if (this.skObject === undefined) {
          throw new Error('Failed to create a cpu backed skia surface.')
        }
      }
    } else {
      throw new Error('Expected an initialized ck-canvas as parent of ck-surface')
    }

    for (const child of this.children) child.render(this)
    this.drawSelf(parent.skObject, this.skObject)
  }

  delete(): void {
    if (this.deleted) {
      return
    }
    this.deleted = true
    this.defaultPaint.delete()
    this.renderPaint?.delete()
    this.renderPaint = undefined
    this.skObject?.delete()
    this.skObject = undefined
  }

  private drawSelf(parent: SkCanvas, skSurface: SkSurface): void {
    const skImage = skSurface.makeImageSnapshot()
    const { dx, dy, paint } = this.props
    // TODO we can be smart and only recreate the paint object if the paint props have changed.
    this.renderPaint?.delete()
    this.renderPaint = toSkPaint(this.canvasKit, paint)
    parent.drawImage(skImage, dx ?? 0, dy ?? 0, this.renderPaint ?? this.defaultPaint)
  }
}

export const createCkSurface: CkElementCreator<'ck-surface'> = (
  type,
  props,
  canvasKit,
): CkElementContainer<'ck-surface'> => new CkSurface(canvasKit, props)

export function isCkSurface(ckElement: CkElement<any>): ckElement is CkSurface {
  return ckElement.type === 'ck-surface'
}
