import { ElementTypes, NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("parser", () => {
  describe("Interpolation", () => {
    test("simple interpolation", () => {
      // 1. 看看是不是一个 {{ 开头的
      // 2. 是的话，那么就作为 插值来处理
      // 3. 获取内部 message 的内容即可
      const ast = baseParse("{{message}}");
      const interpolation = ast.children[0];

      expect(interpolation).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("Element", () => {
    test("simple div", () => {
      const ast = baseParse("<div></div>");
      const element = ast.children[0];

      expect(element).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        tagType: ElementTypes.ELEMENT,
        // children: [
        //   {
        //     type: NodeTypes.TEXT,
        //     content: "hello",
        //   },
        // ],
      });
    });
  });
});
