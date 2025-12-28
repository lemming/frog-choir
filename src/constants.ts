import { FrogMelody } from "./types";

// Note frequencies
export const NOTE_FREQUENCIES: Record<string, number> = {
	B3: 246.94,
	E4: 329.63,
	G4: 392.0,
	"F#4": 369.99,
	A4: 440.0,
	B4: 493.88,
	D5: 587.33,
	E5: 659.25,
	"F#5": 739.99,
	G5: 783.99,
	A5: 880.0,
	B5: 987.77,
};

export const FROGS: FrogMelody[] = [
	{
		id: "red",
		name: "Red Frog",
		color: "#e74c3c",
		scarfColor: "#c0392b",
		notes: [
			{ note: "E5", duration: 0.3, delay: 0 },
			{ note: "G5", duration: 0.3, delay: 0.35 },
		],
		spriteIndex: 0,
	},
	{
		id: "yellow",
		name: "Yellow Frog",
		color: "#f1c40f",
		scarfColor: "#f39c12",
		notes: [{ note: "E5", duration: 0.6, delay: 0 }],
		spriteIndex: 1,
	},

	{
		id: "purple",
		name: "Purple Frog",
		color: "#9b59b6",
		scarfColor: "#8e44ad",
		notes: [
			{ note: "B5", duration: 0.3, delay: 0 },
			{ note: "A5", duration: 0.4, delay: 0.35 },
		],
		spriteIndex: 2,
	},
	{
		id: "blue",
		name: "Blue Frog",
		color: "#3498db",
		scarfColor: "#2980b9",
		notes: [{ note: "B4", duration: 0.5, delay: 0 }],
		spriteIndex: 3,
	},
	{
		id: "green",
		name: "Green Frog",
		color: "#2ecc71",
		scarfColor: "#27ae60",
		notes: [{ note: "F#5", duration: 0.5, delay: 0 }],
		spriteIndex: 4,
	},
];

// Correct order for Hedwig's Theme
export const CORRECT_ORDER = ["blue", "yellow", "red", "green", "purple"];

// Play the complete Hedwig's Theme (full melody)
export const HEDWIGS_THEME: { note: string; duration: number }[] = [
	// First phrase: B - E - G - F# - E
	{ note: "B4", duration: 0.4 },
	{ note: "E5", duration: 0.6 },
	{ note: "G5", duration: 0.3 },
	{ note: "F#5", duration: 0.4 },
	{ note: "E5", duration: 0.8 },
	// Second phrase: B - A - F#
	{ note: "B5", duration: 0.5 },
	{ note: "A5", duration: 1.0 },
	{ note: "F#5", duration: 1.0 },
	// Third phrase: E - G - F# - D# - F
	{ note: "E5", duration: 0.6 },
	{ note: "G5", duration: 0.3 },
	{ note: "F#5", duration: 0.4 },
	{ note: "D5", duration: 0.8 },
	// Fourth phrase: E - B (low) - B (low)
	{ note: "E5", duration: 0.5 },
	{ note: "B4", duration: 1.2 },
];

export const SPRITE_SIZE = 350; // Each frog is 350px in the sprite
export const DISPLAY_SIZE = 140; // Display size on screen
export const SCALE = DISPLAY_SIZE / SPRITE_SIZE;
