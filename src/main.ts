import { ScreepsModule } from "types/interfaces";

// const modules: Array<ScreepsModule> = [];

// modules.forEach((it) => it.initialize?.());

// export const loop = () => {
//   modules.forEach((it) => it.preProcess?.());

//   modules.forEach((it) => it.process?.());

//   modules.forEach((it) => it.postProcess?.());
// };

const initializeModule = (modules: Array<ScreepsModule>) => {
  const willInitedModules: Array<ScreepsModule> = [];
  const initedModules: Array<ScreepsModule> = [];

  modules.forEach((it) => {

    if(initedModules.includes(it)) {
      return
    }

    if(willInitedModules.includes(it)) {
      throw new Error(`There may be circular dependencies between modules: `)
    }

    const deps = it.deps || [];
    deps.forEach((it) => {
      if (initedModules.includes(it)) {
        return;
      }

      it.initialize?.();
      initedModules.push(it);
    });
  });
};
