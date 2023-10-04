import { ReactiveEffect, trackOpBit } from './effect'

export type Dep = Set<ReactiveEffect> & TrackedMarkers

// w 用于记录已经被收集的依赖，n 用于记录新的依赖。由于其中存在递归嵌套执行effect函数的场景，需要通过按位标记记录各个层级的依赖状态
/**
 * wasTracked and newTracked maintain the status for several levels of effect
 * tracking recursion. One bit per level is used to define whether the dependency
 * was/is tracked.
 */
type TrackedMarkers = {
  /**
   * wasTracked
   */
  w: number
  /**
   * newTracked
   */
  n: number
}

export const createDep = (effects?: ReactiveEffect[]): Dep => {
  const dep = new Set<ReactiveEffect>(effects) as Dep
  dep.w = 0
  dep.n = 0
  return dep
}
// 判断dep是否已经收集了当前层依赖
export const wasTracked = (dep: Dep): boolean => (dep.w & trackOpBit) > 0

export const newTracked = (dep: Dep): boolean => (dep.n & trackOpBit) > 0

export const initDepMarkers = ({ deps }: ReactiveEffect) => {
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].w |= trackOpBit // set was tracked 标记当前层的依赖已经被收集
    }
  }
}

export const finalizeDepMarkers = (effect: ReactiveEffect) => {
  const { deps } = effect
  if (deps.length) {
    let ptr = 0
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i]
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(effect)
      } else {
        deps[ptr++] = dep
      }
      // clear bits
      dep.w &= ~trackOpBit
      dep.n &= ~trackOpBit
    }
    deps.length = ptr
  }
}
