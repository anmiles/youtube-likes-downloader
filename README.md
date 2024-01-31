# youtube-likes-downloader

Download all liked videos from youtube

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
1. Execute `npm run create <profile>`

You can create as many profiles as you want.

## Authentication

`npm run login` to login into all existing profiles
`npm run login <profile>` to login into selected profile

## Downloading

`npm start` to download all liked videos for all profiles
`npm start <profile>` will download all liked videos for selected profile

This will never re-download already download ones, just add newly liked ones.
File names are being checked for validity (and renamed if needed).

1. Automatic download by schedule
    - Schedule task that will run `npm start` periodically
1. Manual download
    - Run `npm start` manually. If needed, it will interact with you to retrieve credentials if you still didn't run `npm run login` in advance

## Validating

`npm run check` to just validate all filenames
`npm run check <profile>` will validate all filenames for selected profile

## Updating

`npm run update` to update likes playlist with videos from likes file
`npm run update <profile>` will update likes playlist for selected profile

Likes are being exported in reversed order because likes playlist is ordered "newest first".
This will never remove redundant likes, only like videos that are still not liked but contained in likes file.
This might be useful for copying likes from one profile to another:
  - run `npm start <profile1>` to get likes imported from selected profile
  - copy likes file to another profile
  - run `npm run update <profile2>` to export likes into another profile
