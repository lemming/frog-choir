import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
// @ts-expect-error
import backgroundHighlightedImg from "./assets/background-alt-2.png";
// @ts-expect-error
import backgroundImg from "./assets/background-alt-2-highlighted.png";
// @ts-expect-error
import frogsSpriteImg from "./assets/frogs-sprite.png";
import { Frog } from "./components/Frog";
import { Slot } from "./components/Slot";
import {
	CORRECT_ORDER,
	DISPLAY_SIZE,
	FROGS,
	SCALE,
	SPRITE_SIZE,
} from "./constants";
import type { FrogMelody } from "./types";
import { playCompleteTheme, playFrogMelody } from "./utils/audio";

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
	const [isPortrait, setIsPortrait] = useState(false);
	const singingTimeoutRef = useRef<number | null>(null);
	const gameContainerRef = useRef<HTMLDivElement | null>(null);
	const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

	// Detect portrait orientation
	useEffect(() => {
		const checkOrientation = () => {
			setIsPortrait(window.innerHeight > window.innerWidth);
		};

		checkOrientation();
		window.addEventListener("resize", checkOrientation);
		window.addEventListener("orientationchange", checkOrientation);

		return () => {
			window.removeEventListener("resize", checkOrientation);
			window.removeEventListener("orientationchange", checkOrientation);
		};
	}, []);

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

	const handleFrogClick = useCallback(
		(frog: FrogMelody) => {
			if (isPortrait) return;
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
		},
		[isPortrait],
	);

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
			if (isPortrait) return;
			setDraggedFrog(frog);
			setDragOffset({ x: DISPLAY_SIZE / 2, y: DISPLAY_SIZE / 2 });
			setDragPosition({ x: startX, y: startY });
		},
		[isPortrait],
	);

	const handleDragMove = useCallback(
		(x: number, y: number) => {
			if (isPortrait || !draggedFrog) return;
			setDragPosition({ x, y });
			setHoveredSlot(getSlotAtPosition(x, y));
		},
		[isPortrait, draggedFrog, getSlotAtPosition],
	);

	const handleDragEnd = useCallback(() => {
		if (isPortrait || !draggedFrog) return;

		setSlots((prev) => {
			const newSlots = [...prev];
			// Find if frog is currently in a slot
			const existingIndex = newSlots.findIndex(
				(slot) => slot?.id === draggedFrog.id,
			);

			if (hoveredSlot !== null && hoveredSlot !== existingIndex) {
				// Dropping on a different slot
				// Remove frog from any existing slot
				if (existingIndex !== -1) {
					newSlots[existingIndex] = null;
				}

				// Place frog in new slot (swap if occupied)
				const existingFrog = newSlots[hoveredSlot];
				if (existingFrog && existingIndex !== -1) {
					newSlots[existingIndex] = existingFrog;
				}
				newSlots[hoveredSlot] = draggedFrog;
			} else if (hoveredSlot === null && existingIndex !== -1) {
				// Frog was in a slot and dropped outside - remove it from slot
				newSlots[existingIndex] = null;
			}
			// If hoveredSlot === existingIndex, frog stays in same slot (no change)
			// If hoveredSlot === null && existingIndex === -1, frog was from available area (no change)
			return newSlots;
		});

		setDraggedFrog(null);
		setHoveredSlot(null);
	}, [isPortrait, draggedFrog, hoveredSlot]);

	// Check win condition whenever slots change
	useEffect(() => {
		const currentOrder = slots.map((slot) => slot?.id || null);

		// Check if all slots are filled
		const allSlotsFilled = currentOrder.every((id) => id !== null);

		// Compare melodies: get the notes sequence for current order vs correct order
		const getMelodyNotes = (frogIds: (string | null)[]) => {
			return frogIds
				.filter((id): id is string => id !== null)
				.flatMap((id) => {
					const frog = FROGS.find((f) => f.id === id);
					return frog ? frog.notes.map((n) => n.note) : [];
				});
		};

		const currentMelody = getMelodyNotes(currentOrder);
		const correctMelody = getMelodyNotes(CORRECT_ORDER);

		// Check if melodies match (same notes in same order)
		const melodiesMatch =
			currentMelody.length === correctMelody.length &&
			currentMelody.every((note, i) => note === correctMelody[i]);

		if (allSlotsFilled && melodiesMatch && !hasWon) {
			setHasWon(true);
			setShowCelebration(true);

			// Play the complete theme 33% faster
			setTimeout(() => {
				playCompleteTheme(1.33);
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
			className={`game-container ${draggedFrog ? "dragging-active" : ""} ${isPortrait ? "portrait-mode" : ""}`}
			style={{ backgroundImage: `url(${backgroundImg})` }}
		>
			{/* Background highlight overlay for hovered slot */}
			{hoveredSlot !== null && (
				<div
					className="background-highlight-overlay"
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						backgroundImage: `url(${backgroundHighlightedImg})`,
						backgroundSize: "cover",
						backgroundPosition: "center",
						backgroundRepeat: "no-repeat",
						pointerEvents: "none",
						zIndex: 0,
						clipPath: `inset(0 ${(4 - hoveredSlot) * 20}% 0 ${hoveredSlot * 20}%)`,
					}}
				/>
			)}

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
					{FROGS.map((frog) => {
						const isInSlot = slots.some((slot) => slot?.id === frog.id);
						if (isInSlot) {
							// Render empty placeholder to maintain layout
							return (
								<div
									key={frog.id}
									style={{
										width: `${DISPLAY_SIZE}px`,
										height: `${DISPLAY_SIZE}px`,
									}}
								/>
							);
						}
						return (
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
						);
					})}
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
								onDragStart={handleDragStart}
								onDragMove={handleDragMove}
								onDragEnd={handleDragEnd}
								singingFrogId={singingFrogId}
								isDragging={draggedFrog?.id === slot?.id}
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
							onClick={() => playCompleteTheme(1.33)}
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

			{/* Portrait mode prompt */}
			{isPortrait && (
				<div className="portrait-prompt">
					<div className="portrait-content">
						<div className="rotate-icon">📱</div>
						<h2>Please Rotate Your Device</h2>
						<p>This game is best played in landscape mode</p>
						<div className="rotate-animation">↻</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default App;
