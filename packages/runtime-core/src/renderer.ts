import { effect } from "@mini-vue/reactivity";
import { ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { Fragment, Text } from "./vnode";

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    createText: hostCreateText,
  } = options;

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
    const el = (n2.el = hostCreateText(n2.children));
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
    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};

    // 需要把 el 挂载到新的 vnode
    const el = (n2.el = n1.el);

    // 对比 props
    patchProp(el, oldProps, newProps);

    // 对比 children
    patchChildren(n1, n2, container, parentComponent);
  }

  function patchProp(el, oldProps, newProps) {
    // key 存在 oldProps 里 也存在 newProps 内
    // 以 newProps 作为基准
    for (let key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== nextProp) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }

    // 2. oldProps 有，而 newProps 没有了
    // 之前： {id:1,tId:2}  更新后： {id:1}
    // 这种情况下我们就应该以 oldProps 作为基准，因为在 newProps 里面是没有的 tId 的
    // 还需要注意一点，如果这个 key 在 newProps 里面已经存在了，说明已经处理过了，就不要在处理了
    for (let key in oldProps) {
      if (!(key in newProps)) {
        hostPatchProp(el, key, oldProps[key], null);
      }
    }
  }

  function patchChildren(n1, n2, container, parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 清空老的children
        unmountChildren(c1);
      }
      if (c1 !== c2) {
        // 设置新的text
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(container, "");
        mountChildren(c2, container, parentComponent);
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el, el.parentNode);
    }
  }

  function mountElement(vnode, container, parentComponent) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { shapeFlag, children } = vnode;

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    }

    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      // 初始化props，没得preProps
      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container);
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
