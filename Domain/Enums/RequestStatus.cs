namespace Domain.Enums;

public enum RequestStatus
{
    Submitted = 0,
    PendingHOD = 1,
    PendingIT = 2,
    ApprovedHOD = 3,
    ApprovedIT = 4,
    AccessGranted = 5,
    RejectedHOD = 6,
    RejectedIT = 7,
    AccessRejected = 8,
    Expired = 9,
    Revoked = 10
}