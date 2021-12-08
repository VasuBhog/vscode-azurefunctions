/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext, TestInput } from 'vscode-azureextensiondev';
import { FuncVersion, ProjectLanguage } from '../../extension.bundle';
import { addParallelSuite, ParallelTest } from '../addParallelSuite';
import { allTemplateSources, runForTemplateSource, shouldSkipVersion } from '../global.test';
import { createAndValidateProject, ICreateProjectTestOptions } from './createAndValidateProject';
import { getCSharpValidateOptions, getCustomValidateOptions, getDotnetScriptValidateOptions, getFSharpValidateOptions, getJavaScriptValidateOptions, getJavaValidateOptions, getPowerShellValidateOptions, getPythonValidateOptions, getTypeScriptValidateOptions } from './validateProject';

interface CreateProjectTestCase extends ICreateProjectTestOptions {
    description?: string;
}

const testCases: CreateProjectTestCase[] = [
    { ...getCSharpValidateOptions('netcoreapp2.1', FuncVersion.v2), inputs: [/2/] },
    { ...getCSharpValidateOptions('netcoreapp3.1', FuncVersion.v3), inputs: [/3/], description: 'netcoreapp3.1' },
    { ...getCSharpValidateOptions('net5.0', FuncVersion.v3), inputs: [/5/], description: 'net5.0 isolated v3' },
    // https://github.com/Azure/azure-functions-tooling-feed/pull/289/files#r697703951
    // { ...getCSharpValidateOptions('net5.0', FuncVersion.v4), inputs: [/5/], description: 'net5.0 isolated v4' },
    { ...getCSharpValidateOptions('net6.0', FuncVersion.v4), inputs: [/6/], description: 'net6.0' },
    { ...getCSharpValidateOptions('net6.0', FuncVersion.v4), inputs: [/6.*isolated/i], description: 'net6.0 isolated' },
    { ...getFSharpValidateOptions('netcoreapp2.1', FuncVersion.v2), inputs: [/2/], isHiddenLanguage: true },
    { ...getFSharpValidateOptions('netcoreapp3.1', FuncVersion.v3), inputs: [/3/], isHiddenLanguage: true },
];

// Test cases that are the same for both v2 and v3
for (const version of [FuncVersion.v2, FuncVersion.v3, FuncVersion.v4]) {
    testCases.push(
        { ...getJavaScriptValidateOptions(true /* hasPackageJson */, version) },
        { ...getTypeScriptValidateOptions(version) },
        { ...getPowerShellValidateOptions(version) },
        { ...getDotnetScriptValidateOptions(ProjectLanguage.CSharpScript, version), isHiddenLanguage: true },
        { ...getDotnetScriptValidateOptions(ProjectLanguage.FSharpScript, version), isHiddenLanguage: true },
    );

    testCases.push({
        ...getPythonValidateOptions('.venv', version),
        inputs: [/3\.6/]
    });

    const appName: string = 'javaApp';
    const javaInputs: (TestInput | string | RegExp)[] = [TestInput.UseDefaultValue, TestInput.UseDefaultValue, TestInput.UseDefaultValue, TestInput.UseDefaultValue, appName];
    if (version !== FuncVersion.v2) { // v2 doesn't support picking a java version
        javaInputs.unshift(/11/);
    }
    testCases.push({
        ...getJavaValidateOptions(appName, version),
        inputs: javaInputs
    });
}

testCases.push({ ...getCustomValidateOptions(FuncVersion.v3) });

const parallelTests: ParallelTest[] = [];
for (const testCase of testCases) {
    for (const source of allTemplateSources) {
        let title = `${testCase.language} ${testCase.version}`;
        if (testCase.description) {
            title += ` ${testCase.description}`;
        }
        title += ` (${source})`;

        parallelTests.push({
            title,
            skip: shouldSkipVersion(testCase.version),
            // lots of errors like "The process cannot access the file because it is being used by another process" 😢
            suppressParallel: [ProjectLanguage.FSharp, ProjectLanguage.CSharp, ProjectLanguage.Java].includes(testCase.language),
            callback: async () => {
                await runWithTestActionContext('createProject', async context => {
                    await runForTemplateSource(context, source, async () => {
                        await createAndValidateProject(context, testCase);
                    });
                });
            }
        })
    }
}

addParallelSuite(parallelTests, {
    title: 'Create New Project',
    timeoutMS: 2 * 60 * 1000
});
