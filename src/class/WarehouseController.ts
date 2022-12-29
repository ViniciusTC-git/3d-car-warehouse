export class WarehouseController {
    THREE: any;
    #html: any;
    #scene: any;
    #sequences: { carId: number, sequence: number }[] = [];
    #shuffledArray: number[];
    #lastSequence: number = 0;
    #trels: string[];
    #groups: string[];
    #job: any = {};
    
    constructor(
        THREE: any,
        scene: any,
        html: any,
        trels: string[],
        groups: string[]
    ) {
        this.THREE = THREE;
        this.#scene = scene;
        this.#html = html;
        this.#trels = trels;
        this.#groups = groups;
        
        this.createExtractionGUI();
        this.createProgressGUI();
        this.init();
        this.startJob('checkForTrelExtractions', 5000);
        this.startJob('checkForTrelJobs', 5000);
    }

    get scene() {
        return this.#scene;
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
        }).sort((_a, _b) => 0.5 - Math.random());
    }

    public updateProgressGUI(
        id: string,
        action: 'add' | 'remove',
        value?: number
    ) {
        const item = this.html.getElementById(id);
        const progress = item.querySelector(".progress").querySelector("p");
        const bar = item.querySelector(".bar");
        let progressNumber = parseInt(bar.style.height, 10) || 0;

        if (progressNumber < 100) {
            if (action === 'add') {
                progressNumber += (value || 1);
            } else {
                progressNumber -= (value || 1);
            }

            let color = 
              progressNumber >= 0 && progressNumber <= 30 ? 'rgba(227, 47, 47, 0.65)' :
              progressNumber > 30 && progressNumber <= 59 ? 'rgba(179, 181, 16, 0.9)' :
              progressNumber >= 60 && progressNumber <= 100 ? 'rgba(61, 203, 0, 0.63)' : 
              'rgba(227, 47, 47, 0.65)';

            bar.style.backgroundColor = color;
        } else {
            progressNumber = progressNumber >= 100 ? progressNumber : 0
        }

        bar.style.height = `${progressNumber}%`;
        progress.innerText = progressNumber + ' %';
    }

    private createProgressGUI() {
        const container = this.html.createElement("div");

        container.className = 'progress-container';

        const optimo = this.groups
            .map((group: string) => this.scene.getObjectByName(group))
            .reduce((acc: number, curr: any) => acc += curr.userData.tablesOccupied, 0);

        for (const buffer of ['K110', 'Optimo']) {
            const item = this.html.createElement("div");

            item.style.width = '110px';
            item.id = buffer;

            const progress = this.html.createElement("div");
            const bar = this.html.createElement("div");
            const p = this.html.createElement("p");
            const title = this.html.createElement("p");

            title.innerText = buffer;

            title.style.top = 0;
            title.style.color = 'white';
            title.style.fontWeight = 'bold';
            
            item.appendChild(title);

            progress.className = 'progress';
            p.innerText = '0 %';

            bar.className = 'bar';

            progress.appendChild(p);
            progress.appendChild(bar);
            item.appendChild(progress);
            container.appendChild(item);
        }

        this.html.body.appendChild(container);
        this.updateProgressGUI('Optimo', 'add', optimo);
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
    }

    public updateSequenceGUI(
        trelName: string, 
        cellName: string, 
        sequence: number
    ) {
        this.html
            .getElementById(trelName.replace(/\D/g,''))
            .querySelector("p").innerHTML = `${cellName}<br/>SEQ: 0${sequence}`;
    }

    private checkForTrelJobs() {
        for (const name of this.trels) {
            const trel = this.scene.getObjectByName(name);
     
            if (!trel.userData.hasRequest()) continue;

            trel.userData.requestJob();
        }
    }

    private checkForTrelExtractions() {
        for (const name of this.trels) {
            const trel = this.scene.getObjectByName(name);

            if (trel.userData.hasExtractionRequest()) continue;

            const groups = trel.userData.groups;
            const groupsNames = groups.filter((group: string) => this.scene.getObjectByName(group).userData.tablesOccupied > 0)
        
            if (!groupsNames.length) continue;
    
            const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
            const cells = this.scene.getObjectByName(randomGroup).children.filter((table: any) => !table.userData.empty);

            if (!cells.length) continue;

            const randomCell = cells[Math.floor(Math.random() * cells.length)];

            if (this.shuffledArray.length === 0) this.init();

            const sequence = this.shuffledArray.shift();

            this.updateSequenceGUI(name, randomCell.children[0].name, sequence);

            this.sequences = [
                ...this.sequences,
                { 
                    carId: randomCell.children[0].name, 
                    sequence
                },
            ].sort((a: any, b: any) => a.sequence - b.sequence);

            trel.userData.requests = [ 
                ...trel.userData.requests, { 
                    type: "extraction", 
                    group: randomGroup, 
                    cell: randomCell.name, 
                    point: `MS_0${trel.userData.id}`,
                    started: false 
                } 
            ];
        }
    }
}