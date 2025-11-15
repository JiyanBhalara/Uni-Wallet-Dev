using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Data;

public static class DataSeeder
{
    public static void SeedInitialData(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var user = new User
        {
            FullName = "Alex Johnson",
            Email = "alex@campus.edu",
            UniversityName = "Smart Campus University",
            Semester = "Fall 2025"
        };

        db.Users.Add(user);
        db.SaveChanges();

        var wallets = new List<Wallet>
        {
            new Wallet { UserId = user.Id, Type = WalletType.Campus, DisplayName = "Campus Wallet", Balance = 120.50m, Currency = "USD", IsPrimary = true },
            new Wallet { UserId = user.Id, Type = WalletType.MealPlan, DisplayName = "Meal Plan Swipes", Balance = 10, Currency = "SWIPES" },
            new Wallet { UserId = user.Id, Type = WalletType.DiningDollars, DisplayName = "Dining Dollars", Balance = 50.75m },
            new Wallet { UserId = user.Id, Type = WalletType.BankLinked, DisplayName = "Bank Account", Balance = 800.00m }
        };

        db.Wallets.AddRange(wallets);
        db.SaveChanges();

        var transactions = new List<Transaction>
        {
            new Transaction { UserId = user.Id, WalletId = wallets[0].Id, Amount = -8.50m, Currency = "USD", Description = "Cafeteria North Hall", Category = "Food", IsOnCampus = true, Timestamp = DateTime.Now.AddDays(-1) },
            new Transaction { UserId = user.Id, WalletId = wallets[0].Id, Amount = -2.00m, Currency = "USD", Description = "Library Printing", Category = "Printing", IsOnCampus = true, Timestamp = DateTime.Now.AddDays(-2) },
            new Transaction { UserId = user.Id, WalletId = wallets[3].Id, Amount = -40m, Currency = "USD", Description = "Metro Pass", Category = "Transport", IsOnCampus = false, Timestamp = DateTime.Now.AddDays(-3) }
        };

        db.Transactions.AddRange(transactions);
        db.SaveChanges();
    }
}