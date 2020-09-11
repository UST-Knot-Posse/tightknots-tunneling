import * as THREE from './three.js/build/three.module.js';
import { OrbitControls } from './three.js/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from './three.js/examples/jsm/controls/TrackballControls.js';
import { GUI } from './three.js/examples/jsm/libs/dat.gui.module.js';
import Stats from './three.js/examples/jsm/libs/stats.module.js';
import * as knotreaders from './knotreaders.js';

console.log("Hello, console!");

// Get URL variables to figure out which knot to load
// const url = new URL(window.location.href);
// const knotfilename = url.searchParams.get("knot");
// const strutsfilename = url.searchParams.get("struts")
const hash = window.location.hash.substring(1);
const knotfilename = 'configurations/' + hash + '.r8.vect';
const strutsfilename = 'strutsets/' + hash + '.r8.csv';
console.log(knotfilename);
console.log(strutsfilename);

// Load the knot and struts into memory
const myknot = new knotreaders.Curve(knotfilename);
const mystruts = knotreaders.Strut.strutsfromcsv(strutsfilename);
const typeset = knotreaders.Strut.typesetforstruts(mystruts);
const typecolors = {};
for (let index = 0; index < typeset.length; index++) {
    const type = typeset[index];
    const color = new THREE.Color();
    color.setHSL(index/typeset.length, 1.0, 0.5);
    typecolors[type] = color;
}
let mincompression = mystruts[0].compression;
let maxcompression = mystruts[0].compression;
for (const strut of mystruts) {
    if (strut.compression < mincompression) {
	mincompression = strut.compression;
    }
    if (strut.compression > maxcompression) {
	maxcompression = strut.compression;
    }
}

// Build scene
const masterdiv = document.querySelector('#VECTmaster');
const canvas = document.querySelector('#VECTcanvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha: true, preserveDrawingBuffer: true});
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth/canvas.clientHeight, 0.1, 10000);
camera.position.z = -5;
const controls = new TrackballControls(camera, renderer.domElement);
controls.rotateSpeed=5.0;
controls.update();
const axeshelper = new THREE.AxesHelper(3);
const scene = new THREE.Scene();
const hemilight = new THREE.HemisphereLight(0xffffff, 0.5);
const ambilight = new THREE.AmbientLight(0xffffff, 0.2);
const intensity = 0.6;
const xplight = new THREE.DirectionalLight(0xffffff, intensity);
xplight.position.set(1,0,0);
const xmlight = new THREE.DirectionalLight(0xffffff, intensity);
xmlight.position.set(-1,0,0);
const yplight = new THREE.DirectionalLight(0xffffff, intensity);
yplight.position.set(0,1,0);
const ymlight = new THREE.DirectionalLight(0xffffff, intensity);
ymlight.position.set(0,-1,0);
const zplight = new THREE.DirectionalLight(0xffffff, intensity);
zplight.position.set(0,0,1);
const zmlight = new THREE.DirectionalLight(0xffffff, intensity);
zmlight.position.set(0,0,-1);
//scene.add(hemilight);
//scene.add(ambilight);
scene.add(xplight);
scene.add(xmlight);
scene.add(yplight);
scene.add(ymlight);
scene.add(zplight);
scene.add(zmlight);

