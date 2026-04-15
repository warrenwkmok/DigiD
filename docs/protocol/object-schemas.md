# DigiD object schemas v0

This document turns the earlier conceptual model into a first structured protocol draft.

## Schema goals

The first object layer should be:
- understandable
- signable
- portable across channels
- explicit about trust class and delegation
- easy to verify by software and understandable by humans

## Core object families

DigiD v0 should define at least these core objects:
- Identity Object
- Attestation Object
- Delegation Object
- Signed Communication Object
- Verification Result Object
- Revocation Object

## 1. Identity Object

```json
{
  "object_type": "dgd.identity",
  "version": "0.1",
  "id": "dgd:agent:01JABC...",
  "identity_class": "agent",
  "display_name": "Acme Support Agent 01",
  "verification_state": "verified-agent",
  "subject_status": "active",
  "public_keys": [
    {
      "kid": "key-2026-04",
      "algorithm": "ed25519",
      "public_key": "base64-or-multibase-value",
      "status": "active",
      "created_at": "2026-04-15T00:00:00Z"
    }
  ],
  "operator": {
    "identity_id": "dgd:org:acme",
    "relationship": "organization-issued"
  },
  "disclosure": {
    "display_level": "standard",
    "real_world_identity_disclosed": false
  },
  "created_at": "2026-04-15T00:00:00Z",
  "updated_at": "2026-04-15T00:00:00Z"
}
```

### Notes
- `identity_class` should support: `human`, `agent`, `organization`, `pseudonymous`, `unverified`
- `verification_state` is the user-facing trust interpretation
- `subject_status` should support: `active`, `revoked`, `suspended`, `expired`

## 2. Attestation Object

```json
{
  "object_type": "dgd.attestation",
  "version": "0.1",
  "id": "dgd:att:01JXYZ...",
  "subject_id": "dgd:agent:01JABC...",
  "issuer_id": "dgd:org:acme",
  "attestation_type": "organization-issued-agent",
  "trust_level": "high",
  "issued_at": "2026-04-15T00:00:00Z",
  "expires_at": "2026-10-15T00:00:00Z",
  "revocation": null,
  "claims": {
    "authorized_for": ["voice", "messaging", "email"],
    "brand": "Acme Support"
  },
  "signature": {
    "kid": "org-key-2026-01",
    "algorithm": "ed25519",
    "value": "signature-by-issuer"
  }
}
```

## 3. Delegation Object

```json
{
  "object_type": "dgd.delegation",
  "version": "0.1",
  "id": "dgd:del:01JKLM...",
  "issuer_id": "dgd:org:acme",
  "delegate_id": "dgd:agent:01JABC...",
  "delegate_class": "agent",
  "scope": {
    "channels": ["voice", "video", "email"],
    "actions": ["communicate", "identify", "sign-session"],
    "restrictions": ["no-financial-approval", "no-legal-commitment"]
  },
  "valid_from": "2026-04-15T00:00:00Z",
  "valid_until": "2026-10-15T00:00:00Z",
  "status": "active",
  "signature": {
    "kid": "org-key-2026-01",
    "algorithm": "ed25519",
    "value": "delegation-signature"
  }
}
```

## 4. Signed Communication Object

This is the key product object.

```json
{
  "object_type": "dgd.communication",
  "version": "0.1",
  "id": "dgd:comm:01JCOMM...",
  "channel": "voice",
  "channel_subtype": "outbound-call",
  "sender": {
    "identity_id": "dgd:agent:01JABC...",
    "identity_class": "agent",
    "verification_state": "verified-agent"
  },
  "operator": {
    "identity_id": "dgd:org:acme",
    "verification_state": "verified-organization"
  },
  "delegation_id": "dgd:del:01JKLM...",
  "payload": {
    "content_type": "session-manifest",
    "content_digest": "sha256:...",
    "created_by": "agent",
    "media_mode": "real-time-voice"
  },
  "timestamps": {
    "created_at": "2026-04-15T00:00:00Z",
    "session_started_at": "2026-04-15T00:00:10Z"
  },
  "signature": {
    "kid": "agent-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature-by-sender"
  }
}
```

## 5. Verification Result Object

```json
{
  "object_type": "dgd.verification_result",
  "version": "0.1",
  "verified_at": "2026-04-15T00:05:00Z",
  "subject_id": "dgd:comm:01JCOMM...",
  "signature_valid": true,
  "signer_status": "active",
  "delegation_status": "active",
  "revocation_status": "clear",
  "trust_state": "delegated-agent",
  "display_summary": "Verified agent acting for Acme Support",
  "warnings": [],
  "errors": []
}
```

## 6. Revocation Object

```json
{
  "object_type": "dgd.revocation",
  "version": "0.1",
  "id": "dgd:rev:01JREV...",
  "target_object_id": "dgd:del:01JKLM...",
  "target_object_type": "dgd.delegation",
  "reason": "authorization-ended",
  "revoked_at": "2026-05-01T00:00:00Z",
  "issuer_id": "dgd:org:acme",
  "signature": {
    "kid": "org-key-2026-01",
    "algorithm": "ed25519",
    "value": "revocation-signature"
  }
}
```

## Early design choices

### Identity ids
Use a DigiD-prefixed identifier format such as:
- `dgd:human:<id>`
- `dgd:agent:<id>`
- `dgd:org:<id>`

### Signatures
Keep the first draft algorithm-agnostic but opinionated enough to prototype quickly.
A good early default is Ed25519.

### Verification states vs identity classes
Keep them separate.

- `identity_class` answers: what kind of thing is this?
- `verification_state` answers: how should a receiver interpret its trust level?

This matters because a pseudonymous identity can still be persistent and signed, while an agent can be either verified or unverified.
