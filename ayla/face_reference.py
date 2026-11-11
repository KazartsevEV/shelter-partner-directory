"""Immutable face-reference guard for Ayla image-generation adapters.

This prepares a verified image-conditioning input; it DOES NOT generate images.
A provider adapter must accept and forward reference_image_bytes, not only a
text prompt. The owner-approved master is immutable.
"""
from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from pathlib import Path


class FrozenFaceError(RuntimeError):
    """The approved reference is absent, modified or unsupported."""


@dataclass(frozen=True)
class FrozenFaceReference:
    asset_id: str
    path: Path
    mime_type: str
    sha256: str
    reference_image_bytes: bytes


def load_frozen_face(*, repo_root: Path | None = None) -> FrozenFaceReference:
    root = Path(repo_root) if repo_root is not None else Path(__file__).resolve().parent.parent
    root = root.resolve()
    manifest_path = root / "ayla/assets/face-canon-v1.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    asset = (root / manifest["path"]).resolve()
    if not asset.is_relative_to(root):
        raise FrozenFaceError("face_reference_outside_repo")
    if manifest["asset_mode"] != "immutable" or not manifest["generation_contract"]["reference_image_required"]:
        raise FrozenFaceError("face_reference_manifest_not_frozen")
    data = asset.read_bytes()
    digest = sha256(data).hexdigest()
    if digest != manifest["sha256"] or len(data) != manifest["size_bytes"]:
        raise FrozenFaceError("face_reference_checksum_mismatch")
    if manifest["mime_type"] != "image/jpeg" or not data.startswith(b"\xff\xd8\xff"):
        raise FrozenFaceError("face_reference_not_verified_jpeg")
    return FrozenFaceReference(
        asset_id=manifest["asset_id"],
        path=asset,
        mime_type=manifest["mime_type"],
        sha256=digest,
        reference_image_bytes=data,
    )


def prepare_ayla_portrait_input(
    prompt: str,
    *,
    provider_supports_reference_images: bool,
    repo_root: Path | None = None,
) -> dict:
    """Fail closed if a provider would generate Ayla from a prompt alone.

    The real provider adapter must consume the exact reference_image_bytes.
    Image output still requires separate human/visual identity QA.
    """
    if not isinstance(prompt, str) or not prompt.strip():
        raise ValueError("ayla_portrait_prompt_required")
    if not provider_supports_reference_images:
        raise FrozenFaceError("ayla_portrait_provider_reference_input_required")
    face = load_frozen_face(repo_root=repo_root)
    return {
        "prompt": prompt,
        "reference_asset_id": face.asset_id,
        "reference_image_mime_type": face.mime_type,
        "reference_image_sha256": face.sha256,
        "reference_image_bytes": face.reference_image_bytes,
    }
