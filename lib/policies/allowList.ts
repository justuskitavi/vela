import type { Policy, PolicyContext, PolicyResult } from "./types";


function getAllowedVendorAccounts(): string[] {
    const raw = process.env.POLICY_ALLOWED_VENDOR_ACCOUNTS ?? ""

    return raw 
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
}

export const AllowListPolicy : Policy = {
    name : "AllowPolicy",
     async evaluate(context : PolicyContext) : Promise<PolicyResult> {
        const allowed = getAllowedVendorAccounts()

         if (allowed.length === 0) {
            return {
                allowed : false,
                policyName : this.name,
                reason: `No approved vendors configured.`
            }
         }

         if (!allowed.includes(context.toAccountId)) {
            return {
                allowed : false,
                policyName : this.name,
                reason : `This vendow is not in the approved vendor list.`
            }
         }

         return {
            allowed : true,
            policyName : this.name,
            reason : `Recipient ${context.toAccountId} is an approved vendor`
         }
     }
}