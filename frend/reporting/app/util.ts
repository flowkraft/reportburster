export function isTest(): boolean {
  return process.env.TEST === 'true';
}

export function slash(inputPath: string): string {
  if (!inputPath) return inputPath;

  const isExtendedLengthPath = /^\\\\\?\\/.test(inputPath);

  if (isExtendedLengthPath) {
    return inputPath;
  }

  return inputPath.replace(/\\/g, '/');
}
