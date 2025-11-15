namespace SmartCampusWallet.Api.Models;

public class PayToken
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string Token { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }

    public User User { get; set; } = null!;
}
