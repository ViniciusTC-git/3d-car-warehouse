
export class PointTable {
    THREE: any;
    #scene: any;
    #name: string;
    #empty: boolean = true;
    #hall: string[];
    #ms: any;
    #job: any = {};
    #sequenced: boolean;

    constructor(
        THREE: any,
        scene: any,
        name: string,
        hall: string[],
        ms: any = {},
        sequenced: boolean
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#hall = hall;
        this.#ms = ms;
        this.#sequenced = sequenced;
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

    get sequenced() {
        return this.#sequenced;
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

    public introductionRequest(jobId: number) {
        const trel = this.scene.getObjectByName(`TREL_${this.name.replace(/\D/g, "")}`);
        const introduction = trel.userData.requests.find((request: any) => request.type === 'introduction' && request.started);
        
        if (introduction) {
            console.log(`[POINT_TABLE][WAITING INTRODUCTION][INTRODUCTION REQUEST][${this.name}][${introduction.group}][${introduction.cell}]`);
            return;
        }

        const { occupied, capacity } = this.hall.reduce((acc: any, group: any) => ({
            ...acc,
            occupied: acc.occupied + this.scene.getObjectByName(group).userData.tablesOccupied,
            capacity: acc.capacity + this.scene.getObjectByName(group).userData.capacity 
        }), { occupied: 0, capacity: 0 });

        if (occupied === capacity - 1) {
            console.log(`[POINT_TABLE][WAITING CAPACITY EXTEND][INTRODUCTION REQUEST][${this.name}]`);
            return;
        };

        const groupsNames = this.hall.filter((group: string) => {
            const groupData = this.scene.getObjectByName(group).userData;

            return groupData.tablesOccupied < groupData.capacity;
        });
    
        if (!groupsNames.length) return;

        const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
        const cells = this.scene.getObjectByName(randomGroup).children.filter((table: any) => table.userData.empty);
        const randomCell = cells[Math.floor(Math.random() * cells.length)];
        const carName = this.scene.getObjectByName(this.name).children[0].name;

        console.log(`[POINT_TABLE][REQUESTED][INTRODUCTION REQUEST][${this.name}][${randomGroup}][${randomCell.name}][${carName}]`);

        trel.userData.requests = [ 
            ...trel.userData.requests, { 
                type: "introduction", 
                group: randomGroup, 
                cell: randomCell.name, 
                carName: carName,
                point: this.name,
                started: false 
            } 
        ];

        this.clearJob(jobId);
    }

    private checkForFreeHall(jobId: number) {
        if (this.hasJobPending(jobId)) return null;

        if (
            this.sequenced && 
            this.scene.userData.sequences[0]?.carId !== this.scene.getObjectByName(this.name).children[0].name
        ) return null;

        const { range } = this.ms;

        const groups = this.hall
            .filter((group: string) => {
                const tablesToCheck = this.scene.getObjectByName(group).children.slice(0, range);
                const waiting = tablesToCheck.some((table: any) => !table.userData.empty);
                
                return !waiting;
            }).map((group: any) => this.scene.getObjectByName(group));
        
        if (!groups.length) return null;

        const randomGroup = groups[Math.floor(Math.random() * groups.length)];

        if (this.sequenced) {
            this.scene.userData.sequences.shift();
            this.scene.userData.clearSequenceGUI(`TREL_${this.name.replace(/\D/g, "")}`)
        }

        return randomGroup;
    }

    private checkForFreeTable(jobId: number) {
        const group = this.checkForFreeHall(jobId);

        if (group) {
            const point = this.scene.getObjectByName(this.name);
            const carBody = point.children[0].clone();

            carBody.userData.status = "moving";

            const tableToAdd = group.children[this.ms.startAt];

            tableToAdd.add(carBody);

            tableToAdd.userData.carBody = carBody.name;
            tableToAdd.userData.empty = false;

            if (tableToAdd.userData.onAddCar) tableToAdd.userData.onAddCar(this.scene);

            if (point.userData.onRemoveCar) point.userData.onRemoveCar(this.scene);
            
            point.clear();

            this.clearJob(jobId);

            this.empty = true;

            if (!group.userData.job['moveBetweenTables']) group.userData.startJob('moveBetweenTables');
            
        }
    }
}