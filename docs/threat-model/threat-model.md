# DigiD threat model

## Core threat categories

### 1. Identity spoofing
An attacker claims to be a human, agent, or organization they do not control.

### 2. Delegation abuse
An agent or user claims delegated authority they do not actually possess, or continues to act after authority should have ended.

### 3. Key compromise
A private key is stolen, copied, or misused.

### 4. Revocation lag
A compromised or revoked identity continues to appear trustworthy because revocation is not checked quickly enough.

### 5. Media tampering
A voice or video artifact is modified after signing, or falsely presented as original.

### 6. Misleading trust UI
The cryptography may be sound, but the user interface may overstate what has actually been proven.

### 7. Privacy overexposure
The system may reveal more real-world identity information than a communication context truly requires.

### 8. False sense of truth
Users may confuse verified sender identity with verified factual correctness.

## Security principles

- protect origin authenticity
- make revocation visible
- minimize disclosure by default
- support rotation and recovery
- distinguish provenance from truth
- expose delegation boundaries clearly

## Design reminder

A DigiD trust badge should answer:
- who signed this
- what kind of entity they are
- how they were attested
- whether the signature is intact
- whether authority is active

It should not imply more than the system can truly prove.
