import { shallowReadonly } from "@mini-vue/reactivity";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode, parent?) {
  const instance = {
    type: vnode.type,
    vnode,
    ctx: {}, // context 对象
    emit: () => {},
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
  const { props } = instance.vnode;
  // 1. 处理 props
  initProps(instance, props);
  //TODO 2. 处理 slots
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  // 1. 先创建代理 proxy
  console.log("创建 proxy");
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  const component = instance.type;

  const { setup } = component;

  if (setup) {
    const setupContext = createSetupContext(instance);
    const setupResult = setup(shallowReadonly(instance.props), setupContext);

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
    instance.setupState = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance: any) {
  const component = instance.type;

  if (component.render) {
    instance.render = component.render;
  }
}
