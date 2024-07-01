import { ErrorMapper } from "core/errorMapping";
import { LifecycleName, ScreepsModule, sortModules } from "core/module";
import creepTask from "modules/creepTask";
import baseDevelop from "modules/baseDevelop";

const modules = [creepTask, baseDevelop] as Array<ScreepsModule>;

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
    const context: Record<string, Record<string, any>> = {};

    (module.inject || []).forEach((dep) => {
      const prevContext = processContextMap?.get(dep);
      // const currentContext = contextMap.get(dep);
      context[dep] = prevContext;
    });

    // @ts-ignore
    module.postProcess?.(context);
  }
});

function invokeModules(
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevContextMap?: Map<string, Record<string, any>>
) {
  const contextMap = new Map<string, Record<string, any>>();

  modules.forEach((it) => {
    const context: Record<string, Record<string, any>> = {};

    (it.inject || []).forEach((dep) => {
      // const prevContext = prevContextMap?.get(dep);
      const currentContext = contextMap.get(dep);
      context[dep] = currentContext;
    });

    // @ts-ignorex
    const currentContext = it[fnName]?.(context) as
      | Record<string, any>
      | undefined;

    contextMap.set(it.name, {
      ...prevContextMap?.get(it.name),
      ...currentContext,
    });
  });

  return contextMap;
}
