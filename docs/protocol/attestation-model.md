# DigiD attestation model

## Purpose

An identity claim on its own is weak.
Attestation is what gives the claim weight.

DigiD should support a layered attestation model so that trust is not all-or-nothing.

## Types of attestation

Possible attestation categories include:
- self-asserted
- organization-issued
- employer-issued
- platform-issued
- government-backed verification
- KYC or financial verification
- web-of-trust or delegated trust
- device possession attestation

## Attestation fields

A DigiD attestation should include:
- attestation id
- subject identity id
- issuer identity id
- attestation type
- trust level
- issue date
- expiry date if any
- revocation info
- disclosure policy
- signature of issuer

## Example

```json
{
  "attestation_id": "att-123",
  "subject": "dgd:agent:abc",
  "issuer": "dgd:org:company-x",
  "type": "organization-issued-agent",
  "trust_level": "high",
  "issued_at": "2026-04-15T00:00:00Z",
  "expires_at": "2026-10-15T00:00:00Z",
  "signature": "..."
}
```

## Why attestation matters

Attestation lets the system distinguish between:
- an unknown agent claiming to be legitimate
- an agent that is explicitly authorized by a known company
- a human identity verified by a trusted authority

## Policy stance

Different products and channels can choose different minimum trust requirements.

Examples:
- a business phone system may require organization-issued agent attestation
- public social posting may allow pseudonymous self-attested identities
- high-trust workflows may require stronger verification classes

## Receiver interpretation

The receiver should not have to inspect raw cryptography.
The UX should summarize the meaning, for example:
- verified by organization
- self-asserted only
- government-ID verified
- revoked delegation
