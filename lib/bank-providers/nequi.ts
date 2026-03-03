/**
 * Conecta Nequi API Client
 * Documentation: https://docs.conecta.nequi.com.co/
 */

const NEQUI_BASE_URL = 'https://api.nequi.com.co'; // Default base URL, might need adjustment for sandbox

interface NequiTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface NequiMovement {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: string;
  description: string;
  date: string;
  concept?: string;
}

export class NequiClient {
  private clientId: string;
  private clientSecret: string;
  private phoneNumber: string;

  constructor(clientId: string, clientSecret: string, phoneNumber: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.phoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+57${phoneNumber}`;
  }

  /**
   * Get OAuth2 access token
   */
  async getAccessToken(): Promise<string> {
    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${NEQUI_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Nequi Auth Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: NequiTokenResponse = await response.json();
    return data.access_token;
  }

  /**
   * Fetch account movements
   */
  async getMovements(startDate: string, endDate: string): Promise<NequiMovement[]> {
    const token = await this.getAccessToken();
    
    // Path based on Conecta Nequi Open Banking documentation
    const endpoint = `${NEQUI_BASE_URL}/open-banking/v1/accounts/${this.phoneNumber}/movements`;
    
    const response = await fetch(`${endpoint}?fromDate=${startDate}&toDate=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Nequi Movements Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    // Assuming the response has a 'movements' or similar array. 
    // We might need to adjust this once we see the real payload or more docs.
    return data.movements || data || [];
  }
}
