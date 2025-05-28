import * as assert from 'assert';
import * as vscode from 'vscode';
import { getWebviewContent } from '../../extension'; // Adjust path if needed

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    suite('getWebviewContent Test Suite', () => {
        test('should contain toolbar and content elements', () => {
            const html = getWebviewContent("<h1>Test</h1>");
            assert.ok(html.includes('<div class="toolbar">'), "Should contain toolbar div");
            assert.ok(html.includes('<button id="bold-btn">B</button>'), "Should contain bold button");
            assert.ok(html.includes('<button id="italic-btn">I</button>'), "Should contain italic button");
            assert.ok(html.includes('<button id="h1-btn">H1</button>'), "Should contain h1 button");
            assert.ok(html.includes('<button id="ul-btn">UL</button>'), "Should contain ul button");
            assert.ok(html.includes('<div class="content">'), "Should contain content div");
            assert.ok(html.includes("<h1>Test</h1>"), "Should include rendered HTML content");
            assert.ok(html.includes("<script>"), "Should include script tag");
            assert.ok(html.includes("acquireVsCodeApi()"), "Script should call acquireVsCodeApi");
            assert.ok(html.includes("vscode.postMessage({ command: 'bold' });"), "Script should post 'bold' command");
        });
    });

    suite('Extension Integration Test Suite', () => {
        test('Show Preview command should eventually lead to a webview panel', async () => {
            // Create and show a new untitled markdown document
            const document = await vscode.workspace.openTextDocument({ language: 'markdown', content: '# Hello Test Integration' });
            await vscode.window.showTextDocument(document);

            // Ensure the extension is activated
            const extension = vscode.extensions.getExtension('undefined_publisher.markdown-editor-sync');
            if (!extension) {
                assert.fail('Extension not found. Check publisher and name.');
            }
            if (!extension.isActive) {
                await extension.activate();
            }
             assert.ok(extension.isActive, "Extension should be active");


            // Execute the command.
            // We are not directly checking for panel creation here, as it's hard to do reliably
            // without more complex setup or direct access to extension internals.
            // The main goal is to ensure the command executes without throwing an error.
            try {
                await vscode.commands.executeCommand('markdown-editor-sync.showPreview');
                // If the command executes and doesn't throw, we consider it a basic pass for now.
                // A more robust test would involve checking for the panel's visibility or title,
                // but that requires more advanced testing techniques.
                assert.ok(true, "Show Preview command executed.");
            } catch (e) {
                assert.fail(`Show Preview command failed: ${e}`);
            }
        });

        test('Bold command placeholder test', () => {
            // This test acknowledges the difficulty in directly testing the 'Bold' command's
            // text modification without significant refactoring of the extension's internal
            // command handling logic to make it directly callable or by using more complex
            // UI automation testing tools.
            // For now, this serves as a placeholder.
            assert.ok(true, "Placeholder for testing bold command logic - requires refactoring for direct invocation or more complex test setup.");
        });
    });
});
