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

  return vnode;
}

function getShapFlag(type) {
  if (typeof type === "string") {
    return ShapeFlags.ELEMENT;
  } else {
    return ShapeFlags.STATEFUL_COMPONENT;
  }
}
