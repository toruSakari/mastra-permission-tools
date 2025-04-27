import { describe, it, expect } from "vitest";
import { SecurityLevel } from "../types/security";
import {
	getSecurityLevelValue,
	compareSecurityLevels,
	getHigherSecurityLevel,
	getSecurityLevelDisplayName,
	getSecurityLevelColor,
	parseSecurityLevel,
	isValidSecurityLevel,
} from "../../src/core/security-levels";

describe("security-levels", () => {
	describe("getSecurityLevelValue", () => {
		it("should return correct numeric values for security levels", () => {
			expect(getSecurityLevelValue(SecurityLevel.NONE)).toBe(0);
			expect(getSecurityLevelValue(SecurityLevel.LOW)).toBe(1);
			expect(getSecurityLevelValue(SecurityLevel.MEDIUM)).toBe(2);
			expect(getSecurityLevelValue(SecurityLevel.HIGH)).toBe(3);
			expect(getSecurityLevelValue(SecurityLevel.CRITICAL)).toBe(4);
		});

		it("should return -1 for undefined", () => {
			expect(getSecurityLevelValue(undefined)).toBe(-1);
		});
	});

	describe("compareSecurityLevels", () => {
		it("should compare security levels correctly", () => {
			expect(
				compareSecurityLevels(SecurityLevel.HIGH, SecurityLevel.LOW),
			).toBeGreaterThan(0);
			expect(
				compareSecurityLevels(SecurityLevel.LOW, SecurityLevel.HIGH),
			).toBeLessThan(0);
			expect(
				compareSecurityLevels(SecurityLevel.MEDIUM, SecurityLevel.MEDIUM),
			).toBe(0);
		});

		it("should handle undefined values", () => {
			expect(compareSecurityLevels(undefined, SecurityLevel.LOW)).toBeLessThan(
				0,
			);
			expect(
				compareSecurityLevels(SecurityLevel.LOW, undefined),
			).toBeGreaterThan(0);
		});
	});

	describe("getHigherSecurityLevel", () => {
		it("should return the higher security level", () => {
			expect(
				getHigherSecurityLevel(SecurityLevel.LOW, SecurityLevel.HIGH),
			).toBe(SecurityLevel.HIGH);
			expect(
				getHigherSecurityLevel(SecurityLevel.CRITICAL, SecurityLevel.MEDIUM),
			).toBe(SecurityLevel.CRITICAL);
		});

		it("should handle undefined values", () => {
			expect(getHigherSecurityLevel(undefined, SecurityLevel.HIGH)).toBe(
				SecurityLevel.HIGH,
			);
			expect(getHigherSecurityLevel(SecurityLevel.LOW, undefined)).toBe(
				SecurityLevel.LOW,
			);
			expect(getHigherSecurityLevel(undefined, undefined)).toBe(
				SecurityLevel.MEDIUM,
			);
		});
	});

	describe("getSecurityLevelDisplayName", () => {
		it("should return correct display names", () => {
			expect(getSecurityLevelDisplayName(SecurityLevel.NONE)).toBe("None");
			expect(getSecurityLevelDisplayName(SecurityLevel.CRITICAL)).toBe(
				"Critical",
			);
		});
	});

	describe("getSecurityLevelColor", () => {
		it("should return correct colors", () => {
			expect(getSecurityLevelColor(SecurityLevel.NONE)).toBe("#6b7280");
			expect(getSecurityLevelColor(SecurityLevel.CRITICAL)).toBe("#ef4444");
		});
	});

	describe("parseSecurityLevel", () => {
		it("should parse valid security level strings", () => {
			expect(parseSecurityLevel("low")).toBe(SecurityLevel.LOW);
			expect(parseSecurityLevel("HIGH")).toBe(SecurityLevel.HIGH);
		});

		it("should throw error for invalid strings", () => {
			expect(() => parseSecurityLevel("invalid")).toThrow(
				"Invalid security level: invalid",
			);
		});
	});

	describe("isValidSecurityLevel", () => {
		it("should validate security levels correctly", () => {
			expect(isValidSecurityLevel(SecurityLevel.LOW)).toBe(true);
			expect(isValidSecurityLevel("invalid")).toBe(false);
			expect(isValidSecurityLevel(undefined)).toBe(false);
		});
	});
});
