/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import * as path from 'path';
import { Uri } from "vscode";
import { ext } from "../../extensionVariables";
import { localize } from '../../localize';
import { cpUtils } from "../../utils/cpUtils";
import { getLocalSettingsFile } from './getLocalSettingsFile';

export async function encryptLocalSettings(context: IActionContext, uri?: Uri): Promise<void> {
    const message: string = localize('selectLocalSettings', 'Select the settings file to encrypt.');
    const localSettingsPath: string = uri ? uri.fsPath : await getLocalSettingsFile(context, message);
    ext.outputChannel.show(true);
    await cpUtils.executeCommand(ext.outputChannel, path.dirname(localSettingsPath), 'func', 'settings', 'encrypt');
}
