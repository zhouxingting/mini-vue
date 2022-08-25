import { effect } from "@mini-vue/reactivity";
import { ShapeFlags } from "@mini-vue/shared";
import { createComponentInstance, setupComponent } from "./component";
import { shouldUpdateComponent } from "./componentRenderUtils";
import { createAppAPI } from "./createApp";
import { queueJob } from "./scheduler";
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
    patch(null, vnode, container, null, null);
  }

  //n1 => 之前的值
  //n2 => 新的值
  function patch(
    n1,
    n2,
    container = null,
    anchor = null,
    parentComponent = null
  ) {
    const { shapeFlag, type } = n2;

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        // TODO 处理element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
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

  function processFragment(n1, n2, container) {
    mountChildren(n2.children, container);
  }

  function processComponent(n1, n2, container, parentComponent) {
    if (!n1) {
      // 挂载实例
      mountComponent(n2, container, parentComponent);
    } else {
      // 更新组件
      updateComponent(n1, n2, container);
    }
  }

  // 组件的更新
  function updateComponent(n1, n2, container) {
    // 更新组件实例引用
    const instance = (n2.component = n1.component);
    // 判断组件是否应该更新
    if (shouldUpdateComponent(n1, n2)) {
      // 那么 next 就是新的 vnode 了（也就是 n2）
      instance.next = n2;
      // 重新调用更新逻辑
      instance.update();
    } else {
      n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2.vnode;
    }
  }

  function processElement(n1, n2, container, anchor, parentComponent) {
    if (!n1) {
      mountElement(n2, container, anchor);
    } else {
      // todo 更新
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  }

  function updateElement(n1, n2, container, anchor, parentComponent) {
    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};

    // 需要把 el 挂载到新的 vnode
    const el = (n2.el = n1.el);

    // 对比 props
    patchProp(el, oldProps, newProps);

    // 对比 children
    patchChildren(n1, n2, el, anchor, parentComponent);
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
      const prevProp = oldProps[key];
      const nextProp = null;
      if (!(key in newProps)) {
        // 这里是以 oldProps 为基准来遍历，
        // 而且得到的值是 newProps 内没有的
        // 所以交给 host 更新的时候，把新的值设置为 null
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
  }

  function patchChildren(n1, n2, container, anchor, parentComponent) {
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
        mountChildren(c2, container);
      } else {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent);
      }
    }
  }

  function patchKeyedChildren(
    c1: any[],
    c2: any[],
    container,
    parentAnchor,
    parentComponent
  ) {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;

    /** 判断是否是相同的虚拟节点，若是相同，则不需要创建新的dom，直接更新props就可以了 */
    const isSameVnodeType = (n1, n2) => {
      return n1.type === n2.type && n1.key === n2.key;
    };

    /** 左侧对比 */
    while (i <= e1 && i <= e2) {
      const prevChild = c1[i];
      const nextChild = c2[i];

      /** 找到不相等的范围就跳出while循环 */
      if (!isSameVnodeType(prevChild, nextChild)) {
        // console.log("两个 child 不相等(从左往右比对)");
        // console.log(`prevChild:${prevChild}`);
        // console.log(`nextChild:${nextChild}`);
        break;
      }
      patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      i++;
    }
    /** 右侧对比 */
    while (i <= e1 && i <= e2) {
      // 从右向左取值
      const prevChild = c1[e1];
      const nextChild = c2[e2];
      if (!isSameVnodeType(prevChild, nextChild)) {
        // console.log("两个 child 不相等(从右往左比对)");
        // console.log(`prevChild:${prevChild}`);
        // console.log(`nextChild:${nextChild}`);
        break;
      }
      patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      e1--;
      e2--;
    }

    if (i > e1 && i <= e2) {
      // 如果是这种情况的话就说明 e2 也就是新节点的数量大于旧节点的数量
      // 也就是说新增了 vnode
      // 应该循环 c2
      // 锚点的计算：新的节点有可能需要添加到尾部，也可能添加到头部，所以需要指定添加的问题
      // 要添加的位置是当前的位置(e2 开始)+1
      // 因为对于往左侧添加的话，应该获取到 c2 的第一个元素
      // 所以我们需要从 e2 + 1 取到锚点的位置
      // 只有左侧添加节点，才满足e2 + 1 < l2，否则，应该是e2 + 1 === l2
      const nextPos = e2 + 1;
      const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
      while (i <= e2) {
        // console.log(`需要新创建一个 vnode: ${c2[i].key}`);
        patch(null, c2[i], container, anchor, parentComponent);
        i++;
      }
    } else if (i > e2 && i <= e1) {
      // 这种情况的话说明新节点的数量是小于旧节点的数量的
      // 那么我们就需要把多余的删除
      while (i <= e1) {
        // console.log(`需要删除当前的 vnode: ${c1[i].key}`);
        hostRemove(c1[i].el);
        i++;
      }
    } else {
      // 左右两边都比对完了，然后剩下的就是中间部位顺序变动的
      // 例如下面的情况
      // a,b,[c,d,e],f,g
      // a,b,[e,c,d],f,g
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = new Map();
      let moved = false;
      let maxNewIndexSoFar = 0;

      for (let i = s1; i <= e2; i++) {
        const nextChild = c2[i];
        keyToNewIndexMap.set(nextChild.key, i);
      }

      // 需要处理新节点的数量
      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      // 初始化 从新的index映射为老的index
      // 创建数组的时候给定数组的长度，这个是性能最快的写法
      const newIndexToOldIndexMap = new Array(toBePatched);
      // 初始化为 0 , 后面处理的时候 如果发现是 0 的话，那么就说明新值在老的里面不存在
      for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;

      // 遍历老节点
      // 1. 需要找出老节点有，而新节点没有的 -> 需要把这个节点删除掉
      // 2. 新老节点都有的，—> 需要 patch
      for (let i = s2; i <= e1; i++) {
        const prevChild = c1[i];

        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }

        let newIndex;
        if (prevChild.key !== null) {
          // 这里就可以通过key快速的查找了， 看看在新的里面这个节点存在不存在
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          // 如果没key 的话，那么只能是遍历所有的新节点来确定当前节点存在不存在了
          for (let j = s2; j <= e2; j++) {
            if (isSameVnodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        /** 遍历完旧的节点是否在新的节点中存在 */
        if (newIndex === undefined) {
          // 当前节点的key 不存在于 newChildren 中，需要把当前节点给删除掉
          hostRemove(prevChild.el);
        } else {
          // 新老节点都存在
          // console.log("新老节点都存在");
          // 把新节点的索引和老的节点的索引建立映射关系
          // i + 1 是因为 i 有可能是0 (0 的话会被认为新节点在老的节点中不存在)
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          // 来确定中间的节点是不是需要移动
          // 新的 newIndex 如果一直是升序的话，那么就说明没有移动
          // 所以我们可以记录最后一个节点在新的里面的索引，然后看看是不是升序
          // 不是升序的话，我们就可以确定节点移动过了
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          /** 继续深度遍历子节点 */
          patch(prevChild, c2[newIndex], container, null, parentComponent);
          patched++;
        }
      }

      // 利用最长递增子序列来优化移动逻辑
      // 因为元素是升序的话，那么这些元素就是不需要移动的
      // 而我们就可以通过最长递增子序列来获取到升序的列表
      // 在移动的时候我们去对比这个列表，如果对比上的话，就说明当前元素不需要移动
      // 通过 moved 来进行优化，如果没有移动过的话 那么就不需要执行算法
      // getSequence 返回的是 newIndexToOldIndexMap 的索引值
      // 所以后面我们可以直接遍历索引值来处理，也就是直接使用 toBePatched 即可
      const increasingNewIndexSequence = moved
        ? getSequence(newIndexToOldIndexMap)
        : [];
      let j = increasingNewIndexSequence.length - 1;

      // 遍历新节点
      // 1. 需要找出老节点没有，而新节点有的 -> 需要把这个节点创建
      // 2. 最后需要移动一下位置，比如 [c,d,e] -> [e,c,d]

      // 这里倒循环是因为在 insert 的时候，需要保证锚点是处理完的节点（也就是已经确定位置了）
      // 因为 insert 逻辑是使用的 insertBefore()
      for (let i = toBePatched - 1; i >= 0; i--) {
        // 确定当前要处理的节点索引
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        // 锚点等于当前节点索引+1
        // 也就是当前节点的后面一个节点(又因为是倒遍历，所以锚点是位置确定的节点)
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;

        if (newIndexToOldIndexMap[i] === 0) {
          // 说明新节点在老的里面不存在
          // 需要创建
          patch(null, nextChild, container, anchor, parentComponent);
        } else if (moved) {
          // 需要移动
          // 1. j 已经没有了 说明剩下的都需要移动了
          // 2. 最长子序列里面的值和当前的值匹配不上， 说明当前元素需要移动
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动的话使用 insert 即可
            hostInsert(nextChild.el, container, anchor);
          } else {
            // 这里就是命中了  index 和 最长递增子序列的值
            // 所以可以移动指针了
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const el = children[i].el;
      hostRemove(el);
    }
  }

  function mountElement(vnode, container, anchor) {
    const el = (vnode.el = hostCreateElement(vnode.type));
    const { shapeFlag, children } = vnode;

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    }

    const { props } = vnode;
    for (const key in props) {
      const val = props[key];
      // 初始化props，没得preProps
      hostPatchProp(el, key, null, val);
    }

    hostInsert(el, container, anchor);
  }

  function mountChildren(children, container) {
    children.forEach((VNodeChild) => {
      patch(null, VNodeChild, container);
    });
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));
    /** 给instance对象创建一个proxy代理对象 */
    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance, initialVNode, container) {
    // 触发依赖
    function componentUpdateFn() {
      if (!instance.isMounted) {
        const { proxy } = instance;
        const subTree = (instance.subTree = instance.render.call(proxy));

        //vnode -> patch
        //vnode -> element -> mountElement

        patch(null, subTree, container, null, instance);
        initialVNode.el = subTree.el;

        instance.isMounted = true;
      } else {
        /** 更新视图 */
        console.log("更新");
        const { next, vnode } = instance;

        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        const { proxy } = instance;
        const subTree = instance.render.call(proxy);
        const prevTree = instance.subTree;
        instance.subTree = subTree;

        patch(prevTree, subTree, prevTree.el, null, instance);
      }
    }
    /** 收集依赖 */
    instance.update = effect(componentUpdateFn, {
      scheduler: () => {
        // 把 effect 推到微任务的时候在执行
        // queueJob(effect);
        queueJob(instance.update);
      },
    });
  }

  return {
    render: render,
    createApp: createAppAPI(render),
  };
}

function updateComponentPreRender(instance, nextVNode) {
  // 更新 nextVNode 的组件实例
  // 现在 instance.vnode 是组件实例更新前的
  // 所以之前的 props 就是基于 instance.vnode.props 来获取
  // 接着需要更新 vnode ，方便下一次更新的时候获取到正确的值
  nextVNode.component = instance;
  instance.vnode = nextVNode;
  instance.next = null;

  const { props } = nextVNode;
  instance.props = props;
}

/** 求最长子序列 */
function getSequence(arr: number[]): number[] {
  const p = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
}
