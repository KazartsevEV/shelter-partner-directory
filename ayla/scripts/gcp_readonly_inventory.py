"""Read-only GCP discovery for reusing lazysellerV2 infrastructure.

Run only in an already-authorized gcloud environment. Never triggers VM reset,
creates resources, changes IAM, or reads secrets. Writes a LOCAL sanitized report.
This deliberately does not infer that GitHub WIF secrets grant access to
another repository (shelter-partner-directory vs lazysellerV2).
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import re
import subprocess
from pathlib import Path
from typing import Any

PROJECT_RE = re.compile(r"^[a-z][a-z0-9-]{4,61}[a-z0-9]$")
# Explicit command allowlist: NO create, reset, start, stop, add-iam-policy-binding.
COMMANDS = {
    "project": ["projects", "describe", "{project}", "--format=json"],
    "instances": ["compute", "instances", "list", "--project={project}", "--format=json"],
    "service_accounts": ["iam", "service-accounts", "list", "--project={project}", "--format=json"],
    "buckets": ["storage", "buckets", "list", "--project={project}", "--format=json"],
}
ALLOWED_PREFIXES = {
    "project": ("projects", "describe"),
    "instances": ("compute", "instances", "list"),
    "service_accounts": ("iam", "service-accounts", "list"),
    "buckets": ("storage", "buckets", "list"),
}


def permitted_commands(project: str) -> dict[str, list[str]]:
    if not PROJECT_RE.fullmatch(project):
        raise ValueError("explicit_valid_gcp_project_id_required")
    cmds = {k: ["gcloud"] + [a.replace("{project}", project) for a in v] for k, v in COMMANDS.items()}
    for k, v in cmds.items():
        if tuple(v[1:3]) != ALLOWED_PREFIXES[k]:
            raise RuntimeError("gcp_readonly_allowlist_violation")
    return cmds


def _inspect(name: str, data: Any) -> Any:
    if name == "project":
        return {"verified_project_id": data.get("projectId"), "lifecycle_state": data.get("lifecycleState")}
    if name == "instances":
        return [{
            "name": x.get("name"),
            "zone": (x.get("zone") or "").rsplit("/", 1)[-1],
            "status": x.get("status"),
            "machine_type": (x.get("machineType") or "").rsplit("/", 1)[-1],
            "service_account_count": len(x.get("serviceAccounts") or []),
            "disks_attached": len(x.get("disks") or []),
        } for x in data if isinstance(x, dict)]
    if name == "service_accounts":
        return [{"disabled": a.get("disabled", False), "principal_present": bool(a.get("email"))} for a in data if isinstance(a, dict)]
    if name == "buckets":
        return [{"name": a.get("name"), "location": a.get("location")} for a in data if isinstance(a, dict)]
    raise ValueError("unknown_inspection")


def inventory(project: str, *, runner=subprocess.run) -> dict[str, Any]:
    report: dict[str, Any] = {
        "schema_version": 1,
        "mode": "READ_ONLY",
        "collected_at": datetime.now(timezone.utc).isoformat(),
        "cloud_project": project,
        "source_repo": "KazartsevEV/lazysellerV2",
        "source_identity": "existing_gcloud_authorization",
        "gcp_api_mutations": 0,
        "results": {},
        "caveats": [
            "This report does not establish GitHub OIDC WIF repository claim restrictions.",
            "This report does not prove IAM roles, OAuth credentials, compute capacity or Billing enabled.",
            "PERMISSION_DENIED/UNAVAILABLE is unknown, NOT proof resource does not exist.",
            "Never run donor R13 recovery workflow against shared production: it resets the VM.",
        ],
    }
    for k, cmd in permitted_commands(project).items():
        try:
            done = runner(cmd, text=True, capture_output=True, timeout=30, check=False)
        except (OSError, subprocess.TimeoutExpired):
            report["results"][k] = {"status": "UNAVAILABLE"}
            continue
        if done.returncode != 0:
            # No raw stderr: gcloud may echo sensitive environment/account details.
            report["results"][k] = {"status": "UNKNOWN_OR_PERMISSION_DENIED"}
            continue
        try:
            data = json.loads(done.stdout)
            if k == "project" and not isinstance(data, dict):
                raise ValueError("malformed project")
            if k != "project" and not isinstance(data, list):
                raise ValueError("malformed list")
            report["results"][k] = {"status": "VERIFIED", "data": _inspect(k, data)}
        except (ValueError, TypeError, AttributeError):
            report["results"][k] = {"status": "INVALID_RESPONSE"}
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only lazyseller Google Cloud resource inventory")
    parser.add_argument("--project", required=True, help="Existing GCP project ID; cannot be inferred from GitHub secrets")
    parser.add_argument("--output", required=True, help="Local report path; do not commit raw runtime inventories")
    args = parser.parse_args()
    result = inventory(args.project)
    destination = Path(args.output).expanduser()
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise SystemExit("inventory_destination_exists_no_overwrite")
    destination.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("READ_ONLY inventory saved. No cloud resources were modified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
