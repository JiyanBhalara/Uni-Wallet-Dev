using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;
using BCrypt.Net;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuthController(AppDbContext db)
    {
        _db = db;
    }

    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string FullName, string Email, string Password, string UniversityName, string Semester);

    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest req)
    {
        var user = _db.Users.FirstOrDefault(u => u.Email == req.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials" });

        var isValid = BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash);
        if (!isValid)
            return Unauthorized(new { message = "Invalid credentials" });

        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            universityName = user.UniversityName,
            semester = user.Semester
        });
    }

    [HttpPost("register")]
    public IActionResult Register([FromBody] RegisterRequest req)
    {
        if (_db.Users.Any(u => u.Email == req.Email))
            return Conflict(new { message = "Email already registered" });

        var hashed = BCrypt.Net.BCrypt.HashPassword(req.Password);

        var user = new User
        {
            FullName = req.FullName,
            Email = req.Email,
            UniversityName = req.UniversityName,
            Semester = req.Semester,
            PasswordHash = hashed
        };

        _db.Users.Add(user);
        _db.SaveChanges();

        // Automatically create default wallets for new user
        var defaultWallets = new List<Wallet>
        {
            new Wallet
            {
                UserId = user.Id,
                Type = WalletType.Campus,
                DisplayName = "Campus Wallet",
                Balance = 0,
                Currency = "USD",
                IsPrimary = true
            },
            new Wallet
            {
                UserId = user.Id,
                Type = WalletType.MealPlan,
                DisplayName = "Meal Swipes",
                Balance = 0,
                Currency = "Swipes",
                IsPrimary = false
            },
            new Wallet
            {
                UserId = user.Id,
                Type = WalletType.DiningDollars,
                DisplayName = "Dining Dollars",
                Balance = 0,
                Currency = "USD",
                IsPrimary = false
            }
        };

        _db.Wallets.AddRange(defaultWallets);
        _db.SaveChanges();

        return Ok(new
        {
            id = user.Id,
            fullName = user.FullName,
            email = user.Email,
            universityName = user.UniversityName,
            semester = user.Semester
        });
    }
}
