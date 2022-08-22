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

export function patchProp(el, key, val) {
  if (isOn(key)) {
    const eventName = key.slice(2).toLowerCase();
    el.addEventListener(eventName, val);
  } else {
    el.setAttribute(key, val);
  }
}

export function insert(child, parent) {
  parent.append(child);
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
    }))
  );
}

export function createApp(...args) {
  return ensureRenderer().createApp(...args);
}

export * from "@mini-vue/runtime-core";
