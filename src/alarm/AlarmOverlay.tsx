import { useState, useEffect, useCallback } from "react";
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
      beep(now, 880);        // A5
      beep(now + 0.22, 880); // A5
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

/**
 * Cửa sổ alarm overlay — hiện tất cả sự kiện pending cùng lúc,
 * rung lắc, có âm thanh, tự refresh khi có alarm mới được thêm
 */
export const AlarmOverlay = () => {
  const [alarms, setAlarms] = useState<PendingAlarm[]>([]);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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

  // Đóng cửa sổ sau khi tất cả đã xác nhận
  useEffect(() => {
    if (allDone) {
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

  if (loading || alarms.length === 0) {
    return (
      <div className="alarm-overlay">
        <div className="alarm-card">
          <span className="alarm-icon">⏰</span>
          <p className="alarm-loading-text">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alarm-overlay">
      <div className="alarm-card">
        <span className="alarm-icon">⏰</span>

        {alarms.length > 1 && (
          <p className="alarm-count-badge">{alarms.length} sự kiện cùng lúc</p>
        )}

        <div className="alarm-list">
          {alarms.map((alarm) => {
            const isConfirmed = confirmedIds.has(alarm.reminderId);
            return (
              <div
                key={alarm.reminderId}
                className={`alarm-item${isConfirmed ? " alarm-item--confirmed" : ""}`}
              >
                <div className="alarm-item-info">
                  <span className="alarm-title">{alarm.data.title}</span>
                  <span className="alarm-time">
                    {formatDatetime(alarm.data.datetime)}
                  </span>
                  {alarm.data.note && (
                    <span className="alarm-note">{alarm.data.note}</span>
                  )}
                </div>
                <button
                  className="alarm-confirm-btn alarm-confirm-btn--small"
                  type="button"
                  onClick={() => void confirmOne(alarm.reminderId)}
                  disabled={isConfirmed}
                >
                  {isConfirmed ? "✓" : "Xác nhận"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="alarm-reopen-hint">
          Tự mở lại sau 2 phút nếu chưa xác nhận
        </p>

        {alarms.length > 1 ? (
          <button
            className="alarm-confirm-btn alarm-confirm-btn--all"
            type="button"
            onClick={() => void confirmAll()}
            disabled={allDone}
          >
            ✓ Xác nhận tất cả ({pendingAlarms.length})
          </button>
        ) : (
          <button
            className="alarm-confirm-btn"
            type="button"
            onClick={() => void confirmOne(alarms[0].reminderId)}
            disabled={confirmedIds.has(alarms[0].reminderId)}
          >
            ✓ Đã xác nhận
          </button>
        )}
      </div>
    </div>
  );
};
