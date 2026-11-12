# Pretty TypeScript Errors

Understand TypeScript errors in simple English!

Pretty TypeScript Errors is a Visual Studio Code extension that helps developers understand coding problems without struggling with complicated error messages.

## Features

- **Simple explanations:** Understand selected TypeScript errors in plain English.
- **Problematic code:** See the code line where the problem occurs.
- **Original error messages:** Keep the original diagnostic details available.
- **Live updates:** Refresh the problem list when VS Code detects diagnostic changes.
- **Sidebar integration:** View problems directly inside VS Code.

## How to Use

1. Install Pretty TypeScript Errors.
2. Open your TypeScript project in VS Code.
3. Click the Pretty Errors icon in the Activity Bar.
4. Open the TypeScript Problems view.
5. View your errors, problematic code, and simple explanations.

## Example

**Original error:**

`Type 'number' is not assignable to type 'string'.`

**Simple explanation:**

You assigned a number to a variable that only accepts text.

## Requirements

- Visual Studio Code 1.85.0 or later.
- A project with TypeScript diagnostics available in VS Code.

## Current Limitations

Simple explanations are currently provided for selected error messages. Other errors display a general explanation alongside the original error.

## Feedback and Contributions

Suggestions, bug reports, and contributions are welcome!

## License

MIT