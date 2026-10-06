import { computeMileage, type Entry } from "../lib/mileage";
import assert from "node:assert";

const near = (a: number | null, b: number) => assert.ok(a != null && Math.abs(a - b) < 0.005, `${a} != ${b}`);
let n = 0;
const e = (o: number, l: number, amt: number | null, full: boolean, date: string, extra: Partial<Entry> = {}): Entry =>
  ({ id: String(++n), entryAt: new Date(date), odometerKm: o, fuelMl: l * 1000, totalAmountMinor: amt, fullTank: full, kind: "refill", ...extra });
const scooter = { vehicleType: "scooter" as const, initialOdometerKm: 24500 };

// F1
const f1 = computeMileage(scooter, [e(24720, 5, 52000, true, "2027-01-15"), e(24950, 5.2, 54600, true, "2027-01-28"), e(25180, 4.8, 50640, true, "2027-02-10")]);
near(f1.averageKmpl, 46.0); near(f1.bestKmpl, 47.92); near(f1.worstKmpl, 44.23);
assert.equal(f1.verifiedKm, 460); assert.equal(f1.trackedKm, 680);
near(f1.costPerKmMinor! / 100, 2.29); assert.equal(f1.totalSpendMinor, 157240);

// F2 partials between fulls
const f2 = computeMileage(scooter, [e(24500, 5, null, true, "2027-01-01"), e(24700, 3, null, false, "2027-01-02"), e(24850, 2, null, false, "2027-01-03"), e(25000, 5, null, true, "2027-01-04")]);
assert.equal(f2.segments.length, 1); near(f2.averageKmpl, 50.0);

// F3 unknown start
const f3 = computeMileage(scooter, [e(24700, 3, null, false, "2027-01-01"), e(24850, 2, null, false, "2027-01-02"), e(25000, 5, null, true, "2027-01-03"), e(25230, 5.1, null, true, "2027-01-04")]);
near(f3.averageKmpl, 45.10); assert.equal(f3.status["1"] ?? "unanchored", "unanchored");

// F4 missed fill -> needs review, excluded
const f4 = computeMileage(scooter, [e(25000, 5, null, true, "2027-01-01"), e(25500, 5.6, null, true, "2027-01-02")]);
assert.equal(f4.segments[0].flag, "implausible_high"); assert.equal(f4.averageKmpl, null);

// F4 with acknowledgment -> included
const f4ack = computeMileage(scooter, [e(25000, 5, null, true, "2027-01-01"), e(25500, 5.6, null, true, "2027-01-02", { acknowledged: true })]);
assert.equal(f4ack.segments[0].flag, "implausible_high");
assert.equal(f4ack.segments[0].included, true);
near(f4ack.averageKmpl, 89.286);

// weighted not mean of ratios
const car = { vehicleType: "car" as const, initialOdometerKm: 0 };
const w = computeMileage(car, [e(1000, 1, null, true, "2027-01-01"), e(1120, 6, null, true, "2027-01-02"), e(1600, 30, null, true, "2027-01-03")]);
near(w.averageKmpl, 16.67);

// odometer reset bridge (AC-O2)
const rs = computeMileage(car, [e(99800, 5, null, true, "2027-01-01"), e(150, 10, null, true, "2027-01-02", { odometerReset: { previousFinalKm: 99999, newStartKm: 0 } })]);
assert.equal(rs.segments[0].distanceKm, 349);

// Petrol price standard default Rs 102/L with entry-specific overrides (User scenario: 200@102, 300@120, 400@102)
const heroSplendor = { vehicleType: "motorcycle" as const, initialOdometerKm: 1000 };
// Entry 1: 200 Rs (no price -> 102) -> 200 / 102 * 1000 = 1961 ml (1.961 L)
// Entry 2: 300 Rs (custom price 120 -> 2.500 L = 2500 ml) -> 2.500 L
// Entry 3: 400 Rs (no price -> 102) -> 400 / 102 * 1000 = 3922 ml (3.922 L)
const multiPriceTest = computeMileage(heroSplendor, [
  { id: "e1", entryAt: new Date("2027-04-01"), odometerKm: 1000, fuelMl: null, totalAmountMinor: 20000, fullTank: true, kind: "refill" },
  { id: "e2", entryAt: new Date("2027-04-05"), odometerKm: 1100, fuelMl: 2500, totalAmountMinor: 30000, fullTank: true, kind: "refill" },
  { id: "e3", entryAt: new Date("2027-04-10"), odometerKm: 1300, fuelMl: null, totalAmountMinor: 40000, fullTank: true, kind: "refill" },
]);
// Total fuel volume = 1.961 + 2.500 + 3.922 = 8.383 L
near(multiPriceTest.totalFuelL, 8.383);
assert.equal(multiPriceTest.totalSpendMinor, 90000); // 900 Rs total
assert.equal(multiPriceTest.trackedKm, 300); // 1300 - 1000 = 300 km

console.log("engine tests passed");
