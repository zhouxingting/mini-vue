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

// 判断是否含有某个属性
export const hasOwn = (val, key) => Object.hasOwnProperty.call(val, key);

const camelizeRE = /-(\w)/g;

/**
 * @private
 * 把烤肉串命名方式转换成驼峰命名方式
 */

export const camelize = (str: string) => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};

/**
 * @private
 * 首字母大写
 */
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * @private
 * 添加 on 前缀，并且首字母大写
 */
export const toHandlerKey = (str: string) => {
  return `on${capitalize(str)}`;
};

export const isString = (val) => typeof val === "string";
