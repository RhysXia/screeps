import {
  ModuleInject,
  ModuleExport,
  ScreepsModule,
  LifecycleName,
} from "./types";

export const defineScreepModule = <
  MI extends ModuleInject,
  ME extends ModuleExport,
  Mem extends Record<string, any> = Record<string, any>
>(
  module: ScreepsModule<MI, ME, Mem>
) => module;

const sortModules = (modules: Array<ScreepsModule>) => {
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

const o = Object.create(null);

const getMemoryForModule = (module: ScreepsModule) => {
  const memoryKey = `#${module.name}`;

  // memory 每次都会从 Memory 中获取最新值，可以使 Module 中持有此引用也能正常使用
  const memory = new Proxy(o, {
    get(_, k) {
      const memory = (Memory[memoryKey] = Memory[memoryKey] || {});

      return Reflect.get(memory, k);
    },
    set(_, k, v) {
      const memory = (Memory[memoryKey] = Memory[memoryKey] || {});
      return Reflect.set(memory, k, v);
    },
    has(_, k) {
      const memory = Memory[memoryKey] || {};
      return Reflect.has(memory, k);
    },
    ownKeys(_) {
      const memory = Memory[memoryKey] || {};
      return Reflect.ownKeys(memory);
    },
    deleteProperty(_, k) {
      const memory = Memory[memoryKey] || {};
      return Reflect.deleteProperty(memory, k);
    },
    getOwnPropertyDescriptor(_, k) {
      const memory = Memory[memoryKey] || {};
      return Reflect.getOwnPropertyDescriptor(memory, k);
    },
  });

  return memory;
};

const invokeModules = (
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevContextMap?: Map<string, Record<string, any>>
) => {
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
    const context: Record<string, Record<string, any>> = {
      self: prevContextMap?.get?.(it.name),
    };

    (it.inject || []).forEach((dep) => {
      context[dep] = (isPostProcess ? prevContextMap : contextMap)?.get(dep);
    });

    const fn = it[fnName];

    let currentContext: Record<string, any> | undefined;

    if (fn) {
      currentContext = fn.call(
        { memory: getMemoryForModule(it) },
        bindingContextThis(context, {
          targetModuleName: it.name,
        })
      ) as Record<string, any> | undefined;
    }

    contextMap.set(it.name, {
      ...prevContextMap?.get(it.name),
      ...currentContext,
    });
  });

  return contextMap;
};

const bindingContextThis = (context: Record<string, any>, thisContext: any) => {
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
};

type AnyScreepModule = {
  name: string;
  inject?: Array<string>;
} & Partial<Record<LifecycleName, (...args: any) => any>>;

/**
 * 执行过程：
 * 如果 a -> b -> c
 * process 顺序 a -> b -> c
 * postProcess 顺序 c -> b -> a
 */
export const createInvokeChain = (...modules: Array<AnyScreepModule>) => {
  let sortedModules: Array<ScreepsModule>;

  let bindedContextMap: Map<string, Record<string, any>>;

  return () => {
    if (!sortedModules) {
      sortedModules = sortModules(modules as Array<ScreepsModule>);
      bindedContextMap = invokeModules(sortedModules, "binding");
    }

    if (!Memory.isModuleInited) {
      invokeModules(sortedModules, "initialize", bindedContextMap);
      Memory.isModuleInited = true;
    }

    const processContextMap = invokeModules(
      sortedModules,
      "process",
      bindedContextMap
    );

    invokeModules(sortedModules, "postProcess", processContextMap);
  };
};
