export interface PolicyContext {
    toAccountId : string
    amountHbar : number
    vendorName?: string
}

export interface PolicyResult {
    allowed : boolean 
    policyName: string
    reason : string
}

export interface Policy {
    name: string
    evaluate(context: PolicyContext): Promise<PolicyResult>
}

export interface PolicyRunSummary {
    allowed : boolean
    results : PolicyResult[]
    blockedBy : PolicyResult | null
}

export async function runPolicies(
    policies : Policy[],
    context : PolicyContext
): Promise<PolicyRunSummary> {
    const results: PolicyResult[] = []

    for (const policy of policies ) {
        const result = await policy.evaluate(context)
        results.push(result)

        if (!result.allowed) {
            return {
                allowed: false, 
                results,
                blockedBy: result
            }
        }
    }

    return { allowed: true, results, blockedBy: null }
}
