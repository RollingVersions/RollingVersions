import {ChangeSet} from './ChangeSet';

export default interface Release {
  oldVersion: string | null;
  newVersion: string;
  tagName: string | null;
  changeSet: ChangeSet<{pr: number}>;
}
