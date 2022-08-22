import { effect } from "@mini-vue/reactivity";
import { ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const { createElement, setElementText, patchProp, insert, createText } =
    options;

  function render(vnode, container) {
    patch(null, vnode, container, null);
  }

  //n1 => 之前的值
  //n2 => 新的值

  function patch(n1, n2, container, parentComponent = null) {
    const { shapeFlag, type } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, parentComponent);
        break;
      default:
        // TODO 处理element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          // 处理组件
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }

  function processText(n1, n2: any, container: any) {
    const el = (n2.el = createText(n2.children));
    container.append(el);
  }

  function processFragment(n1, n2, container, parentComponent) {
    mountChildren(n2.children, container, parentComponent);
  }

  function processComponent(n1, n2, container, parentComponent) {
    // 挂载实例
    mountComponent(n2, container, parentComponent);
  }

  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent);
    } else {
      // todo 更新
      updateElement(n1, n2, container, parentComponent);
    }
  }

  function updateElement(n1, n2, container, parentComponent) {
    console.log("n1", n1);
    console.log("n2", n2);
  }

  function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = createElement(vnode.type));
    const { shapeFlag, children } = vnode;

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      setElementText(el, children);
    }

    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      patchProp(el, key, val);
    }

    insert(el, container);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((VNodeChild) => {
      patch(null, VNodeChild, container, parentComponent);
    });
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent);
    /** 给instance对象创建一个proxy代理对象 */
    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance, initialVNode, container) {
    /** 收集依赖 */
    effect(() => {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        //vnode -> patch
        //vnode -> element -> mountElement
        instance.isMounted = true;

        patch(null, subTree, container, instance);
        initialVNode.el = subTree.el;
      } else {
        /** 更新视图 */
        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const preSubTree = instance.subTree;
        instance.subTree = subTree;

        patch(preSubTree, subTree, container, instance);
      }
    });
  }

  return {
    render: render,
    createApp: createAppAPI(render),
  };
}
