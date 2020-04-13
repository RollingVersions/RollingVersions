import {ChangeSet} from '../types';

export default function getEmptyChangeSet<T = {}>(): ChangeSet<T> {
  return {
    breaking: [],
    feat: [],
    refactor: [],
    perf: [],
    fix: [],
  };
}
