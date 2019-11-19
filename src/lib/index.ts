/**
 * Takes a key in the form of a dot-delimited string and iterates over the parts
 * of that key traversing the given object's hierarchy until it gets to the end
 * Returns false if one of the keys is not found. Otherwise it returns the value
 * of the key at the end of the chain.
 * @param ob Can be a set of key value pairs
 * @param key Ex. "my.part.of.the.ob"
 * @return
 */
export function getNestedVal(ob: Record<string,any>, key: string): any {
  if (!key) {return false;}

  const parts = key.split(".");
  let obSoFar = ob;
  let currentKey = parts.shift();
  while (currentKey !== undefined) {
    if (obSoFar.hasOwnProperty(currentKey)) {
      obSoFar = obSoFar[currentKey];
      currentKey = parts.shift();
    }
    else {
      return undefined;
    }
  }
  return obSoFar;
}
