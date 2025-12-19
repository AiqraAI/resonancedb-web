"""
Contributor Tier Enumeration

Defines the tier levels for contributors based on their contributions.
"""

import enum


class ContributorTier(str, enum.Enum):
    """
    Contributor tier levels.
    
    Tiers are earned based on validated submissions and community engagement.
    Higher tiers unlock more API calls and features.
    """
    
    STARTER = "STARTER"     # 0-49 validated samples
    BRONZE = "BRONZE"       # 50-199 validated samples
    SILVER = "SILVER"       # 200-999 validated samples + GitHub engagement
    GOLD = "GOLD"           # 1000+ validated samples or core contributor
    
    @classmethod
    def from_submission_count(cls, count: int, github_stars: int = 0) -> "ContributorTier":
        """
        Determine tier based on submission count and optional GitHub stars.
        
        Args:
            count: Number of validated submissions
            github_stars: Stars on the contributor's related repos
        
        Returns:
            Appropriate tier level
        """
        if count >= 1000 or (count >= 500 and github_stars >= 50):
            return cls.GOLD
        elif count >= 200 and github_stars >= 5:
            return cls.SILVER
        elif count >= 50:
            return cls.BRONZE
        return cls.STARTER
    
    def get_rate_limit(self) -> int:
        """Get requests per hour for this tier."""
        limits = {
            self.STARTER: 100,
            self.BRONZE: 500,
            self.SILVER: 2000,
            self.GOLD: 10000,
        }
        return limits.get(self, 100)
    
    def next_tier(self) -> "ContributorTier | None":
        """Get the next tier, or None if already at max."""
        order = [self.STARTER, self.BRONZE, self.SILVER, self.GOLD]
        idx = order.index(self)
        if idx < len(order) - 1:
            return order[idx + 1]
        return None
    
    def samples_to_next_tier(self, current_count: int) -> int | None:
        """Get number of samples needed to reach next tier."""
        thresholds = {
            self.STARTER: 50,
            self.BRONZE: 200,
            self.SILVER: 1000,
            self.GOLD: None,  # Already max
        }
        threshold = thresholds.get(self)
        if threshold is None:
            return None
        return max(0, threshold - current_count)
