namespace SmartCampusWallet.Api.Models;

public class RewardEvent
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateTime OccurredAt { get; set; }
    public int PointsDelta { get; set; }
    public string Reason { get; set; } = null!;

    public User User { get; set; } = null!;
}
