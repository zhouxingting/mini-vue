import { hasChanged, isObject } from "@mini-vue/shared";
import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

export class RefImpl {
  private _value: any;
  dep: Set<unknown>;

  constructor(value) {
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    /** 依赖收集 */
    trackEffects(this.dep);
    return this._value;
  }
  set value(value) {
    /** 触发依赖 */
    if (hasChanged(value, this._value)) {
      this._value = convert(value);

      triggerEffects(this.dep);
    }
  }
}

export function ref(value) {
  return createRef(value);
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

function createRef(value) {
  return new RefImpl(value);
}
