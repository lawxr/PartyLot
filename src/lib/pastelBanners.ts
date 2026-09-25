const pastelGradients = [
  'linear-gradient(135deg, #ffd1dc 0%, #e0bfff 100%)',
  'linear-gradient(135deg, #fff5ba 0%, #ffd1dc 100%)',
  'linear-gradient(135deg, #b5e8f7 0%, #d4f0fc 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #f8c6e8 100%)',
  'linear-gradient(135deg, #ffd89b 0%, #ffb7b2 100%)',
  'linear-gradient(135deg, #c5f4e0 0%, #d4f0fc 100%)',
  'linear-gradient(135deg, #f6d5f7 0%, #fbe9d7 100%)',
  'linear-gradient(135deg, #fec8d8 0%, #ffd89b 100%)',
  'linear-gradient(135deg, #d0e7f9 0%, #e4c9f7 100%)',
  'linear-gradient(135deg, #fbda61 0%, #ff8fab 100%)',
  'linear-gradient(135deg, #c5dedd 0%, #f5e6e8 100%)',
  'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)',
  'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
  'linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%)',
  'linear-gradient(135deg, #fab1a0 0%, #ffeaa7 100%)',
  'linear-gradient(135deg, #a29bfe 0%, #74b9ff 100%)',
  'linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%)',
  'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
  'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
  'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
];

export function getRandomPastelGradient(): string {
  return pastelGradients[Math.floor(Math.random() * pastelGradients.length)];
}

export function getRandomPastelBanner(): string {
  return getRandomPastelGradient();
}
