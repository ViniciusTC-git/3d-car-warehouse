import { Car } from "./Car";
import { COLORS } from "../utils/COLORS";

export interface Buffer {
    [key: string]: {
        hallNames: string[],
        totalCapacity: number,
        progressCalcu: (
            progressNumber: number, 
            action: 'add' | 'remove', 
            value: number,
            totalCapacity: number
        ) => { 
            result: number, 
            color: string
        }
    }
}
export class WarehouseController {
    THREE: any;
    #html: any;
    #scene: any;
    #car: any;
    #sequences: { carId: number, sequence: number }[] = [];
    #shuffledArray: number[];
    #lastSequence: number = 0;
    #trels: string[];
    #groups: string[];
    #job: any = {};
    #warehouseEntryPoints: string[];
    #entryPoints: string[];
    #exitPoints: string[];
    #warehouseExitPoints: string[];
    #buffer: Buffer;
    #extractionsSpoolGUI: any = [];

    constructor(
        THREE: any,
        scene: any,
        car: any,
        html: any,
        trels: string[],
        groups: string[],
        warehouseEntryPoints: string[],
        entryPoints: string[],
        exitPoints: string[],
        warehouseExitPoints: string[],
        buffer: Buffer,
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#car = car;
        this.#html = html;
        this.#trels = trels;
        this.#groups = groups;
        this.#warehouseEntryPoints = warehouseEntryPoints;
        this.#entryPoints = entryPoints;
        this.#exitPoints = exitPoints;
        this.#warehouseExitPoints = warehouseExitPoints;
        this.#buffer = buffer;

        this.createExtractionGUI();
        this.createProgressGUI();
        this.init();
        this.startJob('checkForTrelExtractions', 45000);
        this.startJob('checkForTrelJobs', 5000);
        this.startJob('randomCarWarehouseEntry', 15000);
    }

    get scene() {
        return this.#scene;
    }

    get car() {
        return this.#car;
    }

    get sequences() {
        return this.#sequences;
    }

    set sequences(sequences: { carId: number, sequence: number }[]) {
        this.#sequences = sequences;
    }

    get shuffledArray() {
        return this.#shuffledArray;
    }

    set shuffledArray(shuffledArray: number[]) {
        this.#shuffledArray = shuffledArray;
    }

    get lastSequence() {
        return this.#lastSequence;
    }

    set lastSequence(lastSequence: number) {
        this.#lastSequence = lastSequence;
    }

    get trels() {
        return this.#trels;
    }

    get groups() {
        return this.#groups;
    }

    get job() {
        return this.#job;
    }

    get html() {
        return this.#html;
    }

    get warehouseEntryPoints() {
        return this.#warehouseEntryPoints;
    }

    get entryPoints() {
        return this.#entryPoints;
    }

    get exitPoints() {
        return this.#exitPoints;
    }

    get warehouseExitPoints() {
        return this.#warehouseExitPoints;
    }

    get buffer() {
        return this.#buffer;
    }

    get extractionsSpoolGUI() {
        return this.#extractionsSpoolGUI;
    }

    set extractionsSpoolGUI(extractionsSpoolGUI: any[]) {
        this.#extractionsSpoolGUI = extractionsSpoolGUI;
    }
    
