/** Nepal DoTM plate: ZONE LOT CATEGORY SERIAL — e.g. BA 10 PA 1234, BA 1 CHA 99 */
export const NEPAL_VEHICLE_NUMBER_REGEX =
  /^[A-Z]{2}[\s-]*\d{1,4}[\s-]*[A-Z]{1,3}[\s-]*\d{1,4}$/i

export const NEPAL_VEHICLE_NUMBER_MESSAGE =
  'Enter a valid Nepal vehicle number (e.g. BA 10 PA 1234)'

export function normalizeVehicleNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '')
}
