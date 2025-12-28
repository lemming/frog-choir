import { useRef } from "react";
// @ts-expect-error
import frogsSpriteImg from "../assets/frogs-sprite.png";
import { DISPLAY_SIZE, SCALE, SPRITE_SIZE } from "../constants";
import type { FrogMelody } from "../types";

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

export const Frog = ({
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
