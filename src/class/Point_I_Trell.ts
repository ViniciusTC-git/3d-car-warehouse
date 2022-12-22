export class PointITrell {
    THREE: any;
    #scene: any;
    #id: number;
    #name: string;
    #x: number;
    #z: number;
    #points: string[];
    #empty: boolean = true;
    #lastPoint: string;
    #lastCarBody: string;
    #job: any = [];

    constructor(
        THREE: any,
        scene: any,
        id: number, 
        name: string, 
        x: number, 
        z: number, 
        points: string[]
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#id = id;
        this.#name = name;
        this.#x = x;
        this.#z = z;
        this.#points = points;
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

    get x() {
        return this.#x;
    }

    get z() {
        return this.#z;
    }

    get points() {
        return this.#points;
    }

    get lastPoint() {
        return this.#lastPoint;
    }

    get empty() {
        return this.#empty;
    }

    get lastCarBody() {
        return this.#lastCarBody;
    }

    set lastCarBody(lastCarBody: string) {
        this.#lastCarBody = lastCarBody;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set lastPoint(lastPoint: string) {
        this.#lastPoint = lastPoint;
    }

    private hasJobPending(jobId: number) {
        const fifo = Object.keys(this.#job).map((index: string) => +index) as number[];
        
        return !fifo.length ? false : Math.min(...fifo) < jobId;
    }

    private clearJob() {
        clearInterval(this.#job[0]);

        this.#job.shift();
    }

    public startJob(name: any, time: number = 2000) {
        this.#job.push(setInterval(() => this[name](), time))
    }

    private checkForFreeTable() {
        this.requestJob();
    }

    public onAddToTable() {
        this.clearJob();

        const trel = this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint);

        point.userData.empty = false;

        const carBody = trel.children[0].clone();

        trel.clear();

        point.add(carBody);

        point.userData.introductionRequest();

        carBody.userData.status = "idle";

        this.startJob('moveToPointIHall');
    }

    private moveToPointIHall() {
        const trel = this.scene.getObjectByName(this.name);
        const trelZ = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).z);
        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const originX = this.x;
        const originZ = this.z;
        
        if (trelX === originX) {
            if (trelZ === originZ) {
                this.empty = true;
                this.clearJob();
            } else {
                if (originZ > trelZ) {
                    trel.position.z += 5;
                } else {
                    trel.position.z -= 5;
                }
            }
        } else {
            if (originX > trelX) {
                trel.position.x += + 5;
            } else {
                trel.position.x -= 5;
            }
        }
    }

    private moveToTable() {
        const trel = this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint);
    
        const trelZ = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).z);

        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const pointX = Math.round(point.getWorldPosition(new this.THREE.Vector3()).x);

        if (
            (trelZ === -36 && this.lastPoint === "ME_03") ||
            (trelZ === -51 && this.lastPoint === "ME_04") 
        ) {
            if (trelX >= (pointX - 6) && (trelX - 6) <= pointX) {
                this.clearJob();
                this.onAddToTable();
            } else {
                if (pointX > trelX) {
                    trel.position.x += 5;
                } else {
                    trel.position.x -= 5;
                }
            }
        } else {
            trel.position.z += 5;
        }
    }

    public requestJob() {
        const meNames = this.points.filter((me: string) => this.scene.getObjectByName(me).userData.empty);

        if (!meNames.length) return;

        this.clearJob();

        const randomMe = meNames[Math.floor(Math.random() * meNames.length)];

        this.lastPoint = randomMe;

        this.startJob('moveToTable');
    }
}
