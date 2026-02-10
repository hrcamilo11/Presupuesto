// Principales bancos de Colombia con sus colores corporativos
export const COLOMBIAN_BANKS = [
  { value: "bancolombia", label: "Bancolombia", color: "#FFD700", gradient: "from-yellow-500 via-yellow-600 to-yellow-700" },
  { value: "davivienda", label: "Davivienda", color: "#E31837", gradient: "from-red-600 via-red-700 to-red-800" },
  { value: "bbva", label: "BBVA Colombia", color: "#004481", gradient: "from-blue-700 via-blue-800 to-blue-900" },
  { value: "banco_de_bogota", label: "Banco de Bogotá", color: "#0066CC", gradient: "from-blue-600 via-blue-700 to-blue-800" },
  { value: "banco_popular", label: "Banco Popular", color: "#00A859", gradient: "from-green-500 via-green-600 to-green-700" },
  { value: "banco_occidente", label: "Banco de Occidente", color: "#003366", gradient: "from-blue-800 via-blue-900 to-indigo-900" },
  { value: "banco_av_villas", label: "Banco AV Villas", color: "#E60012", gradient: "from-red-500 via-red-600 to-red-700" },
  { value: "banco_caja_social", label: "Banco Caja Social", color: "#00A3E0", gradient: "from-cyan-500 via-cyan-600 to-cyan-700" },
  { value: "banco_falabella", label: "Banco Falabella", color: "#00A859", gradient: "from-green-500 via-green-600 to-green-700" },
  { value: "banco_santander", label: "Santander", color: "#EC0000", gradient: "from-red-600 via-red-700 to-red-800" },
  { value: "banco_gnb_sudameris", label: "GNB Sudameris", color: "#003DA5", gradient: "from-blue-700 via-blue-800 to-blue-900" },
  { value: "banco_cooperativo_coopcentral", label: "Coopcentral", color: "#00A859", gradient: "from-green-500 via-green-600 to-green-700" },
  { value: "banco_agrario", label: "Banco Agrario", color: "#00A859", gradient: "from-green-500 via-green-600 to-green-700" },
  { value: "banco_serfinanza", label: "Serfinanza", color: "#003366", gradient: "from-blue-800 via-blue-900 to-indigo-900" },
  { value: "banco_pichincha", label: "Banco Pichincha", color: "#FFD700", gradient: "from-yellow-500 via-yellow-600 to-yellow-700" },
  { value: "banco_citibank", label: "Citibank Colombia", color: "#0066CC", gradient: "from-blue-600 via-blue-700 to-blue-800" },
  { value: "banco_colpatria", label: "Colpatria", color: "#E31837", gradient: "from-red-600 via-red-700 to-red-800" },
  { value: "banco_raizal", label: "Banco Raizal", color: "#003DA5", gradient: "from-blue-700 via-blue-800 to-blue-900" },
  { value: "banco_w", label: "W", color: "#000000", gradient: "from-gray-900 via-gray-800 to-gray-900" },
  { value: "banco_otro", label: "Otro banco", color: "#6B7280", gradient: "from-gray-500 via-gray-600 to-gray-700" },
] as const;

export type BankValue = typeof COLOMBIAN_BANKS[number]["value"];

export function getBankColor(bank: string | null | undefined): string | null {
  if (!bank) return null;
  const bankData = COLOMBIAN_BANKS.find((b) => b.value === bank);
  return bankData?.color || null;
}

export function getBankGradient(bank: string | null | undefined): string | null {
  if (!bank) return null;
  const bankData = COLOMBIAN_BANKS.find((b) => b.value === bank);
  return bankData?.gradient || null;
}
