import { readFileSync } from "node:fs";
import { Agent } from "node:https";

import axios from "axios";

import type { McmasterCredentials } from "./types.js";

function readCredentialsFromEnv(): McmasterCredentials | undefined {
  const username = process.env.MCMASTER_API_USERNAME;
  const password = process.env.MCMASTER_API_PASSWORD;
  const pfxPath = process.env.MCMASTER_API_PFX_PATH;

  if (!username || !password || !pfxPath) {
    return undefined;
  }

  return {
    username,
    password,
    pfxPath,
    pfxPassphrase: process.env.MCMASTER_API_PFX_PASSPHRASE,
  };
}

export class McmasterApiClient {
  private readonly client;
  private authToken?: string;

  constructor(private readonly credentials: McmasterCredentials) {
    this.client = axios.create({
      baseURL: "https://api.mcmaster.com/v1",
      httpsAgent: new Agent({
        pfx: readFileSync(credentials.pfxPath),
        passphrase: credentials.pfxPassphrase,
      }),
      headers: {
        "content-type": "application/json",
      },
      timeout: 20_000,
    });
  }

  static fromEnv(): McmasterApiClient | undefined {
    const credentials = readCredentialsFromEnv();
    return credentials ? new McmasterApiClient(credentials) : undefined;
  }

  private async ensureToken(): Promise<string> {
    if (this.authToken) {
      return this.authToken;
    }

    const response = await this.client.post("/login", {
      UserName: this.credentials.username,
      Password: this.credentials.password,
    });

    const authToken = response.data?.AuthToken;
    if (typeof authToken !== "string" || !authToken.trim()) {
      throw new Error("McMaster login did not return an AuthToken.");
    }

    this.authToken = authToken;
    return this.authToken;
  }

  async getProduct(partNumber: string) {
    const token = await this.ensureToken();
    const response = await this.client.get(`/products/${encodeURIComponent(partNumber)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  }

  async getPrice(partNumber: string) {
    const token = await this.ensureToken();
    const response = await this.client.get(
      `/products/${encodeURIComponent(partNumber)}/price`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  }
}
