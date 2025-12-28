import { NOTE_FREQUENCIES, HEDWIGS_THEME } from "../constants";
import { FrogMelody } from "../types";

// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

export const getAudioContext = () => {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
};

// Play a note using Web Audio API
export const playNote = (
	frequency: number,
	duration: number,
	delay: number = 0,
) => {
	const ctx = getAudioContext();
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	oscillator.type = "sine";
	oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

	// Envelope for magical sound
	gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
	gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
	gainNode.gain.exponentialRampToValueAtTime(
		0.01,
		ctx.currentTime + delay + duration,
	);

	oscillator.start(ctx.currentTime + delay);
	oscillator.stop(ctx.currentTime + delay + duration);
};

// Play a frog's melody
export const playFrogMelody = (frog: FrogMelody) => {
	frog.notes.forEach(({ note, duration, delay }) => {
		const freq = NOTE_FREQUENCIES[note];
		if (freq) playNote(freq, duration, delay);
	});
};

export const playCompleteTheme = () => {
	let currentDelay = 0;
	HEDWIGS_THEME.forEach(({ note, duration }) => {
		const freq = NOTE_FREQUENCIES[note];
		if (freq) playNote(freq, duration, currentDelay);
		currentDelay += duration + 0.05;
	});
};
