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
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, nextValue);
  } else {
    if (nextValue === undefined || nextValue === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, nextValue);
    }
  }
}

export function insert(child, parent, anchor = null) {
  console.log("Insert");
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