import { EmptyObject, UnionToIntersection, UnionToTuple } from "types/utils";

export type LifecycleName =
  /**
   * 绑定阶段，在loop前执行，主要用来初始化一些变量，可能会执行多次
   */
  | "binding"
  /**
   * 初始化，只会执行一次, 第一次 binding 后执行
   */
  | "initialize"
  /**
   * 执行，initialize 后再执行
   */
  | "process"
  /**
   * 后处理，process 后再执行
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
  MI extends ModuleInject,
  ME extends ModuleExport
> = LN extends "postProcess"
  ? ExreactLifecycleContext<"process", MI, ME>
  : (LN extends "initialize" | "process"
      ? ExreactLifecycleContext<"binding", MI, ME>
      : {}) & {
      [K in keyof MI as LN extends keyof MI[K]
        ? K
        : never]: LN extends keyof MI[K] ? MI[K][LN] : never;
    };

export type BindThis<This extends object, T> = T extends (
  ...args: infer P
) => infer R
  ? (this: This, ...args: P) => R
  : T;

export type BindThisForRecord<This extends object, R> = {
  [K in keyof R]: BindThis<This, R[K]>;
};

export type ExtractLifecycleExports<
  LN extends LifecycleName,
  ME extends ModuleExport
> = LN extends "postProcess"
  ? ME["binding"] & ME["process"]
  : LN extends "process" | "initialize"
  ? ME["binding"]
  : {};

export type ModuleLifecycleContextThis<
  LN extends LifecycleName,
  ME extends ModuleExport,
  C extends Record<string, any>
> = C & ExtractLifecycleExports<LN, ME>;

export type ModuleLifecycleExportContextThis<
  LN extends LifecycleName,
  ME extends ModuleExport,
  C extends Record<string, any>
> = ModuleLifecycleContextThis<LN, ME, C> & {
  targetModuleName: string;
};

export type ExtractLifecycle<
  MI extends ModuleInject,
  ME extends ModuleExport,
  C extends Record<string, any>,
  MEK extends Extract<LifecycleName, keyof ME> = Extract<
    LifecycleName,
    keyof ME
  >,
  LN extends Exclude<LifecycleName, MEK> = Exclude<LifecycleName, MEK>
> = {
  [K in MEK]: K extends LifecycleName
    ? ExreactLifecycleContext<K, MI, ME> extends EmptyObject
      ? BindThis<
          ModuleLifecycleContextThis<K, ME, C>,
          () => BindThisForRecord<
            ModuleLifecycleExportContextThis<K, ME, C>,
            ME[K]
          >
        >
      : BindThis<
          ModuleLifecycleContextThis<
            K,
            ME,
            C & { modules: ExreactLifecycleContext<K, MI, ME> }
          >,
          () => BindThisForRecord<
            ModuleLifecycleExportContextThis<
              K,
              ME,
              C & { modules: ExreactLifecycleContext<K, MI, ME> }
            >,
            ME[K]
          >
        >
    : never;
} & {
  [K in LN]?: ExreactLifecycleContext<K, MI, ME> extends never
    ? BindThis<ModuleLifecycleContextThis<K, ME, C>, () => void>
    : BindThis<
        ModuleLifecycleContextThis<
          K,
          ME,
          C & { modules: ExreactLifecycleContext<K, MI, ME> }
        >,
        () => void
      >;
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
  ME extends ModuleExport = ModuleExport,
  Mem extends Record<string, any> = Record<string, any>
> = ExtractScreepModuleInject<MI> &
  ExtractLifecycle<MI, ME, { memory: Mem }> & {
    /**
     * 模块名称，唯一定位模块
     */
    name: string;
  };
