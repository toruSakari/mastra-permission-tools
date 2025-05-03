import { describe, it, expect } from "vitest";
import {
	getSecurityLevelValue,
	compareSecurityLevels,
	getHigherSecurityLevel,
	isValidSecurityLevel,
} from "../../src/core/security-levels";

describe("security-levels", () => {
	describe("getSecurityLevelValue", () => {
		it("should return correct numeric values for security levels", () => {
			expect(getSecurityLevelValue("none")).toBe(0);
			expect(getSecurityLevelValue("low")).toBe(1);
			expect(getSecurityLevelValue("medium")).toBe(2);
			expect(getSecurityLevelValue("high")).toBe(3);
			expect(getSecurityLevelValue("critical")).toBe(4);
		});

		it("should return -1 for undefined", () => {
			expect(getSecurityLevelValue(undefined)).toBe(-1);
		});
	});

	describe("compareSecurityLevels", () => {
		it("should compare security levels correctly", () => {
			expect(compareSecurityLevels("high", "low")).toBeGreaterThan(0);
			expect(compareSecurityLevels("low", "high")).toBeLessThan(0);
			expect(compareSecurityLevels("medium", "medium")).toBe(0);
		});

		it("should handle undefined values", () => {
			expect(compareSecurityLevels(undefined, "low")).toBeLessThan(0);
			expect(compareSecurityLevels("low", undefined)).toBeGreaterThan(0);
		});
	});

	describe("getHigherSecurityLevel", () => {
		it("should return the higher security level", () => {
			expect(getHigherSecurityLevel("low", "high")).toBe("high");
			expect(getHigherSecurityLevel("critical", "medium")).toBe("critical");
		});

		it("should handle undefined values", () => {
			expect(getHigherSecurityLevel(undefined, "high")).toBe("high");
			expect(getHigherSecurityLevel("low", undefined)).toBe("low");
			expect(getHigherSecurityLevel(undefined, undefined)).toBe("medium");
		});
	});

	describe("isValidSecurityLevel", () => {
		it("should validate security levels correctly", () => {
			expect(isValidSecurityLevel("low")).toBe(true);
			expect(isValidSecurityLevel("invalid")).toBe(false);
			expect(isValidSecurityLevel(undefined)).toBe(false);
		});
	});
});
