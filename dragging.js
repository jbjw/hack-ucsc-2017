if ( WEBVR.isAvailable() === false ) {
	document.body.appendChild( WEBVR.getMessage() );
}

var container;
var camera, scene, renderer;
var effect, controls;
var controller1, controller2;

var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();

var group;

// cannon
var world, mass, body, shape, timeStep=1/60

initThree();
initCannon();
animate();

function initCannon() {
	world = new CANNON.World();

	world.gravity.set(Math.random()*3-(3/2),Math.random()*3-(3/2),-1);
	world.broadphase = new CANNON.NaiveBroadphase();
	world.solver.iterations = 10;

// CANNON.Sphere( radius );
// CANNON.Plane()
//

	shape = new CANNON.Box(new CANNON.Vec3(1,1,1));
	mass = 1;
	body = new CANNON.Body({
		mass: 1,
		shape: shape,
	});
	// body.addShape(shape);
	body.angularVelocity.set(1,10,1);
	body.angularDamping = 0.9;
	world.addBody(body);
}

function initThree() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> webgl - htc vive';
	container.appendChild( info );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x808080 );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 10 );
	scene.add( camera );

	var geometry = new THREE.PlaneGeometry( 4, 4 );
	var material = new THREE.MeshStandardMaterial( {
		color: 0xeeeeee,
		roughness: 1.0,
		metalness: 0.0
	} );
	var floor = new THREE.Mesh( geometry, material );
	floor.rotation.x = - Math.PI / 2;
	floor.receiveShadow = true;
	scene.add( floor );

	scene.add( new THREE.HemisphereLight( 0x808080, 0x606060 ) );

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 6, 0 );
	light.castShadow = true;
	light.shadow.camera.top = 2;
	light.shadow.camera.bottom = -2;
	light.shadow.camera.right = 2;
	light.shadow.camera.left = -2;
	light.shadow.mapSize.set( 4096, 4096 );
	scene.add( light );

	group = new THREE.Group();
	scene.add( group );

	var geometries = [
		new THREE.BoxGeometry( 0.2, 0.2, 0.2 ),
		new THREE.ConeGeometry( 0.2, 0.2, 64 ),
		new THREE.CylinderGeometry( 0.2, 0.2, 0.2, 64 ),
		new THREE.IcosahedronGeometry( 0.2, 3 ),
		new THREE.TorusGeometry( 0.2, 0.04, 64, 32 )
	];

	for ( var i = 0; i < 50; i ++ ) {

		var geometry = geometries[ Math.floor( Math.random() * geometries.length ) ];
		var material = new THREE.MeshStandardMaterial( {
			color: Math.random() * 0xffffff,
			roughness: 0.7,
			metalness: 0.0,
		} );

		var object = new THREE.Mesh( geometry, material );

		object.position.x = Math.random() * 4 - 2;
		object.position.y = Math.random() * 2;
		object.position.z = Math.random() * 4 - 2;

		object.rotation.x = Math.random() * 2 * Math.PI;
		object.rotation.y = Math.random() * 2 * Math.PI;
		object.rotation.z = Math.random() * 2 * Math.PI;

		object.scale.setScalar( Math.random() + 0.5 );

		object.castShadow = true;
		object.receiveShadow = true;

		group.add( object );

	}

	//

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	container.appendChild( renderer.domElement );

	controls = new THREE.VRControls( camera );
	controls.standing = true;

	// controllers

	controller1 = new THREE.ViveController( 0 );
	controller1.standingMatrix = controls.getStandingMatrix();
	controller1.addEventListener( 'triggerdown', onTriggerDown );
	controller1.addEventListener( 'triggerup', onTriggerUp );
	scene.add( controller1 );

	controller2 = new THREE.ViveController( 1 );
	controller2.standingMatrix = controls.getStandingMatrix();
	controller2.addEventListener( 'triggerdown', onTriggerDown );
	controller2.addEventListener( 'triggerup', onTriggerUp );
	scene.add( controller2 );

	var loader = new THREE.OBJLoader();
	loader.setPath( 'models/obj/vive-controller/' );
	loader.load( 'vr_controller_vive_1_5.obj', function ( object ) {

		var loader = new THREE.TextureLoader();
		loader.setPath( 'models/obj/vive-controller/' );

		var controller = object.children[ 0 ];
		controller.material.map = loader.load( 'onepointfive_texture.png' );
		controller.material.specularMap = loader.load( 'onepointfive_spec.png' );

		controller1.add( object.clone() );
		controller2.add( object.clone() );

	} );

	//

	var geometry = new THREE.Geometry();
	geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
	geometry.vertices.push( new THREE.Vector3( 0, 0, - 1 ) );

	var line = new THREE.Line( geometry );
	line.name = 'line';
	line.scale.z = 5;

	controller1.add( line.clone() );
	controller2.add( line.clone() );

	raycaster = new THREE.Raycaster();


	//

	effect = new THREE.VREffect( renderer );

	if ( WEBVR.isAvailable() === true ) {

		document.body.appendChild( WEBVR.getButton( effect ) );

	}

	//

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	effect.setSize( window.innerWidth, window.innerHeight );

}

function onTriggerDown( event ) {

	var controller = event.target;

	var intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {

		var intersection = intersections[ 0 ];

		tempMatrix.getInverse( controller.matrixWorld );

		var object = intersection.object;
		object.matrix.premultiply( tempMatrix );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		object.material.emissive.b = 1;
		controller.add( object );

		controller.userData.selected = object;

	}

}

function onTriggerUp( event ) {

	var controller = event.target;

	if ( controller.userData.selected !== undefined ) {

		var object = controller.userData.selected;
		object.matrix.premultiply( controller.matrixWorld );
		object.matrix.decompose( object.position, object.quaternion, object.scale );
		object.material.emissive.b = 0;
		group.add( object );

		controller.userData.selected = undefined;

	}


}

function getIntersections( controller ) {

	tempMatrix.identity().extractRotation( controller.matrixWorld );

	raycaster.ray.origin.setFromMatrixPosition( controller.matrixWorld );
	raycaster.ray.direction.set( 0, 0, -1 ).applyMatrix4( tempMatrix );

	return raycaster.intersectObjects( group.children );

}

function intersectObjects( controller ) {

	// Do not highlight when already selected

	if ( controller.userData.selected !== undefined ) return;

	var line = controller.getObjectByName( 'line' );
	var intersections = getIntersections( controller );

	if ( intersections.length > 0 ) {

		var intersection = intersections[ 0 ];

		var object = intersection.object;
		object.material.emissive.r = 1;
		intersected.push( object );

		line.scale.z = intersection.distance;

	} else {

		line.scale.z = 5;

	}

}

function cleanIntersected() {

	while ( intersected.length ) {

		var object = intersected.pop();
		object.material.emissive.r = 0;

	}

}

//

function animate() {
	effect.requestAnimationFrame( animate );
	updatePhysics();
	render();
}

function updatePhysics() {
	// Step the physics world
	world.step(timeStep);
	// Copy coordinates from Cannon.js to Three.js
	mesh.position.copy(body.position);
	mesh.quaternion.copy(body.quaternion);
}

function render() {

	controller1.update();
	controller2.update();

	controls.update();

	cleanIntersected();

	intersectObjects( controller1 );
	intersectObjects( controller2 );

	effect.render( scene, camera );

}