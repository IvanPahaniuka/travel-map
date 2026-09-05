# Travel Map

Interactive travel journal built with React, TypeScript, and Leaflet. Each place can include a location, date, gallery, and tracks.

## Data

The app reads travel data from the configured URL in settings. Default is `./data/data.json`.

You can create the `data.json` file and the gallery on any file storage service that lets you share files, such as Cloudflare R2 or similar providers, and either supports CORS configuration or does not enforce it.

Example:

```json
{
  "welcome": {
    "title": { "default": "Travel Map" },
    "message": { "default": "Explore travels around the world." }
  },
  "places": [
    {
      "id": "paris-2023",
      "date": "2023-05-01",
      "title": { "default": "Paris, France" },
      "latitude": 48.8553,
      "longitude": 2.3451,
      "tracks": ["spotify:track:..."],
      "gallery": ["./paris-2023/image.jpg", "./paris-2023/video.mp4"]
    }
  ]
}
```

## Features

- Full-screen map and markers
- Photo/video gallery per place
- Spotify/file track playback
- Optional encrypted data support
- Settings for data URL and encryption key
- Sharing your settings with others
- Localized titles/messages support

## Spotify

If you plan to use Spotify playback, create your own Spotify app in the Spotify Developer Dashboard and replace the client ID in the Spotify module with your app's client ID.

## Deploy and run

This is a static React app. Run `npm run build` and publish the generated output to any static host.

### Build

```bash
npm run build
```

### Run locally

```bash
npm install
npm start
```

Then open the local URL from webpack-dev-server.

### GitHub Pages

1. Push the project to GitHub.
2. In the repository settings, open **Pages**.
3. Set the source to **GitHub Actions**.
4. Push to the main branch and wait for the workflow to finish.
5. Use the published URL from the GitHub Pages settings or Actions output.

This project is ready to be published as a GitHub Pages site without changing the app code.