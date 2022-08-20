export function createVNode(type, props?, children?) {
  // 注意 type 有可能是 string 也有可能是对象
  // 如果是对象的话，那么就是用户设置的 options
  // type 为 string 的时候
  // createVNode("div")
  // type 为组件对象的时候
  // createVNode(App)

  const vnode = {
    type,
    props,
    children,
  };

  return vnode;
}
