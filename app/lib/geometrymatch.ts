export function geometryMatchScore(current: any, other: any) {
  let score = 100;

  score -= differencePenalty(current.reach_mm, other.reach_mm, 0.45, 18);
  score -= differencePenalty(current.stack_mm, other.stack_mm, 0.3, 12);
  score -= differencePenalty(current.wheelbase_mm, other.wheelbase_mm, 0.18, 14);
  score -= differencePenalty(current.chainstay_mm, other.chainstay_mm, 0.45, 10);
  score -= differencePenalty(current.bb_drop_mm, other.bb_drop_mm, 0.35, 8);
  score -= differencePenalty(current.head_tube_angle, other.head_tube_angle, 5, 12);
  score -= differencePenalty(current.seat_tube_angle, other.seat_tube_angle, 3, 8);

  return Math.max(Math.round(score), 0);
}

export function geometryDifferences(current: any, other: any) {
  return {
    reach: diff(current.reach_mm, other.reach_mm),
    stack: diff(current.stack_mm, other.stack_mm),
    wheelbase: diff(current.wheelbase_mm, other.wheelbase_mm),
    chainstay: diff(current.chainstay_mm, other.chainstay_mm),
    bbDrop: diff(current.bb_drop_mm, other.bb_drop_mm),
    headAngle: diff(current.head_tube_angle, other.head_tube_angle),
    seatAngle: diff(current.seat_tube_angle, other.seat_tube_angle),
  };
}

function differencePenalty(
  current: number | null,
  other: number | null,
  multiplier: number,
  maxPenalty: number
) {
  if (current == null || other == null) return 0;

  const difference = Math.abs(Number(current) - Number(other));

  return Math.min(difference * multiplier, maxPenalty);
}

function diff(current: number | null, other: number | null) {
  if (current == null || other == null) return null;

  return Number(other) - Number(current);
}