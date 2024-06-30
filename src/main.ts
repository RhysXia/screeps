import { LifecycleName, ScreepsModule, sortModules } from "core/module";

const modules: Array<ScreepsModule> = [];

const sortedModules = sortModules(modules);

const initializeContextMap = invokeModules(sortedModules, "initialize");

export const loop = () => {
  const preProcessContextMap = invokeModules(
    sortedModules,
    "preProcess",
    initializeContextMap
  );

  const processContextMap = invokeModules(
    sortedModules,
    "process",
    preProcessContextMap
  );

  invokeModules(sortedModules, "process", processContextMap);
};

function invokeModules(
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevContextMap?: Map<string, Record<string, any>>
) {
  const contextMap = new Map<string, Record<string, any>>();

  modules.forEach((it) => {
    const context: Record<string, Record<string, any>> = {};

    (it.inject || []).forEach((dep) => {
      const prevContext = prevContextMap?.get(dep);
      const currentContext = contextMap.get(dep);
      context[dep] = {
        ...prevContext,
        ...currentContext,
      };
    });

    // @ts-ignore
    contextMap.set(it.name, it[fnName]?.(context));
  });

  return contextMap;
}
