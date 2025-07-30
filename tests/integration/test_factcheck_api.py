import requests

def test_factcheck_endpoint():
    r = requests.post('http://localhost:4000/api/factcheck', json={'claim': 'Earth is flat'}, headers={'Authorization': 'Bearer <token>'})
    assert r.status_code == 200
    assert 'verdict' in r.json()