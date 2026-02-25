import { Outlet } from "react-router-dom";

function MainLayout() {
    return (
        <div style={{ display: "flex" }}>
            <aside style={{ width: "200px", background: "#eee" }}>
                Sidebar
            </aside>

            <div style={{ flex: 1 }}>
                <header style={{ background: "#ddd", padding: "10px" }}>
                    Header
                </header>

                <main style={{ padding: "20px" }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;