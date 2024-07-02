import { ErrorMapper } from "core/errorMapping";
import { LifecycleName, ScreepsModule, sortModules } from "core/module";
import room from "modules/room";
import spawn from "modules/spawn";
import creepSpawn from "modules/creepSpawn";
import baseDevelop from "modules/baseDevelop";
import defender from "modules/defender";

const modules = [
  room,
  spawn,
  creepSpawn,
  baseDevelop,
  defender,
] as unknown as Array<ScreepsModule>;

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

  invokeModules(sortedModules, "postProcess", processContextMap);
});

const o = Object.create(null);

function invokeModules(
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevContextMap?: Map<string, Record<string, any>>
) {
  const contextMap = new Map<string, Record<string, any>>();

  const isPostProcess = fnName === "postProcess";

  const reversedModules: Array<ScreepsModule> = [];

  if (isPostProcess) {
    // 逆序, postProcess 是被依赖的后执行
    for (let i = modules.length - 1; i >= 0; i--) {
      reversedModules.push(modules[i]);
    }
    modules = reversedModules;
  }

  modules.forEach((it) => {
    const memoryKey = `#${it.name}`;

    const memory = new Proxy(o, {
      get(_, k) {
        const mem = Memory[memoryKey] || {};
        return Reflect.get(mem, k);
      },
      set(_, k, v) {
        const mem = Memory[memoryKey] || {};
        Memory[memoryKey] = mem;
        return Reflect.set(mem, k, v);
      },
      deleteProperty(_, p) {
        const mem = Memory[memoryKey] || {};
        return Reflect.deleteProperty(mem, p);
      },
      has(_, p) {
        const mem = Memory[memoryKey] || {};
        return Reflect.has(mem, p);
      },
      ownKeys() {
        const mem = Memory[memoryKey] || {};
        return Reflect.ownKeys(mem);
      },
    });

    const context: Record<string, Record<string, any>> = {
      self: prevContextMap?.get?.(it.name),
    };

    (it.inject || []).forEach((dep) => {
      context[dep] = (isPostProcess ? prevContextMap : contextMap)?.get(dep);
    });

    const fn = it[fnName];

    let currentContext: Record<string, any> | undefined;

    if (fn) {
      currentContext = fn.call({ memory }, bindingContextThis(context, it)) as
        | Record<string, any>
        | undefined;
    }

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

    if (!injectModule) {
      return;
    }

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
