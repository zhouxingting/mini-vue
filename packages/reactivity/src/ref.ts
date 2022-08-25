import { hasChanged, isObject } from "@mini-vue/shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

export class RefImpl {
  private _rawValue: any;
  private _value: any;
  dep: Set<unknown>;
  public __v_isRef = true;

  constructor(value) {
    this._rawValue = value;
    // 看看value 是不是一个对象，如果是一个对象的话
    // 那么需要用 reactive 包裹一下
    this._value = convert(value);
    this.dep = new Set();
  }

  get value() {
    /** 依赖收集 */
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    /** 触发依赖 */
    if (hasChanged(newValue, this._rawValue)) {
      this._value = convert(newValue);
      this._rawValue = newValue;

      triggerRefValue(this);
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

export function triggerRefValue(ref) {
  triggerEffects(ref.dep);
}

export function trackRefValue(ref) {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
}

// 这个函数的目的是
// 帮助解构 ref
// 比如在 template 中使用 ref 的时候，直接使用就可以了
// 例如： const count = ref(0) -> 在 template 中使用的话 可以直接 count
// 解决方案就是通过 proxy 来对 ref 做处理

const shallowUnwrapHandlers = {
  get(target, key, receiver) {
    return unRef(Reflect.get(target, key, receiver));
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      return (target[key].value = value);
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

export function proxyRefs(objectWithRefs) {
  return new Proxy(objectWithRefs, shallowUnwrapHandlers);
}

export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

export function isRef(target) {
  return !!target.__v_isRef;
}
