using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using Web.Shared.Responses;

namespace Web.Features.Notifications.Commands;

public sealed record SendNotificationCommand(
    string RecipientEmail,
    string Subject,
    string Body,
    string NotificationType) : IRequest<ApiResponse<bool>>;

public sealed class SendNotificationValidator : AbstractValidator<SendNotificationCommand>
{
    public SendNotificationValidator()
    {
        RuleFor(x => x.RecipientEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.NotificationType)
            .Must(t => new[] { "email", "system" }.Contains(t.ToLowerInvariant()))
            .WithMessage("NotificationType must be 'email' or 'system'.");
    }
}

/// <summary>
/// Notification handler — currently logs (simulating send).
/// Wire in SMTP / Azure Communication Services without touching the handler contract.
/// </summary>
public sealed class SendNotificationHandler
    : IRequestHandler<SendNotificationCommand, ApiResponse<bool>>
{
    private readonly ILogger<SendNotificationHandler> _logger;

    public SendNotificationHandler(ILogger<SendNotificationHandler> logger)
        => _logger = logger;

    public async Task<ApiResponse<bool>> Handle(
        SendNotificationCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Sending {Type} notification to {Email} — Subject: {Subject}",
            request.NotificationType, request.RecipientEmail, request.Subject);

        // TODO: inject IEmailSender or INotificationService and call here
        await Task.Delay(10, cancellationToken); // simulate async send

        return ApiResponse<bool>.Ok(true, "Notification queued successfully.");
    }
}