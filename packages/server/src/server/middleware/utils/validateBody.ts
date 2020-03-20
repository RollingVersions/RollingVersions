import * as t from 'io-ts';
import {Response, Request} from 'express';
// import {PathReporter} from 'io-ts/lib/PathReporter';
import * as fp from 'fp-ts';
import {inspect} from 'util';
import {PullRequestResponse} from '../../../types';
import groupBy from '../../../utils/groupBy';

const RequestBody = t.exact(
  t.type({
    submittedAtCommitSha: t.union([t.string, t.null]),
    packages: t.array(
      t.exact(
        t.type(
          {
            packageName: t.string,
            changes: t.array(
              t.exact(
                t.type(
                  {
                    type: t.union(
                      [
                        t.literal('breaking'),
                        t.literal('feat'),
                        t.literal('refactor'),
                        t.literal('perf'),
                        t.literal('fix'),
                      ],
                      'ChangeType',
                    ),
                    title: t.string,
                    body: t.string,
                  },
                  'ChangeLogEntry',
                ),
              ),
            ),
          },
          'PackagePullChangeLog',
        ),
      ),
    ),
  }),
);

/**
 * This function is just here to check that the `RequestBody` validator
 * accepts all valid values of the appropriate type.
 *
 * @deprecated
 */
export function __encodeTest(value: PullRequestResponse['changeLogState']) {
  RequestBody.encode(value);
}

type ValidationResult =
  | {valid: true; value: PullRequestResponse['changeLogState']}
  | {valid: false; reason: string};

function getErrorPath(c: t.Context): string {
  const rest = c.slice((c[0].type as any)._tag === 'UnionType' ? 2 : 1);
  if (!rest.length) return c[0].key;
  return `${c[0].key}.${getErrorPath(rest)}`;
}
function getErrorPrefix(c: t.Context): {prefix: string; rest: t.Context} {
  const rest = c.slice(1);
  if (!rest.length || (c[0].type as any)._tag === 'UnionType') {
    return {prefix: c[0].key, rest};
  }
  const result = getErrorPrefix(rest);
  return {
    prefix: `${c[0].key}.${result.prefix}`,
    rest: result.rest,
  };
}

function buildErrorTree(
  errors: {e: t.ValidationError; c: t.Context}[],
): string {
  if (errors.length === 1) {
    return `You must pass ${
      errors[0].e.context[errors[0].e.context.length - 1].type.name
    } to ${getErrorPath(errors[0].e.context)} but you passed ${inspect(
      errors[0].e.value,
    )}`;
  }
  // group errors that refer to the same union
  const errorsByUnionPrefix = groupBy(
    errors.map(({e, c}) => ({e, ...getErrorPrefix(c)})),
    ({prefix}) => prefix,
  );

  const errorStrings = [...errorsByUnionPrefix.values()].map((byPath) => {
    // group errors that refer to the same case in the union
    const errorsByUnionCase = groupBy(byPath, ({rest}) =>
      rest.length === 0 ? null : rest[0].key,
    );
    if (errorsByUnionCase.size === 1) {
      return buildErrorTree(byPath.map(({e, rest}) => ({e, c: rest})));
    } else {
      const errorsByFullPath = groupBy(byPath, ({e}) =>
        getErrorPath(e.context),
      );
      if (errorsByFullPath.size === 1) {
        return `You must pass (${byPath
          .map(({e}) => e.context[errors[0].e.context.length - 1].type.name)
          .join(' | ')}) to ${getErrorPath(
          byPath[0].e.context,
        )} but you passed ${inspect(byPath[0].e.value)}`;
      }
      return `You must fix one of these errors:\n\n${[
        ...errorsByUnionCase.values(),
      ]
        .map((es) => buildErrorTree(es.map(({e, rest}) => ({e, c: rest}))))
        .join('\n\n')
        .replace(/^/gm, '  ')}`;
    }
  });
  if (errorStrings.length === 1) {
    return errorStrings[0];
  } else {
    return `You must fix all of these errors:\n\n${errorStrings
      .join('\n\n')
      .replace(/^/gm, '  ')}`;
  }
}
function printError(errors: t.Errors): string {
  return buildErrorTree(errors.map((e) => ({e, c: e.context})));
}
function validate(
  body: unknown,
):
  | {valid: true; value: PullRequestResponse['changeLogState']}
  | {valid: false; reason: string} {
  return fp.either.fold<
    t.Errors,
    PullRequestResponse['changeLogState'],
    ValidationResult
  >(
    (errors: t.Errors) => ({
      valid: false,
      reason: printError(errors),
    }),
    (result: PullRequestResponse['changeLogState']) => ({
      valid: true,
      value: result,
    }),
  )(RequestBody.decode(body));
}

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = validate(req.body);
    if (result.valid) next();
    else res.status(400).send(result.reason + '\n');
  };
}
export function getBody(req: Request): PullRequestResponse['changeLogState'] {
  const result = validate(req.body);
  if (result.valid) return result.value;
  else throw new Error(result.reason);
}
