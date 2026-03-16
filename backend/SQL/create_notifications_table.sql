-- Create notifications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE [dbo].[notifications] (
        [notification_id] INT IDENTITY(1,1) NOT NULL,
        [user_id] INT NOT NULL,
        [title] NVARCHAR(255) NOT NULL,
        [message] NVARCHAR(MAX) NOT NULL,
        [type] NVARCHAR(50) NOT NULL,
        [reference_id] INT NULL,
        [reference_type] NVARCHAR(50) NULL,
        [is_read] BIT NOT NULL DEFAULT(0),
        [created_at] DATETIME2 NOT NULL DEFAULT(GETDATE()),
        CONSTRAINT [PK_notifications] PRIMARY KEY CLUSTERED ([notification_id] ASC),
        CONSTRAINT [FK_notifications_user] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users] ([user_id])
    );

    CREATE INDEX [idx_notifications_user] ON [dbo].[notifications] ([user_id]);
    CREATE INDEX [idx_notifications_is_read] ON [dbo].[notifications] ([is_read]);
    CREATE INDEX [idx_notifications_created_at] ON [dbo].[notifications] ([created_at]);
END
GO
