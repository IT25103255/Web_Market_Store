USE [Online_market_system];
GO
SELECT DB_NAME() AS CurrentDatabase;
SELECT TOP 5 * FROM Categories ORDER BY CategoryID;
SELECT TOP 5 * FROM Products ORDER BY ProductID;
SELECT TOP 5 * FROM Promotions ORDER BY PromotionID;
SELECT TOP 5 * FROM Orders ORDER BY OrderID;
SELECT TOP 5 * FROM Deliveries ORDER BY DeliveryID;
GO
