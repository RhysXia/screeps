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

type ModuleInfo = {
  contextThis: Record<string, any>;
  moduleExports: Record<string, any>;
};

const invokeModules = (
  modules: Array<ScreepsModule>,
  fnName: LifecycleName,
  prevModuleInfoMap?: Map<string, ModuleInfo>
) => {
  const moduleInfoMap = new Map<string, ModuleInfo>();

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
    const injectedModuleExports: Record<string, any> = {};

    (it.inject || []).forEach((injectModuleName) => {
      const moduleInfo = (
        isPostProcess ? prevModuleExports : moduleInfoMap
      )?.get(injectModuleName);

      if (moduleInfo) {
        const { contextThis, moduleExports } = moduleInfo;

        // 其他module export被注入进来的ctx，this 指向的应该是原来的module
        const exportContextThis = {
          ...contextThis,
          targetModuleName: it.name,
        };

        injectedModuleExports[injectModuleName] = bindThisForModuleExport(
          moduleExports,
          exportContextThis
        );
      }
    });

    const prevModuleExports = prevModuleInfoMap?.get?.(it.name)?.moduleExports;

    // 生命周期方法的this
    const lifecycleContextThis = {
      ...prevModuleExports,
      memory: getMemoryForModule(it),
      modules: injectedModuleExports,
    };
    const currentExports = it[fnName]?.call(lifecycleContextThis);

    moduleInfoMap.set(it.name, {
      moduleExports: {
        ...prevModuleExports,
        ...currentExports,
      },
      contextThis: lifecycleContextThis,
    });
  });

  return moduleInfoMap;
};

const bindThis = (fn: any, contextThis: any) => {
  if (typeof fn === "function") {
    return (...args: any) => fn.call(contextThis, ...args);
  }

  return fn;
};

const bindThisForModuleExport = (
  context: Record<string, any> | undefined,
  thisContext: any
) => {
  if (!context) {
    return;
  }

  const newContext: Record<string, Record<string, any>> = {};
  Object.keys(context).forEach((moduleName) => {
    const injectModule = context[moduleName];

    if (!injectModule) {
      return;
    }

    const moduleCtx: Record<string, any> = {};

    Object.keys(injectModule).forEach((key) => {
      const value = injectModule[key];
      moduleCtx[key] = bindThis(value, thisContext);
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

  let bindedContextMap: Map<string, ModuleInfo>;

  return () => {
    if (!sortedModules) {
      sortedModules = sortModules(modules as Array<ScreepsModule>);
      bindedContextMap = invokeModules(sortedModules, "binding");
    }

    const memory = Memory as unknown as { $isInit: boolean };

    if (!memory.$isInit) {
      invokeModules(sortedModules, "initialize", bindedContextMap);
      memory.$isInit = true;
    }

    const processContextMap = invokeModules(
      sortedModules,
      "process",
      bindedContextMap
    );

    invokeModules(sortedModules, "postProcess", processContextMap);
  };
};
