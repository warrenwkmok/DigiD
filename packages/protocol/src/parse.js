export function parseJsonDocument(input, label = "document") {
  if (typeof input === "string") {
    return JSON.parse(input);
  }

  if (!input || typeof input !== "object") {
    throw new Error(`Invalid ${label}: expected JSON object`);
  }

  return input;
}

export function parseDigiDObject(input) {
  const document = parseJsonDocument(input, "object");

  if (!document.object_type) {
    throw new Error("Expected DigiD object with object_type");
  }

  return document;
}

export function parseDigiDEnvelope(input) {
  const document = parseJsonDocument(input, "envelope");

  if (!document.envelope_type) {
    throw new Error("Expected DigiD envelope with envelope_type");
  }

  return document;
}
