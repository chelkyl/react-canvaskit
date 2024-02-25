import type { CanvasKit, FontMgr as SkFontManager } from 'canvaskit-wasm'
import CanvasKitInit from 'canvaskit-wasm'
import type { FunctionComponent, ReactNode } from 'react'
import type { HostConfig } from 'react-reconciler'
import ReactReconciler from 'react-reconciler'
import { DefaultEventPriority } from 'react-reconciler/constants'

import type { CkElement, CkElementContainer, CkElementType, CkObjectTyping } from './SkiaElementTypes'
import { createCkElement, isContainerElement } from './SkiaElementTypes'

const loadRobotoFontData = async (): Promise<ArrayBuffer> => {
  const response = await fetch('https://storage.googleapis.com/skia-cdn/misc/Roboto-Regular.ttf')
  return response.arrayBuffer()
}

const canvasKitPromise: Promise<CanvasKit> = CanvasKitInit({
  locateFile: (file: string): string => `https://unpkg.com/canvaskit-wasm@0.39.1/bin/${file}`,
})

let canvasKit: CanvasKit | undefined

let CanvasKitContext: React.Context<CanvasKit>
export let useCanvasKit: () => CanvasKit
export let CanvasKitProvider: FunctionComponent

let FontManagerContext: React.Context<SkFontManager>
export let useFontManager: () => SkFontManager
export let FontManagerProvider: FunctionComponent<{ fontData: ArrayBuffer[] | undefined; children?: ReactNode }>

export async function init(): Promise<void> {
  canvasKit = await canvasKitPromise
  const robotoFontData = await loadRobotoFontData()
  // const copy to make the TS compiler happy when we pass it down to a lambda
  const ck = canvasKit

  CanvasKitContext = React.createContext(ck)
  useCanvasKit = () => React.useContext(CanvasKitContext)
  CanvasKitProvider = ({ children }) => {
    // @ts-ignore
    return <CanvasKitContext.Provider value={ck}>{children}</CanvasKitContext.Provider>
  }

  const defaultFontManager = ck.FontMgr.FromData(robotoFontData) as SkFontManager
  FontManagerContext = React.createContext(defaultFontManager)
  useFontManager = () => React.useContext(FontManagerContext)
  FontManagerProvider = (props: { readonly fontData: ArrayBuffer[] | undefined; readonly children?: ReactNode }) => {
    if (props.fontData) {
      const fontMgrFromData = ck.FontMgr.FromData(...props.fontData)
      if (fontMgrFromData === null) {
        throw new Error('Failed to create font manager from font data.')
      }

      // @ts-ignore
      return <FontManagerContext.Provider value={fontMgrFromData}>{props.children}</FontManagerContext.Provider>
    }
    // @ts-ignore
    return <FontManagerContext.Provider value={defaultFontManager}>{props.children}</FontManagerContext.Provider>
  }
}

type ContainerContext = {
  ckElement: CkElement<CkElementType>
}

export interface SkObjectRef<T> {
  current: T
}

type ReactCanvasKitHostConfig<
  TypeName extends CkElementType,
  Props extends CkObjectTyping[TypeName]['props'] = CkObjectTyping[TypeName]['props'],
  PublicInstance extends CkObjectTyping[TypeName]['type'] = CkObjectTyping[TypeName]['type'],
  ExtraProps extends Record<string, any> = Record<string, unknown>,
> = ExtraProps &
  HostConfig<
    TypeName, // Type
    Props, // Props
    CkElementContainer<TypeName>, // Container
    CkElement<TypeName>, // Instance
    CkElement<'ck-paragraph'> | CkElement<'ck-text'>, // TextInstance
    unknown, // SuspenseInstance
    unknown, // HydratableInstance
    PublicInstance | undefined, // PublicInstance // FIXME: what type?
    ContainerContext, // HostContext
    unknown, // UpdatePayload
    Array<CkElement<TypeName>>, // _ChildSet
    undefined, // TimeoutHandle
    -1 // NoTimeout
  >

