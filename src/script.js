import * as THREE from "three"
import Stats from 'three/examples/jsm/libs/stats.module'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Trel } from "./class/Trel";
import { PointTable } from "./class/PointTable";
import { Group } from "./class/Group";
import { Table } from "./class/Table"
import { PointITrell } from "./class/Point_I_Trell";
import { Car } from './class/Car';
import { WarehouseController } from './class/WarehouseController';
import { COLORS } from './utils/COLORS';
import { progressCalcu } from './utils/progressCalc';

const carUrl = new URL("../static/SUV.glb", import.meta.url);
const trelUrl = new URL("../static/trel.json", import.meta.url);
const scene = new THREE.Scene();
const stats = Stats();

function createGround() {
	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry( 1000, 1000 ), 
		new THREE.MeshPhongMaterial({ 
			color: 0xD6D6D6, 
			depthWrite: false 
		}) 
	);

	ground.rotation.x = - Math.PI / 2;

	scene.add(ground)
}


function createPointTable({
	id, 
	x, 
	z, 
	hall = [], 
	ms = {},
	rotation = Math.PI / 2,
	sequenced = false
}) {
	const pointTable = new THREE.Mesh( 
		new THREE.CylinderGeometry(2.5, 2.5, 0.5, 32), 
		new THREE.MeshToonMaterial({ 
			color: 0xB3AFAF,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.8 
		})
	);

	pointTable.name = id;
	pointTable.position.set(x, 0, z);
	pointTable.rotation.y = rotation;

	pointTable.userData = new PointTable(THREE, scene, id, hall, ms, sequenced);

	scene.add(pointTable);
}
function createPointITrel({ 
	id, 
	trel,
	name, 
	x, 
	z, 
	points 
}) {
	trel.name = name;
	trel.position.set(x, 0, z);

	trel.rotateY(1.56);

	trel.userData = new PointITrell(THREE, scene, id, name, x, z, points);
	
	scene.add(trel);
}
function createTrel({ 
	id, 
	trel, 
	name, 
	x, 
	z, 
	groups,
	buffer
}) {
	trel.name = name;
	trel.position.set(x, 0, z);

	trel.rotateY(1.56);

	trel.userData = new Trel(THREE, scene, id, name, x, z, groups, buffer);
	
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
			new THREE.MeshToonMaterial( { 
				color: tableStyle[i].color || 0xB3AFAF,
				opacity: tableStyle[i].opacity || 0.8,
				transparent: true 
			} )
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
			carName = `CAR_${new Date().getTime()}`;

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
			tableStyle[i]?.ms,
			tableStyle[i]?.onAddCar,
			tableStyle[i]?.onRemoveCar,
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

	camera.position.set(120, 50, -160);

	const orbit = new OrbitControls(camera, render.domElement);

	orbit.minPolarAngle = 0;
	orbit.maxPolarAngle =  Math.PI * 0.49;
	orbit.dampingFactor = 0.25;

	orbit.update();

	const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x444444);

	hemiLight.position.set(0, 20, 0);

	scene.add( hemiLight );

	createGround();

	scene.background = new THREE.Color(0xA0A0A0);
	scene.fog = new THREE.Fog(0xA0A0A0, 10, 1000);

	const loader = new GLTFLoader();

	loader.load(carUrl.href, (car) => {
		const objLoader = new THREE.ObjectLoader();

		objLoader.load(trelUrl.href, (trel) => {
			createPointITrel({ id: 1, trel: trel.clone(), name: "TREL_POINT_I", x: 8, z: -56, points: ["ME_03", "ME_04"] });
			createTrel({ id: 1,  trel: trel.clone(), name: "TREL_01", x: -48, z: -4, groups: ["GROUP_01", "GROUP_02"], buffer: 'Optimo' });
			createTrel({ id: 2, trel: trel.clone(), name: "TREL_02", x: -48, z: -20, groups: ["GROUP_03", "GROUP_04"], buffer: 'Optimo' });
			createTrel({ id: 3, trel: trel.clone(), name: "TREL_03", x: 27, z: -36, groups: ["GROUP_05", "GROUP_06"], buffer: 'Optimo' });
			createTrel({ id: 4, trel: trel.clone(), name: "TREL_04", x: 27, z: -52, groups: ["GROUP_07", "GROUP_08"], buffer: 'Optimo' });
		});

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
					empty: false,
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
					empty: true,
					color: 0x479ecc,
					opacity: 0.4
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
					empty: true,
					color: 0x479ecc,
					opacity: 0.4,
					...(
						tableIndex === 0 ? { onRemoveCar: (scene) => scene.userData.updateProgressGUI('K110', 'remove', 1) } :
						tableIndex === 22 ? { onAddCar: (scene) => scene.userData.updateProgressGUI('K110', 'add', 1) }  : {}
					)
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
					empty: true,
					color: 0xd98704,
					opacity: 0.4
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
					color: 0xd98704,
					opacity: 0.4,
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
					color: 0xd98704,
					opacity: 0.4,
					empty: true,
					point: tableIndex === 5 ? "ME_02" : tableIndex === 8 ? "ME_01" : null
				}
			}), {})
		});

		createPointTable({ id: "POINT_I", x: -56, z: -56, hall: ["POINT_I_HALL", "INTRODUCTION_HALL_1"], ms: { range: 3, startAt: 0 } });
		createPointTable({ id: "ME_01", x: -56, z: -8, hall: ["GROUP_01", "GROUP_02"] });
		createPointTable({ id: "ME_02", x: -56, z: -24, hall: ["GROUP_03", "GROUP_04"]});
		createPointTable({ id: "ME_03", x: 18, z: -40, hall: ["GROUP_05", "GROUP_06"] });
		createPointTable({ id: "ME_04", x: 18, z: -56, hall: ["GROUP_07", "GROUP_08"] });
		createPointTable({ id: "MS_01", x: 72, z: -8, hall: ["MS_HALL"], ms: { range: 1, startAt: 0 }, sequenced: true });
		createPointTable({ id: "MS_02", x: 72, z: -24, hall: ["MS_HALL"], ms: { range: 4, startAt: 3 }, sequenced: true });
		createPointTable({ id: "MS_03", x: 72, z: -40, hall: ["MS_HALL"], ms: { range: 7, startAt: 6 }, sequenced: true });
		createPointTable({ id: "MS_04", x: 72, z: -56, hall: ["MS_HALL"], ms: { range: 10, startAt: 9 }, sequenced: true });		
		createPointTable({ id: "PK", x: 78.4, z: -65, rotation: Math.PI / -2, hall: ["PK_HALL"], ms: { range: 1, startAt: 0 } });

		scene.userData = new WarehouseController(
			THREE, 
			scene, 
			car.scene.clone(),
			document, 
			["TREL_01","TREL_02","TREL_03","TREL_04"], 
			["GROUP_01","GROUP_02","GROUP_03","GROUP_04","GROUP_05","GROUP_06","GROUP_07","GROUP_08"],
			["POINT_I"],
			["ME_01", "ME_02", "ME_03", "ME_04"],
			["MS_01", "MS_02", "MS_03", "MS_04"],
			["PK"],
			{
				['K110']: {
					hallNames: ["PK"],
					totalCapacity: 23,
					progressCalcu
				},
				['Optimo']: {
					hallNames: ["GROUP_01","GROUP_02","GROUP_03","GROUP_04","GROUP_05","GROUP_06","GROUP_07","GROUP_08"],
					totalCapacity: 128, // degree - 1 why ? because safe cell !
					progressCalcu
				}
			}
		);
	}, undefined, function(error) {
		console.log(error)
	});

	document.body.appendChild(stats.dom);

	render.setClearColor(0xB3AFAF);

	render.setAnimationLoop(() => {
		stats.update();
		render.render(scene, camera);
	});

	window.addEventListener('resize', () => {
		camera.aspect = window.innerWidth / window.innerHeight;

		camera.updateProjectionMatrix();

		render.setSize(window.innerWidth, window.innerHeight);
	});
}

init();
