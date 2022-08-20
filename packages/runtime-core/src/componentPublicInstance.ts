const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

// todo 需要让用户可以直接在 render 函数内直接使用 this 来触发 proxy
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState } = instance;
    if (key[0] !== "$") {
      return setupState?.[key];
    }
    const publicGetter = publicPropertiesMap[key];
    return publicGetter(instance);
  },
};
