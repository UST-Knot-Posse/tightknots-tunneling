# Tunneling Results for Tight Knots
After familiarizing yourself with the description of this dataset
below, [click
here](https://ust-knot-posse.github.io/tightknots-tunneling/) to
visualize the data (or navigate to the GitHub pages URL for this
repository). Desktop Firefox or Chrome will probably work the best.

## Dataset overview
This dataset describes the decay possibilities for tight knot
configurations that undergo 'tunneling' (crossing flip) at critical
locations. There are three components to this dataset:

### Tight configurations
Tight configurations for prime and composite knots through 10
crossings are provided in Geomview VECT format. These configurations
were tightened with
[ridgerunner](http://www.jasoncantarella.com/wordpress/software/ridgerunner/).

### Strutset for each configuration
With the assistance of ridgerunner, a set of critical self-contact
points were created for each tight configuration. These 'struts'
represent locations in the configuration that are susceptible to a
tunneling event. For each strut, the crossing was flipped and the
resulting decay knot type determined. The compression of each strut
(as determined by ridgerunner) and the angle between the connected
edges at each strut have also been recorded, along with the
ropelengths (arclength / tube radius) of the starting configuration
and decay configuration.

### Directed graph of configuration decay possibilities
The individual decay possibilities given by the strutsets were
synthesized into a single directed graph that describes how
configurations are connected through their decays. Each node
represents a unique tight configuration, while each edge represents a
decay path and its associated probability of occuring relative to
other decay paths from that node.

For a given configuration, the probability of a tunneling event
resulting in a given decay knot type has been determined by several
different methods for comparison. These methods are divided into two
groups based on strut properties and configuration ropelength
deltas. The strut-based methods are:
- Naive: The probability of a configuration decaying to a certain knot
  type is based solely on the proportion of struts whose decay product
  is that knot type. For example, 316 out of 581 struts in the m5.2
  configuration decay to m3.1, so the probability of m3.1 decay is
  0.54.
- Compression: The naive method is modified by summing the compression
  values for all struts whose decay product is the knot type in
  question, and taking that value in proportion to the sum of all
  compression values for the configuration.
- Angle: The naive method is modified in a manner similar to the
  compression method, but each strut is instead modified by the sine
  of the angle between the two edges connected by the strut. Under
  this method, perpendicular edges are more likely to tunnel than
  parallel or anti-parallel edges.
  
The ropelength-based methods are:
- Strict: A configuration is only allowed to decay to configurations
  with a shorter ropelength. Currently, decays that lead to a longer
  ropelength still contribute strut counts/compressions/angles to the
  sum for that configuration, but do not connect to other
  configurations via decay pathways.
- tanh(): The probability of a given decay is modified by the
  hyperbolic tangent of the change in ropelength across the
  decay. Decays with the greatest reduction in ropelength are boosted
  by this modification. Decays that result in an increase in
  ropelength are allowed by this modification, but their probability
  decreases sharply as the change in ropelength increases.

## Visualization tools
Two visualization tools were created for this dataset: a directed
graph viewer and a 3D configuration viewer. The graph viewer can be
accessed
[here](https://ust-knot-posse.github.io/tightknots-tunneling/), and
the configuration viewer can be accessed from within the graph
viewer. The rest of this section describes how to interact with the
visualization tools.

### Directed graph viewer
The directed graph viewer presents a subset of data from the complete
directed graph in a horizontal tree, with a selected parent
configuration located on the left, and the ultimate unknot descendant
located on the right. All intermediate configurations are represented
as nodes vertically constrained based on the minimal number of
crossings in each configuration. The nodes may be manually
repositioned vertically to improve visibility. All nodes for which a
configuration exists in this dataset are colored green, missing
configurations (anything with 11+ crossings) are colored red, and the
unknot is colored blue. Hover over an edge to view its associated
probability, and hover over a node to view its associated ropelength.

The control panel for the graph viewer is located in the upper right
corner. The TreeRoot dropdown selector allows one to change the root
node configuration on the left. The graph is updated as soon as a new
root is selected. The EdgeType dropdown allows one to select a
probability method to determine the visible edges and intermediate
nodes. Each method has a strut-based component (naive, compression,
angle) and a ropelength-based component (naive, tanh) as described
above. The MinProbability slider further controls which edges and
intermediate nodes are visible by eliminating edges that are below a
minimum probability. While this slider can be dropped down to zero,
larger graphs that contain loops and increases in ropelength will take
longer to generate and may be unresponsive. The graph can be exported
as a PNG image if desired.

Finally, one can double-click on a node to view its configuration in
the 3D configuration viewer. The viewer will open in a new tab.

### 3D configuration viewer
The 3D configuration viewer presents an interactive model of a
selected tight configuration. Orbiting, panning, and zooming maneuvers
can be performed with the left mouse button, right mouse button, and
scroll wheel.

The control panel for the configuration viewer is located in the upper
right corner. There are several parameters for controling the
presentation of the configuration spline and transparent tube. The
Coloring dropdown under the Strut parameters header allows one to
control the colors of the struts based on decay knot type, strut
compression, or angle between connected edges. An associated legend is
visible on the center-left. The configuration and legend can be
exported as a PNG image if desired.
