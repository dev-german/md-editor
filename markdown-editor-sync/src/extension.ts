import * as vscode from 'vscode';
import * as MarkdownIt from 'markdown-it';

// Export for testing
export function getWebviewContent(htmlContent: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Preview</title>
        <style>
            body { 
                margin: 0; 
                padding: 0; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                font-family: sans-serif; 
            }
            .toolbar {
                padding: 10px;
                background-color: #f0f0f0; /* Light grey background */
                border-bottom: 1px solid #ccc;
                display: flex;
                gap: 5px; /* Spacing between buttons */
                flex-shrink: 0; /* Prevent toolbar from shrinking */
            }
            .toolbar button {
                padding: 5px 10px;
                cursor: pointer;
                border: 1px solid #ddd;
                background-color: #fff;
                border-radius: 3px; /* Slightly rounded corners for buttons */
            }
            .toolbar button:hover {
                background-color: #e9e9e9; /* Light hover effect */
            }
            .content {
                padding: 20px;
                flex-grow: 1; /* Allow content to take available space */
                overflow-y: auto; /* Allow content to scroll if it overflows */
            }
        </style>
    </head>
    <body>
        <div class="toolbar">
            <button id="bold-btn">B</button>
            <button id="italic-btn">I</button>
            <button id="h1-btn">H1</button>
            <button id="ul-btn">UL</button>
            <!-- Add more buttons as needed -->
        </div>
        <div class="content">
            ${htmlContent} <!-- The rendered Markdown goes here -->
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            document.getElementById('bold-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'bold' });
            });
            document.getElementById('italic-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'italic' });
            });
            document.getElementById('h1-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'h1' });
            });
            document.getElementById('ul-btn').addEventListener('click', () => {
                vscode.postMessage({ command: 'ul' });
            });
        </script>
    </body>
    </html>`;
}


export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "markdown-editor-sync" is now active!');

    let currentPanel: vscode.WebviewPanel | undefined = undefined;
    let previewingDocumentUri: vscode.Uri | undefined = undefined;
    const md = new MarkdownIt(); // Initialize MarkdownIt once

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-editor-sync.showPreview', () => {
            const editor = vscode.window.activeTextEditor;

            if (!editor) {
                vscode.window.showInformationMessage('No active editor found.');
                return;
            }

            if (editor.document.languageId !== 'markdown') {
                vscode.window.showErrorMessage('Active file is not a Markdown file.');
                return;
            }

            // If a panel already exists for the current document, just reveal it
            if (currentPanel && previewingDocumentUri && previewingDocumentUri.toString() === editor.document.uri.toString()) {
                currentPanel.reveal(vscode.ViewColumn.Beside);
                return;
            }

            // If a panel exists but for a different document, dispose of the old one
            if (currentPanel) {
                currentPanel.dispose();
            }

            // Create and show a new webview panel
            currentPanel = vscode.window.createWebviewPanel(
                'markdownPreview',
                'Markdown Preview',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true // Keep scripts enabled
                }
            );

            previewingDocumentUri = editor.document.uri;
            const markdownText = editor.document.getText();
            currentPanel.webview.html = getWebviewContent(md.render(markdownText));

            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(
                message => {
                    const activeEditor = vscode.window.activeTextEditor; // Re-acquire active editor
                    if (!activeEditor || activeEditor.document.uri.toString() !== previewingDocumentUri?.toString()) {
                        // Ensure edits apply to the document being previewed
                        return;
                    }

                    switch (message.command) {
                        case 'bold':
                            activeEditor.edit(editBuilder => {
                                const selection = activeEditor.selection;
                                const text = activeEditor.document.getText(selection);
                                if (selection.isEmpty) {
                                    editBuilder.insert(selection.start, '****');
                                } else {
                                    editBuilder.replace(selection, `**${text}**`);
                                }
                            });
                            break; 
                        case 'italic':
                            activeEditor.edit(editBuilder => {
                                const selection = activeEditor.selection;
                                const text = activeEditor.document.getText(selection);
                                if (selection.isEmpty) {
                                    editBuilder.insert(selection.start, '**'); 
                                } else {
                                    editBuilder.replace(selection, `*${text}*`);
                                }
                            });
                            break; 
                        case 'h1':
                            activeEditor.edit(editBuilder => {
                                const line = activeEditor.document.lineAt(activeEditor.selection.start.line);
                                const lineText = line.text;
                                const h1Regex = /^(#+\s*)/;
                                const match = lineText.match(h1Regex);

                                if (match) { 
                                    editBuilder.replace(new vscode.Range(line.lineNumber, 0, line.lineNumber, match[1].length), '# ');
                                } else { 
                                    editBuilder.insert(new vscode.Position(line.lineNumber, 0), '# ');
                                }
                            });
                            break; 
                        case 'ul':
                            activeEditor.edit(editBuilder => {
                                const selections = activeEditor.selections;
                                if (selections.length === 1 && selections[0].isEmpty) {
                                    const line = activeEditor.document.lineAt(activeEditor.selection.active.line);
                                    if (line.text.match(/^\s*\* /)) { 
                                        editBuilder.replace(new vscode.Range(line.lineNumber, 0, line.lineNumber, line.text.indexOf('* ') + 2), '');
                                    } else {
                                        editBuilder.insert(new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex), '* ');
                                    }
                                } else {
                                    for (const selection of selections) {
                                        for (let i = selection.start.line; i <= selection.end.line; i++) {
                                            const line = activeEditor.document.lineAt(i);
                                            if (line.text.match(/^\s*\* /)) {
                                                editBuilder.replace(new vscode.Range(i, 0, i, line.text.indexOf('* ') + 2), '');
                                            } else if (line.text.length > 0 || i === selection.start.line) {
                                                editBuilder.insert(new vscode.Position(i, line.firstNonWhitespaceCharacterIndex), '* ');
                                            }
                                        }
                                    }
                                }
                            });
                            break; 
                    }
                },
                undefined,
                context.subscriptions
            );

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                    previewingDocumentUri = undefined;
                },
                null,
                context.subscriptions
            );
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (currentPanel && previewingDocumentUri && event.document.uri.toString() === previewingDocumentUri.toString()) {
                const newMarkdownText = event.document.getText();
                currentPanel.webview.html = getWebviewContent(md.render(newMarkdownText));
            }
        })
    );
}

export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
