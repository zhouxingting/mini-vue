import { ShapeFlags } from "@mini-vue/shared";

export function createVNode(type, props?, children?) {
  // 注意 type 有可能是 string 也有可能是对象
  // 如果是对象的话，那么就是用户设置的 options
  // type 为 string 的时候
  // createVNode("div")
  // type 为组件对象的时候
  // createVNode(App)

  const vnode = {
    type,
    props: props || {},
    children,
    el: null,
    shapeFlag: getShapFlag(type),
  };

  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  normalizeChildren(vnode, children);

  return vnode;
}

// 用 symbol 作为唯一标识
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");

function getShapFlag(type) {
  if (typeof type === "string") {
    return ShapeFlags.ELEMENT;
  } else {
    return ShapeFlags.STATEFUL_COMPONENT;
  }
}

export function createTextVNode(text: string = " ") {
  return createVNode(Text, {}, text);
}

export function normalizeChildren(vnode, children) {
  if (typeof children === "object") {
    // 所以我们这里除了 element ，那么只要是 component 的话，那么children 肯定就是 slots 了
    if (!(vnode.shapeFlag & ShapeFlags.ELEMENT)) {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
}
