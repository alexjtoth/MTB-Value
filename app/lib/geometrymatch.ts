type GeometryValue = number | null | undefined;

type GeometryInput = {
  reach_mm?: GeometryValue;
  stack_mm?: GeometryValue;
  wheelbase_mm?: GeometryValue;
  chainstay_mm?: GeometryValue;
  bb_drop_mm?: GeometryValue;
  head_tube_angle?: GeometryValue;
  seat_tube_angle?: GeometryValue;
  fork_travel_mm?: GeometryValue;
  front_travel_mm?: GeometryValue;
  rear_travel_mm?: GeometryValue;
};

const geometryRules = {
  reach: {
    key: "reach_mm",
    tolerance: 15,
    weight: 0.24,
  },
  stack: {
    key: "stack_mm",
    tolerance: 15,
    weight: 0.16,
  },
  wheelbase: {
    key: "wheelbase_mm",
    tolerance: 25,
    weight: 0.14,
  },
  chainstay: {
    key: "chainstay_mm",
    tolerance: 10,
    weight: 0.08,
  },
  bbDrop: {
    key: "bb_drop_mm",
    tolerance: 10,
    weight: 0.05,
  },
  headAngle: {
    key: "head_tube_angle",
    tolerance: 1,
    weight: 0.16,
  },
  seatAngle: {
    key: "seat_tube_angle",
    tolerance: 1.5,
    weight: 0.08,
  },
  rearTravel: {
    key: "rear_travel_mm",
    tolerance: 20,
    weight: 0.09,
  },
} as const;

export function geometryMatchScore(
  current: GeometryInput,
  other: GeometryInput
) {
  let weightedScore = 0;
  let totalWeight = 0;

  (
    Object.values(geometryRules) as Array<{
      key: keyof GeometryInput;
      tolerance: number;
      weight: number;
    }>
  ).forEach((rule) => {
    const currentValue = Number(current[rule.key]);
    const otherValue = Number(other[rule.key]);

    if (!Number.isFinite(currentValue) || !Number.isFinite(otherValue)) {
      return;
    }

    const difference = Math.abs(currentValue - otherValue);

    const specScore = Math.max(
      0,
      100 - (difference / rule.tolerance) * 25
    );

    weightedScore += specScore * rule.weight;
    totalWeight += rule.weight;
  });

  if (totalWeight === 0) return 0;

  return Math.round(weightedScore / totalWeight);
}

export function geometryDifferences(
  current: GeometryInput,
  other: GeometryInput
) {
  return {
    reach: diff(current.reach_mm, other.reach_mm),
    stack: diff(current.stack_mm, other.stack_mm),
    wheelbase: diff(current.wheelbase_mm, other.wheelbase_mm),
    chainstay: diff(current.chainstay_mm, other.chainstay_mm),
    bbDrop: diff(current.bb_drop_mm, other.bb_drop_mm),
    headAngle: diff(current.head_tube_angle, other.head_tube_angle),
    seatAngle: diff(current.seat_tube_angle, other.seat_tube_angle),
    rearTravel: diff(current.rear_travel_mm, other.rear_travel_mm),
  };
}

export function rideDNA(current: GeometryInput, other: GeometryInput) {
  return {
    fit: average([
      specScore(current.reach_mm, other.reach_mm, 15),
      specScore(current.stack_mm, other.stack_mm, 15),
      specScore(current.seat_tube_angle, other.seat_tube_angle, 1.5),
    ]),
    handling: average([
      specScore(current.wheelbase_mm, other.wheelbase_mm, 25),
      specScore(current.chainstay_mm, other.chainstay_mm, 10),
      specScore(current.bb_drop_mm, other.bb_drop_mm, 10),
      specScore(current.head_tube_angle, other.head_tube_angle, 1),
    ]),
    suspension: average([
      specScore(current.rear_travel_mm, other.rear_travel_mm, 20),
    ]),
  };
}

function specScore(
  current: GeometryValue,
  other: GeometryValue,
  tolerance: number
) {
  const currentValue = Number(current);
  const otherValue = Number(other);

  if (!Number.isFinite(currentValue) || !Number.isFinite(otherValue)) {
    return null;
  }

  const difference = Math.abs(currentValue - otherValue);

  return Math.max(0, Math.round(100 - (difference / tolerance) * 25));
}

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) return null;

  return Math.round(
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length
  );
}

function diff(current: GeometryValue, other: GeometryValue) {
  const currentValue = Number(current);
  const otherValue = Number(other);

  if (!Number.isFinite(currentValue) || !Number.isFinite(otherValue)) {
    return null;
  }

  return otherValue - currentValue;
}