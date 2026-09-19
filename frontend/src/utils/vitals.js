// Vital-sign values are free-text (e.g. "70 kg", "170 cm") so BMI is computed
// on the fly wherever it's displayed rather than stored.
export function calculateBMI(weightRaw, heightRaw) {
  if (!weightRaw || !heightRaw) return null;

  const weightMatch = String(weightRaw).match(/[\d.]+/);
  const heightMatch = String(heightRaw).match(/[\d.]+/);
  if (!weightMatch || !heightMatch) return null;

  const weightKg = parseFloat(weightMatch[0]);
  let heightNum = parseFloat(heightMatch[0]);
  if (!weightKg || !heightNum) return null;

  // Heights are usually entered in cm; treat small values (<=3) as already-metres.
  const heightM = heightNum > 3 ? heightNum / 100 : heightNum;
  if (!heightM) return null;

  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi) || bmi <= 0) return null;
  return Math.round(bmi * 10) / 10;
}
