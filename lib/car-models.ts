// Models sold in Thailand, per brand — the sell form picks from these so the same
// car isn't spelled three ways ("Ativ" / "Yaris Ativ" / "yaris ativ"), which would
// split filters and the Price Estimator. Sellers can still type a model that's missing.
// Add new models here as they launch.

export const CAR_MODELS: Record<string, string[]> = {
  Toyota: [
    "Yaris", "Yaris Ativ", "Yaris Cross", "Vios", "Corolla Altis", "Corolla Cross", "Camry",
    "C-HR", "Prius", "Fortuner", "Hilux Revo", "Hilux Vigo", "Hilux Champ", "Hilux Travo",
    "Innova", "Veloz", "Sienta", "Avanza", "Alphard", "Vellfire", "Commuter", "Hiace", "Majesty",
    "Land Cruiser", "GR Yaris", "GR86", "GR Supra", "bZ4X",
  ],
  Honda: [
    "City", "City Hatchback", "Civic", "Accord", "Jazz", "Brio", "Brio Amaze", "HR-V", "CR-V",
    "BR-V", "WR-V", "ZR-V", "Mobilio", "Freed", "Odyssey", "e:N1",
  ],
  Isuzu: ["D-Max", "MU-X", "MU-7", "V-Cross"],
  Ford: ["Ranger", "Ranger Raptor", "Everest", "Fiesta", "Focus", "EcoSport", "Mustang"],
  Mazda: ["2", "3", "CX-3", "CX-30", "CX-5", "CX-8", "CX-60", "BT-50", "MX-5"],
  Mitsubishi: [
    "Mirage", "Attrage", "Xpander", "Xpander Cross", "Triton", "Pajero Sport", "Outlander PHEV",
    "Space Wagon", "Lancer",
  ],
  Nissan: ["Almera", "March", "Note", "Kicks", "Sylphy", "Teana", "Navara", "Terra", "X-Trail", "Juke", "Leaf"],
  Chevrolet: ["Colorado", "Trailblazer", "Captiva", "Cruze", "Sonic", "Spin", "Aveo"],
  Suzuki: ["Swift", "Celerio", "Ciaz", "Ertiga", "XL7", "Carry", "Jimny", "Vitara"],
  Subaru: ["XV", "Crosstrek", "Forester", "Outback", "BRZ", "WRX"],
  BMW: [
    "118i", "218i", "220i", "320d", "330e", "330Li", "520d", "530e", "730Ld",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7", "iX", "iX1", "iX3", "i4", "i7", "Z4",
    "M2", "M3", "M4", "M5",
  ],
  "Mercedes-Benz": [
    "A200", "A35 AMG", "C200", "C220d", "C300e", "C350e", "CLA200", "CLA250 AMG",
    "E200", "E220d", "E300e", "E350e", "S350d", "S580e", "GLA200", "GLC220d", "GLC300e",
    "GLE300d", "EQA", "EQB", "EQE", "EQS", "V-Class",
  ],
  Audi: ["A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7", "Q8", "TT", "e-tron"],
  MG: ["MG3", "MG5", "MG4 Electric", "ZS", "ZS EV", "HS", "HS PHEV", "VS HEV", "Extender", "EP", "Maxus 9", "Cyberster"],
  BYD: ["Atto 3", "Dolphin", "Seal", "Sealion 6", "Sealion 7", "M6"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "S90", "V60", "EX30", "C40"],
  Kia: ["Carnival", "Sorento", "Sportage", "Seltos", "Stonic", "EV6", "EV9"],
  Hyundai: ["H-1", "Staria", "Creta", "Stargazer", "Tucson", "Santa Fe", "Elantra", "Ioniq 5", "Ioniq 6"],
}

// Sorted for display; the catalog above is grouped by type for easier editing
export function modelsForBrand(brand: string): string[] {
  return [...(CAR_MODELS[brand] ?? [])].sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
}
