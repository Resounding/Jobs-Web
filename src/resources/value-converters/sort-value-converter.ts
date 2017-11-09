const toString = Object.prototype.toString;

export class SortValueConverter {
  toView(array:Array<any>, propertyName:string, direction?:string) {
    if(!array) return 0;

    const factor = direction === 'descending' ? -1 : 1;
    return array
      .slice(0)
      .sort((a, b) => {
        var first = getProp(propertyName, a),
          second = getProp(propertyName, b);

        if(typeof first === 'number' && typeof(second === 'number')) {
          return (first < second ? -1 : 1) * factor;
        }

        if(toString.call(first) === '[object Date]' && toString.call(second) === '[object Date]') {
          return (first < second ? -1 : 1) * factor;
        }

        first = (first || '').toString().toLowerCase();
        second = (second || '').toString().toLowerCase();
        return (first < second ? -1 : 1) * factor;
      });
  }
}

function getProp(dottedPropertyName:string, o:any):any {
  if(o == null) return null;
  
  const parts = dottedPropertyName.split('.'),
    first = parts.shift(),
    propVal = o[first];

  if(typeof propVal === 'undefined') return null;

  return parts.length ? getProp(parts.join('.'), propVal) : propVal;
}