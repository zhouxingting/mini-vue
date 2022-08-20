import { h, ref } from "../../dist/mini-vue.esm-bundler.js";

const count = ref(0);

window.self = null

const HelloWorld = {
  name: "HelloWorld",
  setup() {
    return {
      value: 44
    }
  },
  // TODO 第一个小目标
  // 可以在使用 template 只需要有一个插值表达式即
  // 可以解析 tag 标签
  // template: `
  //   <div>hi {{msg}}</div>
  //   需要编译成 render 函数
  // `,
  render() {
    // window.self = this;
    // console.log('window.self', window.self, this.$el)
    return h(
      "div",
      { tId: "helloWorld" },
      `hello world: count:${count.value} - ${this.value}`
    );
  },
};

export default {
  name: "App",
  setup() {},

  render() {
    window.self = this;
    return h("div", { tId: 1 }, [h("p", {}, "主页"), h(HelloWorld)]);
  },
};
