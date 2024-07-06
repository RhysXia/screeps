import {
  LifecycleName,
  ScreepsModule,
  ScreepsModuleExportContext,
} from "./types";

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

    const imports = module.imports || [];

    willInitedModuleNames.add(module.name);

    imports.forEach((name) => {
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

type Modules = Array<
  {
    name: string;
    imports?: Array<string>;
  } & {
    [K in LifecycleName]?: (
      lifecycleContext?: any
    ) => (exportContext: ScreepsModuleExportContext) => any;
  }
>;

const invokeModules = (
  modules: Modules,
  lifecycleName: LifecycleName,
  prevExportsMap?: Map<string, (exportFn: ScreepsModuleExportContext) => any>
) => {
  const map = new Map<string, (exportFn: ScreepsModuleExportContext) => any>();

  const isPostProcess = lifecycleName === "postProcess";

  if (isPostProcess) {
    const nextModules: Modules = [];
    for (let i = modules.length - 1; i >= 0; i--) {
      nextModules.push(modules[i]);
    }

    modules = nextModules;
  }

  modules.forEach((mod) => {
    if (isPostProcess) {
      // postProcess 不需要存储了，已经是最后一个了
      mod[lifecycleName]?.();
      //   map.set(mod.name, fn);
      return;
    }

    const deps: Record<string, any> = {};

    (mod.imports || []).forEach((dep) => {
      const prevModuleExport = prevExportsMap?.get(dep);

      const exportValue = prevModuleExport?.({
        targetModuleName: mod.name,
      });

      if (exportValue) {
        deps[dep] = exportValue;
      }
    });

    const fn = mod[lifecycleName]?.(deps);
    map.set(mod.name, fn);
  });

  return map;
};

/**
 * 执行过程：
 * 如果 a -> b -> c
 * process 顺序 a -> b -> c
 * postProcess 顺序 c -> b -> a
 */
export default (...moduleInputs: Array<ScreepsModule>) => {
  let modules: Modules;

  let bindedContextMap: Map<
    string,
    (exportFn: ScreepsModuleExportContext) => any
  >;

  return () => {
    if (!modules) {
      modules = sortModules(moduleInputs).map((it) => ({
        name: it.name,
        imports: it.imports,
        lifecycle: it({ memory: getMemoryForModule(it) }),
      }));
      bindedContextMap = invokeModules(modules, "binding");
    }

    const memory = Memory as unknown as { $isInit: boolean };

    if (!memory.$isInit) {
      invokeModules(modules, "initialize", bindedContextMap);
      memory.$isInit = true;
    }

    const processContextMap = invokeModules(
      modules,
      "process",
      bindedContextMap
    );

    invokeModules(modules, "postProcess", processContextMap);
  };
};
