import json
from pathlib import Path

analysis = json.loads(Path('graphify-out/.graphify_analysis.json').read_text(encoding="utf-8"))
top_communities = sorted(analysis['communities'].items(), key=lambda x: len(x[1]), reverse=True)[:10]

print("Top 10 Communities:")
for cid, nodes in top_communities:
    print(f"Community {cid}: {len(nodes)} nodes")
    print(f"Sample nodes: {', '.join(nodes[:5])}")
    print("---")
