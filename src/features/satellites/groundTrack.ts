// F4.3 — ISS ground-track math (corrected)
//
// The classic ground-track relation for a light circular orbit with inclination i:
//   φ(u)  = asin(sin i · sin u)                      latitude from argument of latitude
//   λ(u)  = Ω0 + atan2(sin u · cos i, cos u)          longitude offset from the node
// The old renderer scaled latitude directly with sin(Δλ) (φ ≈ i · sin(Δλ)), which is
// only exact at i = 90° and sags up to ~8° for the ISS inclination — the curve now
// follows the true Lipschitz relation. The node longitude is solved from the current
// position via the same relation, so the drawn sinusoid anchors exactly on the marker
// (equivalent to taking the node from the satellite's orbital elements at "now", but
// immune to position-API staleness).

export interface IssTrackPoint {
  lat: number;
  lng: number;
}

export const ISS_INCLINATION_DEG = 51.64;

export const DEG_TO_RAD = Math.PI / 180;

const TWO_PI = Math.PI * 2;

/** Normalizes an angle into (-π, π]. */
export const normalizeAngleRad = (angleRad: number): number => {
  const wrapped = angleRad - Math.round(angleRad / TWO_PI) * TWO_PI;
  return Object.is(wrapped, -Math.PI) ? Math.PI : wrapped;
};

/**
 * Argument of latitude (rad) reached when the satellite is at longitude offset
 * `dLngRad` (rad) from the ascending node of its ground-track sinusoid.
 * `tan d = sin u · cos i / cos u` inverted with the correct quadrant for both halves
 * of the orbit (the plain atan branch would fold the southern half of the curve
 * back onto the northern one).
 */
export const argumentOfLatitudeRad = (dLngRad: number, inclinationRad: number): number => {
  const wrapped = normalizeAngleRad(dLngRad);
  const halfTurn = Math.abs(wrapped) > Math.PI / 2 ? Math.PI * Math.sign(wrapped) : 0;
  return Math.atan(Math.tan(wrapped) / Math.cos(inclinationRad)) + halfTurn;
};

/**
 * Ground-track latitude (rad) at longitude offset `dLngRad` (rad) from the node.
 * Exact circular-orbit inverse of `atan2(sin u · cos i, cos u)` — the audit's §4.10
 * replacement for the linear-scale `i · sin(Δλ)` approximation.
 */
export const groundTrackLatitudeRad = (dLngRad: number, inclinationRad: number): number => {
  const u = argumentOfLatitudeRad(dLngRad, inclinationRad);
  return Math.asin(Math.max(-1, Math.min(1, Math.sin(inclinationRad) * Math.sin(u))));
};

/**
 * Ascending-node longitude (rad) of the sinusoid that passes through the current
 * ground position with the given inclination. `movingNorth` selects the argument
 * half of the current orbit leg: `sin u = sin φ / sin i` has two solutions in (0, 2π)
 * and the heading (climbing vs descending) picks the matching one.
 */
export const groundTrackNodeRad = (
  point: IssTrackPoint,
  movingNorth: boolean,
  inclinationRad: number,
): number => {
  const ratio = Math.max(-1, Math.min(1, Math.sin(point.lat * DEG_TO_RAD) / Math.sin(inclinationRad)));
  let u = Math.asin(ratio);
  if (!movingNorth) u = Math.PI - u;
  const dLng = Math.atan2(Math.sin(u) * Math.cos(inclinationRad), Math.cos(u));
  return point.lng * DEG_TO_RAD - dLng;
};
