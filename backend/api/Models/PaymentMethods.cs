// Models/PaymentMethod.cs
namespace SmartCampusWallet.Api.Models;

public enum PaymentMethodType
{
    DebitCard = 0,
    CreditCard = 1,
    BankAccount = 2
}

public class PaymentMethod
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public PaymentMethodType Type { get; set; }

    // e.g. "Chase Debit", "BoA Credit", "Checking ****1234"
    public string Label { get; set; } = null!;

    // Store masked number only. In real prod you’d tokenize instead.
    public string MaskedNumber { get; set; } = null!; // "**** **** **** 1234"
    public string Last4 { get; set; } = null!;        // "1234"

    public string? Brand { get; set; }                // "Visa", "Mastercard", "Chase"
    public bool IsDefault { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
