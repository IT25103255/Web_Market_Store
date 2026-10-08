-- ============================================================
-- SE2030 Web-Based Online Market Store - Final Demo Database
-- Microsoft SQL Server
-- Creates the complete schema and a rich presentation/demo data set.
-- Safe to run after creating/clearing the Online_market_system database.
-- ============================================================

IF DB_ID('Online_market_system') IS NULL
    CREATE DATABASE Online_market_system;
GO
USE Online_market_system;
GO

IF OBJECT_ID('dbo.Users','U') IS NULL
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role VARCHAR(30) NOT NULL
);
GO

IF OBJECT_ID('dbo.Categories','U') IS NULL
CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName VARCHAR(100) NOT NULL
);
GO

IF OBJECT_ID('dbo.Companies','U') IS NULL
CREATE TABLE Companies (
    CompanyID INT IDENTITY(1,1) PRIMARY KEY,
    CompanyName VARCHAR(100) NOT NULL,
    Email VARCHAR(100),
    Phone VARCHAR(20),
    Address VARCHAR(255)
);
GO

IF OBJECT_ID('dbo.Products','U') IS NULL
CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductName VARCHAR(100) NOT NULL,
    CategoryID INT NOT NULL,
    CompanyID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Description VARCHAR(255),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT FK_Products_Companies FOREIGN KEY (CompanyID) REFERENCES Companies(CompanyID)
);
GO

IF OBJECT_ID('dbo.Inventory','U') IS NULL
CREATE TABLE Inventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL UNIQUE,
    Quantity INT NOT NULL,
    Status VARCHAR(30),
    CONSTRAINT FK_Inventory_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

-- The existing submitted schema is intentionally retained.
-- DiscountPercentage stores the numeric value. The Strategy Pattern determines
-- whether it is interpreted as percentage or fixed LKR via the Status metadata.
IF OBJECT_ID('dbo.Promotions','U') IS NULL
CREATE TABLE Promotions (
    PromotionID INT IDENTITY(1,1) PRIMARY KEY,
    PromotionName VARCHAR(100) NOT NULL,
    ProductID INT NOT NULL,
    DiscountPercentage DECIMAL(5,2) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Status VARCHAR(30) NOT NULL,
    CONSTRAINT FK_Promotions_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

IF OBJECT_ID('dbo.Orders','U') IS NULL
CREATE TABLE Orders (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName VARCHAR(100) NOT NULL,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(10,2),
    Status VARCHAR(30)
);
GO

IF OBJECT_ID('dbo.OrderItems','U') IS NULL
CREATE TABLE OrderItems (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);
GO

IF OBJECT_ID('dbo.Deliveries','U') IS NULL
CREATE TABLE Deliveries (
    DeliveryID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL UNIQUE,
    DeliveryAddress VARCHAR(255) NOT NULL,
    DeliveryStatus VARCHAR(30) NOT NULL,
    CONSTRAINT FK_Deliveries_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID)
);
GO

-- ============================================================
-- DEMO CATALOGUE
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Categories)
BEGIN
    INSERT INTO Categories(CategoryName) VALUES
    ('Groceries'),('Electronics'),('Beverages'),('Household'),
    ('Personal Care'),('Snacks'),('Fresh Produce'),('Stationery');
END
GO

IF NOT EXISTS (SELECT 1 FROM Companies)
BEGIN
    INSERT INTO Companies(CompanyName,Email,Phone,Address) VALUES
    ('Ceylon Harvest','hello@ceylonharvest.lk','0771234567','Colombo 07'),
    ('TechNova Lanka','sales@technova.lk','0712345678','Colombo 03'),
    ('Fresh Lanka','orders@freshlanka.lk','0763456789','Negombo'),
    ('HomeCare Industries','support@homecare.lk','0754567890','Wattala'),
    ('Glow Essentials','care@glowessentials.lk','0745678901','Kandy'),
    ('Island Choice Trading','info@islandchoice.lk','0726789012','Gampaha');
END
GO

