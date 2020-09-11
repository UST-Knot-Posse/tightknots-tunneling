import { GUI } from './three.js/examples/jsm/libs/dat.gui.module.js';

console.log("Hello, console!");

// Load the graph into memory
const xmlhttp = new XMLHttpRequest();
xmlhttp.open("GET", "2020-06-11_treetunnel.dot", false);
xmlhttp.send();
const dottext = xmlhttp.responseText;
const parseddata = vis.parseDOTNetwork(dottext);
for (const node of parseddata.nodes) {
    node.label = node.name;
    node.title = node.ropelength;
    node.fixed = {x:true, y:false};
    node.x = -100*Number(node.crossings);
    if (Number(node.crossings) == 0) {
	node.color = {border: 'blue', background: 'lightblue', highlight: 'blue'};
    }
    else if (Number(node.crossings) > 10) {
	node.color = {border: 'red', background: 'salmon', highlight: 'red'};
    }
    else {
	node.color = {border: 'green', background: 'lightgreen', highlight: 'green'};
    }
}
for (const edge of parseddata.edges) {
    edge.title = edge.weight;
    edge.value = edge.weight;
    edge.color = 'lightblue';
    edge.chosen = false;
}
const rootoptions = [];
for (const node of parseddata.nodes) {
    if (Number(node.crossings) <= 10) {
	rootoptions.push(node.name);
    }
}
rootoptions.sort(function(a,b) {
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

// Build GUI
const container = document.querySelector('#GraphContainer');
const networkoptions = {
    edges: {
	smooth: {enabled: true, type: 'cubicBezier'},
	scaling: {min: 1, max: 7, customScalingFunction: function(min,max,total,value) {
	    return value; }}
    },
    layout: {
	improvedLayout: false,
	randomSeed: 0,
    },
    physics: {
	enabled: false
    }
};
const network = new vis.Network(container, {nodes: [], edges: []}, networkoptions);
network.on("click", function(params) {
    if (params.nodes.length == 1) {
	console.log(parseddata.nodes);
	console.log(network.body.nodes);
    }
});
network.on("doubleClick", function(params) {
    if (params.nodes.length == 1) {
	const node = parseddata.nodes[params.nodes[0]];
	if (Number(node.crossings) > 0 && Number(node.crossings) <= 10) {
	    window.open("3Dviewer.html#" + node.name.replace(/#/g, "c"), "_blank");
	}
    }
});
const gui = new GUI({name: 'GraphControls'})
const masterparams = {
    TreeRoot: 'm5.2',
    EdgeType: 'naive_strict',
    MinProbability: 0.10,
    ClearControl: function() {
	network.setData({nodes: [], edges: []});
    },
    RegenControl: function() {
	buildTree();
    },
    SavePNG: function() {
	const graphcanvas = document.querySelector('canvas');
	window.open(graphcanvas.toDataURL('image/png'), 'screenshot');
    }
};
const masterfolder = gui.addFolder('Master parameters');
// masterfolder.add(masterparams, 'TreeRoot', rootoptions);
masterfolder.add(masterparams, 'TreeRoot', rootoptions).onChange(buildTree);
masterfolder.add(masterparams, 'EdgeType', ['naive_strict', 'compression_strict', 'angle_strict', 'naive_tanh', 'compression_tanh', 'angle_tanh']).onChange(buildTree);
masterfolder.add(masterparams, 'MinProbability', 0.0, 1.0).onChange(buildTree);
// masterfolder.add(masterparams, 'ClearControl').name('Clear graph');
// masterfolder.add(masterparams, 'RegenControl').name('Regenerate graph');
masterfolder.add(masterparams, 'SavePNG').name('Save to .png');
masterfolder.open();

// Build tree starting from selected node
const edgeequivalency = {
    naive_strict: 'strutnaive_ropestrict',
    compression_strict: 'strutcompression_ropestrict',
    angle_strict: 'strutangle_ropestrict',
    naive_tanh: 'strutnaive_ropetanh',
    compression_tanh: 'strutcompression_ropetanh',
    angle_tanh: 'strutangle_ropetanh',
};
function buildTree() {
    const uncheckednodes = new Set(parseddata.nodes.keys());
    const uncheckededges = new Set(parseddata.edges.keys());
    const treenodes = new Array();
    const treeedges = new Array();
    function findchildren(nodeindex) {
	uncheckededges.forEach(function(edgeindex) {
	    const edge = parseddata.edges[edgeindex]
	    if (edge.from == nodeindex && edge.name == edgeequivalency[masterparams.EdgeType] && Number(edge.weight) >= masterparams.MinProbability) {
		treeedges.push(parseddata.edges[edgeindex]);
		uncheckededges.delete(edgeindex);
		const nextnode = parseddata.edges[edgeindex].to;
		if (uncheckednodes.has(nextnode)) {
		    treenodes.push(parseddata.nodes[nextnode]);
		    uncheckednodes.delete(nextnode);
		    findchildren(nextnode);
		}
	    }
	});
    }
    let startnode = -1;
    for (let index = 0; index < parseddata.nodes.length; index++) {
	if (parseddata.nodes[index].name == masterparams.TreeRoot) {
	    startnode = index;
	    break;
	}
    }
    if (startnode == -1) {
	console.log("Couldn't find startnode " + masterparams.TreeRoot + " in parsed data");
	return;
    }
    treenodes.push(parseddata.nodes[startnode]);
    uncheckednodes.delete(startnode);
    findchildren(startnode);
    network.setData({nodes: treenodes, edges: treeedges});
}

buildTree();
