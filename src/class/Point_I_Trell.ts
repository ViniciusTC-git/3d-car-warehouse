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
    #job: any;

    constructor(
        THREE: any,
        scene: string,
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
        this.#job = null;
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

    private startJob(name: any, time: number = 2000) {
        this.#job = setInterval(() => this[name](), time);
    }

    private clearJob() {
        clearInterval(this.#job);

        this.#job = null;
    }

    public onAddToPoint() {
        this.clearJob();

        const trel =  this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint);

        point.userData.empty = false;

        const carBody = trel.children[0].clone();

        trel.clear();

        this.empty = true;

        point.add(carBody);

        /*setTimeout(() => {
            point.userData.startJob('checkForFreeTable');

            this.requestJob();
        }, 2000);*/
    }

    private moveToPointIHall() {
        const trel = this.scene.getObjectByName(this.name);
        const trelZ = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).z);
        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const originX = this.x;
        const originZ = this.z;
        
        if (trelX === originX) {
            if (trelZ === originZ) {
                console.log('center');
            } else {
                if (originZ > trelZ) {
                    trel.position.z = trel.position.z + 5
                } else {
                    trel.position.z = trel.position.z - 5
                }
            }
        } else {
            if (originX > trelX) {
                trel.position.x = trel.position.x + 5
            } else {
                trel.position.x = trel.position.x - 5
            }
        }
    }

    private moveToPoint() {
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
                this.startJob('moveToPointIHall');
            } else {
                if (pointX > trelX) {
                    trel.position.x = trel.position.x + 5
                } else {
                    trel.position.x = trel.position.x - 5
                }
            }
            /*if (!point.userData.empty) return;

            this.onAddToPoint();*/
        } else {
            trel.position.z = trel.position.z + 5 
        }
    }

    public requestJob() {
        const trel = this.scene.getObjectByName(this.name);
        const pointsNames = this.points.filter((point) => this.scene.getObjectByName(point).userData.empty);

        if (!pointsNames.length) {
            trel.position.x = this.x;
    
            return;
        }
    
        const randomPoint = pointsNames[Math.floor(Math.random() * pointsNames.length)];

        this.lastPoint = randomPoint;

        this.startJob('moveToPoint');
    }
}
