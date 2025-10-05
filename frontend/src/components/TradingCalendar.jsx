import React, { useState, useEffect, useContext } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import axios from "axios";
import { AuthContext, API } from "../App";

// Lokalisierung für react-big-calendar
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const TradingCalendar = () => {
  const { user } = useContext(AuthContext);
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const res = await axios.get(`${API}/trades`);
      setTrades(res.data);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    }
  };

  // Map Trades zu Calendar-Events
  const events = trades.map((trade) => {
    const tradeDate = new Date(trade.date);

    // Gewinn = grün, Verlust = rot, P&L = 0 = grau
    const backgroundColor =
      trade.pnl > 0 ? "green" : trade.pnl < 0 ? "red" : "gray";

    return {
      title: `${trade.pair} - ${trade.trade_type} - P&L: ${trade.pnl || 0}`,
      start: tradeDate,
      end: tradeDate,
      allDay: true,
      resource: trade,
      color: backgroundColor,
    };
  });

  // Custom Event Style
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.color || "blue",
        color: "white",
        borderRadius: "4px",
        padding: "2px",
        border: "none",
      },
    };
  };

  return (
    <div style={{ height: "500px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        eventPropGetter={eventStyleGetter}
        popup
      />
    </div>
  );
};

export default TradingCalendar;
