# Publishing কে ভুয়া? on Google Play

Everything below can be done from a phone browser (Play Console works in Chrome on Android; turn on **Desktop site** if a page is cramped).

## 1. Play Console account

- Sign up at https://play.google.com/console ($25 one-time) and finish identity verification.
- **Personal accounts created after 13 Nov 2023** must run a **closed test with at least 12 testers for 14 days in a row** before they can publish to production (step 6). Organization accounts skip this.

## 2. Create the app

**Home → Create app**

- App name: `কে ভুয়া? বাংলা পার্টি গেম`
- Default language: **Bengali – bn-BD**
- App or game: **Game** · Free or paid: **Free**
- Accept the declarations → **Create app**

## 3. App content (Policy → App content)

| Section | Answer |
| --- | --- |
| Privacy policy | `https://github.com/supal/ke-bhuya/blob/main/PRIVACY.md` |
| App access | All functionality is available without special access |
| Ads | No, my app does not contain ads |
| Content rating | Email + category **Game**. Answer **No** to every question (no violence, sexual content, profanity, drugs, gambling, user interaction or sharing of location). Expect an "Everyone / 3+" style rating. |
| Target audience | **13–15, 16–17, 18+**. Including under-13 adds Google's Families policy requirements. When asked if the app could unintentionally appeal to children, answer honestly. |
| Data safety | **Does your app collect or share any of the required user data types? → No.** (Names and settings stay on the phone, and data that never leaves the device isn't "collected".) Then confirm. |
| Advertising ID | No, the app doesn't use an advertising ID |
| Government app | No |
| Financial features | My app doesn't provide any financial features |
| Health | My app does not have any health features |
| News app | No |

## 4. Store listing

**Grow users → Store presence → Main store listing.** Paste the text from [`LISTING.md`](LISTING.md) and upload the files in [`graphics/`](graphics/). Then **Store settings**: category **Game → Word**, plus your contact email.

## 5. Build and upload the first release

1. Push to the `production` branch (or ask Claude: "make a Play Store build"). `.eas/workflows/build-production.yml` builds an `.aab` on expo.dev.
2. When it finishes, open the build on expo.dev and **download the .aab**.
3. Play Console → **Test and release → Testing → Internal testing → Create new release**.
   - Accept **Play App Signing** (Google keeps the app signing key; the EAS key becomes your upload key).
   - Upload the `.aab`, add release notes (e.g. `প্রথম সংস্করণ`), **Next → Save and publish**.
4. Add yourself as a tester (create an email list) and install it from the opt-in link to check the Play version.

## 6. Closed test (personal accounts only)

1. **Testing → Closed testing → Create track** (or use the default **Alpha**).
2. **Testers:** create an email list with **at least 12 Gmail addresses**. Add a few extra in case someone drops out.
3. Create a release on that track with the same `.aab` (**Add from library**), then **Save and publish**.
4. Send testers the **opt-in link** from the Testers tab. Each one must tap **Become a tester**, then install from Play.
5. Keep them opted in for **14 consecutive days**. Ask them to actually play and leave feedback; Google asks about it.
6. **Dashboard → Apply for production** and answer the questions about your test.

## 7. Production

**Production → Create new release → Add from library** (or upload a newer `.aab`) → **Countries: Bangladesh** (add others if you like) → **Send for review**. Review usually takes a few days.

## Later updates

- **Words or JS-only changes:** still need a new build until `expo-updates` is added. Push to `production`, upload the new `.aab` to Production. `versionCode` increases automatically.
- **Automatic upload:** create a Google Cloud service account with access in Play Console → Users and permissions, upload its JSON key in expo.dev → Credentials → Android, then add a `submit` job to `build-production.yml`. `eas.json` already submits to the **internal** track as a **draft**, which Play requires while the app is unpublished.
