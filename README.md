# Kafka Bank – stránka s placeným stažením certifikátu

## Co je v balíčku
- `index.html` – celá stránka (původní Kafka_Bank.html)
- `thanks.html` – stránka „Děkujeme“, na kterou Stripe přesměruje po zaplacení; vykreslí certifikát a nabídne PDF
- `functions/api/certificate.js` – funkce Cloudflare, která u Stripe ověří, že je platba zaplacená, a vrátí jméno, číslo a datum
- `assets/certificate-base.jpg` – čistý podklad certifikátu (bez jména, čísla a data)
- `assets/kb-pdf.js` – malý skript, který z certifikátu složí PDF

## 1. Cloudflare (zdarma)
1. Založ účet na cloudflare.com.
2. Nahraj celou tuto složku do repozitáře na GitHubu (soubory v kořeni repozitáře, ne uvnitř další složky).
3. Workers & Pages → Create → Pages → Connect to Git → vyber repozitář.
   Build command nech prázdný, výstupní složku (build output directory) nastav na `/` nebo ji nech prázdnou.
4. Po nasazení dostaneš adresu `něco.pages.dev`.

## 2. Tajný klíč
Cloudflare → tvůj projekt → Settings → Variables and secrets → přidej **Secret**:
- název: `STRIPE_SECRET_KEY`
- hodnota: omezený klíč ze Stripe (`rk_test_...` pro test, později `rk_live_...`)

Klíč vytvoř ve Stripe → API keys → Create restricted key a nastav jen **Checkout Sessions: Read**.
Po přidání proměnné nasaď projekt znovu (Deployments → Retry deployment), aby se klíč projevil.

## 3. Stripe – platební odkaz
Upravíš v testovacím režimu (sandbox) a pak to zopakuješ v ostrém:
1. Payment Link → přidej **vlastní pole** (custom field), textové, povinné: „Name on the certificate“.
2. After payment → nezobrazovat potvrzovací stránku, ale **přesměrovat na tvou stránku**:
   `https://TVOJE-ADRESA.pages.dev/thanks?session_id={CHECKOUT_SESSION_ID}`
3. Zkus zaplatit testovací kartou 4242 4242 4242 4242 (libovolné datum v budoucnu, libovolný CVC).
4. Zkontroluj, že se po platbě otevře stránka „Děkujeme“ s certifikátem a že jde stáhnout PDF.

Platební odkaz je v `index.html` v proměnné `PAY`. Pokud budeš v ostrém režimu používat jiný odkaz, změň ho tam.

## Poznámky
- Funkce přijme jen zaplacenou platbu v EUR od 9,99 EUR. Když budeš používat slevové kódy, sniž `MIN_AMOUNT` v `functions/api/certificate.js`.
- PDF se skládá v prohlížeči zákazníka. Server ověřuje platbu a dává jméno a číslo, ale technicky zdatný člověk by mohl PDF obejít a vyrobit si vlastní.
- Zákazník si může PDF stáhnout znovu přes stejnou adresu stránky „Děkujeme“.
- Test a ostrý provoz mají každý svůj klíč i svůj platební odkaz.
