export class Group {
    THREE: any;
    #scene: any;
    #name: string;
    #tablesOccupied: number;
    #capacity: number;
    #empty: boolean;
    #point: string;
    #job: any = {};
    #exitTables: string[] = [];
    #nextHall: string;

    constructor(
        THREE: any,
        scene: any,
        name: string,
        capacity: number,
        tablesOccupied: number,
        empty: boolean,
        point: string,
        nextHall: string,
        exitTables: string[] = []
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#tablesOccupied = tablesOccupied;
        this.#capacity = capacity;
        this.#empty = empty;
        this.#point = point;
        this.#exitTables = exitTables;
        this.#nextHall = nextHall;
    }

    get scene() {
        return this.#scene;
    }

    get name() {
        return this.#name;
    }

    get tablesOccupied() {
        return this.#tablesOccupied;
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

    get exitTables() {
        return this.#exitTables;
    }

    get nextHall() {
        return this.#nextHall;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set tablesOccupied(tablesOccupied: number) {
        this.#tablesOccupied = tablesOccupied;
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

        if (!point.userData.empty) return;

        this.clearJob(jobId);

        const hall = this.scene.getObjectByName(this.name);

        const lastTable = hall.children[hall.userData.capacity - 1];

        if (
            !lastTable.userData.empty && 
            lastTable.userData.carBody === carBody.name
        ) {
            lastTable.clear();
            lastTable.userData.empty = true;
        }

        point.add(carBody);

        carBody.userData.status = "idle";
        
        point.userData.empty = false;

        setTimeout(() => point.userData.startJob('checkForFreeTable'), 2000);  
    }

    public moveBetweenTables() {
        const hall = this.scene.getObjectByName(this.name);
        const tables = hall.children;
    
        let lastIndex = null;

        for (let i = 0; i < tables.length; i++) {
            const currentTable = tables[i];

            if (!currentTable.userData.empty && i !== lastIndex) {
                const currentTable = tables[i];
                const carBody = currentTable.children[0].clone();
                const nextTable = tables[i + 1];


                if (!nextTable) {

                    if (this.point) {
                        this.startJob("checkForFreePoint", { jobId: carBody.name, carBody: carBody }, 1000);
                    } else if (this.nextHall) {
                        currentTable.userData.startJob("checkForFreeTable");
                    } else if (this.exitTables.includes(currentTable.name)) {
                        this.scene.getObjectByName(this.name).getObjectByName(currentTable.name).userData.startJob('checkForFreePoint');
                    } else {
                        currentTable.clear();

                        currentTable.userData.empty = true;
                    }

                    break;
                } else {
                    if (!nextTable.userData.empty) continue;

                    const exitTableIndex = this.exitTables.indexOf(currentTable.name);

                    if (exitTableIndex !== -1) {
                        const exitTable = this.exitTables[exitTableIndex];
                        const nextExitTable = this.exitTables[exitTableIndex + 1];
                        const startJob = (
                            nextExitTable && tables
                                .slice(+exitTable.replace(/\D/g, "") + 1, +nextExitTable.replace(/\D/g, "") + 1)
                                .every((table: any) => table.userData.empty)
                        );

                        if (!startJob) {
                            this.scene.getObjectByName(this.name).getObjectByName(exitTable).userData.startJob('checkForFreePoint');

                            continue;
                        }
                    }

                    currentTable.clear();

                    currentTable.userData.empty = true;

                    nextTable.add(carBody);

                    nextTable.userData.empty = false;
                    nextTable.userData.carBody = carBody.name;
        
                    lastIndex = i + 1;
                }
            }
        }
    
        if (tables.length === 0) this.clearJob("moveBetweenTables");
    }
}