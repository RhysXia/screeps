import { defineScreepModule } from "core/module";

export type EventModuleExport = {
  binding: {
    publish(event: string, params: any): void;
    subsribe(event, fn: (params: any) => void): void;
  };
};

export const moduleName = "event";

const fnMap = new Map<string, Set<(params: any) => void>>();

export default defineScreepModule<{}, EventModuleExport>({
  name: moduleName,
  binding() {
    return {
      subsribe(event, fn) {
        const set = fnMap.get(event) || new Set();

        set.add(fn);

        fnMap.set(event, set);
      },
      publish(event, params) {
        const memory = this.m;
      },
    };
  },
});
