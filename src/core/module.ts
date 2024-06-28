export abstract class AbstractModule<T extends Array<any>> {
    constructor(args: T) {

    }

    abstract preProcess(): void

    abstract process(): void

    abstract postProcess(): void
}