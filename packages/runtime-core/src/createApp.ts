import { createRenderer } from "./renderer";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      const vnode = createVNode(rootComponent);

      createRenderer(vnode, rootContainer);
    },
  };
}
