namespace SmartCampusWallet.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int WalletId { get; set; }

    // negative = debit, positive = credit
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public DateTime Timestamp { get; set; }

    public string Description { get; set; } = null!;
    public string Category { get; set; } = "Other";
    public bool IsOnCampus { get; set; }

    public User User { get; set; } = null!;
    public Wallet Wallet { get; set; } = null!;
}
