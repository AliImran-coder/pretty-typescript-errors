
const vscode = require("vscode");

// Explain TypeScript errors in simple English
function explainError(message) {
    if (message.includes("Type 'number' is not assignable to type 'string'")) {
        return "You assigned a number to a variable that only accepts text.";
    }

    if (message.includes("Argument of type 'string' is not assignable to parameter of type 'number'")) {
        return "This function expects a number, but you provided text.";
    }

    if (message.includes("Cannot find name")) {
        return "This variable or name doesn't exist. Check its spelling or declaration.";
    }

    return "TypeScript found a problem in your code. Check the original message for details.";
}

// Get errors from VS Code
async function updateErrors(view) {
    if (!view || !view.visible) return;

    const diagnostics = vscode.languages.getDiagnostics();
    const errors = [];

    for (const [uri, items] of diagnostics) {
        for (const item of items) {
            if (
                item.severity !== vscode.DiagnosticSeverity.Error &&
                item.severity !== vscode.DiagnosticSeverity.Warning
            ) {
                continue;
            }

            let code = "Unable to read this code line.";

            try {
                const document = await vscode.workspace.openTextDocument(uri);
                code = document.lineAt(item.range.start.line).text;
            } catch (error) {
                console.error("Could not read document:", error);
            }

            errors.push({
                file: uri.fsPath.split(/[\\/]/).pop(),
                line: item.range.start.line + 1,
                code,
                message: item.message,
                explanation: explainError(item.message),
                severity:
                    item.severity === vscode.DiagnosticSeverity.Error
                        ? "Error"
                        : "Warning"
            });
        }
    }

    view.webview.postMessage({
        type: "updateErrors",
        errors
    });
}

// Sidebar provider
class PrettyErrorsProvider {
    constructor() {
        this.view = null;
        this.refreshTimer = null;
    }

    resolveWebviewView(webviewView) {
        this.view = webviewView;

        webviewView.webview.options = {
            enableScripts: true
        };

        webviewView.webview.html = this.getHtml();

        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.type === "ready") {
                updateErrors(webviewView);
            }
        });

        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                updateErrors(webviewView);
            }
        });

        webviewView.onDidDispose(() => {
            this.view = null;
        });
    }

    refresh() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        this.refreshTimer = setTimeout(() => {
            if (this.view && this.view.visible) {
                updateErrors(this.view);
            }
        }, 300);
    }

    getHtml() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">

                <style>
                    body {
                        padding: 10px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                    }

                    .error-card {
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 12px;
                    }

                    .file {
                        font-weight: bold;
                        margin-bottom: 8px;
                    }

                    .code {
                        background: var(--vscode-textCodeBlock-background);
                        padding: 10px;
                        border-radius: 5px;
                        overflow-wrap: anywhere;
                        font-family: var(--vscode-editor-font-family);
                    }

                    .original {
                        color: var(--vscode-errorForeground);
                    }

                    .explanation {
                        color: var(--vscode-descriptionForeground);
                    }

                    .label {
                        font-weight: bold;
                    }

                    #count {
                        font-size: 14px;
                        margin-bottom: 15px;
                    }
                </style>
            </head>

            <body>
                <h2>Pretty TypeScript Errors</h2>

                <p id="count">Loading errors...</p>

                <div id="errors"></div>

                <script>
                    const vscode = acquireVsCodeApi();

                    window.addEventListener("message", (event) => {
                        const data = event.data;

                        if (data.type !== "updateErrors") return;

                        const errors = data.errors;
                        const count = document.getElementById("count");
                        const container = document.getElementById("errors");

                        count.textContent = errors.length + " problems found";
                        container.replaceChildren();

                        if (errors.length === 0) {
                            const empty = document.createElement("p");
                            empty.textContent = "No problems found!";
                            container.appendChild(empty);
                            return;
                        }

                        errors.forEach((error) => {
                            const card = document.createElement("div");
                            card.className = "error-card";

                            const file = document.createElement("div");
                            file.className = "file";
                            file.textContent =
                                error.file + " — Line " + error.line +
                                " (" + error.severity + ")";

                            const codeLabel = document.createElement("p");
                            codeLabel.className = "label";
                            codeLabel.textContent = "Problematic code:";

                            const code = document.createElement("pre");
                            code.className = "code";
                            code.textContent = error.code;

                            const originalLabel = document.createElement("p");
                            originalLabel.className = "label";
                            originalLabel.textContent = "Original error:";

                            const original = document.createElement("p");
                            original.className = "original";
                            original.textContent = error.message;

                            const explanationLabel = document.createElement("p");
                            explanationLabel.className = "label";
                            explanationLabel.textContent = "Simple explanation:";

                            const explanation = document.createElement("p");
                            explanation.className = "explanation";
                            explanation.textContent = error.explanation;

                            card.append(
                                file,
                                codeLabel,
                                code,
                                originalLabel,
                                original,
                                explanationLabel,
                                explanation
                            );

                            container.appendChild(card);
                        });
                    });

                    vscode.postMessage({ type: "ready" });
                </script>
            </body>
            </html>
        `;
    }
}

// Activate extension
function activate(context) {
    const provider = new PrettyErrorsProvider();

    const sidebar = vscode.window.registerWebviewViewProvider(
        "prettyErrors.sidebar",
        provider
    );

    // Refresh whenever TypeScript diagnostics change
    const diagnosticListener =
        vscode.languages.onDidChangeDiagnostics(() => {
            provider.refresh();
        });

    // Keyboard shortcut command
   const openPanel = vscode.commands.registerCommand(
    "prettyErrors.openPanel",
    async () => {
        await vscode.commands.executeCommand(
            "workbench.view.extension.prettyErrors"
        );
    }
);

    context.subscriptions.push(
        sidebar,
        diagnosticListener,
        openPanel
    );
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
