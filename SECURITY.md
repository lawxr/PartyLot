# Security Policy

## Supported Versions

PartyLot is currently in active development for the Monad Metropolis Hackathon.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

The PartyLot team (Law & Gabriela) takes security seriously. If you discover a security vulnerability or exploit in the web application, API endpoints, or deployed smart contracts on Monad Testnet, please disclose it responsibly.

### How to Report
1. **Do not disclose publicly**: Please do not open public issues regarding active vulnerabilities, exploit payloads, or sensitive credential leaks.
2. **Contact the maintainers**: Open a private security advisory on GitHub or contact the maintainers directly via repository issue marked `[SECURITY PRIVATE]`.
3. **Include details**:
   - Description of the vulnerability and potential impact.
   - Step-by-step reproduction steps or proof-of-concept (PoC).
   - Component affected (Smart contracts, Next.js API route, authentication flow, or state store).

---

## Smart Contract Scope

- **Network**: Monad Testnet (Chain ID: 10143).
- **PartyTreasury & SocialGraph**: Designed with fail-closed architectures and authorized caller verification.
- Testnet deployments use simulated testnet MON. Do not send real Mainnet funds to testnet contract addresses.
