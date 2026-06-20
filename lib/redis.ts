import { Redis } from "@upstash/redis"
import { requireEnv } from "@/utils/helpers"

let cachedRedis : Redis | null = null

export function getRedis(): Redis {
    if (cachedRedis) {
        return cachedRedis
    }

    const url = requireEnv("REDIS_URL")
    const token = requireEnv("REDIS_TOKEN")

    cachedRedis = new Redis({ url, token})
    return cachedRedis
}


