import { createComponentInstance, setupComponent } from "./component";

export function createRenderer(vnode, container) {
  //   const { vnode, container } = options;

  patch(vnode, container);
}

function patch(vnode, container) {
  // 处理组件
  processComponent(vnode, container);
}

function processComponent(vnode, container) {
  // 挂载实例
  mountComponent(vnode, container);
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);

  setupRenderEffect(instance, container);
}

function setupRenderEffect(instance, container) {
  const subTree = instance.render();

  //vnode -> patch
  //vnode -> element -> mountElement
  if (subTree) {
    patch(subTree, container);
  }
}
