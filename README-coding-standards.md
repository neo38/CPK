# Standardy pro psaní kódu (JavaScript)

__UPOZORNĚNÍ: Toto je pracovní verze dokumentu!!!__

Při psaní JavaScript kódu je třeba následovat [JavaScript Style Guide][2] od [jQuery][1]. Pro základní přehled jsou zde tyto odkazy:

- [Style Guide][4]
- [Code Organization][5]

Obecně výborným zdrojem pro informace o JavaScriptu je [MDN][7] - kvalitní a otestované ukázky, přehledy podpory v prohlížečích atp. Pro věci okolo [Promise][8] se mi výborně osvědčil [tento tutoriál][9] - ale i celý ten web [javascript.info][10] je poměrně kvalitní.

Zde je několik dalších bodů, které by měly být při psaní JavaScriptu dodržovány:

- programátor __nemůže__ svévolně přidat novou externí knihovnu
- programátor __nemůže__ svévolně vkládat JavaScript do _views_
- na celý web __by měl__ být jen jeden handler pro `document.onReady`
- všude, kde to jde, __dávat přednost__ nativním _JS_ prostředkům před [jQuery][1]
- přiřazení handlerů nemá být přímo v HTML, ale __vždy__ prostřednictvím skriptu
- _dlouhodobým cílem je veškerý _JS_ načítat pomocí [RequireJS][11] na jednom místě (na konci stránky)_


## Ukázky z existujících kódů

Následuje sekce opravdu špatných ukázek z existujícího kódu:

### Práce s [poli][6]

První příklad je pokus, jak odstranit určitý prvek z pole objektů:
```javascript
for (var i = 0; i < lastIdpsLength; ++i) {
  var lastIdp = lastIdps[i];
  if (lastIdp.name === idp.name) {
    // Remove yourself
    lastIdps.splice(i, 1);
    break;
  }
};
```
Samozřejmě, že je tam chyba s inkrementem `i`, ale zároveň se tyto věci píšou takto:
```javascript
lastIdpsLength.filter(function( ip ) {
  return ip.name !== idp.name;
});
```
Nebo dokonce takto:
```javascript
lastIdpsLength.filter( ip => { return ip.name !== idp.name; } );
```

Následuje ukázka, jak chtěl někdo zkrátit pole na tři prvky:
```javascript
// Maximally we will have 3 institutions
if (lastIdps.length > 3)
    lastIdps.pop();
```
Nejprve to zjevně předpokládá, že pole bude mít max. 4 prvky, jinak by tam muselo být toto:
```javascript
while ( lastIdps.length > 3 ) {
  lastIdps.pop();
}
```
Ale tak jako tak, to jde napsat takto:
```javascript
lastIdps = lastIdps.slice( 0, 3 );
```

#### Shrnutí

Nebylo by na škodu, aby si všichni prohlédli, jaké vlastně JavaScript nabízí objekty a co všechno tyto objekty umí... tak jako tak totiž platí, že je lépe využívat nativní věci JavaScriptu než na všechno zneužívat jQuery.

Např. pokud chci přidat třídu k elementu u kterého znám ID, tak místo
```javascript
jQuery( "#id_elementu" ).addClass( "nejaka_trida" );
```
__rozhodně musím použít__ toto:
```javascript
document.getElementById( "#id_elementu" ).classList.add( "nejaka_trida" );
```

[1]:https://jquery.com/
[2]:https://contribute.jquery.org/style-guide/js/
[3]:https://learn.jquery.com/code-organization/concepts/
[4]:https://contribute.jquery.org/style-guide/
[5]:https://learn.jquery.com/code-organization/
[6]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
[7]:https://developer.mozilla.org/en-US/docs/Web/JavaScript
[8]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[9]:https://javascript.info/promise-chaining
[10]:https://javascript.info/
[11]:http://requirejs.org/