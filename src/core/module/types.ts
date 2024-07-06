import { EmptyObject, UnionToTuple } from "types/utils";

export type LifecycleName =
  | "binding"
  | "initialize"
  | "process"
  | "postProcess";

export type ScreepsModuleExport = {
  // postProcess 没有返回值
  [K in Exclude<LifecycleName, "postProcess">]?: Record<string, any>;
};

export type ScreepsModuleImport = Record<string, ScreepsModuleExport>;

/**
 * 提取依赖的名称数组
 */
export type ExtractScreepsModuleImportType<
  MI extends ScreepsModuleImport,
  A = UnionToTuple<keyof MI>
> = A extends []
  ? { imports?: [] }
  : {
      /**
       * 依赖的模块名称
       */
      imports: A;
    };

/**
 * 提取生命周期的直接的上下文，也就是依赖项的 export
 */
export type ExtractLifecycleContext<
  LN extends LifecycleName,
  SMI extends ScreepsModuleImport
  // postProcess 无法获取依赖的方法
> = LN extends "postProcess"
  ? EmptyObject
  : {
      [K in keyof SMI as LN extends keyof SMI[K]
        ? K
        : never]: LN extends keyof SMI[K] ? SMI[K][LN] : never;
    };

export type ScreepsModuleExportContext = {
  targetModuleName: string;
};

// export type ExtractScreepsModuleLifecycle<
//   SMI extends ScreepsModuleImport,
//   BindingType,
//   InitializeType,
// > = {
//   binding?: (
//     ctx: ExtractLifecycleContext<"binding", SMI>
//   ) => void | ((exportContext: ScreepsModuleExportContext) => BindingType);
//   initialize?: (
//     ctx: ExtractLifecycleContext<"initialize", SMI>
//   ) => void | ((exportContext: ScreepsModuleExportContext) => InitializeType);
//   process?: <T>(
//     ctx: ExtractLifecycleContext<"process", SMI>
//   ) => void | ((exportContext: ScreepsModuleExportContext) => T);
//   postProcess?: <T>(
//     ctx: ExtractLifecycleContext<"postProcess", SMI>
//   ) => void | ((exportContext: ScreepsModuleExportContext) => T);
// };

export type ExtractScreepsModuleLifecycle<
  SMI extends ScreepsModuleImport,
  SME extends ScreepsModuleExport,
  L extends Exclude<LifecycleName, "postProcess"> = Exclude<
    LifecycleName,
    "postProcess"
  >,
  EK = keyof SME
> = {
  [K in Extract<L, EK>]: (
    lifecycleContext: ExtractLifecycleContext<K, SMI>
  ) => (exportContext: ScreepsModuleExportContext) => SME[K];
} & {
  [K in Exclude<LifecycleName, EK>]?: (
    lifecycleContext: ExtractLifecycleContext<K, SMI>
  ) => void;
};

export type ScreepsModuleContext<Mem extends Record<string, any>> = {
  memory: Mem;
};

export type ScreepsModule<
  SMI extends ScreepsModuleImport = ScreepsModuleImport,
  SME extends ScreepsModuleExport = ScreepsModuleExport,
  Mem extends Record<string, any> = Record<string, any>
> = ExtractScreepsModuleImportType<SMI> & {
  name: string;
} & ((ctx: ScreepsModuleContext<Mem>) => ExtractScreepsModuleLifecycle<SMI, SME>);

export type ExtractScreepModuleExports<SM extends ScreepsModule<any, any>> =
  SM extends (ctx: any) => infer LS
    ? LS extends Record<infer L, any>
      ? {
          [K in L]: LS[K] extends (ctx: any) => infer R ? R : never;
        }
      : never
    : never;