IF NOT EXISTS (SELECT 1 FROM Products)
BEGIN
    DECLARE @groceries INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Groceries');
    DECLARE @electronics INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Electronics');
    DECLARE @beverages INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Beverages');
    DECLARE @household INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Household');
    DECLARE @care INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Personal Care');
    DECLARE @snacks INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Snacks');
    DECLARE @fresh INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Fresh Produce');
    DECLARE @stationery INT=(SELECT CategoryID FROM Categories WHERE CategoryName='Stationery');

    DECLARE @ceylon INT=(SELECT CompanyID FROM Companies WHERE CompanyName='Ceylon Harvest');
    DECLARE @tech INT=(SELECT CompanyID FROM Companies WHERE CompanyName='TechNova Lanka');
    DECLARE @freshco INT=(SELECT CompanyID FROM Companies WHERE CompanyName='Fresh Lanka');
    DECLARE @home INT=(SELECT CompanyID FROM Companies WHERE CompanyName='HomeCare Industries');
    DECLARE @glow INT=(SELECT CompanyID FROM Companies WHERE CompanyName='Glow Essentials');
    DECLARE @island INT=(SELECT CompanyID FROM Companies WHERE CompanyName='Island Choice Trading');

    INSERT INTO Products(ProductName,CategoryID,CompanyID,Price,Description) VALUES
    ('Premium Rice Pack',@groceries,@ceylon,1650.00,'5kg premium locally sourced rice for everyday family meals.'),
    ('Organic Oats',@groceries,@ceylon,1850.00,'Whole-grain breakfast oats with a naturally rich texture.'),
    ('Pasta Fusilli',@groceries,@island,950.00,'500g spiral pasta suitable for quick meals, salads and sauces.'),
    ('Coconut Milk Pack',@groceries,@freshco,720.00,'Creamy coconut milk pack for curries, desserts and baking.'),
    ('Wireless Headphones',@electronics,@tech,24500.00,'Comfortable wireless headphones with clear audio and long battery life.'),
    ('Smart Fitness Band',@electronics,@tech,15900.00,'Compact activity tracker with step, sleep and heart-rate monitoring.'),
    ('Portable Bluetooth Speaker',@electronics,@tech,12800.00,'Portable speaker with punchy audio and rechargeable battery.'),
    ('USB-C Fast Charger',@electronics,@tech,6250.00,'Compact USB-C fast charger for compatible phones and tablets.'),
    ('Ceylon Tea Premium',@beverages,@ceylon,2040.00,'Premium Ceylon black tea with a bright aroma and full-bodied flavour.'),
    ('Arabica Coffee 250g',@beverages,@island,2950.00,'Roasted Arabica coffee with a smooth, balanced finish.'),
    ('Tropical Mango Juice',@beverages,@freshco,950.00,'Refreshing mango fruit drink for chilled serving.'),
    ('Mineral Water 6 Pack',@beverages,@freshco,1450.00,'Six-bottle mineral water pack for home, office or travel.'),
    ('Eco Laundry Liquid',@household,@home,2750.00,'Concentrated laundry liquid for everyday washing.'),
    ('Dish Wash Lemon',@household,@home,650.00,'Lemon-scented dish wash liquid designed to cut grease.'),
    ('Multipurpose Cleaner',@household,@home,1180.00,'Everyday surface cleaner for kitchens, counters and household areas.'),
    ('Soft Tissue 6 Pack',@household,@home,1250.00,'Soft two-ply tissue pack for home and office use.'),
    ('Herbal Shampoo',@care,@glow,1980.00,'Herbal shampoo formulated for gentle daily cleansing.'),
    ('Aloe Body Wash',@care,@glow,1750.00,'Refreshing aloe body wash with a light, clean fragrance.'),
    ('Roasted Cashew Mix',@snacks,@island,1850.00,'Crunchy roasted cashew snack mix for sharing.'),
    ('Premium Notebook Set',@stationery,@island,2150.00,'Set of three premium notebooks for study and work.'),
    ('Fresh Apple Pack',@fresh,@freshco,1680.00,'Fresh apple pack selected for crispness and everyday snacking.'),
    ('Banana Bunch',@fresh,@freshco,720.00,'Fresh ripe bananas supplied in a convenient family-size bunch.'),
    ('Ballpoint Pen Set',@stationery,@island,780.00,'Smooth-writing ballpoint pen set for school, office and daily use.');
END
GO

