#!/usr/bin/env python3
"""
Normalize backend dataset metadata.json
- convert image paths to forward slashes and lowercase
- add `image_norm` and `basename` fields
- add `program_id` if missing (use program.id or goal-basename)
- report duplicates for (image_norm, goal) and basename
- write out metadata.normalized.json
"""
import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'dataset', 'metadata.json')
OUT = os.path.join(HERE, '..', 'dataset', 'metadata.normalized.json')

def normalize_path(p):
    if not p:
        return ''
    p2 = p.replace('\\', '/').lstrip('/')
    return p2.lower()

def basename_no_ext(p):
    n = normalize_path(p).split('/')[-1]
    if '.' in n:
        return '.'.join(n.split('.')[:-1])
    return n


def main():
    print('Loading', DATA)
    with open(DATA, 'r', encoding='utf-8') as f:
        arr = json.load(f)

    seen_image_goal = defaultdict(list)
    seen_basename = defaultdict(list)

    for i, entry in enumerate(arr):
        img = entry.get('image') or ''
        goal = entry.get('goal') or ''
        img_norm = normalize_path(img)
        base = basename_no_ext(img)
        entry['image_norm'] = img_norm
        entry['basename'] = base
        # program id
        prog = entry.get('program') or {}
        pid = prog.get('id') if isinstance(prog, dict) else None
        if not pid:
            pid = f"{goal}-{base}" if goal and base else f"prog-{i}"
            if isinstance(prog, dict):
                prog['id'] = pid
            else:
                entry['program'] = {'id': pid, 'name': None, 'goal': goal}
        entry['program_id'] = pid

        seen_image_goal[(img_norm, goal)].append(i)
        seen_basename[base].append((i, img_norm, goal))

    # report duplicates
    dup_image_goal = {k:v for k,v in seen_image_goal.items() if len(v) > 1}
    dup_basename = {k:v for k,v in seen_basename.items() if len(v) > 1}

    print('\nSummary:')
    print('Total entries:', len(arr))
    print('Duplicate (image_norm, goal):', len(dup_image_goal))
    for k, v in list(dup_image_goal.items())[:10]:
        print('  ', k, 'indices=', v)
    print('Duplicate basename groups:', len(dup_basename))
    for k, v in list(dup_basename.items())[:10]:
        print('  ', k, 'items=', v[:5])

    # write out
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(arr, f, ensure_ascii=False, indent=2)
    print('\nWrote normalized metadata to', OUT)

if __name__ == '__main__':
    main()
