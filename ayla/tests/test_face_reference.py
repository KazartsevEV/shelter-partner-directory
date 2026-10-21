"""Tests the fail-closed canonical face master boundary (no remote provider calls)."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from ayla.face_reference import FrozenFaceError, load_frozen_face, prepare_ayla_portrait_input


class FrozenFaceTests(unittest.TestCase):
    def test_master_bytes_and_checksum(self):
        face = load_frozen_face()
        self.assertEqual(face.asset_id, "ayla.face.master.v1")
        self.assertEqual(face.mime_type, "image/jpeg")
        self.assertEqual(
            hashlib.sha256(face.reference_image_bytes).hexdigest(),
            "3e866ee23d366f1736a60ac04c5d3e002e34d1eb1653b0ceb4080baf15c4f298",
        )
        self.assertEqual(len(face.reference_image_bytes), 314480)

    def test_prompt_only_provider_is_rejected(self):
        with self.assertRaisesRegex(FrozenFaceError, "provider_reference_input_required"):
            prepare_ayla_portrait_input(
                "Ayla walking in New York",
                provider_supports_reference_images=False,
            )

    def test_reference_bytes_are_mandatory(self):
        request = prepare_ayla_portrait_input(
            "Ayla in a cafe",
            provider_supports_reference_images=True,
        )
        self.assertIsInstance(request["reference_image_bytes"], bytes)
        self.assertEqual(len(request["reference_image_bytes"]), 314480)
        self.assertEqual(request["reference_asset_id"], "ayla.face.master.v1")

    def test_modified_file_fails_closed(self):
        original_root = Path(__file__).resolve().parents[2]
        base = original_root / "ayla/assets"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dst = root / "ayla/assets"
            dst.mkdir(parents=True)
            (dst / "face-canon-v1.json").write_bytes((base / "face-canon-v1.json").read_bytes())
            raw = bytearray((base / "ayla-face-canon-v1.jpg").read_bytes())
            raw[100] ^= 1
            (dst / "ayla-face-canon-v1.jpg").write_bytes(raw)
            with self.assertRaisesRegex(FrozenFaceError, "checksum_mismatch"):
                load_frozen_face(repo_root=root)

    def test_empty_prompt_not_allowed(self):
        with self.assertRaises(ValueError):
            prepare_ayla_portrait_input("  ", provider_supports_reference_images=True)


if __name__ == "__main__":
    unittest.main()
