type GeometryValue = number | null | undefined;

export type BikeGeometry = {
  reach_mm?: GeometryValue;
  stack_mm?: GeometryValue;
  wheelbase_mm?: GeometryValue;
  chainstay_mm?: GeometryValue;
  bb_drop_mm?: GeometryValue;
  head_tube_angle?: GeometryValue;
  seat_tube_angle?: GeometryValue;
  seat_tube_mm?: GeometryValue;
  front_travel_mm?: GeometryValue;
  rear_travel_mm?: GeometryValue;
};

export type GeometryMatchAnalysis = {
  overall: number;
  fit: number;
  handling: number;
  suspension: number;
  differences: {
    reach: number | null;
    stack: number | null;
    wheelbase: number | null;
    chainstay: number | null;
    bbDrop: number | null;
    headAngle: number | null;
    seatAngle: number | null;
    seatTube: number | null;
    frontTravel: number | null;
    rearTravel: number | null;
  };
};

export function analyzeGeometryMatch(
  current: BikeGeometry,
  comparison: BikeGeometry
): GeometryMatchAnalysis {
  const fit = calculateFit(current, comparison);
  const handling = calculateHandling(current, comparison);
  const suspension = calculateSuspension(current, comparison);

  const overall = Math.round(fit * 0.4 + handling * 0.35 + suspension * 0.25);

  return {
    overall,
    fit,
    handling,
    suspension,
    differences: calculateDifferences(current, comparison),
  };
}

function calculateFit(current: BikeGeometry, comparison: BikeGeometry) {
  return average([
    specScore(current.reach_mm, comparison.reach_mm, 20),
    specScore(current.stack_mm, comparison.stack_mm, 20),
    specScore(current.seat_tube_mm, comparison.seat_tube_mm, 35),
  ]);
}

function calculateHandling(current: BikeGeometry, comparison: BikeGeometry) {
  return average([
    specScore(current.wheelbase_mm, comparison.wheelbase_mm, 35),
    specScore(current.chainstay_mm, comparison.chainstay_mm, 15),
    specScore(current.bb_drop_mm, comparison.bb_drop_mm, 12),
    specScore(current.head_tube_angle, comparison.head_tube_angle, 1.2),
    specScore(current.seat_tube_angle, comparison.seat_tube_angle, 1.5),
  ]);
}

function calculateSuspension(current: BikeGeometry, comparison: BikeGeometry) {
  return average([
    specScore(current.front_travel_mm, comparison.front_travel_mm, 25),
    specScore(current.rear_travel_mm, comparison.rear_travel_mm, 25),
  ]);
}

function calculateDifferences(current: BikeGeometry, comparison: BikeGeometry) {
  return {
    reach: diff(current.reach_mm, comparison.reach_mm),
    stack: diff(current.stack_mm, comparison.stack_mm),
    wheelbase: diff(current.wheelbase_mm, comparison.wheelbase_mm),
    chainstay: diff(current.chainstay_mm, comparison.chainstay_mm),
    bbDrop: diff(current.bb_drop_mm, comparison.bb_drop_mm),
    headAngle: diff(current.head_tube_angle, comparison.head_tube_angle),
    seatAngle: diff(current.seat_tube_angle, comparison.seat_tube_angle),
    seatTube: diff(current.seat_tube_mm, comparison.seat_tube_mm),
    frontTravel: diff(current.front_travel_mm, comparison.front_travel_mm),
    rearTravel: diff(current.rear_travel_mm, comparison.rear_travel_mm),
  };
}

function toNumber(value: GeometryValue) {
  if (value === null || value === undefined) return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function specScore(
  current: GeometryValue,
  comparison: GeometryValue,
  tolerance: number
) {
  const currentValue = toNumber(current);
  const comparisonValue = toNumber(comparison);

  if (currentValue === null || comparisonValue === null) {
    return null;
  }

  const difference = Math.abs(currentValue - comparisonValue);

  return Math.max(0, Math.round(100 - (difference / tolerance) * 25));
}

function average(values: Array<number | null>) {
  const validValues = values.filter((value): value is number => value !== null);

  if (validValues.length === 0) return 0;

  return Math.round(
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length
  );
}

function diff(current: GeometryValue, comparison: GeometryValue) {
  const currentValue = toNumber(current);
  const comparisonValue = toNumber(comparison);

  if (currentValue === null || comparisonValue === null) {
    return null;
  }

  return comparisonValue - currentValue;
}