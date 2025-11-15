using Microsoft.AspNetCore.Mvc;
using SmartCampusWallet.Api.Data;
using SmartCampusWallet.Api.Models;

namespace SmartCampusWallet.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public IActionResult GetMe()
    {
        // Get user email from header sent by frontend
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        
        if (string.IsNullOrEmpty(userEmail))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var user = _db.Users.FirstOrDefault(u => u.Email == userEmail);
        
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

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
