import { Hbar, TransferTransaction, Status } from "@hashgraph/sdk";
import { getHederaClient, getOperatorAccountId } from "./client";

export interface TransferParams {
    toAccountId: string
    amountHbar: number
    memo?: string
}

export interface TransferResult {
    success: boolean
    transactionId: string
    status: string
    fromAccountId: string
    toAccountId: string
    amountHbar: number
}

export async function sendHbar(params:TransferParams): Promise<TransferResult> {
    const { toAccountId, amountHbar, memo } = params

    if (amountHbar <= 0) {
        throw new Error(
            `Invalid transfer amount "${amountHbar}". Amount gotta be greater than zero.`
        )
    }

    const client = getHederaClient()
    const fromAccountId = getOperatorAccountId()

     const transaction = new TransferTransaction()
     .addHbarTransfer(fromAccountId, new Hbar(-amountHbar))
     .addHbarTransfer(toAccountId, new Hbar(amountHbar))

     if (memo) {
        transaction.setTransactionMemo(memo)
     }

     const response = await transaction.execute(client)

     const receipt = await response.getReceipt(client)

     if (receipt.status !== Status.Success) {
        throw new Error(
            `Transaction failed with status: "${receipt.status.toString()}`
        )
     }

     return {
        success: true,
        transactionId: response.transactionId.toString(),
        status: receipt.status.toString(),
        fromAccountId,
        toAccountId,
        amountHbar,
     }
}