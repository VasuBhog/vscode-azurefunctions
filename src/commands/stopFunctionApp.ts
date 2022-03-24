/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SiteClient } from '@microsoft/vscode-azext-azureappservice';
import { IActionContext } from '@microsoft/vscode-azext-utils';
import { ext } from '../extensionVariables';
import { localize } from '../localize';
import { ResolvedFunctionAppResource } from '../tree/ResolvedFunctionAppResource';
import { SlotTreeItemBase } from '../tree/SlotTreeItemBase';

export async function stopFunctionApp(context: IActionContext, node?: SlotTreeItemBase): Promise<SlotTreeItemBase> {
    if (!node) {
        node = await ext.rgApi.tree.showTreeItemPicker<SlotTreeItemBase>(new RegExp(ResolvedFunctionAppResource.productionContextValue), context);
    }

    const client: SiteClient = await node.site.createClient(context);
    await node.runWithTemporaryDescription(
        context,
        localize('stopping', 'Stopping...'),
        async () => {
            await client.stop();
        }
    );
    return node;
}
