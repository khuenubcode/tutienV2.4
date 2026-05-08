export const TIME_NAMING = {
  small: ["nhất tức", "trụ hương", "canh giờ"],
  medium: ["ngày", "tuần", "tháng"],
  large: ["năm", "đại vận", "kỷ nguyên"],

  eraNames: [
    "Thanh Minh Kỷ",
    "Huyền Thiên Kỷ",
    "Xích Dương Kỷ",
    "Thái Hư Kỷ",
  ],

  phases: [
    "Thịnh thế",
    "Mạt pháp",
    "Thiên biến",
    "Loạn thế",
  ]
};

export const TIME_UNIT_DAYS: Record<string, number> = {
  "nhất tức": 0, // negligible
  "trụ hương": 1 / 96,
  "canh giờ": 1 / 12,
  "ngày": 1,
  "tuần": 7,
  "tháng": 30,
  "năm": 360,
  "đại vận": 360000, // 1000 years
  "kỷ nguyên": 3600000, // 10000 years
};