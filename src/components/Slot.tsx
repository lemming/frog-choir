import { useRef } from "react";
import type { FrogMelody } from "../types";
import { SPRITE_SIZE, DISPLAY_SIZE, SCALE } from "../constants";
// @ts-expect-error
import frogsSpriteImg from "../assets/frogs-sprite.png";

interface SlotProps {
	index: number;
	frog: FrogMelody | null;
	onFrogClick: (frog: FrogMelody) => void;
	onDragStart: (frog: FrogMelody, startX: number, startY: number) => void;
	onDragMove: (x: number, y: number) => void;
	onDragEnd: () => void;
	singingFrogId: string | null;
	isDragging: boolean;
	isDropTarget: boolean;
	slotRef: (el: HTMLDivElement | null) => void;
}

export const Slot = ({
	index,
	frog,
	onFrogClick,
	onDragStart,
	onDragMove,
	onDragEnd,
	singingFrogId,
	isDragging,
	isDropTarget,
	slotRef,
}: SlotProps) => {
	const isDraggingRef = useRef(false);
	const hasMoved = useRef(false);
	const startPos = useRef({ x: 0, y: 0 });

	const handlePointerDown = (e: React.PointerEvent) => {
		if (!frog) return;
		e.preventDefault();
		e.stopPropagation();
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
		if (!isDraggingRef.current || !frog) return;
		isDraggingRef.current = false;
		(e.target as HTMLElement).releasePointerCapture(e.pointerId);
		onDragEnd();
		if (!hasMoved.current) {
			onFrogClick(frog);
		}
	};

	return (
		<div
			ref={slotRef}
			className={`slot ${frog ? "filled" : "empty"} ${isDropTarget ? "drop-target" : ""}`}
			role="button"
			tabIndex={0}
		>
			{frog ? (
				<div
					className={`frog in-slot ${singingFrogId === frog.id ? "singing" : ""} ${isDragging ? "dragging" : ""}`}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							onFrogClick(frog);
						}
					}}
					role="button"
					tabIndex={0}
					style={{ touchAction: "none" }}
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
				<div className="slot-placeholder" />
			)}
		</div>
	);
};
