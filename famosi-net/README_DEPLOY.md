# FAMOSI.NET — Cloudflare Pages deploy

## Architettura
- sito statico HTML/CSS/JS
- Pages Function: `functions/api/apply.js`
- endpoint pubblico: `POST /api/apply`
- invio email server-side tramite Resend API
- nessuna API key nel frontend o nel repository

## Variabili Cloudflare richieste
Nel progetto Pages: **Settings → Variables and Secrets**.

- `RESEND_API_KEY` = secret API key Resend
- `MAIL_TO` = `business@gabrieleviola.it`
- `MAIL_FROM` = ad esempio `FAMOSI.NET <apply@famosi.net>`

`MAIL_FROM` deve appartenere a un dominio verificato su Resend.

## Deploy GitHub → Cloudflare Pages
1. Crea un repository GitHub e carica l'intera cartella del progetto.
2. Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
3. Seleziona il repository.
4. Production branch: `main`.
5. Framework preset: None.
6. Build command: lascia vuoto.
7. Build output directory: `.`
8. Salva/deploy.
9. Aggiungi le 3 variabili sopra in Settings → Variables and Secrets.
10. Esegui un nuovo deploy dopo aver aggiunto le variabili.

## Dominio
Collega `famosi.net` da **Custom domains** del progetto Pages.

## Test
- Apri `https://TUO-DOMINIO/api/apply`: deve rispondere con JSON `ok: true`.
- Invia poi una candidatura dal form.
- L'email arriva a `business@gabrieleviola.it`; Reply risponde direttamente all'indirizzo inserito dal candidato.

## Test locale opzionale
Con Wrangler puoi usare una `.dev.vars` locale (mai committarla):

```
RESEND_API_KEY=re_xxx
MAIL_TO=business@gabrieleviola.it
MAIL_FROM=FAMOSI.NET <apply@famosi.net>
```

Poi: `npx wrangler pages dev .`
