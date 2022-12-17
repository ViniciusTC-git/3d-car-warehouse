import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Stats from 'three/examples/jsm/libs/stats.module'
import { Trel } from "./class/Trel";
import { PointTable } from "./class/PointTable";
import { Line } from "./class/Line";

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
	hall = null, 
	ms = {},
	rotation = Math.PI / 2
}) {
	const geometry = new THREE.CylinderGeometry( 2.5, 2.5, 0.5, 32);
	const material = new THREE.MeshStandardMaterial( { color: 0xB3AFAF, side: THREE.DoubleSide } );
	const pointTable = new THREE.Mesh( geometry, material );

	pointTable.name = id;
	pointTable.position.set(x, 0, z);
	pointTable.rotation.y = rotation;

	pointTable.userData = new PointTable(THREE, scene, id, hall, ms);

	scene.add(pointTable);
}

function createTrel(name, x, z, groups) {
	const trel = new THREE.Mesh( 
		new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
		new THREE.MeshLambertMaterial({ color: 0xFCBA03 }) 
	);
	const index = name.replace(/\D/g, "");

	trel.name = name;
	trel.position.set(x, 0, z);

	trel.rotateY(1.56);

	trel.userData = new Trel(THREE, scene, index, name, x, z, groups);
	
	scene.add(trel);
}
function createLine({
	id, 
	car, 
	length, 
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

	for (let i = 0; i < length; i++) {
		const table = new THREE.Mesh( 
			new THREE.BoxGeometry( 3.0, 0.5, 4 ), 
			new THREE.MeshLambertMaterial({ color: 0xB3AFAF }) 
		);

		table.name = `${id}_ME_${i < 10 ? '0' : ''}${i}`
		table.position.set(columnPosition, 0 , i * spaceBetweenTable);
		table.rotation.y = tableRotation ? tableRotation : table.rotation.y;

		if ([true, false][Math.floor(Math.random() * 2)] && !empty) {
			const model = car.scene.clone();

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

			model.name = `${id}_CAR_${i < 10 ? '0' : ''}${i}`;

			model.getObjectByName('Cube').material = material;

			table.add(model);

			occupied++;
		}

		group.add(table);
	}

	group.name = id;
	group.rotation.y = groupRotation;
	group.position.x = groupPosition;
	group.userData = new Line(THREE, scene, id, length, occupied, occupied === 0, point);

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
		createLine({ id: "GROUP_1",  car, length: 24, columnPosition: 0, groupPosition: -50 });
		createLine({ id: "GROUP_2", car, length: 24, columnPosition: 8, groupPosition: -50 });
		createLine({ id: "GROUP_3", car, length: 24, columnPosition: 16, groupPosition: -50 });
		createLine({ id: "GROUP_4", car, length: 24, columnPosition: 24, groupPosition: -50 });
		createLine({ id: "GROUP_5", car, length: 9, columnPosition: 32, groupPosition: 25 });
		createLine({ id: "GROUP_6", car, length: 9, columnPosition: 40, groupPosition: 25 });
		createLine({ id: "GROUP_7", car, length: 9, columnPosition: 48, groupPosition: 25 });
		createLine({ id: "GROUP_8", car, length: 9, columnPosition: 56, groupPosition: 25 });
		createLine({ id: "MS_HALL", car, length: 10, columnPosition: 0, groupPosition: 79, groupRotation: 9.43, spaceBetweenTable: 6, empty: true, point: "PK" });
		createLine({ id: "PK_HALL", car, length: 23, columnPosition: 65, groupPosition: -40, tableRotation: 3.15, empty: true, invert: true });

		createPointTable({ id: "MS_01", x: 72, z: -8, hall: "MS_HALL", ms: { range: 1, startAt: 0 } });
		createPointTable({ id: "MS_02", x: 72, z: -24, hall: "MS_HALL", ms: { range: 4, startAt: 3 } });
		createPointTable({ id: "MS_03", x: 72, z: -40, hall: "MS_HALL", ms: { range: 7, startAt: 6 } });
		createPointTable({ id: "MS_04", x: 72, z: -56, hall: "MS_HALL", ms: { range: 10, startAt: 9 } });
		createPointTable({ id: "PK", x: 78.4, z: -65, rotation: Math.PI / -2, hall: "PK_HALL", ms: { range: 1, startAt: 0 } });

		createTrel("TREL_01", -50, -4, ["GROUP_1", "GROUP_2"]);
		createTrel("TREL_02", -50, -20, ["GROUP_3", "GROUP_4"]);
		createTrel("TREL_03", 25, -36, ["GROUP_5", "GROUP_6"]);
		createTrel("TREL_04", 25, -52, ["GROUP_7", "GROUP_8"]);
		
		setTimeout(() => {
			for (const name of ["TREL_01", "TREL_02", "TREL_03", "TREL_04"]) {
				const trel = scene.getObjectByName(name);
		
				trel.userData.requestJob();
			}
		}, 2000)
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
