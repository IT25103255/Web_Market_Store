-- Run once in SSMS using Windows Authentication / a SQL Server administrator login.
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name='market_user')
BEGIN
    CREATE LOGIN market_user WITH PASSWORD='1234', CHECK_POLICY=OFF;
END
GO
USE Online_market_system;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name='market_user')
BEGIN
    CREATE USER market_user FOR LOGIN market_user;
END
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members drm
    JOIN sys.database_principals r ON r.principal_id=drm.role_principal_id
    JOIN sys.database_principals u ON u.principal_id=drm.member_principal_id
    WHERE r.name='db_datareader' AND u.name='market_user'
)
    ALTER ROLE db_datareader ADD MEMBER market_user;
GO
IF NOT EXISTS (
    SELECT 1 FROM sys.database_role_members drm
    JOIN sys.database_principals r ON r.principal_id=drm.role_principal_id
    JOIN sys.database_principals u ON u.principal_id=drm.member_principal_id
    WHERE r.name='db_datawriter' AND u.name='market_user'
)
    ALTER ROLE db_datawriter ADD MEMBER market_user;
GO
PRINT 'market_user is ready for the Online_market_system application.';
