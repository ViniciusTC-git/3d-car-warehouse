export class Table {
    THREE: any;
    #scene: any;
    #id: number;
    #name: string;
    #group: string;
    #carBody: string;
    #empty: boolean;

    constructor(
        THREE: any,
        scene: string,
        id: number, 
        name: string, 
        group: string,
        carBody: string,
        empty: boolean
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#id = id;
        this.#name = name;
        this.#group = group;
        this.#carBody = carBody;
        this.#empty = empty;
    }

    get scene() {
        return this.#scene;
    }

    get id() {
        return this.#id;
    }

    get name() {
       return this.#name;
    }

    get group() {
        return this.#group;
    }

    get carBody() {
        return this.#carBody;
    }

    get empty() {
        return this.#empty;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set carBody(carBody: string) {
        this.#carBody = carBody;
    }

}