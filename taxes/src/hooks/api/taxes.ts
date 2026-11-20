import { useMemo } from 'react'
import {
  createTaxCall,
  deleteTaxCall,
  getTaxCall,
  listTaxesCall,
  updateTaxCall,
} from '@emporix/api-calls/next'
import { useDashboardContext } from '../../context/Dashboard.context'
import { getApiErrorStatus } from '../../helpers/api'
import { toTaxUpdate, type Tax, type TaxClass } from '../../models/Tax.model'

export type TaxListQuery = {
  readonly pageNumber?: number
  readonly pageSize?: number
  /** Country code filter. */
  readonly countryCode?: string
  /** Native sort, for example `countryCode:ASC`. */
  readonly sort?: string
}

/** The country already has a tax class with this code. */
export class DuplicateTaxClassError extends Error {
  constructor(readonly code: string) {
    super(`Tax class ${code} already exists`)
    this.name = 'DuplicateTaxClassError'
  }
}

/** Tax calls bound to the host tenant. */
export const useTaxesApi = () => {
  const { tenant } = useDashboardContext()

  return useMemo(() => {
    const options = { tenant }

    /** `undefined` when the country has no tax record yet (404). */
    const findTax = async (countryCode: string): Promise<Tax | undefined> => {
      try {
        return await getTaxCall(countryCode, options)
      } catch (e: unknown) {
        if (getApiErrorStatus(e) === 404) return undefined
        throw e
      }
    }

    return {
      /** One page of country tax records. */
      getTaxesPage: (query: TaxListQuery) => listTaxesCall(query, options),
      getTax: (countryCode: string) => getTaxCall(countryCode, options),
      /** Replaces the classes of a loaded record; sends its version. */
      updateTaxClasses: (tax: Tax, taxClasses: TaxClass[]) =>
        updateTaxCall(
          tax.location.countryCode,
          toTaxUpdate(tax, taxClasses),
          options
        ),
      /**
       * Adds a class to its country: the record is looked up by country code,
       * updated when it exists and created when it does not. A code the
       * country already has is rejected before anything is written.
       */
      addTaxClass: async (
        countryCode: string,
        taxClass: TaxClass
      ): Promise<'created' | 'updated'> => {
        const existing = await findTax(countryCode)
        if (!existing) {
          await createTaxCall(
            { location: { countryCode }, taxClasses: [taxClass] },
            options
          )
          return 'created'
        }
        if (existing.taxClasses.some((c) => c.code === taxClass.code)) {
          throw new DuplicateTaxClassError(taxClass.code)
        }
        await updateTaxCall(
          countryCode,
          toTaxUpdate(existing, [...existing.taxClasses, taxClass]),
          options
        )
        return 'updated'
      },
      /**
       * Removes one class from the current record; removing the last one
       * deletes the country's record.
       */
      removeTaxClass: async (
        countryCode: string,
        taxClassCode: string
      ): Promise<void> => {
        const current = await getTaxCall(countryCode, options)
        const remaining = current.taxClasses.filter(
          (c) => c.code !== taxClassCode
        )
        if (remaining.length === 0) {
          await deleteTaxCall(countryCode, options)
          return
        }
        await updateTaxCall(
          countryCode,
          toTaxUpdate(current, remaining),
          options
        )
      },
      deleteTax: (countryCode: string) => deleteTaxCall(countryCode, options),
    }
  }, [tenant])
}
