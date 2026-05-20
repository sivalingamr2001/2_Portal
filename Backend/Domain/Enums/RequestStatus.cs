namespace Web.Domain.Enums;

public enum RequestStatus
{
    Submited = 0,
    HodPending = 1,
    OperatorPending = 2,
    HodApproved = 3, 
    OperatorApproved = 4,
    AccessGranted = 5,
    HodRejected = 6, 
    OperatorRejected = 7,
    AccessRejected = 8,
    Expired = 9,
    Revoked = 10
}
