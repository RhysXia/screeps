import { ErrorMapper } from "core/errorMapping";
import { LifecycleName, ScreepsModule, sortModules } from "core/module";
import room from "modules/room";
import spawn from "modules/spawn";
import creepSpawn from "modules/creepSpawn";
import baseDevelop from "modules/baseDevelop";

const modules = [room, spawn, creepSpawn, baseDevelop] as Array<ScreepsModule>;

let sortedModules: Array<ScreepsModule>;

let bindedContextMap: Map<string, Record<string, any>>;

/**
 * 执行过程：
 * 如果 a -> b -> c
 * process 顺序 a -> b -> c
 * postProcess 顺序 c -> b -> a
 */
export const loop = ErrorMapper.wrapLoop(() => {
  if (!sortedModules) {
    sortedModules = sortModules(modules);
    bindedContextMap = invokeModules(sortedModules, "binding");
  }

  if (!Memory.isInited) {
    invokeModules(sortedModules, "initialize", bindedContextMap);
    Memory.isInited = true;
  }

  const processContextMap = invokeModules(
    sortedModules,
    "process",
    bindedContextMap
  );

  for (let i = sortedModules.length - 1; i > -1; i--) {
    const module = sortedModules[i];
    const context: Record<string, Record<string, any>> = {
      self: processContextMap.get(module.name),
    };

    (module.inject || []).forEach((dep) => {
      const prevContext = processContextMap?.get(dep);
      context[dep] = prevContext;
    });

    // @ts-ignore
    module.postProcess?.(bindingContextThis(context, module));
  }
});

const SelfLifecycleMap: Partial<Record<LifecycleName, LifecycleName>> = {
  postProcess: "process",
  process: "binding",
  initialize: "binding",
};

function invokeModules(
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevContextMap?: Map<string, Record<string, any>>
) {
  const contextMap = new Map<string, Record<string, any>>();

  modules.forEach((it) => {
    const context: Record<string, Record<string, any>> = {
      self: prevContextMap?.get?.(it.name),
    };

    (it.inject || []).forEach((dep) => {
      context[dep] = contextMap.get(dep);
    });

    // @ts-ignorex
    const currentContext = it[fnName]?.(bindingContextThis(context, it)) as
      | Record<string, any>
      | undefined;

    contextMap.set(it.name, {
      ...prevContextMap?.get(it.name),
      ...currentContext,
    });
  });

  return contextMap;
}

function bindingContextThis(
  context: Record<string, any>,
  module: ScreepsModule
) {
  const thisContext = {
    targetModuleName: module.name,
  };

  const newContext: Record<string, Record<string, any>> = {};
  Object.keys(context).forEach((moduleName) => {
    const injectModule = context[moduleName];

    const moduleCtx: Record<string, any> = {};

    Object.keys(injectModule).forEach((key) => {
      const value = injectModule[key];
      if (typeof value === "function") {
        moduleCtx[key] = (...args: any) =>
          (value as Function).call(thisContext, ...args);
      } else {
        moduleCtx[key] = value;
      }
    });

    newContext[moduleName] = moduleCtx;
  });

  return newContext;
}
