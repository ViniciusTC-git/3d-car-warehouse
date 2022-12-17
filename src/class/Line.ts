export class Line {
    THREE: any;
    #scene: any;
    #name: string;
    #occupied: number;
    #capacity: number;
    #empty: boolean;
    #point: string;
    #job: any = {};

    constructor(
        THREE: any,
        scene: any,
        name: string,
        capacity: number,
        occupied: number,
        empty: boolean,
        point: string
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#occupied = occupied;
        this.#capacity = capacity;
        this.#empty = empty;
        this.#point = point;
    }

    get scene() {
        return this.#scene;
    }

    get name() {
        return this.#name;
    }

    get occupied() {
        return this.#occupied;
    }

    get capacity() {
        return this.#capacity;
    }

    get empty() {
        return this.#empty;
    }

    get point() {
        return this.#point;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set occupied(occupied: number) {
        this.#occupied = occupied;
    }

    set capacity(capacity: number) {
        this.#capacity = capacity;
    }

    get job() {
        return this.#job;
    }

    private clearJob(id: string) {
        clearInterval(this.#job[id]);

        delete this.#job[id];
    }

    public startJob(name: any, value?: any, time: number = 2000) {
        if (this.job[value?.jobId || name]) return;

        this.#job[value?.jobId || name] = setInterval(() => value ? this[name](value) : this[name](), time);
    }

    public checkForFreePoint({ jobId, carBody }: any) {
        const point = this.scene.getObjectByName(this.point);

        if (point.children.length) return;

        this.clearJob(jobId);

        const hall = this.scene.getObjectByName(this.name);

        const lastTable = hall.children[hall.children.length - 1];

        if (
            lastTable.children.length && 
            lastTable.children?.[0]?.name === carBody.name
        ) {
            lastTable.clear();
        }

        point.add(carBody);

        setTimeout(() => {
            point.userData.startJob('checkForFreeTable');
        }, 2000);  
    }

    public moveBetweenTables() {
        const hall = this.scene.getObjectByName(this.name);
        const tables = hall.children;
    
        let lastIndex = null;
    
        for (let i = 0; i < tables.length; i++) {
            const currentTable = tables[i];

            if (currentTable.children.length && i !== lastIndex) {
                const currentTable = tables[i];
                const carBody = currentTable.children[0].clone();
                const nextTable = tables[i + 1];

                if (!nextTable) {

                    if (this.point) {
                        this.startJob("checkForFreePoint", { jobId: carBody.name, carBody: carBody }, 1000);
                    } else {
                        currentTable.clear();
                    }

                    break;
                } else {
                    if (nextTable.children.length) continue;

                    currentTable.clear();

                    nextTable.add(carBody);
        
                    lastIndex = i + 1;
                }
            }
        }
    
        if (tables.length === 0) this.clearJob("moveBetweenTables");
    }
}