import json
from pathlib import Path
from collections import Counter

d = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding='utf-8-sig'))
all_files = []
for cat, files in d.get('files', {}).items():
    all_files.extend(files)

counts = Counter()
for f in all_files:
    try:
        p = Path(f).relative_to(Path('.').resolve())
        counts[str(p.parent)] += 1
    except ValueError:
        pass

for k, v in counts.most_common(5):
    print(f"{k}: {v} files")
