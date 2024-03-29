export class Trel {
    THREE: any;
    #scene: any;
    #id: number;
    #name: string;
    #x: number;
    #z: number;
    #groups: string[];
    #empty: boolean = true;
    #lastGroup: string;
    #lastTable: string;
    #lastPoint: string;
    #lastCarBody: string;
    #job: any;
    #requests: { 
        type: "introduction" | "extraction", 
        group: string, 
        cell: string, 
        point: string,
        started: boolean
    }[] = [];

    constructor(
        THREE: any,
        scene: any,
        id: number, 
        name: string, 
        x: number, 
        z: number, 
        groups: string[]
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#id = id;
        this.#name = name;
        this.#x = x;
        this.#z = z;
        this.#groups = groups;
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

    get groups() {
        return this.#groups;
    }

    get lastGroup() {
        return this.#lastGroup;
    }

    get lastTable() {
        return this.#lastTable;
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

    get requests() {
        return this.#requests;
    }

    set requests(requests: any[]) {
        this.#requests = requests;
    }

    set lastCarBody(lastCarBody: string) {
        this.#lastCarBody = lastCarBody;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set lastGroup(lastGroup: string) {
        this.#lastGroup = lastGroup;
    }

    set lastTable(lastTable: string) {
        this.#lastTable = lastTable;
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

    private requestJob() {
        if(
            this.requests.length && 
            !this.requests[0].started
        ) {
            this.requests[0].started = true;
            this.lastPoint = this.requests[0].point;
            this.lastGroup = this.requests[0].group;
            this.lastTable = this.requests[0].cell;

            const dest = this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTable);

            if (this.requests[0].type === 'introduction') {
                dest.material.color.setHex(0x76E072);
                this.startJob('moveToTable');
            } else {
                dest.material.color.setHex(0x68D7F2);
                this.startJob('moveToCell');
            }
        }   
    }

    private moveToCell() {
        const { type } = this.requests[0];

        const me = this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTable);
        const trel = this.scene.getObjectByName(this.name);
        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x) - 2;
        const meX = Math.round(me.getWorldPosition(new this.THREE.Vector3()).x);

        if (meX === trelX) {
            if (type === 'introduction') {
                this.onAddToTable();
            } else {
                this.onGrabCar();
            }
        } else {
            if (meX > trelX) {
                trel.position.x = trel.position.x + 5;
            } else {
                trel.position.x = trel.position.x - 5;
            }
        }
    }

    private moveToTable() {
        const trel = this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint); 
        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const pointX = Math.round(point.getWorldPosition(new this.THREE.Vector3()).x);

        if (this.name === "TREL_04")console.log(`${this.name}: ${trelX}`, `[${point.name}]: ${pointX}`)
        
        if (trelX >= (pointX - 2) && trelX <= (pointX + 5))  {
            if (this.requests[0].type === "introduction") {
                this.onGrabCar();
            } else {
                if (!point.userData.empty) return;

                this.onAddToTable();
            }
        } else {
            if (pointX > trelX) {
                trel.position.x = trel.position.x + 5
            } else {
                trel.position.x = trel.position.x - 5
            }
        }
    }

    public onGrabCar() {
        this.clearJob();

        const { type } = this.requests[0];

        const trel = this.scene.getObjectByName(this.name);
        const target = (
            type === 'introduction' ? 
            this.scene.getObjectByName(this.lastPoint) :
            this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTable)
        );
        const carBody = target.children[0].clone();

        target.clear();

        target.userData.empty = true;

        trel.children[0].add(carBody);

        carBody.userData.status = 'moving';

        this.empty = false;
        this.lastCarBody = carBody.name;

        const group = this.scene.getObjectByName(this.lastGroup);

        if (type === 'extraction') {
            group.userData.tablesOccupied -= 1;
            group.userData.empty = group.userData.tablesOccupied === 0;

            this.startJob('moveToTable');
        } else {
            group.userData.tablesOccupied += 1;
            group.userData.empty = group.userData.tablesOccupied === 0;

            this.startJob('moveToCell');
        }
    }

    public onAddToTable() {
        this.clearJob();

        const { type } = this.requests[0];

        const trel = this.scene.getObjectByName(this.name);
        const target = (
            type === 'introduction' ? 
            this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTable) :
            this.scene.getObjectByName(this.lastPoint) 
        );
        const dest = this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTable);
        
        target.userData.empty = false;

        const carBody = trel.children[0].children[0].clone();

        trel.children[0].clear();

        this.empty = true;

        target.add(carBody);

        carBody.userData.status = 'idle';

        this.requests.shift();

        dest.material.color.setHex(0xB3AFAF);
        
        if (type === 'extraction') {
            this.scene.userData.document.getElementById(this.name.replace(/\D/g,'')).querySelector("p").innerHTML = '';
            target.userData.startJob('checkForFreeTable');
        } 
    }


}