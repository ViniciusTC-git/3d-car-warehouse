import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from 'three/examples/jsm/libs/stats.module'
import { Trel } from "./class/Trel";
import { PointTable } from "./class/PointTable";
import { Group } from "./class/Group";
import { Table } from "./class/Table"
import { PointITrell } from "./class/Point_I_Trell"
import { Car } from './class/Car';

const COLORS = [
	'0xC7F595',
	'0x878786',
	'0x2B2B29',
	'0x71A2DE',
	'0x993741'
]
const carUrl = new URL("../static/SUV.glb", import.meta.url);
const scene = new THREE.Scene();
const stats = Stats();

scene.userData.document = document;

function createExtractionGUI() {
	const container = document.createElement("div");

	container.style.zIndex = '2'
	container.style.position = 'fixed';
	container.style.top = '5px'
	container.style.left = '600px'
	container.style.display = 'flex';
	container.style.flexWrap = 'nowrap';
	container.style.fontFamily = 'Verdana, sans-serif';

	for (let i = 0; i < 4; i++) {
		const item = document.createElement("div");
		const header = document.createElement("h4");
		const body = document.createElement("p");

		item.id = `0${i + 1}`;

		item.style.cursor = 'pointer';
		item.style.flexDirection = 'column';
		item.style.width = '150px';
		item.style.height = '60px'
		item.style.margin = '5px';
		item.style.textAlign = 'center';
		item.style.lineHeight = '0px';
		item.style.fontSize = '12px';
		item.style.border = '2px solid #2d2e30';
		item.style.borderRadius = '12px';
		item.style.padding = '5px';
		item.style.color = 'white';
		item.style.backgroundColor = 'rgba( 0, 0, 0, 0.75 )';

		header.innerText = `Extraction Hall 0${i + 1}`;
		
		item.appendChild(header);

		body.innerText = '';

		item.appendChild(body);

		container.appendChild(item);
	}
	
	document.body.appendChild(container);
}


function randomSequences(lastSequence) {
	return [...Array(4).keys()].map((_) => {
		lastSequence += 1;
		return lastSequence;
	}).sort((_a, _b) => 0.5 - Math.random());
}

function createGround() {
	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry( 1000, 1000 ), 
		new THREE.MeshPhongMaterial( { color: 0xD6D6D6, depthWrite: false } ) 
	);

	ground.rotation.x = - Math.PI / 2;

	scene.add(ground)
	/*const planeGeometry = new THREE.PlaneGeometry(200, 200);
	const planeMaterial =  new THREE.MeshBasicMaterial({ 
		color: 0xB3AFAF,
		side: THREE.DoubleSide 
	});
	const plane = new THREE.Mesh(planeGeometry, planeMaterial);

	plane.rotation.x = -0.5 * Math.PI;

	scene.add(plane);*/

	//const axesHelper = new THREE.AxesHelper(6);

	//scene.add(axesHelper);

	//const grid = new THREE.GridHelper(200, 60);

	//scene.add(grid);
}


function createPointTable({
	id, 
	x, 
	z, 
	hall = [], 
	ms = {},
	rotation = Math.PI / 2,
	car = null,
	sequenced = false
}) {
	const geometry = new THREE.CylinderGeometry( 2.5, 2.5, 0.5, 32);
	const material = new THREE.MeshStandardMaterial( { color: 0xB3AFAF, side: THREE.DoubleSide } );
	const pointTable = new THREE.Mesh( geometry, material );

	pointTable.name = id;
	pointTable.position.set(x, 0, z);
	pointTable.rotation.y = rotation;

	pointTable.userData = new PointTable(THREE, scene, id, hall, ms, (car ? car.scene.clone() : car), sequenced);

	scene.add(pointTable);
}
function createPointITrel({ 
	id, 
	name, 
	x, 
	z, 
	points 
}) {
	const trel = new THREE.Mesh( 
		new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
		new THREE.MeshLambertMaterial({ color: 0xFCBA03 }) 
	);

	trel.name = name;
	trel.position.set(x, 0, z);

	trel.rotateY(1.56);

	trel.userData = new PointITrell(THREE, scene, id, name, x, z, points);
	
	scene.add(trel);
}
function createTrel({ id, name, x, z, groups }) {
	const trel = new THREE.Mesh( 
		new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
		new THREE.MeshLambertMaterial({ color: 0xFCBA03 }) 
	);

	trel.name = name;
	trel.position.set(x, 0, z);

	trel.rotateY(1.56);

	trel.userData = new Trel(THREE, scene, id, name, x, z, groups);
	
	scene.add(trel);
}
function createRandomCar({ 
	model, 
	id, 
	name, 
	status, 
	hall, 
	cell, 
	point 
}) {
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

	model.name = name;
	model.userData = new Car(id, name, status, hall, cell, point);

	return model;
}
function createLine({
	id, 
	capacity, 
	position,
	rotation,
	invert,
	point,
	tableStyle,
	car,
	nextHall,
	exitTables
}) {
	const group = new THREE.Group();

	let occupied = 0;

	group.name = id;

	group.rotation.set(rotation.x, (rotation.y || Math.PI / 2), rotation.z);
	group.position.set(position.x, position.y, position.z);

	for (let i = 0; i < capacity; i++) {
		const table = new THREE.Mesh( 
			new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
			new THREE.MeshPhongMaterial({ 
				color: 0xB3AFAF, 
				depthWrite: false 
			}) 
		);
		
		const tableName = `TABLE_${i < 10 ? '0' : ''}${i}`;

		let carName = null;

		table.name = tableName;

		table.rotation.set(
			tableStyle[i].rotation.x, 
			tableStyle[i].rotation.y, 
			tableStyle[i].rotation.z
		);
		table.position.set(
			tableStyle[i].position.x, 
			tableStyle[i].position.y , 
			i * tableStyle[i].spaceBetweenTable
		);
			
		if ([true, false][Math.floor(Math.random() * 2)] && !tableStyle[i].empty) {
			carName = `CAR_${i < 10 ? '0' : ''}${i}`;

			table.add(createRandomCar({
				model: car.scene.clone(),
				id: i,
				name: carName,
				hall: id,
				cell: tableName,
				point: null,
				status: "idle"
			}));

			occupied++;
		}

		table.userData = new Table(
			THREE, 
			scene, 
			i, 
			tableName, 
			id, 
			carName, 
			carName === null, 
			tableStyle[i]?.point, 
			tableStyle[i]?.hall, 
			tableStyle[i]?.ms
		);

		group.add(table);
	}

	group.userData = new Group(
		THREE, 
		scene, 
		id, 
		capacity, 
		occupied, 
		occupied === 0, 
		point,
		nextHall,
		exitTables
	);

	if (invert) {
		group.children.reverse();
	}

	scene.add(group);
}

