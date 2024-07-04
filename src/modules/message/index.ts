import { warning } from "core/logger";
import { defineScreepModule } from "core/module";

export type MessageModuleExport = {
  binding: {
    publish(event: string, params: any, isGlobal?: boolean): void;
    subsribe(event, fn: (params: any) => boolean, isGlobal?: boolean): void;
  };
};

export const moduleName = "message";

const fnMap = new Map<string, Map<string, Set<(params: any) => boolean>>>();

const globalFnMap = new Map<string, Set<(params: any) => boolean>>();

export default defineScreepModule<
  {},
  MessageModuleExport,
  {
    msgs: Array<{
      e: string;
      p: any;
      r?: string;
    }>;
  }
>({
  name: moduleName,
  binding() {
    return {
      subsribe(event, fn, isGlobal) {
        let map: Map<string, Set<(params: any) => boolean>>;

        if (isGlobal) {
          map = globalFnMap;
        } else {
          map = fnMap.get(this.targetModuleName) || new Map();
          fnMap.set(this.targetModuleName, map);
        }

        const set = map.get(event) || new Set();

        set.add(fn);

        map.set(event, set);
      },
      publish(event, params, isGlobal) {
        const memory = this.memory;
        const msgs = (memory.msgs = memory.msgs || []);
        msgs.push({
          e: event,
          p: params,
          r: isGlobal ? undefined : this.targetModuleName,
        });
      },
    };
  },
  postProcess() {
    const memory = this.memory;
    const msgs = memory.msgs || [];
    for (let i = 0; i < msgs.length; i++) {
      const msg = msgs[i];

      const set = (msg.r ? fnMap.get(msg.r) : globalFnMap).get(msg.e);

      if (!set || !set.size) {
        warning(`no suscriber for message(${msg.e})`);
        continue;
      }

      for (const fn of set) {
        const result = fn(msg.p);
        if (result) {
          msgs.splice(i, 1);
          i--;
          break;
        }
      }
    }
  },
});
