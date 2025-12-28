import { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";
// @ts-expect-error
import backgroundImg from "./assets/background-alt-2.png";
import backgroundHighlightedImg from "./assets/background-alt-2-highlighted.png";
// @ts-expect-error
import frogsSpriteImg from "./assets/frogs-sprite.png";
import { Frog } from "./components/Frog";
import { Slot } from "./components/Slot";
import {
	FROGS,
	CORRECT_ORDER,
	SPRITE_SIZE,
	DISPLAY_SIZE,
	SCALE,
} from "./constants";
import type { FrogMelody } from "./types";
import { playFrogMelody, playCompleteTheme } from "./utils/audio";

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

		setSlots((prev) => {
			const newSlots = [...prev];
			// Remove frog from any existing slot
			const existingIndex = newSlots.findIndex(
				(slot) => slot?.id === draggedFrog.id,
			);
			if (existingIndex !== -1) {
				newSlots[existingIndex] = null;
			}

			if (hoveredSlot !== null) {
				// Place frog in new slot (swap if occupied)
				const existingFrog = newSlots[hoveredSlot];
				if (existingFrog && existingIndex !== -1) {
					newSlots[existingIndex] = existingFrog;
				}
				newSlots[hoveredSlot] = draggedFrog;
			}
			return newSlots;
		});

		setDraggedFrog(null);
		setHoveredSlot(null);
	}, [draggedFrog, hoveredSlot]);

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
			className={`game-container ${draggedFrog ? "dragging-active" : ""}`}
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
