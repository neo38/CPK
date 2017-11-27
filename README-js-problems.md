# CPK/themes/bootstrap3/js

## Souhrn

Níže je seznam problémů s použitým JS, nejprve stručně:

U použitých cizích knihoven jsou tyto potíže:

- použité cizí knihovny jsou **neaktualizované** a některé dokonce z ne úplně dobrých zdrojů (např. [Base64][1])
- použité cizí knihovny jsou **neaktualizovatelné**
- není zřejmé k čemu je která cizí knihovna použita a zda je to vůbec prospěšné

U vlastního JavaScriptu:

- kód je z větší části bez komentářů
- občas jsou použité různé funkce pro stejný úkol

Navrhovaný seznam úprav:


## Nalezené problémy

### Cizí JS knihovny

Typicky problematickou knihovnou je [Bootlint][6], je zastaralá a ani není zřejmé, proč by jsme ji vlastně měli mít natvrdo ve repozitáři a ne jen jako GITem ignorovaný JavaScript použitý pouze pro vývojáře (a i zde je otázka, jestli je to vlastně vhodné) - nevím jak moc se dodržují standardy [Bootstrapu][4], ale myslím, že moc ne.

Špatné je to i s [Bootstrap][4] pluginy, kde u některých ani není zřejmé, jaké jsou verze (např. [bootstrap-datepicker.js][7] a jiné, kde verzi známe, jsou zase beznadějně zastaralé (např. [bootstrap-slider.js][8]). Nebo např. knihovna [cookies.js][9] je okopírovaná z [MDN][10] i když na [GitHub][11] probíhá její stále aktivní vývoj (a je o tom zmínka i na té [MDN][10] stránce).

Jako další případ bych mohl uvést knihovnu [D3.js][13] - je použita pouze v jednom [pohledu][14]

Obecně by se cizí knihovny měly vybírat na základě jednoduchého klíče:

- kolik lidí danou knihovnu používá?
- kdy vyšla poslední verze?
- jak opravují nalezené chyby?
- nenese s sebou závislosti na další knihovny, které dosud nepoužíváme?

Také by se měl vytvořit sestavovací soubor pro celý JS _CPK_ modul - tam by se rovnou přidávaly i závislosti, byli bychom upozorňováni na nové verze, které by se také mohly snadněji otestovat, protože by stačilo v příslušném kontajneru spustit přes [Grunt][2] aktualizaci.

### Vlastní JS kód

Pokud jde o námi napsaný JavaScript kód, tak tam jsou hlavní problémy v zásadě následující:

- nejsou dodržovány žádné standardy pro psaní kódu
- kód je sám o sobě mizerně dokumentovaný
- souborová struktura kódu není zcela přehledná

**Problém je i s tím, že občas je rozsáhlejí JS kód k vidění i v `phtml` souborech, přestože to by se vůbec nemělo dít.**

Z výše uvedeného pak občas vyplývá, že si jeden programátor přidá další funkci na něco, na co tam už funkce je nebo by byla s mírným přepracováním (např. uvedením dalšího volitelného parameteru).

I náš JS kód by měl být zahrnut do sestavovacího souboru pro [Grunt][2] - i kdyby jen pro spuštění nástrojů pro kvalitu kódu a následnou kompresi kódu. Užitečné ale i v některých případech bude, že takto vývojář snadno uvidí závislosti, jak jdou po sobě.

Zároveň by se mělo i dbát na to, aby na serveru nebyly zapomenuté chybové hlášky do konzole prohlížeče - stačí jednoduše použít podmínku `if (CPK.verbose === true) { console.log("..."); }`.

## Navrhované úpravy

Zde je seznam navrhovaných kroků s úpravami, které by stávající stav uvedly do pořádku:

1. zavést standardy pro psaní JS kódu (více viz. [tento dokument][5])
2. zavést nástroj pro správu JS kódů (i [VuFind][12] samotný používá [Grunt][2], takže bych to tak i ponechal, alespoň by nám to v budoucnu mohlo pomoci, kdyby jsme chtěli svůj kód sesynchronizovat s kódem aktuální verze [VuFind][12]
3. provést revizi načítaných knihoven a hlavně je i všechny aktualizovat na poslední existující verze (nebo na poslední použitelné v _CPK_) - [Grunt][2] umožňuje nastavit poslední použitelnou verzi načítané knihovny, takže s tímto není problém.
4. v rámci přehlednosti (ale i výkonů výsledné aplikace) také navrhuju upravit _ZF ViewHelpery_ `headScript`, tak aby vypisoval všechny JS kódy do jediného `<script></script>` tagu a pochopitelně komprimovaný a zároveň používat co nejčastěji i `inlineScript` pro vypsání až před koncem `<body>` tagu - to pozitivně vyhodnocuje __Google__ při [hodnocení rychlosti načítání stránky][14].


[1]:https://github.com/moravianlibrary/CPK/blob/master/themes/bootstrap3/js/vendor/base64.js
[2]:https://gruntjs.com/
[3]:https://jquery.com/
[4]:https://getbootstrap.com/
[5]:https://github.com/moravianlibrary/CPK/blob/bug-776b/README-coding-standards.md
[6]:https://github.com/moravianlibrary/CPK/blob/master/themes/bootstrap3/js/vendor/bootlint.min.js
[7]:https://github.com/moravianlibrary/CPK/blob/master/themes/bootstrap3/js/vendor/bootstrap-datepicker.js
[8]:https://github.com/moravianlibrary/CPK/blob/master/themes/bootstrap3/js/vendor/bootstrap-slider.js
[9]:https://github.com/moravianlibrary/CPK/blob/master/themes/bootstrap3/js/vendor/cookies.js
[10]:https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie/Simple_document.cookie_framework
[11]:https://github.com/madmurphy/cookies.js
[12]:http://vufind.org/
[13]:https://d3js.org/
[14]:https://developers.google.com/speed/pagespeed/insights/?url=https%3A%2F%2Fwww.knihovny.cz&tab=mobile

