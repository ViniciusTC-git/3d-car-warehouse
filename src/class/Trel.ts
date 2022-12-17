export class Trel {
    THREE: any;
    #scene: any;
    #id: number;
    #name: string;
    #x: number;
    #z: number;
    #groups: string[];
    #lastGroup: string;
    #lastTarget: string;
    #lastPoint: string;
    #job: any;

    constructor(
        THREE: any,
        scene: string,
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

    get lastTarget() {
        return this.#lastTarget;
    }

    get lastPoint() {
        return this.#lastPoint;
    }

    set lastGroup(lastGroup: string) {
        this.#lastGroup = lastGroup;
    }

    set lastTarget(lastTarget: string) {
        this.#lastTarget = lastTarget;
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
        const trel = this.scene.getObjectByName(this.name);
        const groupsNames = this.groups.filter((group) => !this.scene.getObjectByName(group).userData.empty);
    
        if (!groupsNames.length) {
            trel.position.x = this.x;
    
            return;
        }
    
        const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
        const cells = this.scene.getObjectByName(randomGroup).children.filter((children: any) => children.children.length);
        const randomCell = cells[Math.floor(Math.random() * cells.length)].name;
    
        this.lastGroup = randomGroup;
        this.lastTarget = randomCell;

        this.startJob('moveToTarget');
    }

    private moveToTarget() {
        const me = this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTarget);
        const trel = this.scene.getObjectByName(this.name);

        me.material.color.setHex(trel.children.length ? 0xDE9B16 : 0x68D7F2);

        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const meX = Math.round(me.getWorldPosition(new this.THREE.Vector3()).x);

        /*if (trelId.includes("01")) {
            console.log(`${trelId}: ${trelX}`, `[${groupId}]${targetId}:${meX}`)
        }*/

        if (meX === trelX) {
            this.onGrabCar();
        } else {
            if (meX > trelX) {
                trel.position.x = trel.position.x + 5;
            } else {
                trel.position.x = trel.position.x - 5;
            }
        }
    }

    private moveToPoint() {
        const trel = this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint);
    
        const trelX = Math.round(trel.getWorldPosition(new this.THREE.Vector3()).x);
        const pointX = Math.round(point.getWorldPosition(new this.THREE.Vector3()).x);
    
        /*if (trelId.includes("01")) {
            console.log(`${trelId}: ${trelX}`, `${pointId}:${pointX}`)
        }*/
    
        if (trelX >= (pointX - 2) && trelX <= pointX) {
    
            if (!point.userData.empty) return;

            this.onAddToPoint();
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

        const trel = this.scene.getObjectByName(this.name);
        const me = this.scene.getObjectByName(this.lastGroup).getObjectByName(this.lastTarget);
        const carBody = me.children[0].clone();

        me.clear();

        trel.add(carBody);
       
        me.material.color.setHex(0xB3AFAF);

        this.lastPoint = `MS_${this.id}`;

        const group = this.scene.getObjectByName(this.lastGroup);

        group.userData.occupied -= 1;
        group.userData.empty = group.userData.occupied === 0

        this.startJob('moveToPoint');
    }

    public onAddToPoint() {
        this.clearJob();

        const trel =  this.scene.getObjectByName(this.name);
        const point = this.scene.getObjectByName(this.lastPoint);

        point.userData.empty = false;

        const carBody = trel.children[0].clone();

        trel.clear();

        point.add(carBody);

        setTimeout(() => {
            point.userData.startJob('checkForFreeTable');

            this.requestJob();
        }, 2000);
    }


}