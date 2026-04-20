// Demo-only signing keys for fixture generation.
//
// These keys exist solely so `scripts/generate-demo-fixtures.mjs` can regenerate
// fixtures deterministically without rotating key material on every run.
//
// Never use these keys outside of local reference fixtures.

export const DEMO_FIXTURE_KEY_MATERIAL = Object.freeze({
  org_acme: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEIKRTXkCDet/2mag4HU1bERYjiojKbITajQNY/bKTNr3i"
  },
  org_globex: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEILH0Kkw4tbiBRY1frD3sXaGycyqovURgPWB82C90Iqgs"
  },
  org_northwind: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEIKH45/ksSXZIVqr0QRCu6XXQ/1tjn2aNgOXqYxReBxZv"
  },
  agent_01: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEIElmcGngNSu4bkRzFV/fgKU+GbEvNxAOB83Y9JllT8AT"
  },
  human_01: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEIFZaTKfmMTnpmGXtai4i+cSsrpSikrpWINIrWQaqU+oB"
  },
  unverified_01: {
    pkcs8_der_base64: "MC4CAQAwBQYDK2VwBCIEIKrYaT/f+nD/uqmCvTaXU1dKEHrsaTj2bN+Ceeb2ewe/"
  }
});

