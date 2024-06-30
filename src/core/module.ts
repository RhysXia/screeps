import { EmptyObject, UnionToIntersection, UnionToTuple } from "types/utils";

export type LifecycleName =
  /**
   * 初始化，在 loop 前全局执行一次
   * @returns 返回可以被其他 module 使用的数据/方法等
   */
  | "initialize"
  /**
   * 预处理，在正式执行前执行
   */
  | "preProcess"
  /**
   * 执行，在所有的 preProcess 执行后再执行
   */
  | "process"
  /**
   * 后处理，在所有的 process 执行后再执行
   */
  | "postProcess";

export type ModuleExport = {
  [K in LifecycleName]?: Record<string, any>;
};

export type ModuleInject = Record<string, ModuleExport>;

export type ExtractLifecycleName<MI extends ModuleInject> = MI extends Record<
  any,
  infer O
>
  ? keyof UnionToIntersection<O>
  : never;

export type ExreactLifecycleContext<
  LN extends LifecycleName,
  MI extends ModuleInject
> = LN extends "postProcess"
  ? ExreactLifecycleContext<"process", MI>
  : {
      [K in keyof MI as LN extends keyof MI[K] ? K : never]: MI[K][LN];
    } & (LN extends "preProcess"
      ? ExreactLifecycleContext<"initialize", MI>
      : LN extends "process"
      ? ExreactLifecycleContext<"preProcess", MI>
      : // : LN extends "postProcess"
        // ? ExreactLifecycleContext<"process", MI>
        {});

export type ExtractLifecycle<
  MI extends ModuleInject,
  ME extends ModuleExport,
  MEK extends keyof ME = keyof ME,
  LN extends Exclude<LifecycleName, MEK> = Exclude<LifecycleName, MEK>
> = {
  [K in MEK]: K extends LifecycleName
    ? ExreactLifecycleContext<K, MI> extends EmptyObject
      ? () => ME[K]
      : (ctx: ExreactLifecycleContext<K, MI>) => ME[K]
    : never;
} & {
  [K in LN]?: ExreactLifecycleContext<K, MI> extends never
    ? () => void
    : (ctx: ExreactLifecycleContext<K, MI>) => void;
};

export type ExtractScreepModuleInject<
  MI extends ModuleInject,
  A = UnionToTuple<keyof MI>
> = A extends []
  ? { inject?: [] }
  : {
      /**
       * 依赖的模块名称
       */
      inject: A;
    };

export type ScreepsModule<
  MI extends ModuleInject = ModuleInject,
  ME extends ModuleExport = ModuleExport
> = ExtractScreepModuleInject<MI> &
  ExtractLifecycle<MI, ME> & {
    /**
     * 模块名称，唯一定位模块
     */
    name: string;
  };

export const defineScreepModule = <
  MI extends ModuleInject,
  ME extends ModuleExport
>(
  module: ScreepsModule<MI, ME>
) => module;

export const sortModules = (modules: Array<ScreepsModule>) => {
  const willInitedModuleNames: Set<string> = new Set();
  const initedModules: Array<ScreepsModule> = [];

  const sortModule = (module: ScreepsModule) => {
    if (willInitedModuleNames.has(module.name)) {
      throw new Error(`There may be circular dependencies between modules: `);
    }

    // 已经 init 了
    if (initedModules.some((it) => it.name === module.name)) {
      return;
    }

    const inject = module.inject || [];

    willInitedModuleNames.add(module.name);

    inject.forEach((name) => {
      const injectModule = modules.find((it) => it.name === name);

      if (!injectModule) {
        throw new Error(
          `Could not found inject [${name}] in module [${module.name}]`
        );
      }
      sortModule(injectModule);
    });

    willInitedModuleNames.delete(module.name);

    initedModules.push(module);

    return initedModules.length - 1;
  };

  modules.forEach((it) => {
    sortModule(it);
  });

  return initedModules;
};
