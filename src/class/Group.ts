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

        if (lastTable.userData.onRemoveCar) lastTable.userData.onRemoveCar(this.scene);
        
        if (point.name.includes("TREL")) {
            point.children[0].add(carBody);
        } else {
            point.add(carBody);
        }

        carBody.userData.status = "idle";
        
        point.userData.empty = false;

        setTimeout(() => point.userData.startJob('checkForFreeTable'), 2000);  
    }

    public moveBetweenTables() {
        const hall = this.scene.getObjectByName(this.name);
        const tables = hall.children;
        const occupiedTables = tables
            .reduce((acc: any, table: any, tableIndex: number) => ({
                ...acc,
                ...(!table.userData.empty ? { [tableIndex]: table } : {})
            }), {});
        const occupiedTablesMapped = Object.entries(occupiedTables) as any;

        for (let [tableIndex, table] of occupiedTablesMapped) {
            tableIndex = +tableIndex;

            const exitTableIndex = this.exitTables.indexOf(table.name);

            if (exitTableIndex !== -1) {
                const exitTable = this.exitTables[exitTableIndex];
                const nextExitTable = this.exitTables[exitTableIndex + 1];
                const startJob = (
                    nextExitTable && 
                    tables
                        .slice(+exitTable.replace(/\D/g, "") + 1, +nextExitTable.replace(/\D/g, "") + 1)
                        .every((table: any) => table.userData.empty)
                );

                if (!startJob) {
                    table.userData.startJob('checkForFreePoint');

                    continue;
                }
            }

            const carBody = table.children[0].clone();
            const nextTable = tables[tableIndex + 1];

            if (!nextTable) {
                if (this.point) {
                    this.startJob("checkForFreePoint", { jobId: carBody.name, carBody: carBody }, 1000);
                } else if (this.nextHall) {
                    table.userData.startJob("checkForFreeTable");
                } else {
                    table.clear();

                    table.userData.empty = true;

                    if (table.userData.onRemoveCar) table.userData.onRemoveCar(this.scene);
                }

                break;
            } else if (!nextTable.userData.empty) {
                continue;
            } else {
                table.clear();

                table.userData.empty = true;

                nextTable.add(carBody);

                nextTable.userData.empty = false;
                nextTable.userData.carBody = carBody.name;
            }
        }

        if (tables.every((table: any) => table.userData.empty)) this.clearJob("moveBetweenTables");
    }
}