# কে ভুয়া? (Ke Bhuya?)

A Bangla pass-and-play party game for Android, built with Expo (React Native). The first game is **Imposter**. Everyone gets the same secret word except the imposter, players take turns giving one clue each, then the group votes on who the imposter is.

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

## Project layout

```
src/
  app/                 Screens (Expo Router)
    _layout.tsx        Fonts, splash screen, game provider, stack
    index.tsx          Home: game list, language switch
    setup.tsx          Players, imposters, topics, hint and timer
    play.tsx           Pass the phone → clues → vote → result and scoreboard
    how-to-play.tsx    Rules
  game/
    engine.ts          Pure game logic (reducer, word picking, scoring)
    GameContext.tsx    Settings (saved with AsyncStorage) and game state
  data/words.json      Word lists: add words or topics here, no code changes needed
  i18n/strings.ts      All Bangla and English text
  components/          Shared UI and icons
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

## Checks

```bash
npm run typecheck
```
