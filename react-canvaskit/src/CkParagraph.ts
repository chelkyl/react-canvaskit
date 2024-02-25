import type { CanvasKit, FontMgr as SkFontManager, Paragraph as SkParagraph } from 'canvaskit-wasm'

import { isCkCanvas } from './CkCanvas'
import { toSkParagraphStyle } from './SkiaElementMapping'
import type {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  ParagraphStyle,
} from './SkiaElementTypes'

export type CkParagraphProps = {
  layout: number
  fontManager: SkFontManager
  x?: number
  y?: number
  children?: string
} & ParagraphStyle &
  CkElementProps<SkParagraph>

class CkParagraph implements CkElement<'ck-paragraph'> {
  skObject?: CkObjectTyping['ck-paragraph']['type']
  get skObjectType(): CkObjectTyping['ck-paragraph']['name'] {
    return 'SkParagraph'
  }
  get type(): 'ck-paragraph' {
    return 'ck-paragraph'
  }

  deleted = false

  constructor(
    readonly canvasKit: CanvasKit,
    readonly props: CkObjectTyping['ck-paragraph']['props'],
  ) {}

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error('BUG. paragraph element deleted.')
    }

    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      toSkParagraphStyle(this.canvasKit, this.props)!,
      this.props.fontManager,
    )
    if (this.props.children) {
      skParagraphBuilder.addText(this.props.children)
    }
    this.skObject?.delete()
    this.skObject = skParagraphBuilder.build()
    this.skObject.layout(this.props.layout)
    if (isCkCanvas(parent)) {
      parent.skObject?.drawParagraph(this.skObject, this.props.x ?? 0, this.props.y ?? 0)
    }
    // TODO we can avoid deleting & recreating the paragraph skobject by checkin props that require a new paragraph instance.
  }

  delete(): void {
    if (this.deleted) {
      return
    }
    this.deleted = true
    this.skObject?.delete()
  }
}

export const createCkParagraph: CkElementCreator<'ck-paragraph'> = (
  type,
  props,
  canvasKit,
): CkElement<'ck-paragraph'> => new CkParagraph(canvasKit, props)
