// Models/CampusEvent.cs
namespace SmartCampusWallet.Api.Models;

public class CampusEvent
{
    public int Id { get; set; }

    // from CSV
    public string EventCode { get; set; } = null!;   // event_id (E001...)
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string Location { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }           // we’ll derive if CSV doesn’t have it
    public string Tags { get; set; } = "";
    public decimal Cost { get; set; }

    public ICollection<EventAttendance> Attendances { get; set; } =
        new List<EventAttendance>();
}
