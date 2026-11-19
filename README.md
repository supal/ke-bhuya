# কে ভুয়া? (Ke Bhuya?)

A collection of Bangla pass-and-play party games for Android, built with Expo (React Native):

- **ইমপোস্টার (Imposter):** everyone gets the same secret word except the imposter. Players give one clue each, then vote on who the imposter is.
- **রাজা-মন্ত্রী-চোর-পুলিশ:** 4 players draw secret slips. The Raja reveals himself, then the Police (or Mantri) must find the thief. Points are editable.
- **ডাম্ব শারাডস (Dumb Charades):** 2–4 teams. The actor sees a prompt (proverbs, actions, animals, jobs, food, places) and acts it out against the clock.

- One phone, 3–12 players, works fully offline
- Bangla and English interface
- 6 topics with about 200 words: খাবার, জায়গা, ঘরের জিনিস, পেশা, উৎসব, খেলাধুলা
- 1 or 2 imposters, an optional topic hint for the imposter, a clue timer, and a running scoreboard

## Run it on your phone

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android. Every library used here is included in Expo Go, so you don't need a development build.

This project uses **Expo SDK 58**. If Expo Go from the Play Store says *"Project is incompatible with this version of Expo Go"*, the store version is still on an older SDK. Install the SDK 58 Expo Go from [expo.dev/go](https://expo.dev/go), or skip Expo Go and install a test APK instead:

```bash
eas build -p android --profile preview   # open the build link on your phone to install the APK
```

## Project layout

```
src/
  app/                 Screens (Expo Router)
    _layout.tsx        Fonts, splash screen, game provider, stack
    index.tsx          Home: game list, language switch
    imposter/          setup.tsx, play.tsx (pass → clues → vote → result)
    raja/              setup.tsx, play.tsx (deal → showdown → result → winner)
    charades/          setup.tsx, play.tsx (handover → card → acting → score → winner)
    how-to-play.tsx    Imposter rules
  game/
    engine.ts          Imposter logic (reducer, word picking, scoring)
    GameContext.tsx    Language, Imposter settings and game state
    raja/, charades/   Each game's pure logic (engine.ts) and state provider
  data/words.json      Imposter word lists (Charades also uses jobs, food, places)
  data/charades.json   Charades prompts: proverbs, actions, animals
  i18n/                strings.ts (shared + Imposter), raja.ts, charades.ts
  components/          ui.tsx, game.tsx (shared game pieces), roles.tsx, Icon.tsx
  theme.ts             Colours and fonts
```

### Adding words or a topic

Edit `src/data/words.json`. Each word has `bn` and `en`. A new topic shows up on the setup screen automatically.

### Scoring

- The imposter wins (not caught, or caught but guesses the word): **+2** for each imposter.
- The group wins: **+1** for every other player.

You can change these values in `src/game/engine.ts`.

## Build and publish (EAS)

```bash
npm install -g eas-cli
eas login
eas init                                         # links the project to your Expo account
eas build -p android --profile preview           # APK to install and test
eas build -p android --profile production        # AAB for Google Play
eas submit -p android                            # uploads to the internal testing track
```

- The Android package is `com.supal.kebhuya` (in `app.json`). **It can't be changed after the first Play upload.**
- `versionCode` increments automatically on production builds (`appVersionSource: remote`).

### Building from your phone (no PC)

`.eas/workflows/build-apk.yml` builds a test APK on Expo's servers every time the `release` branch is pushed. One-time setup:

1. ~~Create the Expo project~~ Done: the project ID is in `app.json` (`expo.extra.eas.projectId`).
2. In the project on expo.dev, open **Settings → GitHub** and connect `supal/ke-bhuya`.
3. Push `main` to `release` (`git push origin main:release`). The build appears on expo.dev, and you open its link on your phone to install the APK.

### Publishing on Google Play

Step-by-step checklist, listing text and graphics: [`store/README.md`](store/README.md). Privacy policy: [`PRIVACY.md`](PRIVACY.md).

Pushing to the `production` branch runs `.eas/workflows/build-production.yml`, which builds the Play Store `.aab`.

## Checks

```bash
npm run typecheck
```