IF NOT EXISTS (SELECT 1 FROM Inventory)
BEGIN
    INSERT INTO Inventory(ProductID,Quantity,Status)
    SELECT ProductID,
           CASE ProductName
             WHEN 'Premium Rice Pack' THEN 38 WHEN 'Organic Oats' THEN 18 WHEN 'Pasta Fusilli' THEN 28 WHEN 'Coconut Milk Pack' THEN 34
             WHEN 'Wireless Headphones' THEN 8 WHEN 'Smart Fitness Band' THEN 4 WHEN 'Portable Bluetooth Speaker' THEN 11 WHEN 'USB-C Fast Charger' THEN 19
             WHEN 'Ceylon Tea Premium' THEN 24 WHEN 'Arabica Coffee 250g' THEN 13 WHEN 'Tropical Mango Juice' THEN 31 WHEN 'Mineral Water 6 Pack' THEN 25
             WHEN 'Eco Laundry Liquid' THEN 17 WHEN 'Dish Wash Lemon' THEN 42 WHEN 'Multipurpose Cleaner' THEN 14 WHEN 'Soft Tissue 6 Pack' THEN 23
             WHEN 'Herbal Shampoo' THEN 9 WHEN 'Aloe Body Wash' THEN 5 WHEN 'Roasted Cashew Mix' THEN 16 WHEN 'Premium Notebook Set' THEN 7
             WHEN 'Fresh Apple Pack' THEN 20 WHEN 'Banana Bunch' THEN 3 WHEN 'Ballpoint Pen Set' THEN 0 ELSE 10 END,
           CASE ProductName
             WHEN 'Smart Fitness Band' THEN 'Low Stock' WHEN 'Aloe Body Wash' THEN 'Low Stock' WHEN 'Banana Bunch' THEN 'Low Stock'
             WHEN 'Ballpoint Pen Set' THEN 'Out of Stock' ELSE 'In Stock' END
    FROM Products;
END
GO

-- ============================================================
-- PROMOTION & DISCOUNT MANAGEMENT DEMO DATA
-- Active|PERCENTAGE and Active|FIXED are backward-compatible
-- metadata used by the integrated Strategy Pattern.
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Promotions)
BEGIN
    DECLARE @rice INT=(SELECT ProductID FROM Products WHERE ProductName='Premium Rice Pack');
    DECLARE @headphones INT=(SELECT ProductID FROM Products WHERE ProductName='Wireless Headphones');
    DECLARE @tea INT=(SELECT ProductID FROM Products WHERE ProductName='Ceylon Tea Premium');
    DECLARE @mango INT=(SELECT ProductID FROM Products WHERE ProductName='Tropical Mango Juice');
    DECLARE @shampoo INT=(SELECT ProductID FROM Products WHERE ProductName='Herbal Shampoo');
    DECLARE @cleaner INT=(SELECT ProductID FROM Products WHERE ProductName='Multipurpose Cleaner');
    DECLARE @speaker INT=(SELECT ProductID FROM Products WHERE ProductName='Portable Bluetooth Speaker');
    DECLARE @cashew INT=(SELECT ProductID FROM Products WHERE ProductName='Roasted Cashew Mix');

    INSERT INTO Promotions(PromotionName,ProductID,DiscountPercentage,StartDate,EndDate,Status) VALUES
    ('Family Rice Week',@rice,10.00,DATEADD(day,-5,CAST(GETDATE() AS DATE)),DATEADD(day,30,CAST(GETDATE() AS DATE)),'Active|PERCENTAGE'),
    ('Audio Saver',@headphones,500.00,DATEADD(day,-3,CAST(GETDATE() AS DATE)),DATEADD(day,20,CAST(GETDATE() AS DATE)),'Active|FIXED'),
    ('Tea Time Deal',@tea,15.00,DATEADD(day,-7,CAST(GETDATE() AS DATE)),DATEADD(day,25,CAST(GETDATE() AS DATE)),'Active|PERCENTAGE'),
    ('Mango Refresh',@mango,150.00,DATEADD(day,-2,CAST(GETDATE() AS DATE)),DATEADD(day,18,CAST(GETDATE() AS DATE)),'Active|FIXED'),
    ('Herbal Care',@shampoo,12.00,DATEADD(day,-4,CAST(GETDATE() AS DATE)),DATEADD(day,22,CAST(GETDATE() AS DATE)),'Active|PERCENTAGE'),
    ('Clean Home Offer',@cleaner,8.00,DATEADD(day,-1,CAST(GETDATE() AS DATE)),DATEADD(day,15,CAST(GETDATE() AS DATE)),'Active|PERCENTAGE'),
    ('Speaker Weekend Preview',@speaker,450.00,DATEADD(day,4,CAST(GETDATE() AS DATE)),DATEADD(day,12,CAST(GETDATE() AS DATE)),'Inactive|FIXED'),
    ('Cashew Member Deal',@cashew,10.00,DATEADD(day,-12,CAST(GETDATE() AS DATE)),DATEADD(day,-2,CAST(GETDATE() AS DATE)),'Inactive|PERCENTAGE');