// Build geometry
const myknotsplinecurves = myknot.components.map(x => new THREE.CatmullRomCurve3(x.verts, x.isclosed));
const splinegroup = new THREE.Group();
myknot.components.map((x, index) => splinegroup.add(new THREE.Mesh(new THREE.Geometry(), new THREE.Material())));
scene.add(splinegroup);
const tubegroup = new THREE.Group();
myknot.components.map((x, index) => tubegroup.add(new THREE.Mesh(new THREE.Geometry(), new THREE.Material())));
scene.add(tubegroup);
const strutgroup = new THREE.Group();
mystruts.map((x, index) => strutgroup.add(new THREE.Mesh(new THREE.Geometry(), new THREE.Material())));
scene.add(strutgroup);
let splineparams = {
    Radius: 0.05,
    RadialSegs: 16,
    Visible: true,
    Color: '#000000'
};
let tubeparams = {
    Radius: 0.50,
    RadialSegs: 32,
    Visible: true,
    Opacity: 0.30,
    Color: '#888888'
};
let strutparams = {
    Radius: 0.005,
    RadialSegs: 8,
    Visible: true,
    Coloring: 'type (tunneling)'
};
function generateSplineGeometry() {
    const newsplinegeometries = myknot.components.map((x, index) => new THREE.TubeBufferGeometry(myknotsplinecurves[index], x.verts.length, splineparams.Radius, splineparams.RadialSegs, x.isclosed));
    const newsplinematerials = myknot.components.map(x => new THREE.MeshPhongMaterial({color: splineparams.Color, visible: splineparams.Visible}));
    for (let index = 0; index < newsplinegeometries.length; index++) {
	splinegroup.children[index].geometry.dispose();
	splinegroup.children[index].geometry = newsplinegeometries[index];
	splinegroup.children[index].material.dispose();
	splinegroup.children[index].material = newsplinematerials[index];
    }
}
function generateTubeGeometry() {
    const newtubegeometries = myknot.components.map((x, index) => new THREE.TubeBufferGeometry(myknotsplinecurves[index], x.verts.length, tubeparams.Radius, tubeparams.RadialSegs, x.isclosed));
    const newtubematerials = myknot.components.map(x => new THREE.MeshPhongMaterial({color: tubeparams.Color, transparent: true, opacity: tubeparams.Opacity, visible: tubeparams.Visible}));
    for (let index = 0; index < newtubegeometries.length; index++) {
	tubegroup.children[index].geometry.dispose();
	tubegroup.children[index].geometry = newtubegeometries[index];
	tubegroup.children[index].material.dispose();
	tubegroup.children[index].material = newtubematerials[index];
    }
}
let appliedtransform = false;
function generateStrutGeometry() {
    for (let index = 0; index < strutgroup.children.length; index++) {
	const strut = mystruts[index];
	const startpt = myknot.components[strut.startcomp].verts[strut.startedge];
	const endpt = myknot.components[strut.endcomp].verts[strut.endedge];
	const length = startpt.distanceTo(endpt);
	const anglevector = new THREE.Vector3();
	const midpt = new THREE.Vector3();
	anglevector.copy(endpt);
	anglevector.sub(startpt);
	midpt.copy(anglevector);
	anglevector.normalize();
	midpt.divideScalar(2);
	midpt.add(startpt);
	const newgeometry = new THREE.CylinderBufferGeometry(strutparams.Radius, strutparams.Radius, length, strutparams.RadialSegs, 1, true);
	const newmaterial = new THREE.MeshPhongMaterial({visible: strutparams.Visible});
	if (strutparams.Coloring == "type (tunneling)") {
	    newmaterial.color = typecolors[strut.type];
	}
	else if (strutparams.Coloring == "compression") {
	    const color = new THREE.Color();
	    color.setHSL(2/3*(strut.compression-mincompression)/(maxcompression-mincompression), 1.0, 0.5);
	    newmaterial.color = color;
	}
	else if (strutparams.Coloring == "angle") {
	    const color = new THREE.Color();
	    color.setHSL(2/3*strut.angle/(Math.PI), 1.0, 0.5);
	    newmaterial.color = color;
	}
	else {
	    newmaterial.color = new THREE.Color('#000000');
	}
	strutgroup.children[index].geometry.dispose();
	strutgroup.children[index].geometry = newgeometry;
	strutgroup.children[index].material.dispose();
	strutgroup.children[index].material = newmaterial;
	if (!appliedtransform) {
	    strutgroup.children[index].translateX(midpt.x);
	    strutgroup.children[index].translateY(midpt.y);
	    strutgroup.children[index].translateZ(midpt.z);
	    const rotquat = new THREE.Quaternion();
	    rotquat.setFromUnitVectors(new THREE.Vector3(0,1,0), anglevector);
	    strutgroup.children[index].applyQuaternion(rotquat);
	}
    }
    appliedtransform = true;
    generateStrutLegend();
}
generateSplineGeometry();
generateTubeGeometry();
generateStrutGeometry();

