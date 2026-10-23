"""Independent ZIP AES reader. Password arrives only on stdin; no secrets are logged."""
import hashlib
import json
import pathlib
import sys
import pyzipper

archive, expected, output, filename = sys.argv[1:]
code = sys.stdin.buffer.read()
with pyzipper.AESZipFile(archive) as zipped:
    names = [filename, filename.removesuffix('.html') + '.manifest.json']
    assert sorted(zipped.namelist()) == sorted(names)
    assert all(entry.flag_bits & 1 for entry in zipped.infolist())
    assert all(entry.wz_aes_strength == 3 for entry in zipped.infolist())
    for name in names:
        try:
            zipped.read(name, pwd=b'wrong-password')
            raise AssertionError('Incorrect password was accepted')
        except RuntimeError:
            pass
    html = zipped.read(filename, pwd=code)
    manifest = json.loads(zipped.read(names[1], pwd=code))
    assert html == pathlib.Path(expected).read_bytes()
    assert hashlib.sha256(html).hexdigest() == manifest['files'][0]['sha256']
    pathlib.Path(output).write_bytes(html)
print(json.dumps({'independentReader': 'pyzipper 0.3.6', 'entries': 2,
                  'wrongPasswordRejected': True, 'htmlBytes': len(html),
                  'sourceRevision': manifest['sourceRevision'], 'identicalHtml': True}))
