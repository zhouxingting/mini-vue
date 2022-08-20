export function createComponentInstance(vnode, parent?) {
  const instance = {
    type: vnode.type,
    vnode,
    ctx: {}, // context 对象
  };

  // 在 prod 坏境下的 ctx 只是下面简单的结构
  // 在 dev 环境下会更复杂
  instance.ctx = {
    _: instance,
  };

  return instance;
}

export function setupComponent(instance) {
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const component = instance.type;
  const { setup } = component;

  if (setup) {
    const setupResult = setup();

    handleSetupResule(instance, setupResult);
  }
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