function init() {
	const render = new THREE.WebGLRenderer();

	render.setSize(window.innerWidth, window.innerHeight);

	document.body.appendChild(render.domElement);

	const camera = new THREE.PerspectiveCamera(
		30,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);

	camera.position.set( 120, 50, -160);

	const orbit = new OrbitControls(camera, render.domElement);

	orbit.update();

	scene.background = new THREE.Color(0xa0a0a0);
	scene.fog = new THREE.Fog(0xa0a0a0, 10, 1000);

	const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );

	hemiLight.position.set(0, 20, 0);

	scene.add( hemiLight );

	createGround();

	const loader = new GLTFLoader();

	loader.load(carUrl.href, (car) => {
		createLine({ 
			id: "GROUP_01", 
			capacity: 24, 
			position: { x: -50, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(24).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 0, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_02", 
			capacity: 24, 
			position: { x: -50, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(24).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 8, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_03", 
			capacity: 24, 
			position: { x: -50, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(24).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 16, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_04", 
			capacity: 24, 
			position: { x: -50, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(24).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 24, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_05", 
			capacity: 9, 
			position: { x: 25, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(9).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 32, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_06", 
			capacity: 9, 
			position: { x: 25, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(9).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 40, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_07", 
			capacity: 9, 
			position: { x: 25, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(9).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 48, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "GROUP_08", 
			capacity: 9, 
			position: { x: 25, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: null,
			tableStyle: [...Array(9).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 56, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: false
				}
			}), {}),
			car
		});
		createLine({ 
			id: "MS_HALL", 
			capacity: 10, 
			position: { x: 79, y: 0, z: -8.5 },
			rotation: { x: 0, y: 9.43, z: 0 },
			invert: false,
			point: "PK",
			tableStyle: [...Array(10).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 0, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5.25,
					empty: true
				}
			}), {})
		});
		createLine({ 
			id: "PK_HALL", 
			capacity: 23, 
			position: { x: -40, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: true,
			tableStyle: [...Array(23).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 65, y: 0, z: 0 }, 
					rotation: { x: 0, y: 3.15, z: 0 },
					spaceBetweenTable: 5,
					empty: true
				}
			}), {})
		});
		createLine({ 
			id: "POINT_I_HALL", 
			capacity: 11, 
			position: { x: -50, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: false,
			point: "TREL_POINT_I",
			tableStyle: [...Array(11).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 56, y: 0, z: 0 }, 
					rotation: { x: 0, y: 0, z: 0 },
					spaceBetweenTable: 5,
					empty: true
				}
			}), {})
		});
		createLine({ 
			id: "INTRODUCTION_HALL_1", 
			capacity: 3, 
			position: { x: -58, y: 0, z: -0.5 },
			rotation: { x: 0, y: 0, z: 0 },
			invert: true,
			nextHall: "INTRODUCTION_HALL_2",
			tableStyle: [...Array(3).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 50, y: 0, z: 0 }, 
					rotation: { x: 0, y: 3.15, z: 0 },
					spaceBetweenTable: 5,
					empty: true,
					...(
						tableIndex === 0 ? {
							ms: { range: 3, startAt: 0 },
							hall: ["INTRODUCTION_HALL_2"]
						} : {}
					)
				}
			}), {})
		});
		createLine({ 
			id: "INTRODUCTION_HALL_2", 
			capacity: 9, 
			position: { x: -103, y: 0, z: -49 },
			rotation: { x: 0, y: 0.0001, z: 0 },
			exitTables: ["TABLE_05", "TABLE_08"],
			tableStyle: [...Array(9).keys()].reduce((acc, tableIndex) => ({ 
				...acc, 
				[tableIndex]: {
					position: { x: 40, y: 0, z: 0 }, 
					rotation: { x: 0, y: ([5, 8].includes(tableIndex) ? Math.PI / 2 : 0), z: 0 },
					spaceBetweenTable: 5,
					empty: true,
					point: tableIndex === 5 ? "ME_02" : tableIndex === 8 ? "ME_01" : null
				}
			}), {})
		});

		createPointTable({ id: "POINT_I", x: -56, z: -56, hall: ["POINT_I_HALL", "INTRODUCTION_HALL_1"], ms: { range: 3, startAt: 0 }, car });
		createPointTable({ id: "ME_01", x: -56, z: -8, hall: ["GROUP_01", "GROUP_02"] });
		createPointTable({ id: "ME_02", x: -56, z: -24, hall: ["GROUP_03", "GROUP_04"]});
		createPointTable({ id: "ME_03", x: 18, z: -40, hall: ["GROUP_05", "GROUP_06"] });
		createPointTable({ id: "ME_04", x: 18, z: -56, hall: ["GROUP_07", "GROUP_08"] });
		createPointTable({ id: "MS_01", x: 72, z: -8, hall: ["MS_HALL"], ms: { range: 1, startAt: 0 }, sequenced: true });
		createPointTable({ id: "MS_02", x: 72, z: -24, hall: ["MS_HALL"], ms: { range: 4, startAt: 3 }, sequenced: true });
		createPointTable({ id: "MS_03", x: 72, z: -40, hall: ["MS_HALL"], ms: { range: 7, startAt: 6 }, sequenced: true });
		createPointTable({ id: "MS_04", x: 72, z: -56, hall: ["MS_HALL"], ms: { range: 10, startAt: 9 }, sequenced: true });		
		createPointTable({ id: "PK", x: 78.4, z: -65, rotation: Math.PI / -2, hall: ["PK_HALL"], ms: { range: 1, startAt: 0 } });
		createPointITrel({ id: 1, name: "TREL_POINT_I", x: 5, z: -56, points: ["ME_03", "ME_04"] });

		createTrel({ id: 1, name: "TREL_01", x: -50, z: -4, groups: ["GROUP_01", "GROUP_02"] });
		createTrel({ id: 2, name: "TREL_02", x: -50, z: -20, groups: ["GROUP_03", "GROUP_04"] });
		createTrel({ id: 3, name: "TREL_03", x: 25, z: -36, groups: ["GROUP_05", "GROUP_06"] });
		createTrel({ id: 4, name: "TREL_04", x: 25, z: -52, groups: ["GROUP_07", "GROUP_08"] });
		
		
		for (const name of ["TREL_01", "TREL_02", "TREL_03", "TREL_04"]) {
			const trel = scene.getObjectByName(name);
	
			trel.userData.startJob('requestJob');
		}

		
		const point = scene.getObjectByName("POINT_I");

		point.userData.randomCar();

		let shuffledArray = randomSequences(0);
		let lastSequence = Math.max(...shuffledArray);

		setInterval(() => {
			for (const name of ["TREL_01", "TREL_02","TREL_03", "TREL_04"]) {
				const trel = scene.getObjectByName(name);

				if (trel.userData.requests.some((request) => request.type === 'extraction')) continue;

				const groups = trel.userData.groups;
				const groupsNames = groups.filter((group) => scene.getObjectByName(group).userData.tablesOccupied > 0)
			
				if (!groupsNames.length) continue;
		
				const randomGroup = groupsNames[Math.floor(Math.random() * groupsNames.length)];
				const cells = scene.getObjectByName(randomGroup).children.filter((table) => !table.userData.empty);

				if (!cells.length) continue;

				const randomCell = cells[Math.floor(Math.random() * cells.length)];

				if (shuffledArray.length === 0) {
					shuffledArray = randomSequences(lastSequence);
					lastSequence = Math.max(...shuffledArray);
				}

				console.log(lastSequence, shuffledArray);

				const sequence = shuffledArray.shift();

				document
					.getElementById(name.replace(/\D/g,''))
					.querySelector("p").innerHTML = `
						<p>${randomCell.children[0].name}</p>
						<p>SEQ: 0${sequence}</p>
					`;

				scene.userData.sequences = [
					...(scene.userData.sequences || []),
					{ 
						carId: randomCell.children[0].name, 
						sequence
					},
				] 

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
		}, 5000)

	}, undefined, function(error) {
		console.log(error)
	});

	document.body.appendChild(stats.dom);

	createExtractionGUI();

	render.setClearColor(0xB3AFAF)
	render.setAnimationLoop(() => {
		stats.update();
		render.render(scene, camera);
	});

	window.addEventListener( 'resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;

		camera.updateProjectionMatrix();

		render.setSize(window.innerWidth, window.innerHeight);
	});
}

init();
