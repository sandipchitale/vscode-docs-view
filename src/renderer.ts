import marked = require('marked');
import * as vscode from 'vscode';
import { CodeHighlighter } from './codeHighlighter';

export class Renderer {

	private readonly _disposables: vscode.Disposable[] = [];

	private readonly _highlighter: CodeHighlighter;

	public readonly needsRender: vscode.Event<void>;

	constructor() {
		this._highlighter = new CodeHighlighter();
		this._disposables.push(this._highlighter);

		this.needsRender = this._highlighter.needsRender;
	}

	dispose() {
		let item: vscode.Disposable | undefined;
		while ((item = this._disposables.pop())) {
			item.dispose();
		}
	}

	public async render(hovers: readonly vscode.Hover[]): Promise<string> {
		const parts = (hovers)
			.flatMap(hover => hover.contents.map(content => this.getMarkdown(content)))
			.filter(content => content.length > 0);

		if (!parts.length) {
			return '';
		}

		const markdown = parts.join('\n---\n');

		const highlighter = await this._highlighter.getHighlighter();
		return marked(markdown, { highlight: highlighter });
	}


	private getMarkdown(content: vscode.MarkedString): string {
		if (typeof content === 'string') {
			return content;
		}
		// eslint-disable-next-line no-extra-boolean-cast
		else if (!!(content as vscode.MarkdownString).appendCodeblock) { // instanceof not working for some reason?
			return (content as vscode.MarkdownString).value;
		} else {
			const languageMarkdown = content as { language: string; value: string };

			const markdown = new vscode.MarkdownString();
			markdown.appendCodeblock(languageMarkdown.value, languageMarkdown.language);
			return markdown.value;
		}
	}
}