    private clearJob(name: string) {
        clearInterval(this.#job[name]);

        delete this.#job[name];
    }

    public startJob(name: any, time: number = 2000) {
        if (this.job[name]) this.clearJob(name);

        this.#job[name] = setInterval(() => this[name](), time);
    }

    private init() {
        this.shuffledArray = this.randomSequences(this.lastSequence);
		this.lastSequence = Math.max(...this.shuffledArray);
    }

    private randomSequences(lastSequence: number) {
        return [...Array(4).keys()].map((_) => {
            lastSequence += 1;

            return lastSequence;
        });
    }

    public updateProgressGUI(
        id: string,
        action: 'add' | 'remove',
        value: number
    ) {
        const buffer = this.buffer[id];
        const item = this.html.getElementById(id);
        const progress = item.querySelector(".progress").querySelector("p");
        const bar = item.querySelector(".bar");
        const progressNumber = +bar.style.height.replace("%", "") || 0;

        const { result, color } = (
            progressNumber < 100 ? 
            buffer.progressCalcu(progressNumber, action, value, buffer.totalCapacity) :
            { result: (progressNumber >= 100 ? 100 : progressNumber), color: bar.style.backgroundColor }
        );

        bar.style.backgroundColor = color;
        bar.style.height = `${result}%`;
        
        progress.innerText = Math.floor(result) + ' %';
    }

    private createProgressGUI() {
        const container = this.html.createElement("div");

        container.className = 'progress-container';

        for (const [bufferName, value] of Object.entries(this.buffer)) {
            const occupied = value
                .hallNames
                .map((group: string) => this.scene.getObjectByName(group))
                .reduce((acc: number, curr: any) => acc += curr.userData.tablesOccupied || 0, 0);

            const item = this.html.createElement("div");
            const progress = this.html.createElement("div");
            const bar = this.html.createElement("div");
            const p = this.html.createElement("p");
            const title = this.html.createElement("p");

            item.style.width = '110px';
            item.id = bufferName;

            title.innerText = bufferName;
            title.style.top = 0;
            title.style.color = 'white';
            title.style.fontWeight = 'bold';

            progress.className = 'progress';

            const { result, color } = value.progressCalcu(0, 'add', occupied, value.totalCapacity);

            bar.className = 'bar';
            bar.style.backgroundColor = color;
            bar.style.height = `${result}%`;

            p.innerText = Math.floor(result) + ' %';
            
            item.appendChild(title);

            progress.appendChild(p);
            progress.appendChild(bar);

            item.appendChild(progress);

            container.appendChild(item);   
        }

        this.html.body.appendChild(container);
    }

    private createExtractionGUI() {
        const container = this.html.createElement("div");
    
        container.className = 'container';
    
        for (let i = 0; i < 4; i++) {
            const item = document.createElement("div");
            const header = document.createElement("h4");
            const body = document.createElement("p");
    
            item.className = 'item';
            header.className = 'item-header';
            body.className = 'item-body';
    
            item.id = `0${i + 1}`;
    
            header.innerText = `Extraction Hall 0${i + 1}`;
    
            item.appendChild(header);
            item.appendChild(body);
    
            container.appendChild(item);
        }
        
        this.html.body.appendChild(container);
    }

    public clearSequenceGUI(trelName: string) {
        this.html
            .getElementById(trelName.replace(/\D/g,''))
            .querySelector("p").innerHTML = '';

        if (this.extractionsSpoolGUI.length) {
            const extractionGUI = this.extractionsSpoolGUI.shift();

            this.updateSequenceGUI(extractionGUI.trelName, extractionGUI.cellName, extractionGUI.sequence);
        }
    }

    public updateSequenceGUI(
        trelName: string, 
        cellName: string, 
        sequence: number
    ) {
        const e = this.html
            .getElementById(trelName.replace(/\D/g,''))
            .querySelector("p");

        if (e.innerHTML !== '') {
            this.extractionsSpoolGUI = [
                ...this.extractionsSpoolGUI,
                { trelName, cellName, sequence }
            ];

            return;
        }

        this.html
            .getElementById(trelName.replace(/\D/g,''))
            .querySelector("p").innerHTML = `${cellName}<br/>SEQ: 0${sequence}`;
    }

    private checkForTrelJobs() {
        for (const name of this.trels.sort((_a, _b) => 0.5 - Math.random())) {
            const trel = this.scene.getObjectByName(name);
     
            if (!trel.userData.hasRequest()) continue;

            trel.userData.requestJob();
        }
    }

    private checkForTrelExtractions() {
        for (const trelName of this.trels.sort((_a, _b) => 0.5 - Math.random())) {
            const trel = this.scene.getObjectByName(trelName);

            if (trel.userData.hasExtractionRequest()) continue;

            const groups = trel.userData.groups;
            const groupsNames = groups.filter((group: string) => this.scene.getObjectByName(group).userData.tablesOccupied > 0)
        
            if (!groupsNames.length) continue;
    
            const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
            const cells = this.scene
                .getObjectByName(randomGroup)
                .children
                .filter((table: any) => !table.userData.empty);

            if (!cells.length) continue;

            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            const carName = randomCell.children[0].name;
            const exitTable = this.scene.getObjectByName(`MS_${trelName.replace(/\D/g, "")}`);

            if (exitTable.children.length) {
                const carAtExit = exitTable.children[0].name;
                const cartAtExitSequence = this.sequences.find(({ carId }) => carId === carAtExit).sequence;

                if (this.shuffledArray[0] < cartAtExitSequence) continue;
            }

            const sequence = this.shuffledArray.shift();

            this.lastSequence++;
            this.shuffledArray.push(this.lastSequence)
            this.shuffledArray.sort((a: any, b: any) => a - b);
  
            this.sequences = [
                ...this.sequences,
                { 
                    carId: carName, 
                    sequence
                },
            ].sort((a: any, b: any) => a.sequence - b.sequence);

            trel.userData.requests = [ 
                ...trel.userData.requests, { 
                    type: "extraction", 
                    group: randomGroup, 
                    cell: randomCell.name, 
                    point: `MS_0${trel.userData.id}`,
                    carName: carName,
                    sequence,
                    started: false 
                } 
            ];
        }
    }

    private randomCarWarehouseEntry() {
        const entryPoint = this.warehouseEntryPoints[Math.floor(Math.random() * this.warehouseEntryPoints.length)];
        const point = this.scene.getObjectByName(entryPoint);

        if (!point.userData.empty || point.children.length) return;

        const model = this.car.clone();
        const carId = new Date().getTime();
        const carName = `CAR_${carId}`;

        model.userData = new Car(carId, carName, "idle", null, null, entryPoint);
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

        point.userData.startJob('checkForFreeTable');
    }
}