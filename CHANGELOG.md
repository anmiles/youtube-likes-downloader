# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Fixed licence file to be properly recognized by Gitlab

## [3.0.0](../../tags/v3.0.0) - 2022-06-30
### Changed
- Moved `rimraf` package from `devDepencencies` to `dependencies` because it's needed for building

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
