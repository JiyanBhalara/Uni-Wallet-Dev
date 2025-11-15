using Microsoft.EntityFrameworkCore;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Wallet> Wallets => Set<Wallet>();
    public DbSet<Transaction> Transactions { get; set; } = null!;

    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventRegistration> EventRegistrations => Set<EventRegistration>();
    public DbSet<RewardSummary> RewardSummaries => Set<RewardSummary>();
    public DbSet<RewardEvent> RewardEvents => Set<RewardEvent>();
    public DbSet<PayToken> PayTokens => Set<PayToken>();

    public DbSet<PaymentMethod> PaymentMethods { get; set; } = null!;
    public DbSet<Budget> Budgets { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Wallet>()
            .HasOne(w => w.User)
            .WithMany(u => u.Wallets)
            .HasForeignKey(w => w.UserId);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.User)
            .WithMany(u => u.Transactions)
            .HasForeignKey(t => t.UserId);

        modelBuilder.Entity<Transaction>()
            .HasOne(t => t.Wallet)
            .WithMany(w => w.Transactions)
            .HasForeignKey(t => t.WalletId);

        modelBuilder.Entity<EventRegistration>()
            .HasOne(er => er.Event)
            .WithMany(e => e.Registrations)
            .HasForeignKey(er => er.EventId);

        modelBuilder.Entity<EventRegistration>()
            .HasOne(er => er.User)
            .WithMany(u => u.EventRegistrations)
            .HasForeignKey(er => er.UserId);

        modelBuilder.Entity<PayToken>()
            .HasOne(pt => pt.User)
            .WithMany(u => u.PayTokens)
            .HasForeignKey(pt => pt.UserId);
    }
}
