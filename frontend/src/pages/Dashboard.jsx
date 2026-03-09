import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <Link to="/create-warehouse">
        <button>Tạo Kho Mới</button>
      </Link>
      <br />
      <Link to="/create-staff">
        <button>Tạo Nhân Viên</button>
      </Link>
      <br />
      <Link to="/warehouse-new/1">
        <button>Xem thử Warehouse ID = 1</button>
      </Link>
      <br />
      <Link to="/warehouse-new/2">
        <button>Xem thử Warehouse ID = 2</button>
      </Link>
      <br />
      <Link to="/warehouse-new/3">
        <button>Xem thử Warehouse ID = 3</button>
      </Link>
      <br />
      <Link to="/warehouse-new/4">
        <button>Xem thử Warehouse ID = 4</button>
      </Link>
      <br />
      <Link to="/warehouse-new/5">
        <button>Xem thử Warehouse ID = 5</button>
      </Link>
      <br />
      <Link to="/my-warehouses">
        <button>Danh sách kho của tôi</button>
      </Link>

      <br /><br />
      <h3>Quản lý thuê kho</h3>
      <Link to="/my-rental-requests">
        <button>Yêu cầu thuê của tôi</button>
      </Link>
      <br />
      <Link to="/pending-rental-requests">
        <button>Yêu cầu chờ duyệt (Chủ kho)</button>
      </Link>
    </div>

    
  );
}

export default Dashboard;