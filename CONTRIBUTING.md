# Contributing

Thanks for helping improve TypoShift.

## Bug reports

Before opening a bug report:

- check whether the issue already exists in the repository
- confirm the problem is reproducible with the current code
- include the browser version and operating system
- mention the exact site or field type where the issue occurs
- if relevant, state whether the text was typed in English, French, or Arabic and the expected conversion

Use the GitHub issue tracker and follow the bug report template when available.

## Feature proposals

Feature requests are welcome when they are grounded in how the extension already works. If you want to propose a change:

- explain the real-world workflow it solves
- describe the current behavior and the expected behavior
- mention any affected keyboard layouts or input types
- consider whether the proposal fits the extension's no-backend, browser-only design

## Local development

This repository is a lightweight browser extension with no build step.

1. Clone the repository:

   ```bash
   git clone https://github.com/M003aad/TypoShift.git
   cd TypoShift
   ```

2. Review the relevant source files:
   - `mappings.js` for keyboard layout data
   - `converter.js` for conversion logic
   - `content.js` for UI and browser integration
   - `styles.js` for popup styling

3. Run the test suite:

   ```bash
   node --test
   ```

4. Load the extension in your browser:
   - open `chrome://extensions/` or `edge://extensions/`
   - enable **Developer mode**
   - click **Load unpacked**
   - select this repository folder

5. Refresh tabs after editing extension files, because Chrome does not re-inject content scripts automatically into existing pages.

## Pull request standards

When submitting a pull request:

- keep the change focused and easy to review
- add or update tests when logic changes
- explain the problem, the fix, and any compatibility considerations
- preserve the extension’s lightweight, browser-only architecture
- confirm the relevant tests still pass with `node --test`

## Code of conduct

This project follows the Contributor Covenant. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).
