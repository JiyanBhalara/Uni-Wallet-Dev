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
            Semester = "Fall 2025",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123")
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
            new Transaction { UserId = user.Id, WalletId = wallets[0].Id, Amount = -8.50m, Merchant = "Cafeteria North Hall", PaymentMethod = "Campus Card", Location = "Campus Center", Category = "Dining", Date = DateTime.Now.AddDays(-1) },
            new Transaction { UserId = user.Id, WalletId = wallets[0].Id, Amount = -2.00m, Merchant = "Library Printing", PaymentMethod = "Campus Card", Location = "Library", Category = "Supplies", Date = DateTime.Now.AddDays(-2) },
            new Transaction { UserId = user.Id, WalletId = wallets[3].Id, Amount = -40m, Merchant = "Metro Pass", PaymentMethod = "Credit Card", Location = "Downtown Newark", Category = "Entertainment", Date = DateTime.Now.AddDays(-3) }
        };

        db.Transactions.AddRange(transactions);
        db.SaveChanges();
    }
}