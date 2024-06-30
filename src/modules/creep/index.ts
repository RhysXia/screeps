import { defineScreepModule } from "core/module";

export type CreepModuleExport = {

}

const creep = defineScreepModule<{}, CreepModuleExport>({
    name: 'creep',
    initialize()
})