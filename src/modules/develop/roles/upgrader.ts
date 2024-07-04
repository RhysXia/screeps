import { Role } from "../types";

const upgrader: Role<'upgrader'> = {
    subscribes: {},
    plans: {
        prepare() {
            
        }
    }
};

export default upgrader