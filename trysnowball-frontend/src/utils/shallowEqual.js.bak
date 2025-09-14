/**
 * Simple shallow equality check for objects
 * Compares primitive values and object references at the first level only
 */
export function shallowEqual(obj1, obj2) {
 if (obj1 === obj2) {
  return true;
 }

 if (!obj1 || !obj2) {
  return false;
 }

 const keys1 = Object.keys(obj1);
 const keys2 = Object.keys(obj2);

 if (keys1.length !== keys2.length) {
  return false;
 }

 for (let key of keys1) {
  if (obj1[key] !== obj2[key]) {
   return false;
  }
 }

 return true;
}

export default shallowEqual;