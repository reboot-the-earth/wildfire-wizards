"""
Heavy vehicle / cattle trailer filtering.

Livestock trailers cannot safely use narrow residential streets, steep grades,
or roads with sharp turns. This module filters and penalizes edges that are
unsuitable for trailer towing.
"""

TRAILER_SAFE_TYPES = {"motorway", "motorway_link", "trunk", "trunk_link",
                      "primary", "primary_link", "secondary", "secondary_link"}

TRAILER_PENALTY_TYPES = {"tertiary", "tertiary_link"}

TRAILER_EXCLUDED_TYPES = {"residential", "service", "unclassified", "living_street",
                          "track", "path", "footway", "cycleway"}


def is_trailer_safe_edge(edge_data):
    """Return True if this edge's road type is safe for a cattle trailer."""
    highway = edge_data.get("highway", "unclassified")
    if isinstance(highway, list):
        highway = highway[0]
    return highway in TRAILER_SAFE_TYPES


def apply_trailer_weights(graph):
    """
    Apply additional weight penalties for trailer-unfriendly roads.

    Mutates graph in place. Should be called AFTER fire overlay tagging
    so we don't clobber fire-based weights.
    """
    for u, v, data in graph.edges(data=True):
        highway = data.get("highway", "unclassified")
        if isinstance(highway, list):
            highway = highway[0]

        if highway in TRAILER_EXCLUDED_TYPES:
            data["trailer_penalty"] = 5.0
            data["trailer_friendly"] = False
        elif highway in TRAILER_PENALTY_TYPES:
            data["trailer_penalty"] = 2.0
            data["trailer_friendly"] = True
        else:
            data["trailer_penalty"] = 1.0
            data["trailer_friendly"] = True

    return graph


def check_trailer_friendly(graph, path):
    """
    Check whether an entire path is trailer-friendly.

    Returns True if no edge in the path uses an excluded road type.
    """
    for i in range(len(path) - 1):
        edge_data = graph.get_edge_data(path[i], path[i + 1])
        if edge_data is None:
            continue
        highway = edge_data.get("highway", "unclassified")
        if isinstance(highway, list):
            highway = highway[0]
        if highway in TRAILER_EXCLUDED_TYPES:
            return False
    return True


def get_trailer_weight(graph, u, v):
    """Get the weight for a trailer-aware route for a specific edge."""
    data = graph.get_edge_data(u, v)
    if data is None:
        return float("inf")
    base = data.get("weight", data.get("travel_time", 1000))
    penalty = data.get("trailer_penalty", 1.0)
    return base * penalty
