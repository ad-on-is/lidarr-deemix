import latinize from "latinize";
export function titleCase(str: string) {
  var splitStr = str.toLowerCase().split(" ");
  for (var i = 0; i < splitStr.length; i++) {
    // You do not need to check if i is larger than splitStr length, as your for does that for you
    // Assign it back to the array
    splitStr[i] =
      splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
  }
  // Directly return the joined string
  return splitStr.join(" ");
}

export function normalize(str: string) {
  return latinize(str.toLowerCase());
}

export function removeKeys(obj: any, keys: any) {
  var index;
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      switch (typeof obj[prop]) {
        case "string":
          index = keys.indexOf(prop);
          if (index > -1) {
            delete obj[prop];
          }
          break;
        case "object":
          index = keys.indexOf(prop);
          if (index > -1) {
            delete obj[prop];
          } else {
            removeKeys(obj[prop], keys);
          }
          break;
      }
    }
  }
  return obj;
}
