import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'

/**
 * Company information from ReceitaWS API
 */
export interface ICompanyInfo {
  cnpj: string
  nome: string
  fantasia: string
  situacao: string
  tipo: string
  porte: string
  natureza_juridica: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
  atividade_principal: Array<{ code: string; text: string }>
  data_situacao: string
  capital_social: string
  qsa: Array<{ nome: string; qual: string }>
}

/**
 * ReceitaWS Client for CNPJ lookup
 * Encapsulates external API calls following VTEX IO guidelines
 */
export class ReceitaWsClient extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('https://receitaws.com.br', context, {
      ...options,
      retries: 2,
      headers: {
        ...options?.headers,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  /**
   * Lookup company information by CNPJ
   * @param cnpj - CNPJ number (numbers only)
   * @param token - ReceitaWS API token
   */
  public async lookupByCnpj(
    cnpj: string,
    token: string
  ): Promise<ICompanyInfo> {
    return this.http.get<ICompanyInfo>(`/v1/cnpj/${cnpj}/days/100000000000`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      metric: 'receita-ws-cnpj-lookup',
    })
  }
}
