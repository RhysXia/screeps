import { Lifecycle } from "types/interfaces";
import { EventLoop } from "./types";

const eventLoops: Array<EventLoop> = [];

const CoreModule: Lifecycle = {
  initialize() {},
  preProcess() {},
  process() {},
  postProcess() {
    eventLoops.forEach((it) => it.loop());
  },
};

export default CoreModule;
