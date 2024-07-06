import { ErrorMapper } from "core/errorMapping";
import room from "modules/room";
import spawn from "modules/spawn";
import creepSpawn from "modules/creepSpawn";
import develop from "modules/develop";
import defender from "modules/defender";
import { createInvokeChain } from "core/module_back/methods";
import source from "modules/source";

export const loop = ErrorMapper.wrapLoop(
  createInvokeChain(room, spawn, creepSpawn, defender, source)
);
