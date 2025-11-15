namespace SmartCampusWallet.Api.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string UniversityName { get; set; } = null!;
    public string Semester { get; set; } = "Fall 2025";

    // later: password hash, etc.

    public ICollection<Wallet> Wallets { get; set; } = new List<Wallet>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<EventRegistration> EventRegistrations { get; set; } = new List<EventRegistration>();
    public ICollection<PayToken> PayTokens { get; set; } = new List<PayToken>();
}
