import { Car } from "./Car";

const COLORS = [
	'0xC7F595',
	'0x878786',
	'0x2B2B29',
	'0x71A2DE',
	'0x993741'
]
export class PointTable {
    THREE: any;
    #scene: any;
    #name: string;
    #empty: boolean = true;
    #hall: string[];
    #ms: any;
    #job: any = {};
    #car: any;

    constructor(
        THREE: any,
        scene: any,
        name: string,
        hall: string[],
        ms: any = {},
        car: any
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#hall = hall;
        this.#ms = ms;
        this.#car = car;
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

    public introductionRequest() {
        const groupsNames = this.hall.filter((group: string) => {
            const groupData = this.scene.getObjectByName(group).userData;

            return groupData.tablesOccupied < (groupData.capacity - 1);
        })
    
        if (!groupsNames.length) return;

        const trel = this.scene.getObjectByName(`TREL_${this.name.replace(/\D/g, "")}`);
        const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
        const cells = this.scene.getObjectByName(randomGroup).children.filter((table: any) => table.userData.empty);
        const randomCell = cells[Math.floor(Math.random() * cells.length)].name;

        console.log(`INTRODUCTION REQUEST: point ${this.name} group: ${randomGroup} cell: ${randomCell}`)

        trel.userData.requests = [ 
            ...trel.userData.requests, { 
                type: "introduction", 
                group: randomGroup, 
                cell: randomCell, 
                point: this.name,
                started: false 
            } 
        ];
    }

    private checkForFreeTable(jobId: number) {
        const hall = this.scene.getObjectByName(this.hall[0]);

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

            carBody.userData.status = "moving";

            this.clearJob(jobId);

            this.empty = true;

            if (!hall.userData.job['moveBetweenTables']) hall.userData.startJob('moveBetweenTables');
        }
    }

    public randomCar() {
        setInterval(() => {
            const point = this.scene.getObjectByName(this.name);

            if (!this.empty || point.children.length) return;

            const model = this.#car.clone();
            const carId = new Date().getTime()
            const carName = `CAR_${carId}`;
    
            model.userData = new Car(carId, carName, "idle", null, null, this.name);
            model.name = carName;
            model.children[1].visible = false;
            model.children[2].visible = false;
            model.children[3].visible = false;
            model.children[0].children[1].visible = false;
            model.children[0].children[2].visible = false;
            model.children[0].children[3].visible = false;
            model.children[0].children[4].visible = false;
            model.children[0].children[5].visible = false;
        
            const material = model.getObjectByName('Cube').material.clone();
        
            material.color.setHex(COLORS[Math.floor(Math.random() * COLORS.length)]);
        
            model.getObjectByName('Cube').material = material;
    
            point.add(model);
    
            this.startJob('checkForFreeTable');
        }, 5000)
    }
}