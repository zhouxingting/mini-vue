import { extend } from "@mini-vue/shared";

/** 全局变量，存储当前的Effect的fn */
let activeEffect;
let shouldTrack = false;

export class ReactiveEffect {
  private _fn: any;
  public scheduler: Function | undefined;
  deps = [];
  active = true;
  onStop: any;
  constructor(fn, scheduler?) {
    this._fn = fn;
    this.scheduler = scheduler;
  }
  run() {
    // 执行 fn  但是不收集依赖
    if (!this.active) {
      return this._fn();
    }

    /** 可以开始收集依赖 */
    activeEffect = this;
    shouldTrack = true;

    if (this.onStop) {
      this.onStop();
    }
    const result = this._fn();

    /** 重置 */
    activeEffect = undefined;
    shouldTrack = false;

    return result;
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
  /** 清空 effect.deps 数组*/
  effect.deps.length = 0;
}

const targetMap = new Map();

/** 判断是否正在收集依赖 */
export function isTracking() {
  return shouldTrack && !!activeEffect;
}

/** 收集依赖 */
export function track(target, key) {
  /** 收集过一次依赖则return，不再收集当前依赖 */
  if (!isTracking()) return;

  /** 存储关系是target => key => fn */
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let deps = depsMap.get(key);
  if (!deps) {
    deps = new Set();
    depsMap.set(key, deps);
  }
  trackEffects(deps);
}

export function trackEffects(deps) {
  if (!deps.has(activeEffect)) {
    deps.add(activeEffect);
    /** 存储当前收集的依赖 */
    activeEffect?.deps.push(deps);
  }
}

/** 执行依赖 */
export function trigger(target, key) {
  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  const deps = depsMap.get(key);
  if (!depsMap || !deps) return;
  triggerEffects(deps);
}

export function triggerEffects(dep) {
  for (let effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options: any = {}) {
  // const _effect = new ReactiveEffect(fn, options.scheduler);
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);

  _effect.run();

  let runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
}

/** 清空收集的依赖 */
export function stop(runner) {
  runner.effect.stop();
}
