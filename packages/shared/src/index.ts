export * from "../src/shapeFlags";

export const extend = Object.assign;

export const isObject = (val) => {
  return val !== null && typeof val === "object";
};

export function hasChanged(value, oldValue) {
  return !Object.is(value, oldValue);
}

// 必须是 on+一个大写字母的格式开头
export const isOn = (key) => /^on[A-Z]/.test(key);
