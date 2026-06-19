import { Client,  PrivateKey } from "@hashgraph/sdk";
import { getHederaConfig } from "./config"

let cachedClient: Client | null = null

export function getHederaClient():
Client {
    if (cachedClient){
        return cachedClient
    }

    const config = getHederaConfig()

    const client = config.network === "mainnet" ? Client.forMainnet(): Client.forTestnet()

    const privateKey = PrivateKey.fromStringECDSA(config.privateKey)
    const accountId = config.accountId

    client.setOperator(accountId, privateKey)

    cachedClient = client
    return client
}

export function getOperatorAccountId(): string {
    return getHederaConfig().accountId
}