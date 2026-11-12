# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Saving and resuming puzzles

Progress is saved automatically on this device after each move and when changing
the guide or edge filter. Use **Menu**, then select a puzzle under **Continue a
puzzle** to resume. Saves survive page refreshes and app restarts, including loose
piece positions and connected groups. Each image and difficulty has its own save.

**Restart** replaces progress for the current puzzle only. Saves are local, not
synced between devices; clearing browser/app storage removes them. If saving
fails, the app displays a warning with a retry button.

New puzzles use the bundled images in `assets/images/puzzle`. Older saved puzzles
keep their original Picsum images and still need access to that service.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy-pages.yml` builds and deploys the site
when changes are pushed to `main`. It can also be started manually from the
repository's **Actions** tab.

1. In GitHub, open **Settings → Pages** and set **Build and deployment → Source**
   to **GitHub Actions**. The repository must be eligible for GitHub Pages; for
   example, GitHub Free requires a public repository.
2. Push the workflow and project changes to `main`, or run **Deploy GitHub Pages**
   from the Actions tab after the workflow is on `main`.
3. After the deployment succeeds, open
   `https://arselansultani.github.io/jigsaw/` on the iPad in Safari.

To build the same artifact locally, run `npm ci` followed by
`npm run build:pages`. The output is in `dist/`. The build creates a directory
index for the puzzle route so direct links and refreshes work on GitHub Pages.
Expo's `experiments.baseUrl` is set to `/jigsaw`; change it if the repository
name or hosting path changes. Saved puzzles are local to the browser and do not
transfer from localhost or another URL.


### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
