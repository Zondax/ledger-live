export const getPath = (path: string): string =>
  path && path.slice(0, 2) !== "m/" ? `m/${path}` : path;

export function getPathComponents(path: string): number[] {
  const pathArray = path.split("/");
  if (path.startsWith("m")) {
    pathArray.splice(0, 1);
  }

  const pathElements = pathArray.map(child => {
    const HARDENED = 0x80000000;
    let value = 0;
    if (child.endsWith("'")) {
      value += HARDENED;
      child = child.slice(0, -1);
    }

    const childNumber = Number(child);
    value += childNumber;
    return value;
  });

  return pathElements;
}

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;
export const isError = (r: { return_code: number; error_message?: string }): void => {
  if (!isNoErrorReturnCode(r.return_code)) throw new Error(`${r.return_code} - ${r.error_message}`);
};
