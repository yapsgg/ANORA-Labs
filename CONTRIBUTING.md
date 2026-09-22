# Contributing to ANORA Labs

Thanks for your interest in improving ANORA Labs. This document explains how to
get set up and how to submit changes.

## Development setup

1. Fork and clone the repository.
2. Install dependencies: `npm install`
3. Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```
4. Set up a Convex deployment: `npx convex dev`
5. Start the dev server: `npm run dev`

See the [README](./README.md) for details.

## Before you open a pull request

- Run `npm run lint` and `npm run typecheck` — both must pass.
- Run `npm run build` if your change touches routing, config, or Convex
  functions.
- Keep changes focused. One feature or fix per pull request.
- Match the existing code style. Do not add comments unless they clarify
  non-obvious logic.
- Do not commit secrets. `.env*` files are gitignored except
  `.env.example` — update the example file if you add a variable.

## Commit messages

Write short, imperative commit messages (for example,
`add video polling backoff`). Reference an issue when relevant.

## Pull request process

1. Describe the problem and the approach in the PR description.
2. Link any related issues.
3. Respond to review comments. Maintainers may ask for changes before merging.

## Reporting bugs and requesting features

Open a [GitHub issue](https://github.com/yapsgg/anora/issues). Include
reproduction steps, expected behavior, and your environment where relevant.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./LICENSE).
