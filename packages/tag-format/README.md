# @rollingversions/tag-format

## API

```ts
export interface PrintTagContext {
  packageName: string;
  oldTagName: string | null;
  versionSchema: readonly string[];
  tagFormat: string | undefined;
}
export declare function printTag(
  version: VersionNumber,
  ctx: PrintTagContext,
): string;

export interface ParseTagContext {
  allowTagsWithoutPackageName: boolean;
  packageName: string;
  versionSchema: readonly string[];
  tagFormat: string | undefined;
}
export declare function parseTag(
  tagName: string,
  ctx: ParseTagContext,
): VersionNumber | null;
```
