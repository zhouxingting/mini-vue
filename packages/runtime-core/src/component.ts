import { proxyRefs, shallowReadonly } from "@mini-vue/reactivity";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlo";

export function createComponentInstance(vnode, parent) {
  const instance = {
    type: vnode.type,
    vnode,
    ctx: {}, // context 对象
    emit: () => {},
    slots: {}, // 存放插槽的数据，
    props: {},
    /** 存储parent 是为了获取 parent.provides的数据 */
    parent,
    // 是否是初始化
    isMounted: false,
    //  获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
    provides: parent ? parent.provides : {},
  };

  // 在 prod 坏境下的 ctx 只是下面简单的结构
  // 在 dev 环境下会更复杂
  instance.ctx = {
    _: instance,
  };

  instance.emit = emit.bind(null, instance) as any;

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;
  // 1. 处理 props vnode.props => instance.props
  initProps(instance, props);
  //TODO 2. 处理 slots
  initSlots(instance, children);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  // 1. 先创建代理 proxy
  console.log("创建 proxy");
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  const component = instance.type;

  const { setup } = component;

  if (setup) {
    // 设置当前 currentInstance 的值
    // 必须要在调用 setup 之前
    setCurrentInstance(instance);

    const setupContext = createSetupContext(instance);
    const setupResult = setup(shallowReadonly(instance.props), setupContext);

    setCurrentInstance(null);

    handleSetupResule(instance, setupResult);
  }
}

function createSetupContext(instance) {
  return {
    emit: instance.emit,
  };
}

function handleSetupResule(instance: any, setupResult: any) {
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const component = instance.type;

  if (component.render) {
    instance.render = component.render;
  }
}

/** 获取当前实例 */
let currentInstance = null;

export function getCurrentInstance(): any {
  return currentInstance;
}
export function setCurrentInstance(instance) {
  currentInstance = instance;
}
