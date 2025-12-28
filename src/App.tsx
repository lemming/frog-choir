import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
// @ts-expect-error
import backgroundImg from "./assets/background-alt-2.png";
// @ts-expect-error
import frogsSpriteImg from "./assets/frogs-sprite.png";

// Audio context for Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	return audioContext;
};

// Note frequencies
const NOTE_FREQUENCIES: Record<string, number> = {
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

// Frog melody definitions
interface FrogMelody {
	id: string;
	name: string;
	color: string;
	scarfColor: string;
	notes: { note: string; duration: number; delay: number }[];
	spriteIndex: number;
}

const FROGS: FrogMelody[] = [
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
const CORRECT_ORDER = ["blue", "yellow", "red", "green", "purple"];

// Play a note using Web Audio API
const playNote = (frequency: number, duration: number, delay: number = 0) => {
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
const playFrogMelody = (frog: FrogMelody) => {
	frog.notes.forEach(({ note, duration, delay }) => {
		const freq = NOTE_FREQUENCIES[note];
		if (freq) playNote(freq, duration, delay);
	});
};

// Play the complete Hedwig's Theme (full melody)
const HEDWIGS_THEME: { note: string; duration: number }[] = [
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

const playCompleteTheme = () => {
	let currentDelay = 0;
	HEDWIGS_THEME.forEach(({ note, duration }) => {
		const freq = NOTE_FREQUENCIES[note];
		if (freq) playNote(freq, duration, currentDelay);
		currentDelay += duration + 0.05;
	});
};

// Frog component
interface FrogProps {
	frog: FrogMelody;
	onClick: () => void;
	onDragStart: (frog: FrogMelody, startX: number, startY: number) => void;
	onDragMove: (x: number, y: number) => void;
	onDragEnd: () => void;
	isSinging: boolean;
	isDragging: boolean;
	isInSlot?: boolean;
}

const SPRITE_SIZE = 350; // Each frog is 350px in the sprite
const DISPLAY_SIZE = 140; // Display size on screen
const SCALE = DISPLAY_SIZE / SPRITE_SIZE;

const Frog = ({
	frog,
	onClick,
	onDragStart,
	onDragMove,
	onDragEnd,
	isSinging,
	isDragging,
}: FrogProps) => {
	const spriteOffset = frog.spriteIndex * SPRITE_SIZE * SCALE;
	const isDraggingRef = useRef(false);
	const hasMoved = useRef(false);
	const startPos = useRef({ x: 0, y: 0 });

	const handlePointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		isDraggingRef.current = true;
		hasMoved.current = false;
		startPos.current = { x: e.clientX, y: e.clientY };
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		onDragStart(frog, e.clientX, e.clientY);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDraggingRef.current) return;
		const dx = Math.abs(e.clientX - startPos.current.x);
		const dy = Math.abs(e.clientY - startPos.current.y);
		if (dx > 5 || dy > 5) {
			hasMoved.current = true;
		}
		onDragMove(e.clientX, e.clientY);
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (!isDraggingRef.current) return;
		isDraggingRef.current = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		onDragEnd();
		if (!hasMoved.current) {
			onClick();
		}
	};

	return (
		<div
			className={`frog ${isSinging ? "singing" : ""} ${isDragging ? "dragging" : ""}`}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onKeyDown={(e) => e.key === "Enter" && onClick()}
			role="button"
			tabIndex={0}
			title={`Click to hear ${frog.name}`}
			style={{ touchAction: "none" }}
		>
			<div
				className="frog-sprite"
				style={{
					backgroundImage: `url(${frogsSpriteImg})`,
					backgroundPosition: `-${spriteOffset}px 0`,
					backgroundSize: `${SPRITE_SIZE * 5 * SCALE}px ${SPRITE_SIZE * SCALE}px`,
					width: `${DISPLAY_SIZE}px`,
					height: `${DISPLAY_SIZE}px`,
				}}
			/>
			{isSinging && (
				<div
					className="music-notes"
					style={{ color: frog.color, textShadow: `0 0 10px ${frog.color}` }}
				>
					♪ ♫ ♪
				</div>
			)}
		</div>
	);
};

// Slot component
interface SlotProps {
	index: number;
	frog: FrogMelody | null;
	onFrogClick: (frog: FrogMelody) => void;
	onRemoveFrog: (index: number) => void;
	singingFrogId: string | null;
	isDropTarget: boolean;
	slotRef: (el: HTMLDivElement | null) => void;
}

const Slot = ({
	index,
	frog,
	onFrogClick,
	onRemoveFrog,
	singingFrogId,
	isDropTarget,
	slotRef,
}: SlotProps) => {
	return (
		<div
			ref={slotRef}
			className={`slot ${frog ? "filled" : "empty"} ${isDropTarget ? "drop-target" : ""}`}
			onClick={() => frog && onRemoveFrog(index)}
			onKeyDown={(e) => e.key === "Enter" && frog && onRemoveFrog(index)}
			role="button"
			tabIndex={0}
		>
			{frog ? (
				<div
					className={`frog in-slot ${singingFrogId === frog.id ? "singing" : ""}`}
					onClick={(e) => {
						e.stopPropagation();
						onFrogClick(frog);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.stopPropagation();
							onFrogClick(frog);
						}
					}}
					role="button"
					tabIndex={0}
				>
					<div
						className="frog-sprite"
						style={{
							backgroundImage: `url(${frogsSpriteImg})`,
							backgroundPosition: `-${frog.spriteIndex * SPRITE_SIZE * SCALE}px 0`,
							backgroundSize: `${SPRITE_SIZE * 5 * SCALE}px ${SPRITE_SIZE * SCALE}px`,
							width: `${DISPLAY_SIZE}px`,
							height: `${DISPLAY_SIZE}px`,
						}}
					/>
					{singingFrogId === frog.id && (
						<div
							className="music-notes"
							style={{
								color: frog.color,
								textShadow: `0 0 10px ${frog.color}`,
							}}
						>
							♪ ♫ ♪
						</div>
					)}
				</div>
			) : (
				<div className="slot-placeholder">
					<span className="slot-number">{index + 1}</span>
				</div>
			)}
		</div>
	);
};

export function App() {
	const [gameStarted, setGameStarted] = useState(false);
	const [slots, setSlots] = useState<(FrogMelody | null)[]>([
		null,
		null,
		null,
		null,
		null,
	]);
	const [draggedFrog, setDraggedFrog] = useState<FrogMelody | null>(null);
	const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
	const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
	const [singingFrogId, setSingingFrogId] = useState<string | null>(null);
	const [hasWon, setHasWon] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);
	const singingTimeoutRef = useRef<number | null>(null);
	const gameContainerRef = useRef<HTMLDivElement | null>(null);
	const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

	// Check if fullscreen is supported (not on iOS)
	const isFullscreenSupported =
		typeof document !== "undefined" &&
		(document.fullscreenEnabled ||
			// @ts-expect-error - webkit prefix for Safari
			document.webkitFullscreenEnabled) &&
		// iOS doesn't support fullscreen even though it may report it does
		!/iPad|iPhone|iPod/.test(navigator.userAgent);

	const enterFullscreen = useCallback(async () => {
		if (!isFullscreenSupported) return;
		try {
			if (gameContainerRef.current) {
				if (gameContainerRef.current.requestFullscreen) {
					await gameContainerRef.current.requestFullscreen();
					// @ts-expect-error - webkit prefix for Safari
				} else if (gameContainerRef.current.webkitRequestFullscreen) {
					// @ts-expect-error - webkit prefix for Safari
					await gameContainerRef.current.webkitRequestFullscreen();
				}
			}
		} catch {
			console.log("Fullscreen not supported or denied");
		}
	}, [isFullscreenSupported]);

	const startGame = useCallback(
		async (withFullscreen: boolean) => {
			if (withFullscreen) {
				await enterFullscreen();
			}
			setGameStarted(true);
		},
		[enterFullscreen],
	);

	// Get available frogs (not in slots)
	const availableFrogs = FROGS.filter(
		(frog) => !slots.some((slot) => slot?.id === frog.id),
	);

	const handleFrogClick = useCallback((frog: FrogMelody) => {
		if (singingTimeoutRef.current) {
			clearTimeout(singingTimeoutRef.current);
		}

		setSingingFrogId(frog.id);
		playFrogMelody(frog);

		const maxDuration = Math.max(
			...frog.notes.map((n) => n.delay + n.duration),
		);
		singingTimeoutRef.current = window.setTimeout(
			() => {
				setSingingFrogId(null);
			},
			maxDuration * 1000 + 200,
		);
	}, []);

	// Check which slot the cursor is over
	const getSlotAtPosition = useCallback(
		(x: number, y: number): number | null => {
			for (let i = 0; i < slotRefs.current.length; i++) {
				const slot = slotRefs.current[i];
				if (slot) {
					const rect = slot.getBoundingClientRect();
					if (
						x >= rect.left &&
						x <= rect.right &&
						y >= rect.top &&
						y <= rect.bottom
					) {
						return i;
					}
				}
			}
			return null;
		},
		[],
	);

	const handleDragStart = useCallback(
		(frog: FrogMelody, startX: number, startY: number) => {
			setDraggedFrog(frog);
			setDragOffset({ x: DISPLAY_SIZE / 2, y: DISPLAY_SIZE / 2 });
			setDragPosition({ x: startX, y: startY });
		},
		[],
	);

	const handleDragMove = useCallback(
		(x: number, y: number) => {
			if (!draggedFrog) return;
			setDragPosition({ x, y });
			setHoveredSlot(getSlotAtPosition(x, y));
		},
		[draggedFrog, getSlotAtPosition],
	);

	const handleDragEnd = useCallback(() => {
		if (!draggedFrog) return;

		if (hoveredSlot !== null) {
			setSlots((prev) => {
				const newSlots = [...prev];
				// Remove frog from any existing slot
				const existingIndex = newSlots.findIndex(
					(slot) => slot?.id === draggedFrog.id,
				);
				if (existingIndex !== -1) {
					newSlots[existingIndex] = null;
				}
				// Place frog in new slot (swap if occupied)
				const existingFrog = newSlots[hoveredSlot];
				if (existingFrog && existingIndex !== -1) {
					newSlots[existingIndex] = existingFrog;
				}
				newSlots[hoveredSlot] = draggedFrog;
				return newSlots;
			});
		}

		setDraggedFrog(null);
		setHoveredSlot(null);
	}, [draggedFrog, hoveredSlot]);

	const handleRemoveFrog = useCallback((slotIndex: number) => {
		setSlots((prev) => {
			const newSlots = [...prev];
			newSlots[slotIndex] = null;
			return newSlots;
		});
	}, []);

	// Check win condition whenever slots change
	useEffect(() => {
		const currentOrder = slots.map((slot) => slot?.id || null);
		const isCorrect =
			currentOrder.every((id) => id !== null) &&
			currentOrder.every((id, index) => id === CORRECT_ORDER[index]);

		if (isCorrect && !hasWon) {
			setHasWon(true);
			setShowCelebration(true);

			// Play the complete theme
			setTimeout(() => {
				playCompleteTheme();
			}, 500);
		}
	}, [slots, hasWon]);

	const resetGame = () => {
		setSlots([null, null, null, null, null]);
		setHasWon(false);
		setShowCelebration(false);
	};

	return (
		<div
			ref={gameContainerRef}
			className="game-container"
			style={{ backgroundImage: `url(${backgroundImg})` }}
		>
			{/* Start Screen */}
			{!gameStarted && (
				<div className="start-screen">
					<div className="start-content">
						<h1>The Frog Choir</h1>
						<p className="start-subtitle">A Magical Musical Puzzle</p>
						<div className="start-buttons">
							{isFullscreenSupported && (
								<button
									type="button"
									className="start-btn fullscreen-btn"
									onClick={() => startGame(true)}
								>
									🖥️ Play Fullscreen
								</button>
							)}
							<button
								type="button"
								className={`start-btn ${isFullscreenSupported ? "windowed-btn" : "fullscreen-btn"}`}
								onClick={() => startGame(false)}
							>
								{isFullscreenSupported ? "Play Windowed" : "🎵 Start Game"}
							</button>
						</div>
						{isFullscreenSupported && (
							<p className="fullscreen-hint">
								Fullscreen recommended for the best experience!
							</p>
						)}
					</div>
				</div>
			)}

			{/* Floating candles */}
			<div className="floating-candles">
				{[...Array(8)].map((_, i) => (
					<div
						key={i}
						className="candle"
						style={{
							left: `${10 + i * 12}%`,
							top: `${20 + (i % 2) * 10}px`,
							animationDelay: `${i * 0.5}s`,
						}}
					>
						🕯️
					</div>
				))}
			</div>

			{/* Header */}
			<header className="game-header">
				<h1>The Frog Choir</h1>
				<p>Arrange the frogs to play Hedwig's Theme!</p>
				<p className="hint">
					Click a frog to hear its part, then drag it to a slot
				</p>
			</header>

			{/* Available frogs area */}
			<div className="frogs-area">
				<div className="frogs-container">
					{availableFrogs.map((frog) => (
						<Frog
							key={frog.id}
							frog={frog}
							onClick={() => handleFrogClick(frog)}
							onDragStart={handleDragStart}
							onDragMove={handleDragMove}
							onDragEnd={handleDragEnd}
							isSinging={singingFrogId === frog.id}
							isDragging={draggedFrog?.id === frog.id}
						/>
					))}
				</div>
			</div>

			{/* Slots area */}
			<div className="slots-area">
				<div className="stone-railing">
					<div className="slots-container">
						{slots.map((slot, index) => (
							<Slot
								key={index}
								index={index}
								frog={slot}
								onFrogClick={handleFrogClick}
								onRemoveFrog={handleRemoveFrog}
								singingFrogId={singingFrogId}
								isDropTarget={hoveredSlot === index}
								slotRef={(el) => {
									slotRefs.current[index] = el;
								}}
							/>
						))}
					</div>
				</div>
			</div>

			{/* Dragged frog ghost */}
			{draggedFrog && (
				<div
					className="dragged-frog"
					style={{
						position: "fixed",
						left: dragPosition.x - dragOffset.x,
						top: dragPosition.y - dragOffset.y,
						pointerEvents: "none",
						zIndex: 1000,
					}}
				>
					<div
						className="frog-sprite"
						style={{
							backgroundImage: `url(${frogsSpriteImg})`,
							backgroundPosition: `-${draggedFrog.spriteIndex * SPRITE_SIZE * SCALE}px 0`,
							backgroundSize: `${SPRITE_SIZE * 5 * SCALE}px ${SPRITE_SIZE * SCALE}px`,
							width: `${DISPLAY_SIZE}px`,
							height: `${DISPLAY_SIZE}px`,
							transform: "scale(1.1)",
							filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.4))",
						}}
					/>
				</div>
			)}

			{/* Celebration overlay */}
			{showCelebration && (
				<div className="celebration-overlay">
					<div className="celebration-content">
						<div className="magic-sparkles">✨ ⭐ ✨ ⭐ ✨</div>
						<h2>🎵 Magical! 🎵</h2>
						<p>You've recreated Hedwig's Theme!</p>
						<div className="celebrating-frogs">
							{FROGS.map((frog) => (
								<div key={frog.id} className="celebrating-frog">
									<div
										className="frog-sprite"
										style={{
											backgroundImage: `url(${frogsSpriteImg})`,
											backgroundPosition: `-${frog.spriteIndex * SPRITE_SIZE * SCALE}px 0`,
											backgroundSize: `${SPRITE_SIZE * 5 * SCALE}px ${SPRITE_SIZE * SCALE}px`,
											width: `${DISPLAY_SIZE}px`,
											height: `${DISPLAY_SIZE}px`,
											transform: "scale(0.7)",
										}}
									/>
								</div>
							))}
						</div>
						<button
							type="button"
							className="play-again-btn"
							onClick={resetGame}
						>
							Play Again 🔄
						</button>
						<button
							type="button"
							className="play-theme-btn"
							onClick={() => playCompleteTheme()}
						>
							Play Theme Again 🎵
						</button>
					</div>
				</div>
			)}

			{/* Stars */}
			<div className="stars">
				{[...Array(20)].map((_, i) => (
					<div
						key={i}
						className="star"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 40}%`,
							animationDelay: `${Math.random() * 3}s`,
						}}
					>
						✦
					</div>
				))}
			</div>
		</div>
	);
}

export default App;
