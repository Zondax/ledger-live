export const getPath = (path: string): string =>
  path && path.slice(0, 2) !== "m/" ? `m/${path}` : path;

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;
export const isError = (r: { return_code: number; error_message?: string }): void => {
  if (!isNoErrorReturnCode(r.return_code)) throw new Error(`${r.return_code} - ${r.error_message}`);
};
