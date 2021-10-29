import compile from './compile';
import {parse} from './parse';
import {Template} from './types';

let cacheA = new Map<string, Template>();
let cacheB = new Map<string, Template>();
function swapFullCaches() {
  if (cacheA.size > 20) {
    [cacheB, cacheA] = [cacheA, cacheB];
    cacheA.clear();
  }
}
export default function parseTemplate(str: string): Template {
  const cachedA = cacheA.get(str);
  if (cachedA) return cachedA;

  const cachedB = cacheB.get(str);
  if (cachedB) {
    cacheA.set(str, cachedB);
    swapFullCaches();
    return cachedB;
  }

  const fresh = compile(parse(str));
  cacheA.set(str, fresh);
  swapFullCaches();

  return fresh;
}
