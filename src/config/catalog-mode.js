export const TEST_CATALOG_DATASET = "amazon-bestsellers-500";

/**
 * Keep production honest while making the local Data Connect demo usable.
 * An explicit dataset always wins over environment inference.
 */
export function catalogDataset(env = process.env) {
  const explicit = env.ITI_IA_DATASET?.trim();
  if (explicit) return explicit;
  return env.DATA_CONNECT_EMULATOR_HOST || env.FIREBASE_DATA_CONNECT_EMULATOR_HOST
    ? TEST_CATALOG_DATASET
    : "inventory";
}
