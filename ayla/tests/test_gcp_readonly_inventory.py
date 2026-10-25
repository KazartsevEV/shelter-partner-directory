"""Read-only GCP inventory preflight tests. No GCP credentials/network needed."""
import json
import subprocess
import unittest

from ayla.scripts.gcp_readonly_inventory import inventory, permitted_commands


class GcpInventoryReadOnlyTests(unittest.TestCase):
    def test_only_allowlisted_read_commands(self):
        commands = permitted_commands("existing-project-123")
        self.assertEqual(len(commands), 4)
        self.assertTrue(all(v[0] == "gcloud" for v in commands.values()))
        self.assertTrue(all(
            not any(x in v for x in ("create", "delete", "reset", "start", "stop", "set-iam-policy", "add-iam-policy-binding"))
            for v in commands.values()
        ))

    def test_project_must_be_explicit(self):
        for unsafe in ("", "abc;rm -rf /", "PROJECT_ID", "http://example.com", "x"):
            with self.subTest(unsafe=unsafe):
                with self.assertRaises(ValueError):
                    permitted_commands(unsafe)

    def test_no_raw_secret_or_service_account_email_in_output(self):
        seen = []
        def run(cmd, **kwargs):
            seen.append(cmd)
            if cmd[1:3] == ["projects", "describe"]:
                obj = {"projectId":"existing-project-123", "lifecycleState":"ACTIVE"}
            elif cmd[1:4] == ["compute", "instances", "list"]:
                obj = [{"name":"existing-vm", "zone":"zones/us-central1-a", "status":"RUNNING", "machineType":"types/e2-medium", "serviceAccounts":[{"email":"dont-expose@example.com"}], "disks":[{},{}]}]
            elif cmd[1:4] == ["iam", "service-accounts", "list"]:
                obj = [{"email":"secret-account@example.iam.gserviceaccount.com", "disabled":False}]
            else:
                obj = [{"name":"bucket-existing", "location":"US"}]
            return subprocess.CompletedProcess(cmd, 0, stdout=json.dumps(obj), stderr="secret-env-var")
        report=inventory("existing-project-123",runner=run)
        raw=json.dumps(report)
        self.assertNotIn("dont-expose@", raw)
        self.assertNotIn("secret-account@", raw)
        self.assertNotIn("secret-env-var", raw)
        self.assertEqual(report["gcp_api_mutations"], 0)
        self.assertEqual(len(seen),4)
        self.assertEqual(report["results"]["instances"]["data"][0]["service_account_count"],1)

    def test_permission_denied_is_unknown_not_empty(self):
        def denied(cmd,**kwargs):
            return subprocess.CompletedProcess(cmd, 1, stdout="", stderr="PERMISSION_DENIED: details")
        report=inventory("existing-project-123",runner=denied)
        self.assertTrue(all(row["status"]=="UNKNOWN_OR_PERMISSION_DENIED" for row in report["results"].values()))
        self.assertNotIn("details",json.dumps(report))


if __name__ == "__main__":
    unittest.main()
