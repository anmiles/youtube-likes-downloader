# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [11.1.3](../../tags/v11.1.3) - 2026-02-01
### Changed
- Fix vulnerable dependencies

## [11.1.2](../../tags/v11.1.2) - 2025-11-29
### Changed
- Fix vulnerable dependencies

## [11.1.1](../../tags/v11.1.1) - 2025-07-24
### Changed
- Fix vulnerable dependencies

## [11.1.0](../../tags/v11.1.0) - 2025-06-12
### Added
- New command 'add' to manually add a video into the archive

## [11.0.4](../../tags/v11.0.4) - 2025-06-02
### Changed
- Fixed api property that was optional by mistake

## [11.0.3](../../tags/v11.0.3) - 2025-06-01
### Changed
- Fixed non-displaying errors

## [11.0.2](../../tags/v11.0.2) - 2025-05-24
### Changed
- Fixed path to templates

## [11.0.1](../../tags/v11.0.1) - 2025-05-19
### Changed
- Fixed expecting refresh_token in temporary credentials

## [11.0.0](../../tags/v11.0.0) - 2025-05-18
__(BREAKING) Dropped support for NodeJS 18 (EOL). Minimum required version is now NodeJS 20.__

### Changed
- Migrated to NodeJS 20.19
- Migrated to ESLint V9 flat configs
- Updated dependencies

## [10.0.1](../../tags/v10.0.1) - 2024-03-20
### Changed
- Update dependencies

## [10.0.0](../../tags/v10.0.0) - 2024-03-16
### Changed
- Update eslint config and raise minimum supported NodeJS version to match one in typescript-eslint plugin
- Update .npmignore
- Unify jest.config.js by removing redundant patterns and providing support for both ts and tsx

## [9.0.6](../../tags/v9.0.6) - 2024-02-01
### Changed
- Fix README.md

## [9.0.5](../../tags/v9.0.5) - 2024-02-01
### Changed
- Fix README.md

## [9.0.4](../../tags/v9.0.4) - 2024-01-31
### Changed
- Migrate to GitHub

## [9.0.3](../../tags/v9.0.3) - 2024-01-29
### Changed
- Explicitly specify ignores from .gitignore in .eslintrc.js

## [9.0.2](../../tags/v9.0.2) - 2024-01-19
### Changed
- Update `@anmiles/google-api-wrapper`, `@anmiles/prototypes`

## [9.0.0](../../tags/v9.0.0) - 2024-01-16
### Changed
- Update project configurations
- Update dependencies

## [8.0.0](../../tags/v8.0.0) - 2023-12-04
### Changed
- Append video ID to the end of the filenames

## [7.1.1](../../tags/v7.1.1) - 2023-11-12
### Changed
- Update dependencies

## [7.1.0](../../tags/v7.1.0) - 2023-10-26
### Changed
- Small visual improvements for auth page

## [7.0.0](../../tags/v7.0.0) - 2023-09-12
### Changed
- Move jest extensions to a separate package
- Update dependencies (breaking)

## [6.0.0](../../tags/v6.0.0) - 2023-08-04
### Changed
- Filenames are being validated after downloaded. Non-compatible filenames are being renamed.

## [5.3.1](../../tags/v5.3.1) - 2023-08-06
### Changed
- Update `@anmiles/google-api-wrapper` and use `filterProfiles`

## [5.3.0](../../tags/v5.3.0) - 2023-08-04
### Added
- Ability to specify additional likes file (for videos that can't be acquired via youtube API)

## [5.2.1](../../tags/v5.2.1) - 2023-06-11
### Changed
- Update `@anmiles/google-api-wrapper`

## [5.2.0](../../tags/v5.2.0) - 2023-06-10
### Added
- `npm run update` now will update actual likes playlist with items provided in likes file

## [5.1.3](../../tags/v5.1.3) - 2023-06-01
### Changed
- Update `@anmiles/google-api-wrapper`

## [5.1.2](../../tags/v5.1.2) - 2023-05-31
### Added
- New jest matcher to expect function

## [5.1.1](../../tags/v5.1.1) - 2023-05-31
### Changed
- Update `@anmiles/google-api-wrapper` with breaking change

## [5.1.0](../../tags/v5.1.0) - 2023-05-26
### Changed
- Update `@anmiles/google-api-wrapper` in order to queue authentication in case of concurrent applications

## [5.0.0](../../tags/v5.0.0) - 2023-05-15
### Changed
- Update `@anmiles/logger` with breaking change (removing timestamps for colored logs)

## [4.1.6](../../tags/v4.1.6) - 2023-05-08
### Changed
- Use shared eslint config * explicitly specify ignorePatterns

## [4.1.5](../../tags/v4.1.6) - 2023-05-08
### Changed
- Move repository
- Use shared eslint config
- Use `@anmiles/logger` instead of old built-in logger
- Cleanup cSpell words
- Fixed changelog

## [4.1.4](../../tags/v4.1.4) - 2023-05-03
### Changed
- Upgraded `@anmiles/google-api-wrapper`

## [4.0.2](../../tags/v4.0.2) - 2023-03-20
### Changed
- Upgraded `@anmiles/google-api-wrapper` to v6.0.0

## [4.0.1](../../tags/v4.0.1) - 2023-03-13

### Changed
- Moved common auth logic to [google-auth-wrapper](https://gitlab.com/anmiles/google-auth-wrapper)
- Changed supported NodeJS version to >=18.14.2
### Removed
- Support of profiles migration

## [3.2.0](../../tags/v3.2.0) - 2022-07-01
### Added
- Restrict old files: application will do nothing and ask to migrate old files if any
### Changed
- Unified codebase with other projects

## [3.1.1](../../tags/v3.1.0) - 2022-07-01
### Added
- Added changelog
- Added CI/CD
### Changed
- Improve types
- Unified codebase with other projects
- Fixed license file to be properly recognized by Gitlab

## [3.0.0](../../tags/v3.0.0) - 2022-06-30
### Changed
- Moved `rimraf` package from `devDependencies` to `dependencies` because it's needed for building

## [2.0.0](../../tags/v2.0.0) - 2022-06-30
### Added
- Introduced multi-profile support
- Added tests and linting
### Changed
- Totally refactored project using typescript
### Removed
- Removed old JS codebase

## [1.0.0](../../tags/v1.0.0) - 2022-04-12
### Added
- Initial commit
