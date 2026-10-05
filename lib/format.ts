export const km = (n: number | null | undefined) => (n == null || isNaN(n) ? "—" : `${Math.round(n).toLocaleString("en-IN")} km`);
export const litres = (ml: number | null | undefined) => (ml == null || isNaN(ml) ? "—" : `${(ml / 1000).toFixed(2)} L`);
export const inr = (minor: number | null | undefined) =>
  minor == null || isNaN(minor) ? "—" : "₹" + (minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const kmpl1 = (n: number | null | undefined) => (n == null || isNaN(n) ? "—" : `${n.toFixed(1)} km/L`);
export const kmpl2 = (n: number | null | undefined) => (n == null || isNaN(n) ? "—" : `${n.toFixed(2)} km/L`);
export const day = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

