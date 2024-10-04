import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
	throw new Error("JWT_SECRET is not set in environment variables");
}

export function createToken(payload: object): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyToken(token: string): any {
	try {
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
}