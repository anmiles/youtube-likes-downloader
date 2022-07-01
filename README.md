# youtube-likes-downloader

Downloads your liked videos onto local drive

----

## IMPORTANT! Migration to v3

*You can skip this section if you clone the repository first time.*

1. **If you have `output` file** - do nothing, it will be deleted
1. **If you have `output` directory**:
    1. Rename `output` to `output2`
    1. Update repository to latest version
    1. Rename `output2` back to `output`
1. **Getting compatible with multi-profile support**
    1. Come up with a profile name that will be used for your named profile
    1. Run `npm run migrate profile` (where `profile` is profile name your chosen).
        - This will rename all profile files into appropriate ones.
        - The command will throw an error if destination files already exist.
        - The command will do nothing if you still didn't have any data
    1. You can add more profiles, see [Adding profiles](#adding-profiles) below.

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

<a name="adding-profiles"></a>
## Adding profiles

This application may work with multiple profiles (download videos liked from multiple youtube accounts).

1. Come up with any profile name you want
1. Execute `npm run create profile`, where `profile` is profile name your came up with
You can create as many profiles as you want.

## Downloading

`npm start` will download all liked videos. It never re-download already download ones, just add newly liked ones.

1. Automatic download by schedule
    - Run `npm run login` to explicitly retrieve all credentials in advance
    - Schedule task that will run `npm start` periodically
1. Manual download
    - Run `npm start` manually. If needed, it will interact with you to retrieve credentials. But you still could run `npm run login` to explicitly retrieve all credentials in advance.
