import axios from "axios";

export interface FloidTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  balance_after?: number;
}

export class FloidClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = "https://api.floid.app"; // Official API domain from docs

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.FLOID_CLIENT_ID || "";
    this.clientSecret = clientSecret || process.env.FLOID_CLIENT_SECRET || "";
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("FloidClient initialized without full OAuth credentials");
    }
  }

  /**
   * Generates a new access token using client credentials.
   * Based on: https://readme.floid.io/docs/floid_oauth_20
   */
  async getAccessToken(): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);

      const response = await axios.post(
        `${this.baseUrl}/oauth_server/?endpoint=token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      if (!response.data?.access_token) {
        throw new Error("Respuesta de Floid no contiene access_token");
      }

      return response.data.access_token;
    } catch (error: any) {
      console.error("Floid Auth Error:", error.response?.data || error.message);
      throw new Error("Error de autenticación con Floid");
    }
  }

  /**
   * Fetches transactions for a linked Nequi account via Floid.
   * The linkToken provided here is the secret token obtained after user connection.
   */
  async getNequiTransactions(linkToken: string): Promise<FloidTransaction[]> {
    try {
      // Get the API Session Token (OAuth)
      const apiToken = await this.getAccessToken();

      // Based on common Floid patterns, the link token might be passed as a query param or header
      // The endpoint from the user's link is /nequi-personas/transactions
      const response = await axios.get(`${this.baseUrl}/nequi-personas/transactions`, {
        params: {
          token: linkToken // Floid often uses 'token' param for extraction links
        },
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      });

      // Map Floid response to our internal format
      // Note: We'll need to adjust the mapping based on the actual JSON structure
      // returned by the Floid API (usually they have a common format for aggregators).
      const transactions = response.data?.transactions || response.data || [];
      
      return transactions.map((tx: any) => ({
        id: tx.id || tx.external_id,
        amount: Math.abs(parseFloat(tx.amount)),
        description: tx.description || tx.concept || "Movimiento Nequi",
        date: tx.date || tx.created_at,
        type: parseFloat(tx.amount) < 0 ? 'EXPENSE' : 'INCOME',
        balance_after: tx.balance
      }));
    } catch (error: any) {
      console.error("Floid API Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Error al obtener movimientos de Floid");
    }
  }

  /**
   * Placeholder for potentially getting a link/widget URL if handled via API
   */
  async createConnectIntent() {
    // Some aggregators require creating an intent/session before opening the widget
    // If Floid uses a direct Client ID + public key on frontend, this might not be needed.
  }
}