END
GO

-- ============================================================
-- ORDER + DELIVERY MANAGEMENT DEMO DATA
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Orders)
BEGIN
    INSERT INTO Orders(CustomerName,OrderDate,TotalAmount,Status) VALUES
    ('Demo Customer',DATEADD(day,-8,GETDATE()),4704.00,'Completed'),
    ('Nimal Perera',DATEADD(day,-5,GETDATE()),30250.00,'Confirmed'),
    ('Kavindi Silva',DATEADD(day,-3,GETDATE()),4050.00,'Confirmed'),
    ('Demo Customer',DATEADD(day,-1,GETDATE()),4250.00,'Pending'),
    ('Sahan Fernando',DATEADD(day,-10,GETDATE()),4300.00,'Cancelled');

    DECLARE @o1 INT=(SELECT MIN(OrderID) FROM Orders WHERE CustomerName='Demo Customer');
    DECLARE @o2 INT=(SELECT OrderID FROM Orders WHERE CustomerName='Nimal Perera');
    DECLARE @o3 INT=(SELECT OrderID FROM Orders WHERE CustomerName='Kavindi Silva');
    DECLARE @o4 INT=(SELECT MAX(OrderID) FROM Orders WHERE CustomerName='Demo Customer');
    DECLARE @o5 INT=(SELECT OrderID FROM Orders WHERE CustomerName='Sahan Fernando');

    DECLARE @rice2 INT=(SELECT ProductID FROM Products WHERE ProductName='Premium Rice Pack');
    DECLARE @tea2 INT=(SELECT ProductID FROM Products WHERE ProductName='Ceylon Tea Premium');
    DECLARE @head2 INT=(SELECT ProductID FROM Products WHERE ProductName='Wireless Headphones');
    DECLARE @charger INT=(SELECT ProductID FROM Products WHERE ProductName='USB-C Fast Charger');
    DECLARE @laundry INT=(SELECT ProductID FROM Products WHERE ProductName='Eco Laundry Liquid');
    DECLARE @dish INT=(SELECT ProductID FROM Products WHERE ProductName='Dish Wash Lemon');
    DECLARE @mango2 INT=(SELECT ProductID FROM Products WHERE ProductName='Tropical Mango Juice');
    DECLARE @cashew2 INT=(SELECT ProductID FROM Products WHERE ProductName='Roasted Cashew Mix');
    DECLARE @notebook INT=(SELECT ProductID FROM Products WHERE ProductName='Premium Notebook Set');

    INSERT INTO OrderItems(OrderID,ProductID,Quantity,UnitPrice,Subtotal) VALUES
    (@o1,@rice2,2,1485.00,2970.00),(@o1,@tea2,1,1734.00,1734.00),
    (@o2,@head2,1,24000.00,24000.00),(@o2,@charger,1,6250.00,6250.00),
    (@o3,@laundry,1,2750.00,2750.00),(@o3,@dish,2,650.00,1300.00),
    (@o4,@mango2,3,800.00,2400.00),(@o4,@cashew2,1,1850.00,1850.00),
    (@o5,@notebook,2,2150.00,4300.00);

    INSERT INTO Deliveries(OrderID,DeliveryAddress,DeliveryStatus) VALUES
    (@o1,'42 Flower Road, Colombo 07','Delivered'),
    (@o2,'18 Lake View, Nugegoda','Shipped'),
    (@o3,'77 Temple Road, Negombo','Preparing'),
    (@o4,'15 Station Lane, Gampaha','Preparing');
END
GO

PRINT 'Online_market_system database created successfully with full demo data.';
GO
