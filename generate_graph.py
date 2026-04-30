import json
from graphify.export import to_html
from networkx.readwrite import json_graph
from pathlib import Path

# Load the graph data
data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

# Create communities in the correct format: {community_id: [list of node_ids]}
# Put all nodes in community 0 for simplicity
all_nodes = list(G.nodes())
communities = {0: all_nodes}

# Generate the HTML graph
to_html(G, communities, 'graphify-out/graph.html', community_labels=None)
print('Graph generated successfully in graph.html')