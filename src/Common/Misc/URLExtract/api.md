# URLExtract

```js
const URLExtract = require('paraviewweb/src/Common/Misc/URLExtract');
```

## toNativeType(str)

```js
> toNativeType('')
""
> toNativeType(' ')
NaN
> toNativeType(' 4')
4
> toNativeType(' d ')
" d "
> toNativeType(' d')
" d"
> toNativeType(NaN)
NaN
> toNativeType('NaN')
"NaN"
> toNativeType('4.6.7.8')
"4.6.7.8"
> toNativeType('4.678')
4.678
> toNativeType(' 4.678 ')
4.678
> toNativeType(' 4.67 8 ')
" 4.67 8 "
```

## extractURLParameters(castToNativeType = true, query = window.location.search)

```js
const query = '?a=b&c=d%20d&d=5.6&e=true&f=undefined&g';
const strObj = ;
const typeObj = extractURLParameters(true, query);

console.log(extractURLParameters(false, query));
{
  a: 'b',
  c: 'd d',
  d: '5.6',
  e: 'true',
  f: 'undefined',
  g: true
}

console.log(extractURLParameters(true, query));
{
  a: 'b',
  c: 'd d',
  d: 5.6,
  e: true,
  f: undefined,
  g: true
}
```
