/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as assert from 'assert';
import URI from 'vs/base/common/uri';
import { LanguageIdentifier } from 'vs/editor/common/modes';
import { IndentAction } from 'vs/editor/common/modes/languageConfiguration';
import { LanguageConfigurationRegistry } from 'vs/editor/common/modes/languageConfigurationRegistry';
import { ModelServiceImpl } from 'vs/editor/common/services/modelServiceImpl';
import { MockMode } from 'vs/editor/test/common/mocks/mockMode';
import { TestConfigurationService } from 'vs/platform/configuration/test/common/testConfigurationService';
import { NodeList, Block, build } from './../tokenTree';

class MockJSMode extends MockMode {

	private static readonly _id = new LanguageIdentifier('mockJSMode', 3);

	constructor() {
		super(MockJSMode._id);

		this._register(LanguageConfigurationRegistry.register(this.getLanguageIdentifier(), {
			brackets: [
				['(', ')'],
				['{', '}'],
				['[', ']']
			],

			onEnterRules: [
				{
					// e.g. /** | */
					beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
					afterText: /^\s*\*\/$/,
					action: { indentAction: IndentAction.IndentOutdent, appendText: ' * ' }
				},
				{
					// e.g. /** ...|
					beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
					action: { indentAction: IndentAction.None, appendText: ' * ' }
				},
				{
					// e.g.  * ...|
					beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
					action: { indentAction: IndentAction.None, appendText: '* ' }
				},
				{
					// e.g.  */|
					beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
					action: { indentAction: IndentAction.None, removeText: 1 }
				},
				{
					// e.g.  *-----*/|
					beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
					action: { indentAction: IndentAction.None, removeText: 1 }
				}
			]
		}));
	}
}

suite('TokenTree.build', () => {

	let modelService: ModelServiceImpl = null;
	let mode: MockJSMode = null;

	setup(() => {
		modelService = new ModelServiceImpl(null, new TestConfigurationService());
		mode = new MockJSMode();
	});

	teardown(() => {
		modelService.dispose();
		mode.dispose();
	});

	test('nested blocks with empty line', () => {
		let uri = URI.file('test.js');
		const model = modelService.createModel('{\n {\n\n }\n}', mode, uri);
		let tree = build(model);
		assert.ok(tree instanceof NodeList);
		assert.equal((tree as NodeList).children.length, 1);
		assert.ok((tree as NodeList).children[0] instanceof Block);
	});
});
