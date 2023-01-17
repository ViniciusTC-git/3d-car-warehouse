export class Car {
    #id: number;
    #name: string;
    #status: "moving" | "idle" | "introduction" | "extraction";
    #cell: string;
    #hall: string;
    #point: string;

    constructor(
        id: number, 
        name: string,
        status: "moving" | "idle" | "introduction" | "extraction", 
        hall: string,
        cell: string,
        point: string,
    ) {
        this.#id = id;
        this.#name = name;
        this.#status = status;
        this.#cell = cell;
        this.#hall = hall;
        this.#point = point;
    }

    get id() {
        return this.#id;
    }

    get name() {
       return this.#name;
    }

    get status() {
        return this.#status;
    }

    get hall() {
        return this.#hall;
    }

    get cell() {
        return this.#cell;
    }

    get point() {
        return this.#point;
    }

    set status(status: "moving" | "idle" | "introduction" | "extraction") {
        this.#status = status;
    }

    set cell(cell: string) {
        this.#cell = cell;
    }

    set hall(hall: string) {
        this.#cell = hall;
    }

    set point(point: string) {
        this.#point = point;
    }
}