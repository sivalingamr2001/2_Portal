using System.ComponentModel;

namespace Web.Domain.Enums;

public enum AccessTypes
{
    [Description("Not Applicable")]
    NotApplicable,

    [Description("Read Only")]
    ReadOnly,

    [Description("Read & Write")]
    ReadAndWrite
}
