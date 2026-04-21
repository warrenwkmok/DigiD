const objectRequiredFields = {
  "dgd.identity": ["object_type", "schema_version", "object_id", "identity_class", "display_name", "status", "keys", "created_at"],
  "dgd.attestation": ["object_type", "schema_version", "object_id", "issuer_id", "subject_id", "attestation_type", "verification_state", "status", "valid_from", "proof"],
  "dgd.delegation": ["object_type", "schema_version", "object_id", "issuer_id", "delegate_id", "delegate_class", "status", "authority", "valid_from", "proof"],
  "dgd.key_authorization": ["object_type", "schema_version", "object_id", "issuer_id", "subject_id", "delegation_id", "authorized_key", "status", "valid_from", "created_at", "proof"],
  "dgd.communication": ["object_type", "schema_version", "object_id", "status", "channel", "channel_subtype", "session_id", "sender", "purpose", "payload", "timestamps", "proof"],
  "dgd.session": ["object_type", "schema_version", "object_id", "status", "session_type", "communication_id", "channel", "sequence_scope", "timestamps", "proof"],
  "dgd.revocation": ["object_type", "schema_version", "object_id", "issuer_id", "target_object_id", "target_object_type", "status", "revoked_at", "created_at", "proof"],
  "dgd.artifact": ["object_type", "schema_version", "object_id", "status", "artifact_type", "communication_id", "payload", "created_at", "proof"],
  "dgd.verification_result": ["object_type", "schema_version", "object_id", "subject_id", "status", "verified_at", "decision", "verification_mode", "checks", "resolved_trust_state", "display_summary", "warnings", "errors"]
};

const envelopeRequiredFields = {
  "dgd.message": ["envelope_type", "schema_version", "envelope_id", "message_type", "subject_id", "channel", "sender_id", "conversation_id", "created_at", "verification_context", "payload", "proof"],
  "dgd.event": ["envelope_type", "schema_version", "envelope_id", "event_type", "subject_id", "actor_id", "conversation_id", "created_at", "verification_context", "payload", "payload_digest", "proof"]
};

function assertRequiredFields(document, fields, kind) {
  for (const field of fields) {
    if (document[field] === undefined) {
      throw new Error(`Invalid ${kind}: missing required field ${field}`);
    }
  }
}

export function validateObjectShape(document) {
  const requiredFields = objectRequiredFields[document.object_type];

  if (!requiredFields) {
    throw new Error(`Unsupported object type: ${document.object_type}`);
  }

  assertRequiredFields(document, requiredFields, document.object_type);

  if (document.schema_version !== "0.3") {
    throw new Error(`Unsupported schema version for ${document.object_type}: ${document.schema_version}`);
  }

  return document;
}

export function validateEnvelopeShape(document) {
  const requiredFields = envelopeRequiredFields[document.envelope_type];

  if (!requiredFields) {
    throw new Error(`Unsupported envelope type: ${document.envelope_type}`);
  }

  assertRequiredFields(document, requiredFields, document.envelope_type);

  if (document.schema_version !== "0.3") {
    throw new Error(`Unsupported schema version for ${document.envelope_type}: ${document.schema_version}`);
  }

  return document;
}
