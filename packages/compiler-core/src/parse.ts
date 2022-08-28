import { NodeTypes } from "./ast";

export function baseParse(content: string) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}

function createParseContext(content: string) {
  console.log("创建 paserContext");
  return {
    source: content,
  };
}

function parseChildren(context, ancestors) {
  console.log("开始解析 children");
  const nodes: any = [];

  let node;
  const s = context.source;
  if (startsWith(s, "{{")) {
    // 看看如果是 {{ 开头的话，那么就是一个插值， 那么去解析他
    node = parseInterpolation(context);
  }

  nodes.push(node);

  return nodes;
}

function parseInterpolation(context: any) {
  // 1. 先获取到结束的index
  // 2. 通过 closeIndex - startIndex 获取到内容的长度 contextLength
  // 3. 通过 slice 截取内容

  // }} 是插值的关闭
  // 优化点是从 {{ 后面搜索即可
  const openDelimiter = "{{";
  const closeDelimiter = "}}";

  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );
  // 让代码前进2个长度，可以把 {{ 干掉
  advanceBy(context, 2);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);

  const preTrimContent = parseTextData(context, rawContent.length);

  const content = preTrimContent.trim();

  // 最后在让代码前进2个长度，可以把 }} 干掉
  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  };
}

function parseTextData(context: any, length: number): any {
  console.log("解析 textData");
  // 从 length 切的话，是为了可以获取到 text 的值（需要用一个范围来确定）
  const rawText = context.source.slice(0, length);
  // 2. 移动光标
  advanceBy(context, length);

  return rawText;
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    helpers: [],
  };
}

function advanceBy(context, numberOfCharacters) {
  console.log("推进代码", context, numberOfCharacters);
  context.source = context.source.slice(numberOfCharacters);
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString);
}
