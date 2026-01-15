import type { MasterData } from '@vtex/api'

/**
 * MasterData document with order relation
 */
export interface IOrderRelationDoc {
  orderFormId?: string
  orderId?: string
  id: string
  [key: string]: unknown
}

/**
 * Fetches all documents from a MasterData entity with pagination
 * Handles pagination automatically to retrieve all documents
 *
 * @param masterdata - MasterData client instance
 * @param dataEntity - The data entity to search in
 * @param fields - Fields to retrieve
 * @returns Array of all documents from the entity
 */
export async function fetchAllDocuments<T>(
  masterdata: MasterData,
  dataEntity: string,
  fields: string[]
): Promise<T[]> {
  const allDocuments: T[] = []
  let pageDocuments: T[] = []
  let page = 1

  do {
    allDocuments.push(...pageDocuments)
    pageDocuments = await masterdata.searchDocuments<T>({
      dataEntity,
      fields,
      pagination: {
        page,
        pageSize: 1000,
      },
    })
    page++
  } while (pageDocuments.length > 0)

  return allDocuments
}
