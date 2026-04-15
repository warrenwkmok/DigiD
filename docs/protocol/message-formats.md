# DigiD signed message formats v0

This document maps DigiD into concrete communication objects the product can eventually sign and verify.

## Objective

DigiD should define a common envelope that works across channels, even if the payload format differs.

## Common envelope

A channel-specific DigiD message should have:
- sender identity
- optional operator identity
- optional delegation identity
- channel type
- content digest
- timestamp
- signature
- optional provenance metadata

## Base envelope

```json
{
  "envelope_type": "dgd.envelope",
  "version": "0.1",
  "message_id": "msg_01J...",
  "channel": "messaging",
  "sender_id": "dgd:human:01J...",
  "operator_id": null,
  "delegation_id": null,
  "created_at": "2026-04-15T00:00:00Z",
  "payload_digest": "sha256:...",
  "signature": {
    "kid": "key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Voice call start envelope

```json
{
  "envelope_type": "dgd.voice_session_start",
  "version": "0.1",
  "session_id": "call_01J...",
  "channel": "voice",
  "sender_id": "dgd:agent:01J...",
  "operator_id": "dgd:org:acme",
  "delegation_id": "dgd:del:01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "call_direction": "outbound",
  "claimed_purpose": "support-follow-up",
  "signature": {
    "kid": "agent-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Voice recording manifest

```json
{
  "envelope_type": "dgd.voice_recording_manifest",
  "version": "0.1",
  "recording_id": "rec_01J...",
  "session_id": "call_01J...",
  "sender_id": "dgd:agent:01J...",
  "media": {
    "codec": "opus",
    "duration_ms": 48321,
    "content_digest": "sha256:..."
  },
  "created_at": "2026-04-15T00:10:00Z",
  "signature": {
    "kid": "agent-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Video artifact envelope

```json
{
  "envelope_type": "dgd.video_artifact",
  "version": "0.1",
  "artifact_id": "vid_01J...",
  "sender_id": "dgd:human:01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "provenance": {
    "capture_mode": "human-recorded",
    "edited": false,
    "content_digest": "sha256:..."
  },
  "signature": {
    "kid": "human-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Messaging envelope

```json
{
  "envelope_type": "dgd.messaging_message",
  "version": "0.1",
  "message_id": "chat_01J...",
  "sender_id": "dgd:human:01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "payload": {
    "content_type": "text/plain",
    "content_digest": "sha256:..."
  },
  "signature": {
    "kid": "human-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Email envelope

```json
{
  "envelope_type": "dgd.email_message",
  "version": "0.1",
  "message_id": "mail_01J...",
  "sender_id": "dgd:agent:01J...",
  "operator_id": "dgd:org:acme",
  "delegation_id": "dgd:del:01J...",
  "created_at": "2026-04-15T00:00:00Z",
  "payload": {
    "subject_digest": "sha256:...",
    "body_digest": "sha256:..."
  },
  "signature": {
    "kid": "agent-key-2026-04",
    "algorithm": "ed25519",
    "value": "signature"
  }
}
```

## Interpretation rule

The DigiD envelope should make verification portable even if the host platform does not natively understand DigiD.
That means:
- a verifier can check the signature and trust chain externally
- a UI can still render trust state from the envelope and related objects

## First implementation note

For the first prototype, it is enough to define these as JSON reference objects and build a verifier against them.
The protocol does not need full RFC-grade serialization before the first proof of concept.