// Build legend (parts stolen from stats.module.js)
function generateStrutLegend() {
    const oldlegend = document.querySelector('#VECTlegend');
    if (oldlegend) {
	oldlegend.remove();
    }
    if (strutparams.Visible && strutparams.Coloring == "type (tunneling)") {
	const legend = document.createElement('canvas');
	legend.setAttribute('id', 'VECTlegend');
	masterdiv.appendChild(legend);
	const PR = Math.round(window.devicePixelRatio || 1);
	const entryheight = 32;
	const entrywidth = 64;
	const textspace = 12;
	const textsize = 40;
	const entryspace = 12;
	const legendwidth = 500;
	const legendheight = typeset.length*(entryheight+entryspace);
	const legendleft = 20;
	const legendtop = Math.round((canvas.clientHeight/2)-(legendheight/2));
	legend.style.cssText = 'position:fixed;left:' + legendleft + 'px;top:' + legendtop + 'px;width:' + legendwidth + 'px;height:' + legendheight + 'px;display:block;opacity:1.0;z-index:10000;pointer-events:none';
	legend.width=legendwidth*PR;
	legend.height=legendheight*PR;
	const context = legend.getContext('2d');
	context.font = 'bold ' + (textsize * PR) + 'px "Courier New",Courier,monospace';
	context.textBaseline = 'alphabetic';
	let ypos = 0;
	for (const [type, color] of Object.entries(typecolors)) {
	    const colorString = '#' + color.getHexString();
	    context.fillStyle = colorString;
	    context.fillRect(0, ypos, entrywidth, entryheight);
	    context.fillStyle = '#000000';
	    context.fillText(type, entrywidth+textspace, ypos+entryheight);
	    ypos += entryheight+entryspace;
	}
    }
    else if (strutparams.Visible && strutparams.Coloring == "compression") {
	const legend = document.createElement('canvas');
	legend.setAttribute('id', 'VECTlegend');
	masterdiv.appendChild(legend);
	const PR = Math.round(window.devicePixelRatio || 1);
	const entryheight = 256;
	const entrywidth = 64;
	const textspace = 12;
	const textsize = 40;
	const entryspace = 12;
	const legendwidth = 500;
	const legendheight = entryheight+entryspace;
	const legendleft = 20;
	const legendtop = Math.round((canvas.clientHeight/2)-(legendheight/2));
	legend.style.cssText = 'position:fixed;left:' + legendleft + 'px;top:' + legendtop + 'px;width:' + legendwidth + 'px;height:' + legendheight + 'px;display:block;opacity:1.0;z-index:10000;pointer-events:none';
	legend.width=legendwidth*PR;
	legend.height=legendheight*PR;
	const context = legend.getContext('2d');
	context.font = 'bold ' + (textsize * PR) + 'px "Courier New",Courier,monospace';
	const grad = context.createLinearGradient(0, 0, 0, entryheight);
	const color = new THREE.Color();
	const stops = 8;
	for (let i = 0; i <= stops; i++) {
	    color.setHSL(2/3*i/stops, 1.0, 0.5);
	    grad.addColorStop(i/stops, '#' + color.getHexString());
	}
	context.fillStyle = grad;
	context.fillRect(0, 0, entrywidth, entryheight);
	context.fillStyle = '#000000';
	context.textBaseline = 'top';
	context.fillText(mincompression.toString(), entrywidth+textspace, 0);
	context.textBaseline = 'middle';
	context.fillText((mincompression + (maxcompression-mincompression)/2).toString(), entrywidth+textspace, Math.round(entryheight/2));
	context.textBaseline = 'alphabetic';
	context.fillText(maxcompression.toString(), entrywidth+textspace, entryheight);
    }
    else if (strutparams.Visible && strutparams.Coloring == "angle") {
	const legend = document.createElement('canvas');
	legend.setAttribute('id', 'VECTlegend');
	masterdiv.appendChild(legend);
	const PR = Math.round(window.devicePixelRatio || 1);
	const entryheight = 256;
	const entrywidth = 64;
	const textspace = 12;
	const textsize = 40;
	const entryspace = 12;
	const legendwidth = 500;
	const legendheight = entryheight+entryspace;
	const legendleft = 20;
	const legendtop = Math.round((canvas.clientHeight/2)-(legendheight/2));
	legend.style.cssText = 'position:fixed;left:' + legendleft + 'px;top:' + legendtop + 'px;width:' + legendwidth + 'px;height:' + legendheight + 'px;display:block;opacity:1.0;z-index:10000;pointer-events:none';
	legend.width=legendwidth*PR;
	legend.height=legendheight*PR;
	const context = legend.getContext('2d');
	context.font = 'bold ' + (textsize * PR) + 'px "Courier New",Courier,monospace';
	const grad = context.createLinearGradient(0, 0, 0, entryheight);
	const color = new THREE.Color();
	const stops = 8;
	for (let i = 0; i <= stops; i++) {
	    color.setHSL(2/3*i/stops, 1.0, 0.5);
	    grad.addColorStop(i/stops, '#' + color.getHexString());
	}
	context.fillStyle = grad;
	context.fillRect(0, 0, entrywidth, entryheight);
	context.fillStyle = '#000000';
	context.textBaseline = 'top';
	context.fillText("0°", entrywidth+textspace, 0);
	context.textBaseline = 'middle';
	context.fillText("90°", entrywidth+textspace, Math.round(entryheight/2));
	context.textBaseline = 'alphabetic';
	context.fillText("180°", entrywidth+textspace, entryheight);
    }
}

