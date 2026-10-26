import bcrypt from "bcrypt";

// Work factor 2^12. Measured ~300 ms per hash on the development machine:
// slow enough to make offline guessing expensive, fast enough for logins.
export const BCRYPT_COST = 12;

// Hash of a random, discarded password. Comparing against it when the email
// is unknown makes a failed login take as long as a wrong password, so
// response times do not reveal which emails are registered.
const DUMMY_HASH = "$2b$12$Li0AUs6N2C/JK58qFNVCRu7gVQcBoCWCixqMwV4AlV1dRNCIVslXS";

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_COST);

export const verifyPassword = (password: string, passwordHash: string | null) =>
  bcrypt.compare(password, passwordHash ?? DUMMY_HASH).then((match) => match && passwordHash !== null);
