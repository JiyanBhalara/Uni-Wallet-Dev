namespace SmartCampusWallet.Api.Models;

public enum WalletType
{
    Campus = 0,
    MealPlan = 1,
    DiningDollars = 2,
    BankLinked = 3,
    Other = 4
}

public class Wallet
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public WalletType Type { get; set; }
    public string DisplayName { get; set; } = null!;
    public decimal Balance { get; set; }
    public string Currency { get; set; } = "USD";
    public bool IsPrimary { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}