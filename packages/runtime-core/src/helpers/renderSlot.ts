import { createVNode } from "../vnode";

export function renderSlot(slots, name: string, props = {}) {
  console.log(`渲染插槽 slot -> ${name}`);
  const slot = slots[name];

  if (slot) {
    // 因为 slot 是一个返回 vnode 的函数，我们只需要把这个结果返回出去即可
    // slot 就是一个函数，所以就可以把当前组件的一些数据给传出去，这个就是作用域插槽
    // 参数就是 props
    return createVNode("div", props, slot(props));
  }
}
