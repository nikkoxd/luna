import { sql } from "drizzle-orm";
import { members } from "../schema";

export function levelToExp(level: number) {
	return 12.5 * (Math.pow(2 * level + 1, 2) - 1);
}

export function expToLevel(exp: number) {
	return Math.floor((Math.sqrt((4 * exp) / 50 + 1) - 1) / 2);
}

export function expToLevelSQL(exp: number) {
	return sql`FLOOR((SQRT(4 * ${exp} / 50 + 1) - 1) / 2)`;
}

export function updateMemberExp(expToAdd: number) {
	return sql`${members.exp} + ${expToAdd}`;
}

export function updateMemberBalance(balanceToAdd: number) {
	return sql`${members.balance} + ${balanceToAdd}`;
}

export function updateMemberLevel(expToAdd: number) {
	return sql`FLOOR((SQRT(4 * (${members.exp} + ${expToAdd}) / 50 + 1) - 1) / 2)`;
}
