// 在 render 中使用 proxy 调用 emit 函数
// 也可以直接使用 this
// 验证 proxy 的实现逻辑
import { h, ref, createTextVNode } from "../../dist/mini-vue.esm-bundler.js";
import Child from "./Child.js";

export default {
  name: "App",
  setup() {
    const msg = ref("123");
    window.msg = msg;

    const changeChildProps = () => {
      msg.value = "456";
    };

    return { msg, changeChildProps };
  },

  render() {
    return h("div", {}, [
      createTextVNode(`这是通过 createTextVNode 创建的节点${this.msg}`),
      h("div", {}, `你好${this.msg}`),
      h(
        "button",
        {
          onClick: this.changeChildProps,
        },
        "change child props"
      ),
      h(Child, {
        msg: this.msg,
      }),
    ]);
  },
};
