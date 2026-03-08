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
<br></br>
            <Link to="/warehouse-new/6">
        <button>Xem thử Warehouse ID = 6</button>
   
      </Link>
   <br></br>
                  <Link to="/warehouse-new/7">
        <button>Xem thử Warehouse ID = 7</button>
      </Link>

   <br></br>


            <Link to="/my-warehouses">
        <button>Danh sách kho của tôi</button>
      </Link>
    </div>

    
  );
}

export default Dashboard;