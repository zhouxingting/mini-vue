import { isOn, ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { Fragment, Text } from "./vnode";

export function createRenderer(vnode, container, parentComponent) {
  //   const { vnode, container } = options;

  patch(vnode, container, parentComponent);
}

function patch(vnode, container, parentComponent = null) {
  const { shapeFlag, type } = vnode;

  switch (type) {
    case Text:
      processText(vnode, container);
      break;
    case Fragment:
      processFragment(vnode, container, parentComponent);
      break;
    default:
      // TODO 处理element
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 处理组件
        processComponent(vnode, container, parentComponent);
      }
  }
}

function processText(vnode: any, container: any) {
  const el = (vnode.el = document.createTextNode(vnode.children));
  container.append(el);
}

function processFragment(vnode, container, parentComponent) {
  mountChildren(vnode.children, container, parentComponent);
}

function processElement(vnode, container, parentComponent) {
  const { shapeFlag } = vnode;

  const el = (vnode.el = document.createElement(vnode.type));

  if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode.children, el, parentComponent);
  } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.innerText = vnode.children;
  }
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    if (isOn(key)) {
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

function mountChildren(children, container, parentComponent) {
  children.forEach((VNodeChild) => {
    patch(VNodeChild, container, parentComponent);
  });
}

function processComponent(vnode, container, parentComponent) {
  // 挂载实例
  mountComponent(vnode, container, parentComponent);
}

function mountComponent(initialVNode, container, parentComponent) {
  const instance = createComponentInstance(initialVNode, parentComponent);
  /** 给instance对象创建一个proxy代理对象 */
  setupComponent(instance);

  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  //vnode -> patch
  //vnode -> element -> mountElement
  patch(subTree, container, instance);

  initialVNode.el = subTree.el;
}
