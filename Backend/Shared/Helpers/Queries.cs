namespace Web.Shared.Helpers;

public static class Queries
{
    public const string CmplLoginUserQuery = @"
        SELECT 
            CMPL_USER_ID as UserId, 
            emp_id as EmployeeId, 
            CMPL_USER_NAME as UserName, 
            MAIL_ID as Email,
            MOB_NO as Mobile,
            dept_id as DeptId
        FROM it_inventory_db_new.jan_complaint_login
        WHERE deleted_flag = 0 
            AND (CMPL_USER_NAME = @id OR emp_id = @id OR MAIL_ID = @id) 
            AND CMPL_USER_KEY = @pwd 
        LIMIT 1";

    public const string CmplUserQuery = @"
        SELECT 
            CMPL_USER_ID as UserId, 
            emp_id as EmployeeId, 
            CMPL_USER_NAME as UserName, 
            MAIL_ID as Email,
            MOB_NO as Mobile,
            dept_id as DeptId
        FROM it_inventory_db_new.jan_complaint_login";

    public const string GetDepartmentIdQuery = @"
        SELECT DISTINCT TRIM(dept_id) AS DepartmentId
        FROM it_inventory_db_new.jan_complaint_login
        WHERE dept_id IS NOT NULL AND TRIM(dept_id) != ''
        ORDER BY DepartmentId ASC";

    public const string GetHodData = @"
        SELECT 
            id AS EmployeeId, 
            hodname AS Name, 
            Email_ID AS Email, 
            Mob_no AS PhoneNumber
        FROM it_inventory_db_new.hod_master
        WHERE deleted = 0";
}