// TODO implement missing functions
const hostConfig: ReactCanvasKitHostConfig<CkElementType> = {
  // -------------------
  //        Modes
  // -------------------
  // supportsPersistence is true
  supportsMutation: false,
  // If your target platform has immutable trees, you'll want the **persistent mode** instead. In that mode, existing nodes are never mutated, and instead every change clones the parent tree and then replaces the whole parent tree at the root. This is the node used by the new React Native renderer, codenamed "Fabric".
  supportsPersistence: true,

  // -------------------
  //    Core Methods
  // -------------------

  /**
   * Create instance is called on all host nodes except the leaf text nodes. So we should return the correct view
   * element for each host type here. We are also supposed to take care of the props sent to the host element. For
   * example: setting up onClickListeners or setting up styling etc.
   *
   * This method should return a newly created node. For example, the DOM renderer would call `document.createElement(type)` here and then set the properties from `props`.
   *
   * You can use `rootContainer` to access the root container associated with that tree. For example, in the DOM renderer, this is useful to get the correct `document` reference that the root belongs to.
   *
   * The `hostContext` parameter lets you keep track of some information about your current place in the tree. To learn more about it, see `getChildHostContext` below.
   *
   * The `internalHandle` data structure is meant to be opaque. If you bend the rules and rely on its internal fields, be aware that it may change significantly between versions. You're taking on additional maintenance risk by reading from it, and giving up all guarantees if you write something to it.
   *
   * This method happens **in the render phase**. It can (and usually should) mutate the node it has just created before returning it, but it must not modify any other nodes. It must not register any event handlers on the parent tree. This is because an instance being created doesn't guarantee it would be placed in the tree — it could be left unused and later collected by GC. If you need to do something when an instance is definitely in the tree, look at `commitMount` instead.
   *
   * @param type - This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props - Contains the props passed to the host react element.
   * @param rootContainerInstance - Root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext - Contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   * @param internalInstanceHandle - The fiber node for the text instance. This manages work for this instance.
   */
  // eslint-disable-next-line max-params
  createInstance<T extends CkElementType>(
    type: T,
    props: CkObjectTyping[T]['props'],
    rootContainerInstance: CkElementContainer<CkElementType>,
    hostContext: ContainerContext,
    internalInstanceHandle: any,
  ): CkElement<T> {
    return createCkElement(type, props, hostContext.ckElement.canvasKit)
  },

  /**
   * Here we specify how the renderer should handle the text content.
   *
   * Same as `createInstance`, but for text nodes. If your renderer doesn't support text nodes, you can throw here.
   *
   * @param text - Contains the text string that needs to be rendered.
   * @param rootContainerInstance - Root dom node you specify while calling render. This is most commonly
   * <div id="root"></div>
   * @param hostContext - Contains the context from the host node enclosing this text node. For example, in the case of
   * <p>Hello</p>: currentHostContext for Hello text node will be host context of p.
   * @param internalInstanceHandle - The fiber node for the text instance. This manages work for this instance.
   * @returns This should be an actual text view element. In case of dom it would be a textNode.
   */
  createTextInstance(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle,
  ): CkElement<'ck-paragraph'> | CkElement<'ck-text'> {
    throw new Error(`The text '${text}' must be wrapped in a ck-text or ck-paragraph element.`)
  },

  /**
   * Here we will attach the child dom node to the parent on the initial render phase. This method will be called for
   * each child of the current node.
   *
   * This method should mutate the `parentInstance` and add the child to its list of children. For example, in the DOM this would translate to a `parentInstance.appendChild(child)` call.
   *
   * This method happens **in the render phase**. It can mutate `parentInstance` and `child`, but it must not modify any other nodes. It's called while the tree is still being built up and not connected to the actual tree on the screen.
   *
   * @param parentInstance - The current node in the traversal
   * @param child - The child dom node of the current node.
   */
  appendInitialChild(parentInstance: CkElement<CkElementType>, child: CkElement<CkElementType>) {
    if (isContainerElement(parentInstance)) {
      parentInstance.children.push(child)
    } else {
      throw new Error('Bug? Trying to append a child to a parent that is not a container.')
    }
  },

  /**
   * In react native renderer, this function does nothing but return false.
   *
   * In react-dom, this adds default dom properties such as event listeners, etc.
   * For implementing auto focus for certain input elements (autofocus can happen only
   * after render is done), react-dom sends return type as true. This results in commitMount
   * method for this element to be called. The commitMount will be called only if an element
   * returns true in finalizeInitialChildren and after the all elements of the tree has been
   * rendered (even after resetAfterCommit).
   *
   * In this method, you can perform some final mutations on the `instance`. Unlike with `createInstance`, by the time `finalizeInitialChildren` is called, all the initial children have already been added to the `instance`, but the instance itself has not yet been connected to the tree on the screen.
   *
   * This method happens **in the render phase**. It can mutate `instance`, but it must not modify any other nodes. It's called while the tree is still being built up and not connected to the actual tree on the screen.
   *
   * There is a second purpose to this method. It lets you specify whether there is some work that needs to happen when the node is connected to the tree on the screen. If you return `true`, the instance will receive a `commitMount` call later. See its documentation below.
   *
   * If you don't want to do anything here, you should return `false`.
   *
   * @param parentInstance - The instance is the dom element after appendInitialChild.
   * @param type - This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props - Contains the props passed to the host react element.
   * @param rootContainerInstance - Root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext - Contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   */
  finalizeInitialChildren(parentInstance, type, props, rootContainerInstance, hostContext) {
    return false
  },

  /**
   * React calls this method so that you can compare the previous and the next props, and decide whether you need to update the underlying instance or not. If you don't need to update it, return `null`. If you need to update it, you can return an arbitrary object representing the changes that need to happen. Then in `commitUpdate` you would need to apply those changes to the instance.
   *
   * This method happens **in the render phase**. It should only *calculate* the update — but not apply it! For example, the DOM renderer returns an array that looks like `[prop1, value1, prop2, value2, ...]` for all props that have actually changed. And only in `commitUpdate` it applies those changes. You should calculate as much as you can in `prepareUpdate` so that `commitUpdate` can be very fast and straightforward.
   *
   * See the meaning of `rootContainer` and `hostContext` in the `createInstance` documentation.
   */
  // eslint-disable-next-line max-params
  prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, hostContext) {
    // TODO check & return if we can need to create an entire new object or we can reuse the underlying skobject and use it as the payload in cloneInstance.
    return null
  },

  /**
   * If the function returns true, the text would be created inside the host element and no new text element would be
   * created separately.
   *
   * If this returned true, the next call would be to createInstance for the current element and traversal would stop at
   * this node (children of this element wont be traversed).
   *
   * If it returns false, getChildHostContext and shouldSetTextContent will be called on the child elements and it will
   * continue till shouldSetTextContent returns true or if the recursion reaches the last tree endpoint which usually is
   * a text node. When it reaches the last leaf text node it will call createTextInstance
   *
   * Some target platforms support setting an instance's text content without manually creating a text node. For example, in the DOM, you can set `node.textContent` instead of creating a text node and appending it.
   *
   * If you return `true` from this method, React will assume that this node's children are text, and will not create nodes for them. It will instead rely on you to have filled that text during `createInstance`. This is a performance optimization. For example, the DOM renderer returns `true` only if `type` is a known text-only parent (like `'textarea'`) or if `props.children` has a `'string'` type. If you return `true`, you will need to implement `resetTextContent` too.
   *
   * If you don't want to do anything here, you should return `false`.
   *
   * This method happens **in the render phase**. Do not mutate the tree from it.
   *
   * @param type - This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props - Contains the props passed to the host react element.
   * @returns This should be a boolean value.
   */
  shouldSetTextContent(type, props): boolean {
    return type === 'ck-text' || type === 'ck-paragraph'
  },

  /**
   * This function lets you share some context with the other functions in this HostConfig.
   *
   * This method lets you return the initial host context from the root of the tree. See `getChildHostContext` for the explanation of host context.
   *
   * If you don't intend to use host context, you can return `null`.
   *
   * This method happens **in the render phase**. Do not mutate the tree from it.
   *
   * @param rootContainerInstance - is basically the root dom node you specify while calling render. This is most commonly
   * <div id="root"></div>
   * @returns A context object that you wish to pass to immediate child.
   */
  getRootHostContext(rootContainerInstance: CkElementContainer<CkElementType>): ContainerContext {
    return { ckElement: rootContainerInstance }
  },

  /**
   * This function provides a way to access context from the parent and also a way to pass some context to the immediate
   * children of the current node. Context is basically a regular object containing some information.
   *
   * Host context lets you track some information about where you are in the tree so that it's available inside `createInstance` as the `hostContext` parameter. For example, the DOM renderer uses it to track whether it's inside an HTML or an SVG tree, because `createInstance` implementation needs to be different for them.
   *
   * If the node of this `type` does not influence the context you want to pass down, you can return `parentHostContext`. Alternatively, you can return any custom object representing the information you want to pass down.
   *
   * If you don't want to do anything here, return `parentHostContext`.
   *
   * This method happens **in the render phase**. Do not mutate the tree from it.
   *
   * @param parentHostContext - Context from parent. Example: This will contain rootContext for the immediate child of
   * roothost.
   * @param type - This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param rootContainerInstance - rootInstance is basically the root dom node you specify while calling render. This is
   * most commonly <div id="root"></div>
   * @returns A context object that you wish to pass to immediate child.
   */
  getChildHostContext(
    parentHostContext: ContainerContext,
    type: CkElementType,
    rootContainerInstance: CkElementContainer<CkElementType>,
  ): ContainerContext {
    return parentHostContext
  },

  /**
   * Determines what object gets exposed as a ref. You'll likely want to return the `instance` itself. But in some cases it might make sense to only expose some part of it.
   *
   * If you don't want to do anything here, return `instance`.
   *
   * @param instance - The element to get the ref of.
   * @returns The underlying skObject ref.
   */
  getPublicInstance<T extends CkElementType>(instance: CkElement<T>) {
    return instance.skObject
  },

  /**
   * This function is called when we have made a in-memory render tree of all the views (Remember we are yet to attach
   * it the the actual root dom node). Here we can do any preparation that needs to be done on the rootContainer before
   * attaching the in memory render tree. For example: In the case of react-dom, it keeps track of all the currently
   * focused elements, disabled events temporarily, etc.
   *
   * This method lets you store some information before React starts making changes to the tree on the screen. For example, the DOM renderer stores the current text selection so that it can later restore it. This method is mirrored by `resetAfterCommit`.
   *
   * Even if you don't want to do anything here, you need to return `null` from it.
   *
   * @param containerInfo - The root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  prepareForCommit(containerInfo) {
    return null
  },

  /**
   * This function gets executed after the in-memory tree has been attached to the root dom element. Here we can do any
   * post attach operations that needs to be done. For example: react-dom re-enabled events which were temporarily
   * disabled in prepareForCommit and refocuses elements, etc.
   *
   * This method is called right after React has performed the tree mutations. You can use it to restore something you've stored in `prepareForCommit` — for example, text selection.
   *
   * You can leave it empty.
   *
   * @param containerInfo - The root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  resetAfterCommit(containerInfo: CkElementContainer<CkElementType>) {
    // TODO instead of re-rendering everything, only rerender dirty nodes?
    for (const child of containerInfo.children) child.render(containerInfo)
    if ('renderCallback' in containerInfo) {
      containerInfo.props.renderCallback?.()
    }
  },

  /**
   * This method is called for a container that's used as a portal target. Usually you can leave it empty.
   */
  preparePortalMount(containerInfo): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  /**
   * You can proxy this to `setTimeout` or its equivalent in your environment.
   */
  scheduleTimeout(fn: (...args: unknown[]) => unknown, delay?: number): undefined {
    // eslint-disable-next-line no-useless-return
    return
  },

  /**
   * You can proxy this to `clearTimeout` or its equivalent in your environment.
   */
  cancelTimeout(id: undefined): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  /**
   * This is a property (not a function) that should be set to something that can never be a valid timeout ID. For example, you can set it to `-1`.
   */
  noTimeout: -1,

  /**
   * Set this to `true` to indicate that your renderer supports `scheduleMicrotask`. We use microtasks as part of our discrete event implementation in React DOM. If you're not sure if your renderer should support this, you probably should. The option to not implement `scheduleMicrotask` exists so that platforms with more control over user events, like React Native, can choose to use a different mechanism.
   */
  supportsMicrotasks: false,

  /**
   * Optional. You can proxy this to `queueMicrotask` or its equivalent in your environment.
   */
  scheduleMicrotask: undefined,

  /**
   * This is a property (not a function) that should be set to `true` if your renderer is the main one on the page. For example, if you're writing a renderer for the Terminal, it makes sense to set it to `true`, but if your renderer is used *on top of* React DOM or some other existing renderer, set it to `false`.
   */
  isPrimaryRenderer: false,

  /**
   * Whether the renderer shouldn't trigger missing `act()` warnings
   */
  warnsIfNotActing: true, // FIXME: what does this mean?

  /**
   * The constant you return depends on which event, if any, is being handled right now. (In the browser, you can check this using `window.event && window.event.type`).
   *
   * - **Discrete events**: If the active event is directly caused by the user (such as mouse and keyboard events) and each event in a sequence is intentional (e.g. click), return DiscreteEventPriority. This tells React that they should interrupt any background work and cannot be batched across time.
   *
   * - **Continuous events**: If the active event is directly caused by the user but the user can't distinguish between individual events in a sequence (e.g. mouseover), return ContinuousEventPriority. This tells React they should interrupt any background work but can be batched across time.
   *
   * - **Other events / No active event**: In all other cases, return DefaultEventPriority. This tells React that this event is considered background work, and interactive events will be prioritized over it.
   *
   * You can consult the `getCurrentEventPriority()` implementation in `ReactDOMHostConfig.js` for a reference implementation.
   */
  getCurrentEventPriority() {
    return DefaultEventPriority
  },

  getInstanceFromNode(node: any): undefined {
    // eslint-disable-next-line no-useless-return
    return
  },

  beforeActiveInstanceBlur(): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  afterActiveInstanceBlur(): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  prepareScopeUpdate(scopeInstance: any, instance: any): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  getInstanceFromScope(scopeInstance: any): null {
    // eslint-disable-next-line no-useless-return
    return null
  },

  detachDeletedInstance(node: any): void {
    // eslint-disable-next-line no-useless-return
    return
  },

  // -------------------
  //  Mutation Methods
  //    (not applicable)
  // -------------------

  appendChild: undefined,
  appendChildToContainer: undefined,
  insertBefore: undefined,
  insertInContainerBefore: undefined,
  removeChild: undefined,
  removeChildFromContainer: undefined,
  resetTextContent: undefined,
  commitTextUpdate: undefined,
  commitMount: undefined,
  commitUpdate: undefined,
  hideInstance: undefined,
  hideTextInstance: undefined,
  unhideInstance: undefined,
  unhideTextInstance: undefined,
  clearContainer: undefined,

  // -------------------
  // Persistence Methods
  //    (applicable)
  //  If you use the persistent mode instead of the mutation mode, you would still need the "Core Methods". However, instead of the Mutation Methods above you will implement a different set of methods that performs cloning nodes and replacing them at the root level. You can find a list of them in the "Persistence" section [listed in this file](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js). File an issue if you need help.
  // -------------------

  // eslint-disable-next-line max-params
  cloneInstance<T extends CkElementType>(
    instance: CkElement<T>,
    updatePayload: undefined,
    type: T,
    oldProps: CkObjectTyping[T]['props'],
    newProps: CkObjectTyping[T]['props'],
    internalInstanceHandle: SkObjectRef<any>, // FIXME: type?
    keepChildren: boolean,
    recyclableInstance: CkElement<T>,
  ): CkElement<T> {
    // TODO implement a way where we can create a new instance and reuse the underlying canvaskit objects where possible

    const ckElement = createCkElement(type, newProps, instance.canvasKit)
    if (keepChildren && isContainerElement(ckElement) && isContainerElement(instance)) {
      ckElement.children = instance.children
    }

    // recyclableInstance.props = newProps
    // return recyclableInstance
    return ckElement
  },

  createContainerChildSet(container: CkElementContainer<CkElementType>): Array<CkElement<CkElementType>> {
    return []
  },

  /**
   * Attaches new children to the set returned by createContainerChildSet
   * @param childSet - The set to attach to
   * @param child - The child to attach
   */
  appendChildToContainerChildSet(childSet: Array<CkElement<CkElementType>>, child: CkElement<CkElementType>) {
    childSet.push(child)
  },

  finalizeContainerChildren(container: CkElementContainer<any>, newChildren: Array<CkElement<any>>) {
    // eslint-disable-next-line no-useless-return
    return
  },

  replaceContainerChildren(container: CkElementContainer<any>, newChildren: Array<CkElement<any>>) {
    for (const child of container.children) child.delete()
    container.children = newChildren
  },

  cloneHiddenInstance<T extends CkElementType>(
    instance: CkElement<T>,
    type: T,
    props: CkObjectTyping[T]['props'],
    internalInstanceHandle: unknown,
  ): CkElement<T> {
    // eslint-disable-next-line no-useless-return
    // FIXME: create clone
    return instance
  },

  cloneHiddenTextInstance(
    instance: CkElement<'ck-paragraph'> | CkElement<'ck-text'>,
    text: 'ck-paragraph' | 'ck-text',
    internalInstanceHandle: unknown,
  ): CkElement<'ck-paragraph'> | CkElement<'ck-text'> {
    // eslint-disable-next-line no-useless-return
    // FIXME: create clone
    return instance
  },

  // -------------------
  // Hydration Methods
  //    (not applicable)
  // You can optionally implement hydration to "attach" to the existing tree during the initial render instead of creating it from scratch. For example, the DOM renderer uses this to attach to an HTML markup.
  //
  // To support hydration, you need to declare `supportsHydration: true` and then implement the methods in the "Hydration" section [listed in this file](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/forks/ReactFiberHostConfig.custom.js). File an issue if you need help.
  // -------------------
  supportsHydration: false,

  canHydrateInstance: undefined,
  canHydrateTextInstance: undefined,
  canHydrateSuspenseInstance: undefined,
  isSuspenseInstancePending: undefined,
  isSuspenseInstanceFallback: undefined,
  registerSuspenseInstanceRetry: undefined,
  getNextHydratableSibling: undefined,
  getFirstHydratableChild: undefined,
  hydrateInstance: undefined,
  hydrateTextInstance: undefined,
  hydrateSuspenseInstance: undefined,
  getNextHydratableInstanceAfterSuspenseInstance: undefined,
  getParentSuspenseInstance: undefined,
  commitHydratedContainer: undefined,
  commitHydratedSuspenseInstance: undefined,
  didNotMatchHydratedContainerTextInstance: undefined,
  didNotMatchHydratedTextInstance: undefined,
  didNotHydrateContainerInstance: undefined,
  didNotHydrateInstance: undefined,
  didNotFindHydratableContainerInstance: undefined,
  didNotFindHydratableContainerTextInstance: undefined,
  didNotFindHydratableContainerSuspenseInstance: undefined,
  didNotFindHydratableInstance: undefined,
  didNotFindHydratableTextInstance: undefined,
  didNotFindHydratableSuspenseInstance: undefined,
  errorHydratingContainer: undefined,
}

