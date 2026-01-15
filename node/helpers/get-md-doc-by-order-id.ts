import type { MasterData } from '@vtex/api'

import { fetchAllDocuments } from './fetch-all-documents'

/**
 * Entry document from MasterData
 */
interface MasterDataEntry {
  orderFormId?: string
  orderId?: string
  email?: string
  id?: string
}

/**
 * Get a MasterData document by Order ID
 * Searches through all pages of a data entity to find the matching document
 *
 * @param ctx - VTEX Context with MasterData client
 * @param originalOrderId - The order ID to search for
 * @param dataEntity - The MasterData entity to search in (e.g., 'OC', 'OU')
 * @returns The matching document or undefined
 */
export async function getMdDocByOrderId(
  ctx: { clients: { masterdata: MasterData } },
  originalOrderId: string,
  dataEntity: string
): Promise<MasterDataEntry | undefined> {
  const allDocuments = await fetchAllDocuments<MasterDataEntry>(
    ctx.clients.masterdata,
    dataEntity,
    ['orderId', 'orderFormId', 'id', 'email']
  )

  return allDocuments.find((doc) => doc.orderId === originalOrderId)
}
