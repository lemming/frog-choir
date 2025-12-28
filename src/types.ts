export interface FrogConfig {
	id: string;
	name: string;
	color: string;
	scarfColor: string;
	notesCount: number;
	spriteIndex: number;
}

export interface FrogMelody extends FrogConfig {
	notes: { note: string; duration: number; delay: number }[];
}
