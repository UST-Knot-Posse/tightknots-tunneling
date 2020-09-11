import * as THREE from './three.js/build/three.module.js';

export class Strand {
    constructor(nverts, isclosed=true) {
	this.verts = Array(nverts)
	this.isclosed = isclosed;
    }
}

export class Curve {
    constructor(filename, centerofmass=true) {
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();
	if(xmlhttp.status != 200) {
	    return null;
	}
	const vecttext = xmlhttp.responseText.split('\n');
	// Check for the 'VECT' keyword
	if (! /^\s*VECT/.test(vecttext[0])) {
	    console.log("Couldn't find VECT keyword.");
	    return null;
	}
	// Function to read non-comment lines
	let currentline = 0;
	function nextnoncommentline() {
	    while (true) {
		currentline += 1;
		if(! /^\s*#/.test(vecttext[currentline])) {
		    return vecttext[currentline];
		}
	    }
	}
	// Read three integers giving components, vertices, colors
	let m = nextnoncommentline().match(/\s*(-?\d+)\s+(-?\d+)\s+(-?\d+)/);
	if (!m) {
	    console.log("Couldn't parse <ncomps> <nverts> <ncolors> line.");
	    return null;
	}
	const ncomps = m[1];
	const nverts = m[2];
	const ncolors = m[3];
	if (ncomps <= 0) {
	    console.log("VECT file defines curve with ${ncomps} components.");
	    return null;
	}
	// Read the list of the numbers of vertices/colors for each component
	m = nextnoncommentline().match(/(-?\d+)/);
	const nvlist = m.slice(1).map(x => Math.abs(Number(x)));
	const closedlist = m.slice(1).map(x => x < 0);
	if (nvlist.length != ncomps) {
	    console.log("Couldn't parse number of vertices.");
	    return null;
	}
	m = nextnoncommentline().match(/(-?\d+)/);
	const collist = m.slice(1).map(x => Number(x));
	if (collist.length != ncomps) {
	    console.log("Couldn't parse number of colors.");
	    return null;
	}
	// Skipping contraints stuff
	// Read in the vertices
	this.components = Array(ncomps);
	for (let currentcomp = 0; currentcomp < ncomps; currentcomp++) {
	    this.components[currentcomp] = new Strand(nvlist[currentcomp], closedlist[currentcomp]);
	    for (let currentvert = 0; currentvert < nvlist[currentcomp]; currentvert++) {
		m = [...nextnoncommentline().matchAll(/[+-]?\s*(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/g)];
		if (m.length != 3) {
		    console.log("Bad vertex for component ${currentcomp} vertex ${currentvert}.")
		}
		const vertcoords = m.map(x => Number(x[0]));
		this.components[currentcomp].verts[currentvert] = new THREE.Vector3(vertcoords[0], vertcoords[1], vertcoords[2]);
	    }
	}
	// Skipping color stuff
	if (centerofmass) {
	    let sumvect = new THREE.Vector3(0,0,0);
	    let sumverts = 0;
	    for (const currentcomp of this.components) {
		for (const currentvert of currentcomp.verts) {
		    sumvect.add(currentvert);
		    sumverts ++;
		}
	    }
	    sumvect.divideScalar(sumverts);
	    for (const currentcomp of this.components) {
		for (const currentvert of currentcomp.verts) {
		    currentvert.sub(sumvect);
		}
	    }
	}
	return
    }
}

export class Strut {
    constructor(startcomp=0, endcomp=0, startedge=0, endedge=0, length=0, compression=0, angle=0, type="a0.1", ropelength=6.28) {
	this.startcomp = startcomp;
	this.endcomp = endcomp;
	this.startedge = startedge;
	this.endedge = endedge;
	this.length = length;
	this.compression = compression;
	this.angle = angle;
	this.type = type;
	this.ropelength = ropelength;
    }

    static strutsfromcsv(filename) {
	const xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", filename, false);
	xmlhttp.send();
	if(xmlhttp.status != 200) {
	    return null;
	}
	const csvtext = xmlhttp.responseText.split('\n');
	// Function to read non-comment lines
	let currentline = -1;
	function nextnoncommentline() {
	    while (true) {
		currentline += 1;
		if(currentline >= csvtext.length) {
		    return null;
		}
		if(! /^\s*#/.test(csvtext[currentline])) {
		    return csvtext[currentline];
		}
	    }
	}
	let struts = Array();
	while(true) {
	    let line = nextnoncommentline();
	    if(line == null || line == "") {
		return struts;
	    }
	    const fields = line.split(',');
	    struts.push(new this(Number(fields[0].trim()), Number(fields[1].trim()), Number(fields[2].trim()), Number(fields[3].trim()), Number(fields[4].trim()), Number(fields[5].trim()), Number(fields[6].trim()), fields[7].trim(), Number(fields[8].trim())));
	}
    }

    static typesetforstruts(struts) {
	const typeset = new Set();
	for (const strut of struts) {
	    typeset.add(strut.type);
	}
	const typearr = Array.from(typeset);
	typearr.sort(function(a,b) {
	    const amatches = [...a.matchAll(/([ahmp])(\d+)\.(\d+)#?/g)];
	    const bmatches = [...b.matchAll(/([ahmp])(\d+)\.(\d+)#?/g)];
	    let acrossings = 0;
	    const acomps = amatches.length;
	    const across = [];
	    const aindex = [];
	    const achiral = [];
	    for (const match of amatches) {
		acrossings += Number(match[2]);
		achiral.push(match[1]);
		across.push(Number(match[2]));
		aindex.push(Number(match[3]));
	    }
	    let bcrossings = 0;
	    const bcomps = bmatches.length;
	    const bcross = [];
	    const bindex = [];
	    const bchiral = [];
	    for (const match of bmatches) {
		bcrossings += Number(match[2]);
		bchiral.push(match[1]);
		bcross.push(Number(match[2]));
		bindex.push(Number(match[3]));
	    }
	    if ((acrossings-bcrossings) != 0) {
		return acrossings-bcrossings;
	    }
	    if ((acomps-bcomps) != 0) {
		return acomps-bcomps;
	    }
	    for (let index = 0; index < Math.min(across.length, across.length); index++) {
		let diff = across[index]-bcross[index];
		if(diff != 0) {
		    return diff;
		}
		diff = aindex[index]-bindex[index];
		if(diff != 0) {
		    return diff;
		}
		diff = achiral[index].charCodeAt(0)-bchiral[index].charCodeAt(0);
		if(diff != 0) {
		    return diff;
		}
	    }
	    return 0;
	});
	return typearr;
    }
}
