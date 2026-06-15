import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import browser from "webextension-polyfill";

/** Data của một alarm đang pending xác nhận */
interface PendingAlarmData {
  title: string;
  note: string;
  datetime: number;
}

/** Một alarm trong danh sách pending */
interface PendingAlarm {
  reminderId: string;
  data: PendingAlarmData;
}

const PENDING_PREFIX = "alarm:pending:";

/** Format unix timestamp (ms) thành chuỗi ngày giờ tiếng Việt */
const formatDatetime = (ms: number): string =>
  new Date(ms).toLocaleString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Đọc tất cả pending alarm từ storage, sắp xếp theo giờ */
const loadAllPendingAlarms = async (): Promise<PendingAlarm[]> => {
  const all = await browser.storage.local.get(null);
  return Object.entries(all)
    .filter(([key]) => key.startsWith(PENDING_PREFIX))
    .map(([key, value]) => ({
      reminderId: key.slice(PENDING_PREFIX.length),
      data: value as PendingAlarmData,
    }))
    .sort((a, b) => a.data.datetime - b.data.datetime);
};

/** Phát âm thanh báo thức dạng 3 beep (A5-A5-E6), lặp mỗi 3 giây */
const useAlarmSound = (active: boolean) => {
  useEffect(() => {
    if (!active) return;

    const audioCtx = new AudioContext();
    let isActive = true;

    const beep = (time: number, freq: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      osc.start(time);
      osc.stop(time + 0.15);
    };

    const playPattern = () => {
      if (!isActive) return;
      const now = audioCtx.currentTime;
      beep(now, 880);         // A5
      beep(now + 0.22, 880);  // A5
      beep(now + 0.44, 1320); // E6 — nốt cao hơn ở cuối
    };

    playPattern();
    const interval = setInterval(playPattern, 3000);

    return () => {
      isActive = false;
      clearInterval(interval);
      void audioCtx.close();
    };
  }, [active]);
};

/** Spring animation cho card — xuất hiện từ dưới lên với bounce nhẹ */
const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
};

/** Stagger variants cho từng phần tử bên trong card */
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Cửa sổ alarm overlay — hiện tất cả sự kiện pending cùng lúc,
 * có âm thanh, tự refresh khi có alarm mới được thêm
 */
