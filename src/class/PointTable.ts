import { Car } from "./Car";
import { COLORS } from "./COLORS";

export class PointTable {
    THREE: any;
    #scene: any;
    #name: string;
    #empty: boolean = true;
    #hall: string[];
    #ms: any;
    #job: any = {};
    #car: any;
    #sequenced: boolean;

    constructor(
        THREE: any,
        scene: any,
        name: string,
        hall: string[],
        ms: any = {},
        car: any,
        sequenced: boolean
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#name = name;
        this.#hall = hall;
        this.#ms = ms;
        this.#car = car;
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

        console.log(`INTRODUCTION REQUEST: point: ${this.name} group: ${randomGroup} cell: ${randomCell}`)

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
        }

        return randomGroup;
    }

    private checkForFreeTable(jobId: number) {
        const group = this.checkForFreeHall(jobId);

        if (group) {
            const tablesToCheck = group.children;
            
            const { startAt } = this.ms;

            const point = this.scene.getObjectByName(this.name);
            const carBody = point.children[0].clone();

            tablesToCheck[startAt].add(carBody);
            tablesToCheck[startAt].userData.carBody = carBody.name;
            tablesToCheck[startAt].userData.empty = false;

            if (tablesToCheck[startAt].userData.onAddCar) {
                tablesToCheck[startAt].userData.onAddCar(this.scene);
            }

            if (point.userData.onRemoveCar) {
                point.userData.onRemoveCar(this.scene);
            }

            point.clear();

            carBody.userData.status = "moving";

            this.clearJob(jobId);

            this.empty = true;

            if (!tablesToCheck[0].parent.userData.job['moveBetweenTables']) {
                tablesToCheck[0].parent.userData.startJob('moveBetweenTables');
            }
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
        }, 10000);
    }
}