function toNonExponential(num) {
  num = Number(num);
  const strNum = String(num);
  if (strNum.indexOf('e') === -1) return strNum;
  const m = num.toExponential().match(/\d(?:\.(\d*))?e([+-]\d+)/);
  return num.toFixed(Math.max(0, (m[1] || '').length - Number(m[2])));
}

function getDecimalLen(num) {
  try {
    return toNonExponential(num).split('.')[1].length;
  } catch (f) {
    return 0;
  }
}
 
export function add(a, b) {
  const n1 = getDecimalLen(a);
  const n2 = getDecimalLen(b);
  const n = Math.pow(10, Math.max(n1, n2));
 
  return (mul(a, n) + mul(b, n)) / n;
}

export function sub(a, b) {
  return add(a, -b);
}

export function mul(a, b) {
  const decimalLen = getDecimalLen(a) + getDecimalLen(b);
  const e = Math.pow(10, decimalLen);
  const aa = Number(toNonExponential(a).replace('.', ''));
  const bb = Number(toNonExponential(b).replace('.', ''));
 
  return (aa * bb) / e;
}

export function div(a, b) {
  const decimalLen = getDecimalLen(b) - getDecimalLen(a);
  const e = Math.pow(10, decimalLen);
  const aa = Number(toNonExponential(a).replace('.', ''));
  const bb = Number(toNonExponential(b).replace('.', ''));
 
  return e === 1 ? aa / bb : mul(aa / bb, e);
}

export function pow(x, y) {
  if (y >= 0) {
    return Math.pow(x, y);
  } else {
    return Number(Math.pow(x, y).toFixed(-y));
  }
}

export function myToLocaleString(num) {
  if(isNaN(num)){return num};
  
  var str = ''+num;
  if(!/e/i.test(str)){return num;};
  
  return (num).toFixed(18).replace(/\.?0+$/, "");
}