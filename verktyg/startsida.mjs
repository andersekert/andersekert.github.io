// Låser och låser upp startsidan (index.html).
//
// Startsidans innehåll ligger krypterat (AES-GCM, nyckel från lösenordet via
// PBKDF2-SHA256) i index.html. Klartexten ligger i startsida.html, som aldrig
// checkas in (se .gitignore).
//
//   node verktyg/startsida.mjs oppna   index.html  -> startsida.html
//   node verktyg/startsida.mjs las     startsida.html -> index.html
//
// Lösenordet läses från STARTSIDA_LOSEN eller frågas efter i terminalen.
// startsida.html innehåller det som ska stå inuti <main class="e-page">.

import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { webcrypto as crypto } from "node:crypto";

const ITERATIONS = 600000;
const SOURCE = "startsida.html";
const TARGET = "index.html";
const b64 = (buf) => Buffer.from(buf).toString("base64");
const unb64 = (s) => new Uint8Array(Buffer.from(s, "base64"));

async function password() {
  if (process.env.STARTSIDA_LOSEN) return process.env.STARTSIDA_LOSEN;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const p = await rl.question("Lösenord: ");
  rl.close();
  return p;
}

async function deriveKey(pw, salt, iterations) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function lock() {
  const pw = await password();
  if (pw.length < 10) throw new Error("Lösenordet bör ha minst 10 tecken.");
  const plain = readFileSync(SOURCE, "utf8");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pw, salt, ITERATIONS);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const data = { v: 1, iter: ITERATIONS, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  writeFileSync(TARGET, page(JSON.stringify(data)));
  console.log(`Skrev ${TARGET}.`);
}

async function open() {
  const html = readFileSync(TARGET, "utf8");
  const m = html.match(/<script id="lasta-data" type="application\/json">([^<]+)<\/script>/);
  if (!m) throw new Error(`Hittar inget krypterat innehåll i ${TARGET}.`);
  const d = JSON.parse(m[1]);
  const key = await deriveKey(await password(), unb64(d.salt), d.iter);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(d.iv) }, key, unb64(d.ct));
  } catch { throw new Error("Fel lösenord."); }
  writeFileSync(SOURCE, new TextDecoder().decode(plain));
  console.log(`Skrev ${SOURCE}. Kör "las" när du har ändrat klart.`);
}

function page(data) {
  return `<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Ekert: appar</title>
  <link rel="stylesheet" href="profil/v1.css">
</head>
<body>
  <!-- Genererad av verktyg/startsida.mjs. Ändra inte för hand. -->
  <main class="e-page" id="sida">
    <div class="e-top">
      <span class="e-mark">ekert</span>
    </div>

    <h1>Appar</h1>

    <form class="e-section" id="lasform" autocomplete="on">
      <input type="text" name="username" value="startsida" autocomplete="username" hidden>
      <div class="e-field">
        <label for="losen">Lösenord</label>
        <input id="losen" name="password" type="password" autocomplete="current-password" required autofocus>
      </div>
      <button class="e-button" type="submit">Öppna</button>
      <p class="e-muted" id="besked" role="status" aria-live="polite"></p>
    </form>
  </main>

  <script id="lasta-data" type="application/json">${data}</script>
  <script>
    // Innehållet sätts med innerHTML, där skript inte körs, så klicken fångas här.
    // Varje app öppnas i ett eget fönster. Blockeras det gäller länkens target.
    document.addEventListener("click", function (event) {
      var link = event.target.closest("[data-fonster]");
      if (!link || event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      var size = "popup,noopener,width=" + Math.min(1280, screen.availWidth) + ",height=" + Math.min(900, screen.availHeight);
      window.open(link.href, "_blank", size);
    });
    (function () {
      var form = document.getElementById("lasform");
      var besked = document.getElementById("besked");
      var d = JSON.parse(document.getElementById("lasta-data").textContent);
      function unb64(s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); }

      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var knapp = form.querySelector("button");
        knapp.disabled = true;
        besked.textContent = "Öppnar …";
        try {
          var pw = document.getElementById("losen").value;
          var base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
          var key = await crypto.subtle.deriveKey(
            { name: "PBKDF2", hash: "SHA-256", salt: unb64(d.salt), iterations: d.iter },
            base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
          var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(d.iv) }, key, unb64(d.ct));
          document.getElementById("sida").innerHTML = new TextDecoder().decode(plain);
        } catch (err) {
          besked.textContent = "Fel lösenord.";
          knapp.disabled = false;
          document.getElementById("losen").select();
        }
      });
    })();
  </script>
</body>
</html>
`;
}

const cmd = process.argv[2];
try {
  if (cmd === "las") await lock();
  else if (cmd === "oppna") await open();
  else { console.log("Använd: node verktyg/startsida.mjs las | oppna"); process.exit(1); }
} catch (e) { console.error(e.message); process.exit(1); }
