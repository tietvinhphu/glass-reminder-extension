// entrypoints/popup/App.tsx
// Component gốc của popup extension
// AuthGate kiểm tra đăng nhập → hiện LoginScreen hoặc nội dung chính

import { AuthGate } from '../../src/popup/components/AuthGate';

function App() {
  return (
    // AuthGate tự động kiểm tra token trong storage
    // Nếu chưa đăng nhập → hiện LoginScreen
    // Nếu đã đăng nhập → hiện children (nội dung chính)
    <AuthGate>
      <div>
        {/* TODO Checkpoint 3: Thay bằng CalendarView */}
        <p>Đăng nhập thành công!</p>
      </div>
    </AuthGate>
  );
}

export default App;