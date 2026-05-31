// Önceki Python benchmark çalışmasından alınan veriler
// Kaynak: benchmark_sonuclar.csv (12 çekirdekli CPU, 3 tekrar ortalaması)
export const benchmarkData = [
  {
    label: "10 MB",
    e2eSeri: 0.51,
    e2eParalel: 2.19,
    e2eSpeedup: 0.23,
    pureSeri: 0.48,
    pureParalel: 2.13,
    pureSpeedup: 0.23,
    chunks: 3,
  },
  {
    label: "50 MB",
    e2eSeri: 2.46,
    e2eParalel: 2.13,
    e2eSpeedup: 1.16,
    pureSeri: 2.46,
    pureParalel: 2.21,
    pureSpeedup: 1.12,
    chunks: 13,
  },
  {
    label: "100 MB",
    e2eSeri: 5.5,
    e2eParalel: 2.86,
    e2eSpeedup: 1.92,
    pureSeri: 5.89,
    pureParalel: 2.66,
    pureSpeedup: 2.21,
    chunks: 26,
  },
  {
    label: "500 MB",
    e2eSeri: 28.65,
    e2eParalel: 6.75,
    e2eSpeedup: 4.25,
    pureSeri: null,
    pureParalel: null,
    pureSpeedup: null,
    chunks: 125,
  },
];

export const systemInfo = {
  cpuCores: 12,
  repeatCount: 3,
  chunkSize: "4 MB",
  algorithm: "zlib (DEFLATE, seviye 6)",
  os: "Windows",
};
