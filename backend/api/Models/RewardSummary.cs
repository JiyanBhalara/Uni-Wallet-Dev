namespace SmartCampusWallet.Api.Models;

public class RewardSummary
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int Points { get; set; }
    public string Tier { get; set; } = "Bronze";
    public int NextTierAt { get; set; } = 500;

    public User User { get; set; } = null!;
}
