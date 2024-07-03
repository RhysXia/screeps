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

const bindThisForRecord = (obj: Record<string, any> | undefined, ctx: any) => {
  if (!obj) {
    return;
  }

  const newObj: Record<string, any> = {};

  Object.keys(obj).forEach((k) => {
    const v = obj[k];

    if (typeof v === "function") {
      newObj[k] = (...args: any) => (v as Function).call(ctx, ...args);
    } else {
      newObj[k] = v;
    }
  });

  return newObj;
};

type ModuleExportFn = (
  appendContext: Record<string, any>
) => Record<string, any>;

const invokeModules = (
  modules: Array<ScreepsModule>,
  lifecycleName: LifecycleName,
  prevModuleInfoMap?: Map<string, ModuleExportFn>
) => {
  const isPostProcess = lifecycleName === "postProcess";

  if (isPostProcess) {
    const reversedModules: Array<ScreepsModule> = [];
    for (let i = modules.length - 1; i >= 0; i--) {
      reversedModules.push(modules[i]);
    }
    modules = reversedModules;
  }

  const moduleInfoMap = new Map<string, ModuleExportFn>();

  modules.forEach((mod) => {
    const lifecycle = mod[lifecycleName];

    const prevModuleExportFn = prevModuleInfoMap?.get(mod.name);

    if (!lifecycle) {
      moduleInfoMap.set(mod.name, prevModuleExportFn);
      return
    }

    const modules: Record<string, Record<string, any>> = {};

    const appendContext = {
      targetModuleName: mod.name,
    };

    (mod.inject || []).forEach((injectModuleName) => {
      const moduleExportFn = (
        isPostProcess ? prevModuleInfoMap : moduleInfoMap
      )?.get(injectModuleName);
      modules[injectModuleName] = moduleExportFn?.(appendContext);
    });


    const lifecycleContextThis = {
      memory: getMemoryForModule(mod),
      modules,
      ...prevModuleExportFn?.(appendContext),
    };

    const lifecycleExport = lifecycle.call(lifecycleContextThis);

    const moduleExportFn: ModuleExportFn = (appendContext) => {
      const preModuleExport = prevModuleExportFn?.(appendContext);
      const newLifecycleExport = bindThisForRecord(lifecycleExport, {
        ...lifecycleContextThis,
        ...appendContext,
      });
      return {
        ...preModuleExport,
        ...newLifecycleExport,
      };
    };

    moduleInfoMap.set(mod.name, moduleExportFn);
  });

  return moduleInfoMap;
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

  let bindedContextMap: Map<string, ModuleExportFn>;

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
