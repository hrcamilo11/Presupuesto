import { Client, Databases, Users } from "node-appwrite";

const WALLETS_COLLECTION_ID = "wallets";

function getConfig() {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID ?? "main";
  return { endpoint, projectId, apiKey, databaseId };
}

export function isAppwriteConfigured(): boolean {
  const { endpoint, projectId, apiKey } = getConfig();
  return !!(endpoint && projectId && apiKey);
}

export function getAppwriteClient(): Client | null {
  if (!isAppwriteConfigured()) return null;
  const { endpoint, projectId, apiKey } = getConfig();
  return new Client()
    .setEndpoint(endpoint!)
    .setProject(projectId!)
    .setKey(apiKey!);
}

export function getAppwriteDatabases(): Databases | null {
  const client = getAppwriteClient();
  return client ? new Databases(client) : null;
}

export function getAppwriteUsers(): Users | null {
  const client = getAppwriteClient();
  return client ? new Users(client) : null;
}

export function getAppwriteDatabaseId(): string {
  return getConfig().databaseId;
}

export function getWalletsCollectionId(): string {
  return WALLETS_COLLECTION_ID;
}
