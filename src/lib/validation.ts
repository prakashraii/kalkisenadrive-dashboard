/** Nepal DoTM plate: ZONE LOT CATEGORY SERIAL — e.g. BA 10 PA 1234, BA 1 CHA 99 */
export const NEPAL_VEHICLE_NUMBER_REGEX =
  /^[A-Z]{2}[\s-]*\d{1,4}[\s-]*[A-Z]{1,3}[\s-]*\d{1,4}$/i

export const NEPAL_VEHICLE_NUMBER_MESSAGE =
  'Enter a valid Nepal vehicle number (e.g. BA 10 PA 1234)'

export function normalizeVehicleNumber(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9\s-]/g, '')
}

/** Prisma `Int` / PostgreSQL INTEGER max (signed 32-bit). */
export const PG_INT_MAX = 2_147_483_647
export const MAX_PRICE_RUPEES = PG_INT_MAX / 100

const priceLimitLabel = new Intl.NumberFormat('en-NP', { maximumFractionDigits: 2 }).format(MAX_PRICE_RUPEES)

export const PRICE_TOO_LARGE_MESSAGE = `Must be at most रू ${priceLimitLabel}`
export const STOCK_TOO_LARGE_MESSAGE = 'Stock is too large'

export function rupeesFitIntCents(rupees: number) {
  return Number.isFinite(rupees) && Math.round(rupees * 100) <= PG_INT_MAX
}
