import React, { useEffect, useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { de };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function TradingCalendar() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trades`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        const formatted = data.map((trade) => ({
          id: trade.id,
          title: `${trade.pair} (${trade.trade_type})`,
          start: new Date(trade.date),
          end: new Date(trade.date),
          allDay: true,
          resource: trade,
        }));

        setTrades(formatted);
      } catch (error) {
        console.error("Fehler beim Laden der Trades:", error);
      }
    };

    fetchTrades();
  }, []);

  const events = useMemo(() => trades, [trades]);

  const handleSelectEvent = (event) => {
    const t = event.resource;
    alert(
      `📈 Trade Details:\n\n` +
        `Paar: ${t.pair}\n` +
        `Typ: ${t.trade_type}\n` +
        `Eintritt: ${t.entry_price}\n` +
        `Austritt: ${t.exit_price || "Noch offen"}\n` +
        `PnL: ${t.pnl || 0}`
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Trading Kalender</h2>
      <div style={{ height: "80vh", background: "white", borderRadius: "12px", padding: "10px" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          onSelectEvent={handleSelectEvent}
          views={["month", "week", "day"]}
          popup
        />
      </div>
    </div>
  );
}

