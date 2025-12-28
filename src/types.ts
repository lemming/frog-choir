export interface FrogMelody {
	id: string;
	name: string;
	color: string;
	scarfColor: string;
	notes: { note: string; duration: number; delay: number }[];
	spriteIndex: number;
}
