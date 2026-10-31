# Grafisk profil: Svart på vitt

Gäller alla Anders appar. Läs den här filen innan en ny app byggs eller en befintlig app ändrar utseende.

## Grundidé

Enkelt och nästan utan färg. Hierarkin kommer från storlek, vikt och linjer, inte från färg, skuggor eller rundade hörn.

## Så används den

Webbappar på `andersekert.github.io`:

```html
<link rel="stylesheet" href="/profil/v1.css">
```

Appar på en annan adress laddar samma fil med hela adressen:

```html
<link rel="stylesheet" href="https://andersekert.github.io/profil/v1.css">
```

Appar som måste fungera utan nät, som Import & Backup, kopierar färger och former till sin egen fil och använder Mac-appens systemtypsnitt om Hanken Grotesk inte finns.

## Färger

| Namn | Ljust | Mörkt | Till |
|---|---|---|---|
| `--ink` | `#111111` | `#f2f2f2` | Text, knappar, inmatningsfält, listans första linje |
| `--ink-soft` | `#5e5e5e` | `#a6a6a6` | Sekundär text |
| `--line` | `#e4e4e4` | `#333333` | Tunna linjer |
| `--paper` | `#ffffff` | `#111111` | Bakgrund |

Ingen accentfärg. Rött, grönt eller annan färg används bara när den bär information, till exempel ett felmeddelande. Bilder får ha sina egna färger.

## Typsnitt

Hanken Grotesk i tre vikter: 400 brödtext, 500 etiketter, 700 rubriker och knappar. Siffror är tabulära, så tidkoder och kolumner står rakt.

## Former

- Inga rundade hörn och inga skuggor.
- Knappar är fyllda i `--ink`. Bara en huvudknapp per vy.
- Klickytor är minst 44 px höga.

## Delar i `v1.css`

| Klass | Till |
|---|---|
| `.e-page` | Sidans ram |
| `.e-top`, `.e-mark` | Toppraden: `ekert / Appens namn` till vänster, till exempel Logga ut till höger |
| `.e-list`, `.e-row` | Listor |
| `.e-app`, `.e-icon` | Rad med liten ikon, ritad med tunna linjer |
| `.e-section` | Avdelning med rubrik ovanför en lista |
| `.e-field` | Etikett med inmatningsfält |
| `.e-button` | Huvudknapp |
| `.e-muted` | Sekundär text |

## Regler

- **Versioner:** ändra aldrig `v1.css` så att en befintlig app kan gå sönder. Större ändringar blir `v2.css`, och varje app byter när den är redo.
- **Lagring:** appar på `andersekert.github.io` delar `localStorage`. Varje nyckel börjar med appens namn, till exempel `fotokurs:session`. Lagra inga inloggningsuppgifter där i nya appar.
- **Startsidan:** en ny app läggs till i listan i `index.html`. En app som inte är klar står under På gång, utan länk.
- **Startsidan är låst:** `index.html` är krypterad med lösenord. Ändra den så här: `node verktyg/startsida.mjs oppna` (ger `startsida.html`), redigera, `node verktyg/startsida.mjs las`. Checka aldrig in `startsida.html`.
