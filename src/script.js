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

function createGround() {
	const planeGeometry = new THREE.PlaneGeometry(200, 60);
	const planeMaterial =  new THREE.MeshBasicMaterial({ 
		color: 0xB3AFAF,
		side: THREE.DoubleSide 
	});
	const plane = new THREE.Mesh(planeGeometry, planeMaterial);

	plane.rotation.x = -0.5 * Math.PI;

	scene.add(plane);

	const grid = new THREE.GridHelper(200, 60);

	scene.add(grid);
}


function createPointTable({
	id, 
	x, 
	z, 
	hall = [], 
	ms = {},
	rotation = Math.PI / 2,
	car = null
}) {
	const geometry = new THREE.CylinderGeometry( 2.5, 2.5, 0.5, 32);
	const material = new THREE.MeshStandardMaterial( { color: 0xB3AFAF, side: THREE.DoubleSide } );
	const pointTable = new THREE.Mesh( geometry, material );

	pointTable.name = id;
	pointTable.position.set(x, 0, z);
	pointTable.rotation.y = rotation;

	pointTable.userData = new PointTable(THREE, scene, id, hall, ms, car ? car.scene.clone() : car);

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
	car, 
	capacity, 
	columnPosition, 
	groupPosition,
	groupRotation = Math.PI / 2,
	spaceBetweenTable = 5,
	empty = false,
	tableRotation,
	point = null,
	invert = false
}) {
	const group = new THREE.Group();
	let occupied = 0;

	for (let i = 0; i < capacity; i++) {
		const table = new THREE.Mesh( 
			new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
			new THREE.MeshLambertMaterial({ color: 0xB3AFAF }) 
		);
		
		const tableName = `TABLE_${i < 10 ? '0' : ''}${i}`;
		let carName = null;

		table.name = tableName;
		table.position.set(columnPosition, 0 , i * spaceBetweenTable);
		table.rotation.y = tableRotation ? tableRotation : table.rotation.y;
			
		if ([true, false][Math.floor(Math.random() * 2)] && !empty) {
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

		table.userData = new Table(THREE, scene, i, tableName, id, carName, carName === null);

		group.add(table);
	}

	group.name = id;
	group.rotation.y = groupRotation;
	group.position.x = groupPosition;
	group.userData = new Group(THREE, scene, id, capacity, occupied, occupied === 0, point);

	if (invert) group.children.reverse();

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

	camera.position.set(-10, 30 ,30);

	const orbit = new OrbitControls(camera, render.domElement);

	orbit.update();

	const light = new THREE.AmbientLight(0x333333);

	scene.add(light);

	const directional = new THREE.DirectionalLight(0xFFFFFF, 1);

	directional.position.set(0, 5, 5);

	scene.add(directional);

	const axesHelper = new THREE.AxesHelper(6);

	scene.add(axesHelper);

	createGround();

	const loader = new GLTFLoader();

	loader.load(carUrl.href, (car) => {
		createLine({ id: "GROUP_1", car, capacity: 24, columnPosition: 0, groupPosition: -50 });
		createLine({ id: "GROUP_2", car, capacity: 24, columnPosition: 8, groupPosition: -50 });
		createLine({ id: "GROUP_3", car, capacity: 24, columnPosition: 16, groupPosition: -50 });
		createLine({ id: "GROUP_4", car, capacity: 24, columnPosition: 24, groupPosition: -50 });
		createLine({ id: "GROUP_5", car, capacity: 9, columnPosition: 32, groupPosition: 25 });
		createLine({ id: "GROUP_6", car, capacity: 9, columnPosition: 40, groupPosition: 25 });
		createLine({ id: "GROUP_7", car, capacity: 9, columnPosition: 48, groupPosition: 25 });
		createLine({ id: "GROUP_8", car, capacity: 9, columnPosition: 56, groupPosition: 25 });
		
		createLine({ id: "POINT_I_HALL", car, capacity: 11, columnPosition: 56, groupPosition: -50, empty: true, point: "TREL_POINT_I" });
		createLine({ id: "MS_HALL", car, capacity: 10, columnPosition: 0, groupPosition: 79, groupRotation: 9.43, spaceBetweenTable: 6, empty: true, point: "PK" });
		createLine({ id: "PK_HALL", car, capacity: 23, columnPosition: 65, groupPosition: -40, tableRotation: 3.15, empty: true, invert: true });

		createPointTable({ id: "POINT_I", x: -56, z: -56, hall: ["POINT_I_HALL"], ms: { range: 1, startAt: 0 }, car });

		createPointTable({ id: "ME_01", x: -56, z: -8, hall: ["GROUP_1", "GROUP_2"] });
		createPointTable({ id: "ME_02", x: -56, z: -24, hall: ["GROUP_3", "GROUP_4"]});
		createPointTable({ id: "ME_03", x: 18, z: -40, hall: ["GROUP_5", "GROUP_6"] });
		createPointTable({ id: "ME_04", x: 18, z: -56, hall: ["GROUP_7", "GROUP_8"] });

		createPointTable({ id: "MS_01", x: 72, z: -8, hall: ["MS_HALL"], ms: { range: 1, startAt: 0 } });
		createPointTable({ id: "MS_02", x: 72, z: -24, hall: ["MS_HALL"], ms: { range: 4, startAt: 3 } });
		createPointTable({ id: "MS_03", x: 72, z: -40, hall: ["MS_HALL"], ms: { range: 7, startAt: 6 } });
		createPointTable({ id: "MS_04", x: 72, z: -56, hall: ["MS_HALL"], ms: { range: 10, startAt: 9 } });
		
		createPointTable({ id: "PK", x: 78.4, z: -65, rotation: Math.PI / -2, hall: ["PK_HALL"], ms: { range: 1, startAt: 0 } });

		createPointITrel({ id: 1, name: "TREL_POINT_I", x: 5, z: -56, points: ["ME_03", "ME_04"] });

		createTrel({ id: 1, name: "TREL_01", x: -50, z: -4, groups: ["GROUP_1", "GROUP_2"] });
		createTrel({ id: 2, name: "TREL_02", x: -50, z: -20, groups: ["GROUP_3", "GROUP_4"] });
		createTrel({ id: 3, name: "TREL_03", x: 25, z: -36, groups: ["GROUP_5", "GROUP_6"] });
		createTrel({ id: 4, name: "TREL_04", x: 25, z: -52, groups: ["GROUP_7", "GROUP_8"] });
		
		
		for (const name of [/*"TREL_01", "TREL_02",*/ "TREL_03", "TREL_04"]) {
			const trel = scene.getObjectByName(name);
	
			trel.userData.startJob('requestJob');
		}

		const point = scene.getObjectByName("POINT_I");

		point.userData.randomCar();

	}, undefined, function(error) {
		console.log(error)
	});

	document.body.appendChild(stats.dom);

	render.setClearColor(0xB3AFAF)
	render.setAnimationLoop(() => {
		stats.update();
		render.render(scene, camera);
	});
}

init();
