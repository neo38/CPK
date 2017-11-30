# Standardy pro psaní kódu

__UPOZORNĚNÍ: Toto je pracovní verze dokumentu!!! Není určena ke čtení!!!__

V zásadě přeužijeme základní dokumenty od [jQuery][1] - [JavaScript Style Guide][2] a [Code Organization Concepts][3]. Pro přečtení ovšem nejsou špatné ani ty další na obou rozcestníkových stránkách - [Style Guide][4] a [Code Organization][5].

~~Je zde pouze několik změn, které bych oproti jejich standardům navrhoval:~~

~~Doporučil bych jen jednu výjimku a to používat __místo odsazení tabulátorem mezery__ a to proto, že nám lépe pasují ke stylu použitému v PHP, ale v zásadě je to jedno. Další výjimkou by mohlo být zrušení mezery v závorkách (normální, složené i hranaté) - opět jde o to, že to nepoužíváme nikde jinde, tak by to mohlo být matoucí.~~

## Ukázky z existujících kódů

Následuje sekce opravdu špatných ukázek z existujícího kódu:

### Práce s poli

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
