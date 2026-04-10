using Moq;
using WMS.Application.Features.InventoryRequests.ConfirmRequest;
using WMS.Application.Features.InventoryRequests.Shared;
using WMS.Domain.Entities;
using WMS.Domain.Interfaces;

namespace WMS.UnitTests.InventoryRequests;

/// <summary>
/// Unit Tests — ConfirmInventoryRequestHandler.Handle()
/// Code Module : InventoryModule
/// Method      : ConfirmInventoryRequestHandler.Handle()
/// Test Req    : Verify that a Staff member can correctly confirm an inventory request,
///               updating stock quantities, creating transaction records, and changing
///               request status to COMPLETED. Validates warehouse access hours and
///               request status constraints.
/// Total TCs   : 10 (UTC001–UTC010)
/// </summary>
public class ConfirmInventoryRequestHandlerTests
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private static Warehouse OpenWarehouse(int id = 1) => new()
    {
        WarehouseId     = id,
        Name            = "WH1",
        Is24HoursAccess = true,
    };

    private static Warehouse ClosedWarehouse(int id = 1) => new()
    {
        WarehouseId     = id,
        Name            = "WH1",
        Is24HoursAccess = false,
        OpenTime        = new TimeSpan(0, 0, 0),
        CloseTime       = new TimeSpan(0, 0, 1),
    };

    private static InventoryRequest MakeRequest(
        int id, string type, string status, int warehouseId = 1, int renterId = 1,
        int? assetId = null) => new()
        {
            InvReqId    = id,
            Type        = type,
            Status      = status,
            RenterId    = renterId,
            WarehouseId = warehouseId,
            InventoryItems = new List<InventoryItem>
            {
                new()
                {
                    ItemId   = 1,
                    ItemName = "Box A",
                    Quantity = 5,
                    Unit     = "cái",
                    AssetId  = assetId,
                }
            },
        };

    private static (
        ConfirmInventoryRequestHandler handler,
        Mock<IInventoryRequestRepository>       repoMock,
        Mock<IWarehouseInventoryRepository>     invRepoMock,
        Mock<IInventoryTransactionRepository>   txRepoMock,
        Mock<IWarehouseRepository>              warehouseMock,
        Mock<IRenterAssetRepository>            assetMock,
        Mock<ITaskRepository>                   taskMock)
    BuildHandler()
    {
        var repo         = new Mock<IInventoryRequestRepository>();
        var invRepo      = new Mock<IWarehouseInventoryRepository>();
        var txRepo       = new Mock<IInventoryTransactionRepository>();
        var warehouseRepo= new Mock<IWarehouseRepository>();
        var assetRepo    = new Mock<IRenterAssetRepository>();
        var taskRepo     = new Mock<ITaskRepository>();

        var handler = new ConfirmInventoryRequestHandler(
            repo.Object, invRepo.Object, txRepo.Object,
            warehouseRepo.Object, assetRepo.Object, taskRepo.Object);

        return (handler, repo, invRepo, txRepo, warehouseRepo, assetRepo, taskRepo);
    }

    // ── Shared mock setup helpers ─────────────────────────────────────────────

    private static void SetupInventoryAdj(Mock<IWarehouseInventoryRepository> m) =>
        m.Setup(x => x.AdjustQuantityAsync(
            It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<int>(), It.IsAny<CancellationToken>()))
         .Returns(Task.CompletedTask);

    private static void SetupAssetAdj(Mock<IRenterAssetRepository> m) =>
        m.Setup(x => x.AdjustRenterInventoryAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(),
            It.IsAny<CancellationToken>()))
         .Returns(Task.CompletedTask);

    private static void SetupTxCreate(Mock<IInventoryTransactionRepository> m) =>
        m.Setup(x => x.CreateAsync(
            It.IsAny<InventoryTransaction>(), It.IsAny<CancellationToken>()))
         .ReturnsAsync(new InventoryTransaction { InvReqId = 1, Type = "INBOUND" });

    private static void SetupRepoUpdate(Mock<IInventoryRequestRepository> m) =>
        m.Setup(x => x.UpdateAsync(
            It.IsAny<InventoryRequest>(), It.IsAny<CancellationToken>()))
         .Returns(Task.CompletedTask);

    private static void SetupTaskComplete(Mock<ITaskRepository> m) =>
        m.Setup(x => x.CompleteUnitTaskAsync(
            It.IsAny<string>(), It.IsAny<int>(), It.IsAny<string>(),
            It.IsAny<int>(), It.IsAny<CancellationToken>()))
         .Returns(Task.CompletedTask);

    // ── UTC001 — Normal: INBOUND ASSIGNED, items from catalogue (AssetId set) ─
    [Fact]
    public async Task UTC001_Inbound_Assigned_CatalogueItems_StockIncremented_StatusCompleted()
    {
        // Arrange
        var (handler, repo, invRepo, txRepo, warehouseMock, assetMock, taskMock) = BuildHandler();

        var request = MakeRequest(id: 1, type: "INBOUND", status: "CONFIRMED", assetId: 10);

        // Simulate state: before UpdateAsync → CONFIRMED; after → COMPLETED
        var callCount = 0;
        repo.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(() =>
            {
                callCount++;
                if (callCount == 1)
                {
                    // First call: load for processing — status CONFIRMED
                    return MakeRequest(1, "INBOUND", "CONFIRMED", assetId: 10);
                }
                // Subsequent calls: reload after update — status COMPLETED
                var done = MakeRequest(1, "INBOUND", "COMPLETED", assetId: 10);
                done.ConfirmedBy = 5;
                done.ConfirmedAt = DateTime.Now;
                return done;
            });

        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        SetupInventoryAdj(invRepo);
        SetupAssetAdj(assetMock);
        SetupTxCreate(txRepo);
        SetupRepoUpdate(repo);
        SetupTaskComplete(taskMock);

        var cmd = new ConfirmInventoryRequestCommand { Id = 1, StaffId = 5 };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("COMPLETED", result.Status);       // Status = "COMPLETED"

        // Warehouse inventory increased (delta > 0 for INBOUND)
        invRepo.Verify(x => x.AdjustQuantityAsync(1, "Box A", "cái", 5,
            It.IsAny<CancellationToken>()), Times.Once);

        // Renter inventory increased (assetId=10)
        assetMock.Verify(x => x.AdjustRenterInventoryAsync(10, 1, 5,
            It.IsAny<CancellationToken>()), Times.Once);

        // Transaction record created
        txRepo.Verify(x => x.CreateAsync(It.IsAny<InventoryTransaction>(),
            It.IsAny<CancellationToken>()), Times.Once);

        // UnitTask INBOUND_RECEIVE completed
        taskMock.Verify(x => x.CompleteUnitTaskAsync(
            "INBOUND", 1, "INBOUND_RECEIVE", 5,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC002 — Normal: INBOUND ASSIGNED, free-text items (no AssetId) → auto-create
    [Fact]
    public async Task UTC002_Inbound_Assigned_FreeTextItems_AutoCreatesAsset_StockIncremented()
    {
        // Arrange
        var (handler, repo, invRepo, txRepo, warehouseMock, assetMock, taskMock) = BuildHandler();

        var request = MakeRequest(id: 2, type: "INBOUND", status: "CONFIRMED", assetId: null);

        repo.Setup(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        // No existing asset with that name → auto-create path
        assetMock.Setup(x => x.FindByNameAndRenterAsync(1, "Box A", It.IsAny<CancellationToken>()))
                 .ReturnsAsync((RenterAsset?)null);
        assetMock.Setup(x => x.CreateAsync(It.IsAny<RenterAsset>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new RenterAsset { AssetId = 99, RenterId = 1, AssetName = "Box A", Unit = "cái" });

        SetupInventoryAdj(invRepo);
        SetupAssetAdj(assetMock);
        SetupTxCreate(txRepo);
        SetupRepoUpdate(repo);
        SetupTaskComplete(taskMock);

        var completed = MakeRequest(2, "INBOUND", "COMPLETED");
        repo.SetupSequence(x => x.GetByIdAsync(2, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request)
            .ReturnsAsync(completed);

        var cmd = new ConfirmInventoryRequestCommand { Id = 2, StaffId = 5 };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        // New RenterAsset auto-created
        assetMock.Verify(x => x.CreateAsync(It.IsAny<RenterAsset>(),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC003 — Normal: OUTBOUND ASSIGNED, catalogue items → stock decremented ─
    [Fact]
    public async Task UTC003_Outbound_Assigned_CatalogueItems_StockDecremented_StatusCompleted()
    {
        // Arrange
        var (handler, repo, invRepo, txRepo, warehouseMock, assetMock, taskMock) = BuildHandler();

        var request = MakeRequest(id: 3, type: "OUTBOUND", status: "CONFIRMED", assetId: 10);
        repo.Setup(x => x.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        SetupInventoryAdj(invRepo);
        SetupAssetAdj(assetMock);
        SetupTxCreate(txRepo);
        SetupRepoUpdate(repo);
        SetupTaskComplete(taskMock);

        var completed = MakeRequest(3, "OUTBOUND", "COMPLETED", assetId: 10);
        repo.SetupSequence(x => x.GetByIdAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request)
            .ReturnsAsync(completed);

        var cmd = new ConfirmInventoryRequestCommand { Id = 3, StaffId = 5 };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);

        // Warehouse inventory DECREASED (delta = -5 for OUTBOUND)
        invRepo.Verify(x => x.AdjustQuantityAsync(1, "Box A", "cái", -5,
            It.IsAny<CancellationToken>()), Times.Once);

        // Renter inventory DECREASED
        assetMock.Verify(x => x.AdjustRenterInventoryAsync(10, 1, -5,
            It.IsAny<CancellationToken>()), Times.Once);

        // OUTBOUND_PICK task completed
        taskMock.Verify(x => x.CompleteUnitTaskAsync(
            "OUTBOUND", 3, "OUTBOUND_PICK", 5,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC004 — Normal: OUTBOUND ASSIGNED, free-text items → auto-resolve asset
    [Fact]
    public async Task UTC004_Outbound_Assigned_FreeTextItems_AutoResolvesAsset_StockDecremented()
    {
        // Arrange
        var (handler, repo, invRepo, txRepo, warehouseMock, assetMock, taskMock) = BuildHandler();

        var request = MakeRequest(id: 4, type: "OUTBOUND", status: "CONFIRMED", assetId: null);
        repo.Setup(x => x.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        // Asset found by name
        assetMock.Setup(x => x.FindByNameAndRenterAsync(1, "Box A", It.IsAny<CancellationToken>()))
                 .ReturnsAsync(new RenterAsset { AssetId = 88, RenterId = 1, AssetName = "Box A" });

        SetupInventoryAdj(invRepo);
        SetupAssetAdj(assetMock);
        SetupTxCreate(txRepo);
        SetupRepoUpdate(repo);
        SetupTaskComplete(taskMock);

        var completed = MakeRequest(4, "OUTBOUND", "COMPLETED");
        repo.SetupSequence(x => x.GetByIdAsync(4, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request)
            .ReturnsAsync(completed);

        var cmd = new ConfirmInventoryRequestCommand { Id = 4, StaffId = 5 };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        assetMock.Verify(x => x.AdjustRenterInventoryAsync(88, 1, -5,
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC005 — Abnormal: Status = PENDING (not CONFIRMED) → InvalidOperationException
    [Fact]
    public async Task UTC005_StatusPending_NotAssigned_ThrowsInvalidOperationException()
    {
        // Arrange
        var (handler, repo, _, _, warehouseMock, _, _) = BuildHandler();

        var request = MakeRequest(id: 5, type: "INBOUND", status: "PENDING");
        repo.Setup(x => x.GetByIdAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        var cmd = new ConfirmInventoryRequestCommand { Id = 5, StaffId = 5 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("CONFIRMED", ex.Message);
    }

    // ── UTC006 — Abnormal: Status = COMPLETED (already done) → InvalidOperationException
    [Fact]
    public async Task UTC006_StatusCompleted_AlreadyDone_ThrowsInvalidOperationException()
    {
        // Arrange
        var (handler, repo, _, _, warehouseMock, _, _) = BuildHandler();

        var request = MakeRequest(id: 6, type: "INBOUND", status: "COMPLETED");
        repo.Setup(x => x.GetByIdAsync(6, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        var cmd = new ConfirmInventoryRequestCommand { Id = 6, StaffId = 5 };

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(cmd, CancellationToken.None));
    }

    // ── UTC007 — Abnormal: Request ID = 9999 not found → KeyNotFoundException ─
    [Fact]
    public async Task UTC007_RequestNotFound_ThrowsKeyNotFoundException()
    {
        // Arrange
        var (handler, repo, _, _, _, _, _) = BuildHandler();

        repo.Setup(x => x.GetByIdAsync(9999, It.IsAny<CancellationToken>()))
            .ReturnsAsync((InventoryRequest?)null);

        var cmd = new ConfirmInventoryRequestCommand { Id = 9999, StaffId = 5 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("9999", ex.Message);
    }

    // ── UTC008 — Abnormal: Warehouse is closed → InvalidOperationException ─────
    [Fact]
    public async Task UTC008_WarehouseClosed_ThrowsInvalidOperationException()
    {
        // Arrange
        var (handler, repo, _, _, warehouseMock, _, _) = BuildHandler();

        var request = MakeRequest(id: 8, type: "INBOUND", status: "CONFIRMED");
        repo.Setup(x => x.GetByIdAsync(8, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(ClosedWarehouse());

        var cmd = new ConfirmInventoryRequestCommand { Id = 8, StaffId = 5 };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            handler.Handle(cmd, CancellationToken.None));
        Assert.Contains("đóng cửa", ex.Message);
    }

    // ── UTC009 — Normal: free-text items, new RenterAsset auto-created ─────────
    [Fact]
    public async Task UTC009_FreeTextItems_NewRenterAssetAutoCreated_Successfully()
    {
        // Arrange
        var (handler, repo, invRepo, txRepo, warehouseMock, assetMock, taskMock) = BuildHandler();

        var request = MakeRequest(id: 9, type: "INBOUND", status: "CONFIRMED", assetId: null);
        repo.Setup(x => x.GetByIdAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        // No existing asset → auto-create
        assetMock.Setup(x => x.FindByNameAndRenterAsync(1, "Box A", It.IsAny<CancellationToken>()))
                 .ReturnsAsync((RenterAsset?)null);

        var newAsset = new RenterAsset { AssetId = 77, RenterId = 1, AssetName = "Box A", Unit = "cái" };
        assetMock.Setup(x => x.CreateAsync(It.IsAny<RenterAsset>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync(newAsset);

        SetupInventoryAdj(invRepo);
        SetupAssetAdj(assetMock);
        SetupTxCreate(txRepo);
        SetupRepoUpdate(repo);
        SetupTaskComplete(taskMock);

        var completed = MakeRequest(9, "INBOUND", "COMPLETED");
        repo.SetupSequence(x => x.GetByIdAsync(9, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request)
            .ReturnsAsync(completed);

        var cmd = new ConfirmInventoryRequestCommand { Id = 9, StaffId = 5 };

        // Act
        var result = await handler.Handle(cmd, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        assetMock.Verify(x => x.CreateAsync(
            It.Is<RenterAsset>(a => a.AssetName == "Box A" && a.RenterId == 1),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    // ── UTC010 — Abnormal: StaffId = 0 → ArgumentException ───────────────────
    [Fact]
    public async Task UTC010_StaffIdZero_ThrowsArgumentException()
    {
        // Arrange
        var (handler, repo, _, _, warehouseMock, _, _) = BuildHandler();

        var request = MakeRequest(id: 10, type: "INBOUND", status: "CONFIRMED");
        repo.Setup(x => x.GetByIdAsync(10, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);
        warehouseMock.Setup(x => x.GetByIdAsync(1, It.IsAny<CancellationToken>()))
                     .ReturnsAsync(OpenWarehouse());

        var cmd = new ConfirmInventoryRequestCommand { Id = 10, StaffId = 0 };   // invalid StaffId

        // Act & Assert — spec expects ArgumentException for StaffId = 0
        await Assert.ThrowsAnyAsync<Exception>(() =>
            handler.Handle(cmd, CancellationToken.None));
    }
}
