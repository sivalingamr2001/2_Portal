using Application.Interfaces;
using Domain.Enums;
using Domain.Interfaces.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.BackgroundJobs;

/// <summary>
/// Runs daily. Sends reminders at 15 days and 7 days before expiry.
/// Marks items as Expired on the expiry date.
/// </summary>
public sealed class AccessExpiryJob(
    IServiceScopeFactory scopeFactory,
    ILogger<AccessExpiryJob> logger
) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(24);
    private const int ExpiryDays = 90;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessAsync(stoppingToken);
            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task ProcessAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var repo   = scope.ServiceProvider.GetRequiredService<IAccessRequestRepository>();
        var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();

        var now = DateTime.UtcNow;

        // Fetch all granted items expiring within the next 16 days (covers 7-day and 15-day windows)
        var threshold = now.AddDays(ExpiryDays + 16);
        var items = await repo.GetItemsGrantedExpiringBeforeAsync(threshold, ct);

        foreach (var item in items)
        {
            if (item.UpdatedAt is null) continue;

            var expiryDate = item.UpdatedAt.Value.AddDays(ExpiryDays);
            var daysLeft   = (expiryDate - now).Days;

            if (daysLeft <= 0)
            {
                // Mark expired
                item.Status    = RequestStatus.Expired;
                item.UpdatedAt = now;
                await repo.UpdateItemAsync(item, ct);

                var req = await repo.GetByIdAsync(item.AccessReqId, ct);
                if (req is not null)
                    await notify.NotifyUserAsync(req.UserId, "AccessExpired",
                        $"Your access for ticket {item.TicketNumber} ({item.FolderPath}) has expired.",
                        item.AccessReqId, item.AccessItemId, ct: ct);

                logger.LogInformation("Item {TicketNumber} expired.", item.TicketNumber);
            }
            else if (daysLeft == 7 || daysLeft == 15)
            {
                var req = await repo.GetByIdAsync(item.AccessReqId, ct);
                if (req is not null)
                    await notify.NotifyUserAsync(req.UserId, "AccessExpiringSoon",
                        $"Reminder: Your access for '{item.FolderPath}' (ticket {item.TicketNumber}) expires in {daysLeft} days on {expiryDate:dd-MMM-yyyy}.",
                        item.AccessReqId, item.AccessItemId, ct: ct);

                logger.LogInformation("Reminder sent for item {Ticket}: {Days} days left.", item.TicketNumber, daysLeft);
            }
        }
    }
}