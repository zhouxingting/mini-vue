import { ReactiveEffect } from "./effect";

class ComputedRefImpl {
  private _dirty: any;
  effect: ReactiveEffect;
  private _value: any;

  constructor(getter) {
    this._dirty = true;
    this.effect = new ReactiveEffect(getter, () => {
      /** 在响应式对象的属性变化时重新执行run方法，获取最新的value值 */
      if (!this._dirty) {
        this._dirty = true;
      }
    });
  }
  get value() {
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }
    return this._value;
  }
}

export function computed(getter) {
  return new ComputedRefImpl(getter);
}