export const AlarmOverlay = () => {
  const [alarms, setAlarms] = useState<PendingAlarm[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  const pendingAlarms = alarms.filter((a) => !confirmedIds.has(a.reminderId));
  const allDone = alarms.length > 0 && pendingAlarms.length === 0;

  // Âm thanh chỉ phát khi còn alarm chưa xác nhận
  useAlarmSound(pendingAlarms.length > 0 && !loading);

  const loadAlarms = useCallback(async () => {
    const pending = await loadAllPendingAlarms();
    setAlarms(pending);
    setLoading(false);
    if (pending.length === 0) globalThis.close();
  }, []);

  // Focus cửa sổ alarm ngay khi mở để nhảy lên trên cùng
  useEffect(() => {
    globalThis.focus();
  }, []);

  useEffect(() => {
    void loadAlarms();

    // Lắng nghe storage để tự refresh khi alarm mới được thêm vào
    const onStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
    ) => {
      const hasNew = Object.keys(changes).some(
        (k) => k.startsWith(PENDING_PREFIX) && changes[k].newValue !== undefined,
      );
      if (hasNew) void loadAlarms();
    };

    browser.storage.onChanged.addListener(onStorageChange);
    return () => browser.storage.onChanged.removeListener(onStorageChange);
  }, [loadAlarms]);

  // Gửi message về background để resize cửa sổ khớp với nội dung thực tế
  useEffect(() => {
    if (alarms.length === 0) return;
    const timer = setTimeout(() => {
      const cardEl = document.querySelector(".alert-card");
      if (!cardEl) return;
      // 60px = padding overlay + OS chrome title bar
      const neededHeight = (cardEl as HTMLElement).offsetHeight + 60;
      browser.runtime.sendMessage({ type: "RESIZE_WINDOW", height: neededHeight })
        .catch(() => {}); // bỏ qua nếu SW chưa sẵn sàng
    }, 120);
    return () => clearTimeout(timer);
  }, [alarms.length]);

  // Đóng cửa sổ sau khi tất cả đã xác nhận (delay nhỏ cho animation exit)
  useEffect(() => {
    if (allDone) {
      setVisible(false);
      const t = setTimeout(() => globalThis.close(), 300);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  /** Xác nhận một alarm, thông báo background hủy recheck */
  const confirmOne = async (reminderId: string) => {
    try {
      await browser.runtime.sendMessage({ type: "ALARM_CONFIRMED", reminderId });
    } catch (err) {
      console.error("[Glass Reminder] ALARM_CONFIRMED failed:", err);
    }
    setConfirmedIds((prev) => new Set(prev).add(reminderId));
  };

  /** Xác nhận tất cả alarm cùng lúc */
  const confirmAll = async () => {
    for (const alarm of pendingAlarms) {
      try {
        await browser.runtime.sendMessage({
          type: "ALARM_CONFIRMED",
          reminderId: alarm.reminderId,
        });
      } catch {
        // tiếp tục với cái tiếp theo
      }
    }
    setConfirmedIds(new Set(alarms.map((a) => a.reminderId)));
  };

  /** Đóng cửa sổ mà không xác nhận — alarm sẽ tự mở lại sau 2 phút */
  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => globalThis.close(), 250);
  };

  // Khi đang loading, vẫn show card đơn giản để resize hoạt động
  if (loading || alarms.length === 0) {
    return (
      <div className="alarm-overlay">
        <div className="alert-card">
          <span className="alert-loading-text">{"Đang tải..."}</span>
        </div>
      </div>
    );
  }

  const firstAlarm = alarms[0];
  const isMulti = alarms.length > 1;
  const mainTitle = isMulti
    ? `${alarms.length} nhắc nhở cùng lúc`
    : firstAlarm.data.title;

  return (
    <div className="alarm-overlay">
      <AnimatePresence>
        {visible && (
          <motion.div
            className="alert-card"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alertdialog"
            aria-live="assertive"
          >
            {/* Nút dismiss — đóng mà không xác nhận */}
            <motion.button
              type="button"
              className="alert-dismiss-btn"
              aria-label="Đóng, nhắc lại sau"
              onClick={handleDismiss}
              variants={itemVariants}
            >
              <X size={14} />
            </motion.button>

            {/* Icon chuông với pulse animation */}
            <div className="alert-icon-wrap" aria-hidden="true">
              <span className="alert-icon-inner">
                <Bell size={22} color="#fff" />
              </span>
            </div>

            {/* Tiêu đề */}
            <motion.h3 className="alert-title" variants={itemVariants}>
              {mainTitle}
            </motion.h3>

            {/* Single alarm: thời gian + ghi chú */}
            {!isMulti && (
              <motion.div variants={itemVariants}>
                <p className="alert-time">{formatDatetime(firstAlarm.data.datetime)}</p>
                {firstAlarm.data.note && (
                  <span className="alert-note">{firstAlarm.data.note}</span>
                )}
                <p className="alert-hint">{"Tự mở lại sau 2 phút nếu chưa xác nhận"}</p>
              </motion.div>
            )}

            {/* Multi-alarm: danh sách từng sự kiện */}
            {isMulti && (
              <motion.div variants={itemVariants}>
                <p className="alert-hint alert-hint--multi">
                  {"Tự mở lại sau 2 phút nếu chưa xác nhận"}
                </p>
                <ul className="alert-list">
                  {alarms.map((alarm) => {
                    const isConfirmed = confirmedIds.has(alarm.reminderId);
                    return (
                      <li
                        key={alarm.reminderId}
                        className={`alert-item${isConfirmed ? " alert-item--confirmed" : ""}`}
                      >
                        <div className="alert-item-info">
                          <span className="alert-item-title">{alarm.data.title}</span>
                          <span className="alert-item-time">
                            {formatDatetime(alarm.data.datetime)}
                          </span>
                          {alarm.data.note && (
                            <span className="alert-item-note">{alarm.data.note}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="alert-item-btn"
                          onClick={() => void confirmOne(alarm.reminderId)}
                          disabled={isConfirmed}
                        >
                          {isConfirmed ? "✓" : "OK"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}

            {/* Nút CTA chính */}
            <motion.button
              type="button"
              className="alert-confirm-btn"
              onClick={() => void (isMulti ? confirmAll() : confirmOne(firstAlarm.reminderId))}
              disabled={isMulti ? allDone : confirmedIds.has(firstAlarm.reminderId)}
              variants={itemVariants}
            >
              {isMulti
                ? `✓ Xác nhận tất cả (${pendingAlarms.length})`
                : "Đã hiểu"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
