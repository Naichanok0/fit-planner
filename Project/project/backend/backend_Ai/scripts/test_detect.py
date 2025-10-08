import requests
import os

BASE = os.environ.get('AI_BASE', 'http://127.0.0.1:8000')
IMG = os.path.join(os.path.dirname(__file__), '..', 'dataset', '1.jpg')

if not os.path.exists(IMG):
    print('No sample image found at', IMG)
    print('Place a sample image named 1.jpg under dataset/ or set AI_BASE and use different image')
    raise SystemExit(1)

with open(IMG, 'rb') as f:
    files = {'file': ('1.jpg', f, 'image/jpeg')}
    data = {'goal': 'muscle-gain'}
    print('POST /detect/ ...')
    r = requests.post(BASE + '/detect/', files=files, data=data)
    print('status', r.status_code)
    print(r.text)
    if r.ok:
        j = r.json()
        pid = j.get('program_id')
        if pid:
            print('GET /programs/', pid)
            r2 = requests.get(BASE + f'/programs/{pid}')
            print('status', r2.status_code)
            print(r2.text)
        else:
            print('No program_id in detect response')
