import { isObject } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";

export function createRenderer(vnode, container) {
  //   const { vnode, container } = options;

  patch(vnode, container);
}

function patch(vnode, container) {
  console.log(vnode.type);
  // TODO 处理element
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else {
    // 处理组件
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type));

  if (Array.isArray(vnode.children)) {
    mountChildren(vnode.children, el);
  } else {
    el.innerText = vnode.children;
  }
  const { props } = vnode;
  for (const key in props) {
    el.setAttribute(key, props[key]);
  }

  container.append(el);
}

function mountChildren(children, container) {
  children.forEach((VNodeChild) => {
    patch(VNodeChild, container);
  });
}

function processComponent(vnode, container) {
  // 挂载实例
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  const instance = createComponentInstance(initialVNode);
  /** 给instance对象创建一个proxy代理对象 */
  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //vnode -> patch
  //vnode -> element -> mountElement
  patch(subTree, container);
  initialVNode.el = subTree.el;
}
