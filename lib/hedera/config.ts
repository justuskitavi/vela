export type HederaNetwork = "testnet" | "mainnet"

export interface HederaConfig {
    network: HederaNetwork
    accountId: string 
    privateKey: string
}

 function requireEnv(name: string): string {
    const value = process.env[name]

    if (!value || value.trim() === "") {
        throw new Error(
            `Missing required environment var: ${name}` 
        )        
    }

    return value.trim()
 }

 export function getHederaConfig():
 HederaConfig {
    const network = requireEnv("HEDERA_NETWORK")
    if (network!=="testnet" && network!=="mainnet"){
        throw new Error(
            `Invalid Hedera Network ${network}. Expected mainnet or testnet. `
        )
    }

    const accountId = requireEnv("HEDERA_ACCOUNT_ID")
    if (!accountId || accountId.trim() === ""){
        throw new Error(
            `Invalid HEDERA_ACCOUNT_ID: "${accountId}". Expected the shape 0.0.xxxx`
        )
    }

    const privateKey = requireEnv("HEDERA_PRIVATE_KEY")
    if (!privateKey || privateKey.trim() === "") {
        throw new Error(
            `Invalid environment var HEDERA_PRIVATE_KEY: "${privateKey}"`
        )
    }

    return { network, accountId, privateKey }
 }
