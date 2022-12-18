export class PointTable {
    THREE: any;
    #scene: any;
    #name: string;
    #empty: boolean = true;
    #hall: string;
    #ms: any;
    #job: any = {};

    constructor(
        THREE: any,
        scene: any,
        name: string,
        hall: string,
        ms: any = {}
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#hall = hall;
        this.#ms = ms;
    }

    get scene() {
        return this.#scene;
    }

    get name() {
        return this.#name;
    }

    get hall() {
        return this.#hall;
    }

    get ms() {
        return this.#ms;
    }

    get empty() {
        return this.#empty;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    private hasJobPending(jobId: number) {
        const fifo = Object.keys(this.#job).map((index: string) => +index) as number[];
        
        return !fifo.length ? false : Math.min(...fifo) < jobId;
    }

    private clearJob(jobId: number) {
        clearInterval(this.#job[jobId]);

        delete this.#job[jobId];
    }

    public startJob(name: any, time: number = 2000) {
        const fifo = Object.keys(this.#job).map((index: string) => +index) as number[];
        const index = !fifo.length ? 1 : Math.max(...fifo) + 1;


        this.#job[index] = setInterval(() => this[name](index), time);
    }

    private checkForFreeTable(jobId: number) {
        const hall = this.scene.getObjectByName(this.hall);

        const { range, startAt } = this.ms;

        const tablesToCheck = hall.children.slice(0, range);

        const occupied = tablesToCheck.some((table: any) => !table.userData.empty);

        if (!occupied && !this.hasJobPending(jobId)) {
            const point = this.scene.getObjectByName(this.name);
            const carBody = point.children[0].clone();

            tablesToCheck[startAt].add(carBody);
            tablesToCheck[startAt].userData.carBody = carBody.name;
            tablesToCheck[startAt].userData.empty = false;

            point.clear();

            this.empty = true;

            this.clearJob(jobId);

            if (!hall.userData.job['moveBetweenTables']) hall.userData.startJob('moveBetweenTables');
        }
    }
}