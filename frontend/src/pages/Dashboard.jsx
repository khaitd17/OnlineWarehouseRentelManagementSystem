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
    </div>
  );
}

export default Dashboard;