// Miscellaneous controls
let miscparams = {
    ShowAxes: false,
    ResetControl: function() {
	controls.reset();
    },
    SavePNG: function() {
	const tmpcanvas = document.createElement("canvas");
	tmpcanvas.style.cssText = 'position:fixed;left:' + 0 + 'px;top:' + 0 + 'px;width:' + canvas.clientWidth + 'px;height:' + canvas.clientHeight + 'px';
	const PR = Math.round(window.devicePixelRatio || 1);
	tmpcanvas.width=canvas.clientWidth*PR;
	tmpcanvas.height=canvas.clientHeight*PR;
	const context = tmpcanvas.getContext('2d');
	const curlegend = document.querySelector('#VECTlegend');
	if (curlegend) {
	    const rect = curlegend.getBoundingClientRect();
	    context.drawImage(curlegend, rect.left, rect.top, rect.width, rect.height);
	}
	context.drawImage(canvas, 0, 0, canvas.clientWidth, canvas.clientHeight);
	window.open(tmpcanvas.toDataURL('image/png'), 'screenshot');
    }
};

// Build GUI
const stats = new Stats();
document.body.appendChild(stats.dom);
const gui = new GUI({name: `VECTcontrols`});
const splinefolder = gui.addFolder('Spline parameters');
splinefolder.add(splineparams, 'Radius', 0.01, 0.25).onChange(generateSplineGeometry);
splinefolder.add(splineparams, 'RadialSegs', 4, 32, 1).onChange(generateSplineGeometry);
splinefolder.add(splineparams, 'Visible').onChange(generateSplineGeometry);
splinefolder.addColor(splineparams, 'Color').onChange(generateSplineGeometry);
splinefolder.open();
const tubefolder = gui.addFolder('Tube parameters');
tubefolder.add(tubeparams, 'Radius', 0.25, 2.0).onChange(generateTubeGeometry);
tubefolder.add(tubeparams, 'RadialSegs', 8, 64, 1).onChange(generateTubeGeometry);
tubefolder.add(tubeparams, 'Visible').onChange(generateTubeGeometry);
tubefolder.add(tubeparams, 'Opacity', 0.0, 1.0).onChange(generateTubeGeometry);
tubefolder.addColor(tubeparams, 'Color').onChange(generateTubeGeometry);
tubefolder.open();
const strutfolder = gui.addFolder('Strut parameters');
strutfolder.add(strutparams, 'Visible').onChange(generateStrutGeometry);
strutfolder.add(strutparams, 'Coloring', ['type (tunneling)', 'compression', 'angle']).onChange(generateStrutGeometry);
strutfolder.open();
const miscfolder = gui.addFolder('Miscellaneous');
miscfolder.add(miscparams, 'ShowAxes').onChange(function() {
    if (miscparams.ShowAxes) {
	scene.add(axeshelper);
    }
    else {
	scene.remove(axeshelper);
    }
});
miscfolder.add(miscparams, 'ResetControl').name('Reset orbit');
miscfolder.add(miscparams, 'SavePNG').name('Save to .png');
miscfolder.open();

// Render
function animate() {
    renderer.render(scene, camera);
    controls.update();
    stats.update();
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
