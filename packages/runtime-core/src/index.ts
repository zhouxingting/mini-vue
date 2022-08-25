export * from "./h";
export * from "./createApp";
export { getCurrentInstance } from "./component";
export { renderSlot } from "./helpers/renderSlot";
export { createTextVNode } from "./vnode";
export { inject, provide } from "./apiInject";
export { createRenderer } from "./renderer";
export { nextTick } from "./scheduler";

export {
  // core
  reactive,
  ref,
  readonly,
  // utilities
  unRef,
  proxyRefs,
  isReadonly,
  isReactive,
  isProxy,
  isRef,
  // advanced
  shallowReadonly,
  // effect
  effect,
  stop,
  computed,
} from "@mini-vue/reactivity";
