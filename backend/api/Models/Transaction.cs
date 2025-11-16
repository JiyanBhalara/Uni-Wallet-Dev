// Models/Transaction.cs
using NanoidDotNet;

namespace SmartCampusWallet.Api.Models;

public class Transaction
{
    public string Id { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Merchant { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int WalletId { get; set; }

    // Plaid integration fields
    public string? PlaidTransactionId { get; set; }
    public int? LinkedAccountId { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Wallet Wallet { get; set; } = null!;
    public LinkedAccount? LinkedAccount { get; set; }

    public Transaction()
    {
        Id = Nanoid.Generate(size: 12);
    }
}
