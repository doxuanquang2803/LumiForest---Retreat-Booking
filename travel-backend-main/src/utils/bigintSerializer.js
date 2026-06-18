/**
 * Safely converts BigInt values in an object/array to numbers (if safe) or strings.
 * This prevents JSON serialization errors when sending Prisma responses containing BigInts.
 * 
 * @param {*} obj - The object or value to serialize
 * @returns {*} The serialized object or value
 */
function serializeBigInt(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    const num = Number(obj);
    return Number.isSafeInteger(num) ? num : obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  
  if (typeof obj === 'object') {
    if (obj instanceof Date) {
      return obj;
    }
    
    // If the object has a toJSON method, we let it be handled by Express JSON serializer
    if (typeof obj.toJSON === 'function') {
      return obj;
    }

    const serialized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serializeBigInt(obj[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

module.exports = {
  serializeBigInt
};
