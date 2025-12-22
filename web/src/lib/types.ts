// Types matching the Python Pydantic schemas

export type ContributorTier = "starter" | "bronze" | "silver" | "gold" | "platinum"

// --- Contributor Types ---

export interface ContributorCreate {
    email: string
    github_username?: string
    display_name?: string
}

export interface ContributorResponse {
    id: string
    email: string
    github_username?: string
    display_name?: string
    tier: ContributorTier
    total_submissions: number
    validated_submissions: number
    created_at: string
}

export interface ContributorWithKey {
    id: string
    email: string
    api_key: string
    tier: ContributorTier
    message: string
}

export interface ContributorStats {
    id: string
    email: string
    tier: ContributorTier
    total_submissions: number
    validated_submissions: number
    rate_limit_per_hour: number
    progress_to_next_tier: { current: number; required: number; next_tier: string } | null
    created_at: string
    last_activity_at?: string
}

export interface LeaderboardEntry {
    rank: number
    display_name?: string
    github_username?: string
    tier: ContributorTier
    validated_submissions: number
}

export interface LeaderboardResponse {
    entries: LeaderboardEntry[]
    total_contributors: number
    updated_at: string
}

// --- Sample Types ---

export interface SampleCreate {
    material: string
    vibration: number[]
    sample_rate_hz: number
    excitation: string
    source: "real" | "simulation" | "phone_sensor"
    temperature_c?: number
    thickness_mm?: number
    load_g?: number
    mounting?: string
    device?: string
    notes?: string
}

export interface SampleResponse {
    id: string
    material: string
    sample_rate_hz: number
    vibration_length: number
    duration_seconds: number
    validated: boolean
    created_at: string
}

export interface SampleListItem {
    id: string
    material: string
    sample_rate_hz: number
    vibration_length: number
    duration_seconds: number
    source: string
    device?: string
    validated: boolean
    created_at: string
}

export interface SampleListResponse {
    items: SampleListItem[]
    total: number
    page: number
    page_size: number
    has_next: boolean
}

export interface SampleDetail {
    id: string
    contributor_id: string
    material: string
    vibration: number[]
    sample_rate_hz: number
    excitation: string
    source: string
    temperature_c?: number
    thickness_mm?: number
    load_g?: number
    mounting?: string
    device?: string
    notes?: string
    validated: boolean
    peak_frequency_hz?: number
    energy?: number
    created_at: string
}

// --- Prediction Types ---

export interface PredictRequest {
    vibration: number[]
    sample_rate_hz: number
}

export interface PredictResponse {
    prediction: string
    confidence: number
    probabilities?: Record<string, number>
    features?: Record<string, number>
}

// --- Stats Types ---

export interface StatsResponse {
    total_samples: number
    validated_samples: number
    total_contributors: number
    status: string
}

// --- API Error ---

export interface ApiError {
    detail: string
}