const canvaskitReconciler = ReactReconciler(hostConfig)
canvaskitReconciler.injectIntoDevTools({
  bundleType: 1, // 0 for PROD, 1 for DEV
  version: '0.0.1', // version for your renderer
  rendererPackageName: 'react-canvaskit', // package name
})

export async function render(
  element: ReactNode,
  canvas: HTMLCanvasElement,
  renderCallback?: () => void,
): Promise<void> {
  if (canvasKit === undefined) {
    throw new Error('Not initialized')
  }

  const rootTag = 0 // legacy mode

  const skSurface = canvasKit.MakeWebGLCanvasSurface(canvas)
  if (skSurface === null) {
    throw new Error('Failed to create surface from canvas.')
  }

  const ckSurfaceElement: CkElementContainer<'ck-surface'> = {
    canvasKit,
    type: 'ck-surface',
    props: { width: canvas.width, height: canvas.height, renderCallback },
    skObjectType: 'SkSurface',
    skObject: skSurface,
    children: [],
    render() {
      for (const child of this.children) child.render(ckSurfaceElement)
    },
    delete() {
      return
    },
  }

  const container: CkElementContainer<'ck-surface'> = canvaskitReconciler.createContainer(
    ckSurfaceElement,
    rootTag,
    null,
    true,
    null,
    'ck-',
    () => {},
    null,
  )

  return new Promise<void>((resolve) => {
    canvaskitReconciler.updateContainer(element, container, null, () => resolve())
  })
}
