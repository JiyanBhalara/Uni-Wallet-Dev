// Models/EventAttendance.cs
namespace SmartCampusWallet.Api.Models;

public class EventAttendance
{
    public int Id { get; set; }

    public int EventId { get; set; }
    public CampusEvent Event { get; set; } = null!;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public bool Rsvped { get; set; }
    public bool CheckedIn { get; set; }

    public DateTime? RsvpedAt { get; set; }
    public DateTime? CheckedInAt { get; set; }
}