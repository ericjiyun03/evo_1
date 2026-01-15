export function parseSession(
  result?: [number, number, bigint] | readonly [number, number, bigint]
) {
  if (!result) return undefined;
  return {
    start: result[0],
    end: result[1],
    totalAttended: parseInt(result[2].toString()),
  };
}
