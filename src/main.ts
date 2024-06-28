import { Lifecycle } from "types/interfaces";

const modules: Array<Lifecycle> = [];

modules.forEach((it) => it.initialize?.());

export const loop = () => {
  modules.forEach((it) => it.preProcess?.());

  modules.forEach((it) => it.process?.());

  modules.forEach((it) => it.postProcess?.());
};
