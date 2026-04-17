export function validateCommunicationLineage({ communication, session, envelopes }) {
  const errors = [];

  if (!communication) {
    errors.push("Missing communication anchor");
    return errors;
  }

  if (!session) {
    errors.push("Missing session object");
    return errors;
  }

  if (session.communication_id !== communication.object_id) {
    errors.push("Session communication_id does not match communication object_id");
  }

  if (session.object_id !== communication.session_id) {
    errors.push("Session object_id does not match communication session_id");
  }

  for (const envelope of envelopes) {
    if (envelope.conversation_id !== session.object_id) {
      errors.push(`${envelope.envelope_id} conversation_id does not match session object_id`);
    }

    if (communication.operator_id && envelope.operator_id !== communication.operator_id) {
      errors.push(`${envelope.envelope_id} operator_id does not match communication operator_id`);
    }

    if (communication.delegation_id && envelope.delegation_id !== communication.delegation_id) {
      errors.push(`${envelope.envelope_id} delegation_id does not match communication delegation_id`);
    }

    const signerId = envelope.sender_id ?? envelope.actor_id;

    if (signerId !== communication.sender.identity_id) {
      errors.push(`${envelope.envelope_id} signer does not match communication sender`);
    }

    if (communication.purpose && envelope.purpose && envelope.purpose !== communication.purpose) {
      errors.push(`${envelope.envelope_id} purpose does not match communication purpose`);
    }
  }

  return errors;
}
