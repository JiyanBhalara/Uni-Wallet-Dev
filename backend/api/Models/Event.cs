namespace SmartCampusWallet.Api.Models;

public class Event
{
    public int Id { get; set; }
    public string Title { get; set; } = null!;
    public DateTime StartsAt { get; set; }
    public string Location { get; set; } = null!;
    public decimal Price { get; set; }
    public string Currency { get; set; } = "USD";

    public ICollection<EventRegistration> Registrations { get; set; } = new List<EventRegistration>();
}
