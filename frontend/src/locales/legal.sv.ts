/*
 * Copyright (c) 2026 FalkenDev
 *
 * This file is part of Grindify.
 *
 * Grindify is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with Grindify. If not, see
 * <https://www.gnu.org/licenses/>.
 */

/*
 * Juridiska texter (integritetspolicy, villkor, juridisk information). Renderas av
 * components/legal/LegalDocument.vue – detta är den enda källan till texterna.
 *
 * Platshållare: {operator}, {email}, {city}, {country}, {backupDays}, {logDays}.
 * Obs: vue-i18n tolkar { } @ $ | som specialtecken – använd dem inte bokstavligt.
 */

export default {
  versionLine: 'Version {version} · Gäller från {date}',
  notConfiguredValue: '[ej konfigurerad]',
  notConfiguredTitle: 'Uppgifter om operatören saknas',
  notConfiguredText:
    'Operatören av den här instansen har inte konfigurerat alla juridiska uppgifter. Värden markerade [ej konfigurerad] måste fyllas i innan tjänsten används i produktion. Saknas: {missing}',

  privacy: {
    title: 'Integritetspolicy',
    sections: [
      {
        title: '1. Personuppgiftsansvarig',
        paragraphs: [
          '{operator} är personuppgiftsansvarig för de personuppgifter som behandlas i den här Grindify-instansen (”Tjänsten”). Kontakt: {email}.',
          'Grindify är programvara med öppen källkod. Den här instansen drivs av {operator}, som bestämmer hur dina uppgifter behandlas.',
        ],
      },
      {
        title: '2. Personuppgifter vi behandlar',
        items: [
          {
            label: 'Kontouppgifter',
            text: 'För- och efternamn, e-postadress, lösenord (lagras endast som en säker hash), profilbild, språk-, enhets- och visningsinställningar.',
          },
          {
            label: 'Inloggning med Google eller GitHub',
            text: 'Om du väljer att logga in med Google eller GitHub tar vi emot och sparar ditt konto-id hos leverantören, ditt namn, din e-postadress och profilbild. Profilbilden laddas ner och lagras på vår server.',
          },
          {
            label: 'Kropps- och hälsouppgifter',
            text: 'Kroppsvikt och viktloggar, längd, målvikt och viktmål, kön, födelsedatum samt progressbilder med tillhörande datum, pose och anteckningar. Vikt, kroppsmått och progressbilder är hälsouppgifter (en särskild kategori av personuppgifter enligt art. 9 GDPR).',
          },
          {
            label: 'Träningsdata',
            text: 'Träningspass, övningar, sessioner, set, repetitioner, vikter, RPE, aktiviteter, scheman, mål, streaks och bilder du laddar upp till egna övningar.',
          },
          {
            label: 'Tekniska uppgifter och säkerhetsuppgifter',
            text: 'Inloggningstider, IP-adress och webbläsare/user agent i säkerhetsloggar samt tekniska serverloggar.',
          },
          {
            label: 'Samtyckesuppgifter',
            text: 'Datum och version för de villkor och den integritetspolicy du har godkänt, samt datum för ditt samtycke till behandling av hälsouppgifter.',
          },
        ],
      },
      {
        title: '3. Ändamål och rättslig grund',
        items: [
          {
            label: 'Tillhandahålla Tjänsten – art. 6.1 b GDPR (avtal)',
            text: 'Skapa och hantera ditt konto, lagra och visa din träningsdata och statistik samt skicka nödvändiga e-postmeddelanden som verifieringskoder och lösenordsåterställning.',
          },
          {
            label: 'Hälsouppgifter – art. 6.1 a och art. 9.2 a GDPR (uttryckligt samtycke)',
            text: 'Kroppsvikt, kroppsmått, målvikt och progressbilder behandlas endast med ditt uttryckliga samtycke, som du lämnar separat. Samtycket är frivilligt: du kan använda Grindify utan det, det är bara funktionerna för vikt, kroppsmått och progressbilder som då inte är tillgängliga. Du kan när som helst ge eller återkalla samtycket under Inställningar utan att resten av ditt konto påverkas.',
          },
          {
            label: 'Säkerhet – art. 6.1 f GDPR (berättigat intresse)',
            text: 'Skydda ditt konto och Tjänsten mot missbruk, till exempel begränsning av inloggningsförsök och säkerhetsloggar.',
          },
          {
            label: 'Rättsliga förpliktelser – art. 6.1 c GDPR',
            text: 'När vi enligt lag måste spara eller lämna ut uppgifter.',
          },
        ],
        after: [
          'Vi använder inte dina uppgifter för reklam, profilering eller analys, och vi säljer dem aldrig.',
        ],
      },
      {
        title: '4. Mottagare och personuppgiftsbiträden',
        items: [
          {
            label: 'Drift (hosting)',
            text: 'Tjänsten och dess databas körs på servrar som drivs av {operator}.',
          },
          {
            label: 'CDN/proxy',
            text: 'Trafiken till Tjänsten kan passera en CDN/proxy-leverantör som operatören använder för att leverera och skydda Tjänsten. Leverantören behandlar då tekniska uppgifter, till exempel din IP-adress, för operatörens räkning. Om leverantören finns utanför EU/EES (till exempel i USA) sker överföringen med stöd av EU–US Data Privacy Framework och/eller EU:s standardavtalsklausuler.',
          },
          {
            label: 'E-post (Resend, USA)',
            text: 'Transaktionella e-postmeddelanden som verifieringskoder och lösenordsåterställning skickas via Resend. Din e-postadress och innehållet i dessa meddelanden överförs till USA med stöd av EU–US Data Privacy Framework och/eller EU:s standardavtalsklausuler.',
          },
          {
            label: 'Google och GitHub (USA)',
            text: 'Endast om du väljer att logga in med Google eller GitHub. Leverantören får då veta att du använder Tjänsten. Deras egna integritetspolicyer gäller för deras behandling.',
          },
          {
            label: 'Administratörer',
            text: 'Tjänstens administratörer kan se kontouppgifter (till exempel namn, e-postadress, registreringsdatum och verifieringsstatus) och aggregerad statistik över hur Tjänsten används. Åtkomsten är begränsad till vad som behövs för att driva och ge support för Tjänsten.',
          },
        ],
      },
      {
        title: '5. Cookies och lokal lagring',
        items: [
          {
            label: 'auth_token (cookie)',
            text: 'En nödvändig httpOnly-cookie som håller dig inloggad. Den kan inte läsas av skript och tas bort när du loggar ut.',
          },
          {
            label: 'Lokal lagring på din enhet',
            text: 'Din inloggningsstatus och grundläggande profil, cachad träningsdata (träningspass, övningar, sessioner) för snabbhet och offlineanvändning samt ditt val av språk och tema. Användardata tas bort från enheten när du loggar ut; språk och tema sparas.',
          },
          {
            label: 'App-cache',
            text: 'Appens filer cachas av en service worker så att appen laddar snabbt och fungerar offline.',
          },
        ],
        after: [
          'Vi använder inga spårnings-, analys- eller reklamcookies. Lagring som är nödvändig för att tillhandahålla Tjänsten kräver inte samtycke, och därför visas ingen cookiebanner.',
        ],
      },
      {
        title: '6. Lagringstid',
        items: [
          { text: 'Dina uppgifter sparas så länge du har ett konto.' },
          {
            text: 'När du raderar ditt konto raderas dina personuppgifter och uppladdade filer (progressbilder, profilbild, övningsbilder) omedelbart.',
          },
          {
            text: 'När du återkallar ditt samtycke till hälsouppgifter raderas dina viktloggar, progressbilder och kroppsmått omedelbart. Ditt konto och din träningsdata finns kvar.',
          },
          {
            text: 'Backuper skrivs över inom {backupDays} dagar, därefter finns raderade uppgifter inte heller kvar i backuperna.',
          },
          { text: 'Säkerhetsloggar sparas i {logDays} dagar.' },
        ],
      },
      {
        title: '7. Dina rättigheter',
        items: [
          {
            label: 'Tillgång och dataportabilitet (art. 15 och 20)',
            text: 'Under Inställningar kan du exportera all din data som en zip-fil med dina uppgifter i JSON-format och dina uppladdade bilder.',
          },
          {
            label: 'Rättelse (art. 16)',
            text: 'Du kan när som helst ändra dina uppgifter under Inställningar.',
          },
          {
            label: 'Radering (art. 17)',
            text: 'Du kan radera ditt konto och all data under Inställningar.',
          },
          {
            label: 'Återkalla samtycke (art. 7.3)',
            text: 'Du kan när som helst återkalla ditt samtycke till hälsouppgifter under Inställningar. Ditt konto fungerar som vanligt; bara funktionerna för hälsodata stängs av. Återkallelsen påverkar inte behandling som skett innan dess.',
          },
          {
            label: 'Begränsning och invändning (art. 18 och 21)',
            text: 'Du kan begära begränsad behandling och invända mot behandling som grundar sig på berättigat intresse.',
          },
        ],
        after: ['Kontakta {email} för att utöva dina rättigheter. Vi svarar inom en månad.'],
      },
      {
        title: '8. Säkerhet',
        paragraphs: [
          'Lösenord lagras som säkra hashar, trafiken är krypterad, inloggningscookien är inte åtkomlig för skript och progressbilder kan bara nås av dig när du är inloggad.',
        ],
      },
      {
        title: '9. Rätt att klaga',
        paragraphs: [
          'Om du anser att dina personuppgifter behandlas i strid med GDPR kan du lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se, telefon 08-657 61 00.',
        ],
      },
      {
        title: '10. Ändringar',
        paragraphs: [
          'Om vi gör väsentliga ändringar i policyn uppdateras versionsnumret och du ombeds granska och godkänna den nya versionen i appen.',
        ],
      },
      {
        title: '11. Kontakt',
        paragraphs: ['Frågor om integritet: {email}.'],
      },
    ],
  },

  terms: {
    title: 'Användarvillkor',
    sections: [
      {
        title: '1. Godkännande',
        paragraphs: [
          'Genom att skapa ett konto och använda Grindify (”Tjänsten”) godkänner du dessa villkor. Om du inte godkänner dem får du inte använda Tjänsten.',
        ],
      },
      {
        title: '2. Tjänsten',
        paragraphs: [
          'Grindify är en träningsapp för att planera träningspass, logga sessioner, följa framsteg och sätta mål. Den här instansen av Tjänsten tillhandahålls av {operator} (”vi”, ”oss”).',
        ],
      },
      {
        title: '3. Konto och säkerhet',
        paragraphs: [
          'Du måste lämna korrekta uppgifter och vara minst 16 år. Du ansvarar för att hålla dina inloggningsuppgifter hemliga och för aktivitet på ditt konto. Meddela oss omedelbart om du misstänker obehörig användning.',
        ],
      },
      {
        title: '4. Dina uppgifter',
        paragraphs: [
          'Du behåller äganderätten till de uppgifter du för in (träningspass, mått, mål med mera). Vi behandlar dem endast för att tillhandahålla Tjänsten till dig, enligt integritetspolicyn. Vi säljer inte dina uppgifter.',
        ],
      },
      {
        title: '5. Innehåll du laddar upp',
        paragraphs: [
          'Du äger de bilder du laddar upp, till exempel progressbilder, profilbilder och övningsbilder. Du ger oss en begränsad, icke-exklusiv rätt att lagra, behandla och visa dem enbart för att tillhandahålla Tjänsten till dig. De publiceras inte, delas inte med andra användare och används inte för marknadsföring, AI-träning eller något annat ändamål.',
          'Du får bara ladda upp innehåll som du har rätt att använda, och det får inte vara olagligt eller inkräkta på andras rättigheter. Innehållet raderas när du tar bort det eller raderar ditt konto.',
        ],
      },
      {
        title: '6. Otillåten användning',
        items: [
          { text: 'Att använda Tjänsten i olagligt syfte' },
          { text: 'Att försöka komma åt andras konton eller system utan behörighet' },
          { text: 'Att störa eller överbelasta Tjänsten' },
          { text: 'Att dela dina inloggningsuppgifter med andra' },
          { text: 'Att skrapa eller hämta ut data från Tjänsten med automatiserade verktyg' },
        ],
      },
      {
        title: '7. Hälsoförbehåll',
        paragraphs: [
          'Grindify är ingen medicinsk tjänst och inget i appen är medicinsk rådgivning. Rådfråga kvalificerad vårdpersonal innan du börjar ett träningsprogram.',
        ],
      },
      {
        title: '8. Öppen källkod',
        paragraphs: [
          'Grindify är fri programvara licensierad under GNU Affero General Public License v3 (AGPL-3.0). Källkoden finns i projektets repository.',
        ],
      },
      {
        title: '9. Ansvarsbegränsning',
        paragraphs: [
          'Tjänsten tillhandahålls ”i befintligt skick” utan garantier. I den utsträckning lagen tillåter ansvarar vi inte för indirekta skador eller följdskador som uppstår av din användning av Tjänsten.',
        ],
      },
      {
        title: '10. Tillgänglighet',
        paragraphs: [
          'Vi garanterar inte oavbruten drift. Vi kan ändra, pausa eller lägga ner Tjänsten, med rimligt varsel när det är möjligt.',
        ],
      },
      {
        title: '11. Uppsägning',
        paragraphs: [
          'Du kan när som helst radera ditt konto under Inställningar. Vi kan stänga av eller avsluta konton som bryter mot villkoren. Uppgifterna raderas då enligt integritetspolicyn.',
        ],
      },
      {
        title: '12. Ändringar av villkoren',
        paragraphs: [
          'Vid väsentliga ändringar uppdateras versionsnumret och du ombeds godkänna de nya villkoren i appen innan du fortsätter använda Tjänsten.',
        ],
      },
      {
        title: '13. Tillämplig lag',
        paragraphs: [
          'Villkoren regleras av svensk lag. Tvingande konsumentskyddsregler i ditt hemland gäller fortfarande.',
        ],
      },
      {
        title: '14. Kontakt',
        paragraphs: ['Frågor om villkoren: {email}.'],
      },
    ],
  },

  imprint: {
    title: 'Juridisk information',
    sections: [
      {
        title: 'Operatör av tjänsten',
        paragraphs: ['{operator}', '{city}, {country}', 'E-post: {email}'],
      },
      {
        title: 'Om tjänsten',
        paragraphs: [
          'Den här Grindify-instansen är en träningstjänst som drivs av {operator}. Grindify i sig är programvara med öppen källkod.',
        ],
      },
      {
        title: 'Tillsynsmyndighet',
        paragraphs: [
          'Integritetsskyddsmyndigheten (IMY), Box 8114, 104 20 Stockholm. imy.se, telefon 08-657 61 00.',
        ],
      },
      {
        title: 'Licens för öppen källkod',
        paragraphs: [
          'Grindify är fri programvara licensierad under GNU Affero General Public License v3 (AGPL-3.0). Källkoden finns i projektets repository.',
        ],
      },
      {
        title: 'Kontakt',
        paragraphs: [
          'För alla frågor, inklusive GDPR-förfrågningar (tillgång, radering, dataportabilitet): {email}.',
        ],
      },
    ],
  },
}
