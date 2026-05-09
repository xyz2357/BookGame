import data from '../data/strings.json';

type StringTree = { [key: string]: string | StringTree };

function resolve(path: string): string {
  const keys = path.split('.');
  let node: StringTree | string = data.ui as StringTree;
  for (const k of keys) {
    if (typeof node === 'string') return path;
    node = node[k];
    if (node === undefined) return path;
  }
  return typeof node === 'string' ? node : path;
}

export function t(path: string, vars?: Record<string, string | number>): string {
  let str = resolve(path);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
