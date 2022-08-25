import { isOn } from "@mini-vue/shared";
import { createRenderer } from "packages/runtime-core/src/renderer";

export function createElement(type) {
  return document.createElement(type);
}

function createText(text) {
  return document.createTextNode(text);
}

export function setElementText(el, text) {
  el.innerText = text;
}

export function patchProp(el, key, preValue, nextValue) {
  // preValue 之前的值
  // 为了之后 update 做准备的值
  // nextValue 当前的值
  if (isOn(key)) {
    const invokers = el._vei || (el._vei = {});
    const existingInvoker = invokers[key];

    if (nextValue && existingInvoker) {
      // 直接修改函数的值即可
      existingInvoker.value = nextValue;
    } else {
      const eventName = key.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = (invokers[key] = nextValue);
        el.addEventListener(eventName, invoker);
      } else {
        el.removeEventListener(eventName, existingInvoker);
        invokers[key] = undefined;
      }
    }
  } else {
    if (nextValue === undefined || nextValue === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}

export function insert(child, parent, anchor = null) {
  // console.log("Insert");
  parent.insertBefore(child, anchor);
}

/** 移除 */
export function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

// 缓存
let renderer;

function ensureRenderer() {
  return (
    renderer ||
    (renderer = createRenderer({
      createElement,
      createText,
      setElementText,
      patchProp,
      insert,
      remove,
    }))
  );
}

export function createApp(...args) {
  return ensureRenderer().createApp(...args);
}

export * from "@mini-vue/runtime-core";
