import { isObject, ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";

export function createRenderer(vnode, container) {
  //   const { vnode, container } = options;

  patch(vnode, container);
}

function patch(vnode, container) {
  console.log(vnode.type);

  const { shapeFlag } = vnode;

  // TODO 处理element
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    // 处理组件
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  const { shapeFlag } = vnode;

  const el = (vnode.el = document.createElement(vnode.type));

  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el);
  } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
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
