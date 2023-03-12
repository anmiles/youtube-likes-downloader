# youtube-likes-downloader

Downloads your liked videos onto local drive

----

## Prerequisites

- Have `yt-dlp` installed.
- Be familiar with Google API console and know how to create project with credentials here

## Installation

1. Install dependencies
`npm install`
1. Build
`npm run build`
1. Test everything
`npm test`

## Adding profiles

This application may work with multiple profiles (download videos liked from multiple youtube accounts).

1. Come up with any profile name you want
1. Execute `npm run create profile`, where `profile` is profile name your came up with
You can create as many profiles as you want.

## Authentication

`npm run login` to login into all existing profiles
`npm run login <profile>` to login into selected profile

## Downloading

`npm start` to download all liked videos for all profiles
`npm start <profile>` will download all liked videos for selected profile

This will never re-download already download ones, just add newly liked ones.

1. Automatic download by schedule
    - Schedule task that will run `npm start` periodically
1. Manual download
    - Run `npm start` manually. If needed, it will interact with you to retrieve credentials if you still didn't run `npm run login` in advance
