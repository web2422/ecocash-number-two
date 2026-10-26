# EcoCash Number Two — independent school project

This is a starter implementation of the mobile-first Zimbabwe phone-number login and account-registration screen.

## Run locally

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

The server creates a local SQLite database automatically. User PINs are salted and hashed with Node's `scrypt`; they are not stored in plaintext. Phone numbers are limited to Zimbabwe mobile format.

## Important next steps before any public deployment

- This is a starter, not a production-ready financial service.
- Configure real SMS OTP verification through an authorized SMS provider before treating phone ownership as verified. OTP is not implemented in this first stage.
- Add secure server-side sessions, CSRF protections as appropriate, account lockout/abuse controls, password/PIN reset, audit logging, database backups, and HTTPS.
- Review privacy, security, legal and regulatory requirements before handling real customers or lending.
- This is an independent school project and is not the official EcoCash service. Do not collect users' official EcoCash PINs or imply official affiliation.
