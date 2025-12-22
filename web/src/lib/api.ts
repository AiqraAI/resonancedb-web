import type {
    ContributorCreate,
    ContributorWithKey,
    ContributorStats,
    LeaderboardResponse,
    SampleCreate,
    SampleResponse,
    SampleListResponse,
    SampleDetail,
    PredictRequest,
    PredictResponse,
    StatsResponse,
    ApiError,
} from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// --- Auth Storage ---

const API_KEY_STORAGE_KEY = "resonancedb_api_key"

export function getStoredApiKey(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(API_KEY_STORAGE_KEY)
}

export function setStoredApiKey(key: string): void {
    if (typeof window !== "undefined") {
        localStorage.setItem(API_KEY_STORAGE_KEY, key)
    }
}

export function clearStoredApiKey(): void {
    if (typeof window !== "undefined") {
        localStorage.removeItem(API_KEY_STORAGE_KEY)
    }
}

// --- Fetch Wrapper ---

class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const apiKey = getStoredApiKey()

        const headers: HeadersInit = {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        }

        if (apiKey) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${apiKey}`
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({ detail: "Unknown error" }))
            throw new Error(error.detail || `HTTP ${response.status}`)
        }

        return response.json()
    }

    // --- Auth Endpoints ---

    async register(data: ContributorCreate): Promise<ContributorWithKey> {
        return this.request<ContributorWithKey>("/api/v1/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async regenerateKey(): Promise<ContributorWithKey> {
        return this.request<ContributorWithKey>("/api/v1/auth/regenerate-key", {
            method: "POST",
        })
    }

    async getProfile(): Promise<ContributorStats> {
        return this.request<ContributorStats>("/api/v1/auth/me")
    }

    // --- Contributor Endpoints ---

    async getMyStats(): Promise<ContributorStats> {
        return this.request<ContributorStats>("/api/v1/contributors/me/stats")
    }

    async getLeaderboard(limit = 10): Promise<LeaderboardResponse> {
        return this.request<LeaderboardResponse>(`/api/v1/contributors/leaderboard?limit=${limit}`)
    }

    // --- Sample Endpoints ---

    async submitSample(data: SampleCreate): Promise<SampleResponse> {
        return this.request<SampleResponse>("/api/v1/samples", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async listSamples(
        page = 1,
        pageSize = 20,
        material?: string
    ): Promise<SampleListResponse> {
        const params = new URLSearchParams({
            page: String(page),
            page_size: String(pageSize),
        })
        if (material) params.set("material", material)

        return this.request<SampleListResponse>(`/api/v1/samples?${params}`)
    }

    async getSample(id: string): Promise<SampleDetail> {
        return this.request<SampleDetail>(`/api/v1/samples/${id}`)
    }

    // --- Prediction Endpoints ---

    async predict(data: PredictRequest): Promise<PredictResponse> {
        return this.request<PredictResponse>("/api/v1/predict", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    // --- Stats Endpoints ---

    async getStats(): Promise<StatsResponse> {
        return this.request<StatsResponse>("/api/v1/stats")
    }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL)
