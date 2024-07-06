import { UnionToTuple } from "types/utils";
import {
  ExtractLifecycleContext,
  ExtractScreepsModuleLifecycle,
  ScreepsModule,
  ScreepsModuleContext,
  ScreepsModuleExportContext,
  ScreepsModuleImport,
} from "./types";

const defineScreepsModule = <
  SMI extends ScreepsModuleImport,
  Mem extends Record<string, any> = Record<string, any>
>(
  name: string,
  ...agrs: UnionToTuple<keyof SMI> extends [] ? [] : [UnionToTuple<keyof SMI>]
) => {
  return (a: {
    binding?: <T>(
          ctx: ExtractLifecycleContext<"binding", SMI>
        ) => void | ((exportContext: ScreepsModuleExportContext) => T);
        initialize?: <T>(
          ctx: ExtractLifecycleContext<"initialize", SMI>
        ) => void | ((exportContext: ScreepsModuleExportContext) => T);
        process?: <T>(
          ctx: ExtractLifecycleContext<"process", SMI>
        ) => void | ((exportContext: ScreepsModuleExportContext) => T);
        postProcess?: <T>(
          ctx: ExtractLifecycleContext<"postProcess", SMI>
        ) => void | ((exportContext: ScreepsModuleExportContext) => T);
  }) => {
   return a
  }
};


const a = defineScreepsModule<{
  module1: {
    initialize: {
      fn1: void
    }
  }
}>("module", ['module1'])
.initialize((ctx, lctx) => {
  return {
    a: 1
  }
})

type A = {
  <T>(a: T):  {
    demo: T
  }
}

const b: A = (a: string) => {
  return {
    demo: 1
  }
}