import { ErrorMapper } from "core/errorMapping";
import room from "modules/room";
import spawn from "modules/spawn";
import creepSpawn from "modules/creepSpawn";
import baseDevelop from "modules/baseDevelop";
import defender from "modules/defender";
import { createInvokeChain } from "core/module/methods";

export const loop = ErrorMapper.wrapLoop(
  createInvokeChain(room, spawn, creepSpawn, baseDevelop, defender)
);
