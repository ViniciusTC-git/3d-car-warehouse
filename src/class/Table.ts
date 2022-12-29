export class Table {
    THREE: any;
    #scene: any;
    #id: number;
    #name: string;
    #group: string;
    #carBody: string;
    #empty: boolean;
    #point: string;
    #job: any;
    #hall: string[];
    #ms: any;
    onAddCar: any;
    onRemoveCar: any;

    constructor(
        THREE: any,
        scene: any,
        id: number, 
        name: string, 
        group: string,
        carBody: string,
        empty: boolean,
        point: string,
        hall: string[],
        ms: any,
        onAddCar: any,
        onRemoveCar: any
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#id = id;
        this.#name = name;
        this.#group = group;
        this.#carBody = carBody;
        this.#empty = empty;
        this.#point = point;
        this.#hall = hall;
        this.#ms = ms;
        this.onAddCar = onAddCar;
        this.onRemoveCar = onRemoveCar;
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

    get group() {
        return this.#group;
    }

    get carBody() {
        return this.#carBody;
    }

    get empty() {
        return this.#empty;
    }
    
    get point() {
        return this.#point;
    }

    get job() {
        return this.#job;
    }

    get hall() {
        return this.#hall;
    }

    get ms() {
        return this.#ms;
    }

    set empty(empty: boolean) {
        this.#empty = empty;
    }

    set carBody(carBody: string) {
        this.#carBody = carBody;
    }

    private clearJob() {
        clearInterval(this.#job);

        this.#job = null;
    }

    public startJob(name: any, time: number = 2000) {
        if (this.job) return;

        this.#job = setInterval(() => this[name](), time);
    }

    private checkForFreeTable() {
        const { startAt, range } = this.ms;

        const groups = this.hall
            .filter((group: string) => {
                const tablesToCheck = this.scene.getObjectByName(group).children.slice(0, range);
                const waiting = tablesToCheck.some((table: any) => !table.userData.empty);
                
                return !waiting;
            }).map((group: any) => this.scene.getObjectByName(group));

        if (!groups.length) return;

        const randomGroup = groups[Math.floor(Math.random() * groups.length)];

        const tablesToCheck = randomGroup.children;

        if (tablesToCheck.length) {
            const point = this.scene.getObjectByName(this.group).getObjectByName(this.name);
            const carBody = point.children[0].clone();

            tablesToCheck[startAt].add(carBody);
            tablesToCheck[startAt].userData.carBody = carBody.name;
            tablesToCheck[startAt].userData.empty = false;

            if (tablesToCheck[startAt].userData.onAddCar) tablesToCheck[startAt].userData.onAddCar(this.scene);
          
            if (point.userData.onRemoveCar) point.userData.onRemoveCar(this.scene);

            point.clear();

            carBody.userData.status = "moving";

            this.clearJob();

            this.empty = true;

            if (!randomGroup.userData.job['moveBetweenTables']) {
                randomGroup.userData.startJob('moveBetweenTables');
            }
        }
    }

    private checkForFreePoint() {
        const point = this.scene.getObjectByName(this.point);

        if (!point.userData.empty) return;

        this.clearJob();

        const table = this.scene.getObjectByName(this.group).getObjectByName(this.name);

        const carBody = table.children[0].clone();

        if (table.userData.onRemoveCar) table.userData.onRemoveCar(this.scene);
  
        table.clear();

        table.userData.empty = true;

        point.add(carBody);

        if (point.userData.onAddCar) point.userData.onAddCar(this.scene);

        carBody.userData.status = "idle";
        
        point.userData.empty = false;

        point.userData.introductionRequest();
    }

}