import { hasOwn } from "@mini-vue/shared";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $slots: (i) => i.slots,
  $props: (i) => i.props,
};

// todo 需要让用户可以直接在 render 函数内直接使用 this 来触发 proxy
export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;
    if (key[0] !== "$") {
      if (hasOwn(setupState, key)) {
        return setupState?.[key];
      } else if (hasOwn(props, key)) {
        return props[key];
      }
    }
    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};
