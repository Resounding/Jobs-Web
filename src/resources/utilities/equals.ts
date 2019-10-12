export function equals(a:string | null, b:string | null):boolean {
  if(a == null || b == null) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function contains(text:string | null, find:string | null):boolean {
  if(text == null || find == null) return false;
  return text.toLowerCase().indexOf(find.toLowerCase()) !== -1;
}
