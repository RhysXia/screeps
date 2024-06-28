export type Lifecycle = {
  /**
   * 初始化，全局执行
   */
  initialize?: () => void;

  /**
   * 预处理，在正式执行前执行
   */
  preProcess?: () => void;

  /**
   * 执行，在所有的 preProcess 执行后再执行
   */
  process?: () => void;

  /**
   * 后处理，在所有的 process 执行后再执行
   */
  postProcess?: () => void;
};

export type ScreepsModule = {
  /**
   * 模块名称，唯一定位模块
   */
  name: string
  /**
   * 依赖的模块名称
   */
  deps?: Array<string>

  /**
   * 初始化，在 loop 前全局执行一次
   * @returns 返回可以被其他 module 使用的数据/方法等
   */
  initialize?: () => void | Array<any>
}