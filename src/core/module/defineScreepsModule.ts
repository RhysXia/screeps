import { UnionToTuple } from "types/utils";
import {
  ExtractScreepsModuleLifecycle,
  ScreepsModule,
  ScreepsModuleContext,
  ScreepsModuleExport,
  ScreepsModuleImport,
} from "./types";

export default <
  SMI extends ScreepsModuleImport,
  SME extends ScreepsModuleExport,
  Mem extends Record<string, any> = Record<string, any>
>(
  name: string,
  ...args: UnionToTuple<keyof SMI> extends [] ? [] : [UnionToTuple<keyof SMI>]
) => {
  return (
    lifecycles: (
      ctx: ScreepsModuleContext<Mem>
    ) => ExtractScreepsModuleLifecycle<SMI, SME>
  ) => {
    const module = lifecycles as ScreepsModule<SMI, SME, Mem>;

    module.name = name;
    module.imports = args[0];

    return module;
  };
};
