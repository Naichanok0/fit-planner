#!/usr/bin/env python3
"""
Build an index from metadata.normalized.json with two maps:
- by_image_goal: "{image_norm}||{goal}" -> list of program_id
- by_basename: "basename" -> list of {program_id, image_norm, goal}
Writes metadata.index.json next to the dataset file.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
NORM = os.path.join(HERE, '..', 'dataset', 'metadata.normalized.json')
OUT = os.path.join(HERE, '..', 'dataset', 'metadata.index.json')

with open(NORM, 'r', encoding='utf-8') as f:
    arr = json.load(f)

by_image_goal = {}
by_basename = {}

for e in arr:
    img = e.get('image_norm','')
    goal = e.get('goal','')
    key = f"{img}||{goal}"
    pid = e.get('program_id')
    by_image_goal.setdefault(key, []).append(pid)
    base = e.get('basename','')
    by_basename.setdefault(base, []).append({'program_id': pid, 'image_norm': img, 'goal': goal})

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'by_image_goal': by_image_goal, 'by_basename': by_basename}, f, ensure_ascii=False, indent=2)

print('Wrote index to', OUT)
print('image_goal keys:', len(by_image_goal))
print('basename keys:', len(by_basename))

# Print a few sample entries
cnt = 0
print('\nSample image_goal entries:')
for k, v in list(by_image_goal.items())[:5]:
    print(' ', k, '->', v)
    cnt += 1
    if cnt >= 5:
        break

cnt = 0
print('\nSample basename entries:')
for k, v in list(by_basename.items())[:5]:
    print(' ', k, '->', v[:3])
    cnt += 1
    if cnt >= 5:
        break
