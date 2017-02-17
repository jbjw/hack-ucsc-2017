var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
scene.add( cube );

camera.position.z = 5;

//

var world = new CANNON.World();
world.gravity.set(0,0,-9.82);
world.broadphase = new CANNON.NaiveBroadphase();

var mass = 5, radius = 1;
var sphereShape = new CANNON.Sphere(radius); // Step 1
var sphereBody = new CANNON.Body(mass,sphereShape); // Step 2
sphereBody.position.set(0,0,10);
world.add(sphereBody); // Step 3

var groundShape = new CANNON.Plane();
var groundBody = new CANNON.Body({ mass: 0, shape: groundShape });
world.add(groundBody);

var timeStep = 1.0 / 60.0; // seconds

world.solver.iterations = 2;

function render() {
	requestAnimationFrame( render );

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.01;
	//update();
	world.step(timeStep);
	console.log(sphereBody.position.z);

	renderer.render( scene, camera );
}
render();

function update() {
	cube.position.x = sphereBody.position.x;
	cube.position.y = sphereBody.position.y;
	cube.position.z = sphereBody.position.z;

	cube.quaternion.x = sphereBody.quaternion.x;
	cube.quaternion.y = sphereBody.quaternion.y;
	cube.quaternion.z = sphereBody.quaternion.z;
	cube.quaternion.w = sphereBody.quaternion.w;
}
