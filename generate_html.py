import json
from graphify.build import build_from_json
from graphify.export import to_html
from networkx.readwrite import json_graph
from pathlib import Path
import networkx as nx

# Load the graph data
data = json.loads(Path('graphify-out/graph.json').read_text())
G = json_graph.node_link_graph(data, edges='links')

# Try to load community labels if they exist
try:
    analysis_path = Path('graphify-out/.graphify_analysis.json')
    labels_path = Path('graphify-out/.graphify_labels.json')

    if analysis_path.exists():
        analysis = json.loads(analysis_path.read_text())
        communities = {int(k): v for k, v in analysis['communities'].items()}
    else:
        # If we can't load the analysis, create default communities
        communities = {node: 0 for node in G.nodes()}

    if labels_path.exists():
        labels = json.loads(labels_path.read_text())
        labels = {int(k): v for k, v in labels.items()}
    else:
        labels = {}

    # Make sure communities is in the right format for graphify
    # Convert node_id -> community_id mapping to community_id -> [node_ids] mapping
    node_communities = {}
    if analysis_path.exists():
        analysis = json.loads(analysis_path.read_text())
        # The communities in the file are node_id -> community_id
        node_communities = {int(node_id): comm_id for node_id, comm_id in analysis['communities'].items()}
    else:
        # Create default communities (all nodes in community 0)
        node_communities = {str(node): 0 for node in G.nodes()}

    # Convert to the format expected by graphify (community_id -> [node_ids])
    communities = {}
    for node, comm_id in node_communities.items():
        if comm_id not in communities:
            communities[comm_id] = []
        communities[comm_id].append(node)
except Exception as e:
    # If we can't load the analysis, create default communities
    print(f"Error loading analysis: {e}")
    # Create default communities (all nodes in community 0)
    node_communities = {str(node): 0 for node in G.nodes()}
    communities = {0: list(G.nodes())}
    labels = {}

to_html(G, communities, 'graphify-out/graph.html', community_labels=labels or None)
print('graph.html written - open in any browser, no server needed')
