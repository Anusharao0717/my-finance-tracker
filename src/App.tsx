import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Moon,
  Plus,
  Pencil,
  Trash2,
  Wallet,
  X,
  Sun
} from 'lucide-react';
import type { Category, Payment } from './types';
import { defaultMonth, loadData, monthKey, saveData } from './storage';
import { cancelPaymentReminder, schedulePaymentReminder, setupNotifications } from './notifications';

const CATEGORIES: Category[] = ['Loans', 'Credit Cards', 'Gold Loans', 'Household', 'Other'];

const money = (n: number) =>
  `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });
};

const getMonthKeyOffset = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return monthKey(d);
};

function App() {
  const [data, setData] = useState(loadData);
  const [currentMonth, setCurrentMonth] = useState(monthKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  const month = data.months[currentMonth] ?? defaultMonth();

  useEffect(() => {
    if (!data.months[currentMonth]) {
      const next = {
        ...data,
        months: { ...data.months, [currentMonth]: defaultMonth() }
      };
      setData(next);
      saveData(next);
    }
  }, [currentMonth]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.darkMode);
    setupNotifications();
  }, [data.darkMode]);

  const totals = useMemo(() => {
    const total = month.payments.reduce((s, p) => s + p.amount, 0);
    const paid = month.payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
    const pending = total - paid;
    const remaining = month.income - pending;
    const progress = total ? Math.round((paid / total) * 100) : 0;
    return { total, paid, pending, remaining, progress };
  }, [month]);

  const updateMonth = (patch: Partial<typeof month>) => {
    const next = {
      ...data,
      months: {
        ...data.months,
        [currentMonth]: { ...month, ...patch }
      }
    };
    setData(next);
    saveData(next);
  };

  const togglePaid = async (payment: Payment) => {
    const updated = { ...payment, paid: !payment.paid };
    updateMonth({
      payments: month.payments.map(p => p.id === payment.id ? updated : p)
    });

    const [year, m] = currentMonth.split('-').map(Number);
    if (updated.paid) {
      await cancelPaymentReminder(updated, year, m);
    } else {
      await schedulePaymentReminder(updated, year, m);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const savePayment = async (payment: Payment) => {
    const exists = month.payments.some(p => p.id === payment.id);
    const payments = exists
      ? month.payments.map(p => p.id === payment.id ? payment : p)
      : [...month.payments, payment];

    updateMonth({ payments });

    const [year, m] = currentMonth.split('-').map(Number);
    if (payment.paid) {
      await cancelPaymentReminder(payment, year, m);
    } else {
      await schedulePaymentReminder(payment, year, m);
    }

    setModalOpen(false);
    setEditingId(null);
  };

  const deletePayment = async (payment: Payment) => {
    if (!confirm(`Delete "${payment.name}"?`)) return;
    updateMonth({
      payments: month.payments.filter(p => p.id !== payment.id)
    });
    const [year, m] = currentMonth.split('-').map(Number);
    await cancelPaymentReminder(payment, year, m);
  };

  const resetMonth = () => {
    if (!confirm('Reset this month to the default payments?')) return;
    const next = {
      ...data,
      months: { ...data.months, [currentMonth]: defaultMonth() }
    };
    setData(next);
    saveData(next);
  };

  const enableNotifications = async () => {
    await setupNotifications();
    setNotificationMessage('Payment reminders are enabled when Android permission is granted.');
    setTimeout(() => setNotificationMessage(''), 3500);
  };

  const previousMonth = () => {
    const d = new Date(currentMonth + '-01T00:00:00');
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(monthKey(d));
  };

  const nextMonth = () => {
    const d = new Date(currentMonth + '-01T00:00:00');
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(monthKey(d));
  };

  const grouped = CATEGORIES
    .map(category => ({
      category,
      payments: month.payments.filter(p => p.category === category)
    }))
    .filter(g => g.payments.length);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">PERSONAL FINANCE</div>
          <h1>My Finance</h1>
          <p>Track every payment in one place</p>
        </div>
        <button className="iconButton" onClick={() => setData({ ...data, darkMode: !data.darkMode })}>
          {data.darkMode ? <Sun size={21} /> : <Moon size={21} />}
        </button>
      </header>

      <section className="monthBar">
        <button className="iconButton small" onClick={previousMonth}><ChevronLeft size={19} /></button>
        <div className="monthName">{monthLabel(currentMonth)}</div>
        <button className="iconButton small" onClick={nextMonth}><ChevronRight size={19} /></button>
      </section>

      <section className="hero">
        <div className="heroLabel">MONEY LEFT</div>
        <div className="heroAmount">{money(totals.remaining)}</div>

        <div className="summaryGrid">
          <Summary label="Income" value={money(month.income)} />
          <Summary label="Bills" value={money(totals.total)} />
          <Summary label="Pending" value={money(totals.pending)} />
        </div>

        <div className="progressHeader">
          <span>Payment progress</span>
          <strong>{totals.progress}%</strong>
        </div>
        <div className="progressTrack">
          <div className="progressFill" style={{ width: `${Math.min(100, totals.progress)}%` }} />
        </div>
      </section>

      <section className="card">
        <div className="sectionTitle">
          <div>
            <h2>Monthly Income</h2>
            <p>Set your available income for this month.</p>
          </div>
          <Wallet size={22} />
        </div>
        <div className="incomeRow">
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={month.income || ''}
            placeholder="Enter income"
            onChange={e => updateMonth({ income: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
      </section>

      {grouped.map(group => (
        <section className="categorySection" key={group.category}>
          <div className="categoryHeader">
            <h2>{group.category}</h2>
            <span>{money(group.payments.reduce((s, p) => s + p.amount, 0))}</span>
          </div>

          <div className="paymentList">
            {group.payments.map(payment => (
              <article className={`payment ${payment.paid ? 'paid' : ''}`} key={payment.id}>
                <button className={`check ${payment.paid ? 'checked' : ''}`} onClick={() => togglePaid(payment)}>
                  {payment.paid && <Check size={15} />}
                </button>

                <div className="paymentInfo">
                  <strong>{payment.name}</strong>
                  <div className="paymentMeta">
                    <span>{payment.dueDay ? `Due ${payment.dueDay}${ordinal(payment.dueDay)}` : 'Monthly'}</span>
                    <span className={`status ${payment.paid ? 'paid' : 'pending'}`}>
                      {payment.paid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="paymentRight">
                  <strong>{money(payment.amount)}</strong>
                  <div className="actions">
                    <button onClick={() => openEdit(payment.id)} aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => deletePayment(payment)} aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <button className="addButton" onClick={openAdd}>
        <Plus size={19} /> Add Payment
      </button>

      <button className="reminderButton" onClick={enableNotifications}>
        <Bell size={18} /> Enable payment reminders
      </button>

      <button className="resetButton" onClick={resetMonth}>
        Reset this month
      </button>

      {notificationMessage && <div className="toast">{notificationMessage}</div>}

      {modalOpen && (
        <PaymentModal
          payment={editingId ? month.payments.find(p => p.id === editingId) ?? null : null}
          onClose={() => { setModalOpen(false); setEditingId(null); }}
          onSave={savePayment}
        />
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="summaryItem">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function PaymentModal({
  payment,
  onClose,
  onSave
}: {
  payment: Payment | null;
  onClose: () => void;
  onSave: (payment: Payment) => void;
}) {
  const [name, setName] = useState(payment?.name ?? '');
  const [category, setCategory] = useState<Category>(payment?.category ?? 'Other');
  const [amount, setAmount] = useState(String(payment?.amount ?? ''));
  const [dueDay, setDueDay] = useState(payment?.dueDay ? String(payment.dueDay) : '');
  const [note, setNote] = useState(payment?.note ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericAmount = Math.max(0, Number(amount) || 0);
    const dayNumber = dueDay ? Number(dueDay) : null;

    if (!name.trim()) {
      alert('Please enter a payment name.');
      return;
    }

    if (dayNumber !== null && (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31)) {
      alert('Due day must be between 1 and 31.');
      return;
    }

    onSave({
      id: payment?.id ?? crypto.randomUUID(),
      name: name.trim(),
      category,
      amount: numericAmount,
      dueDay: dayNumber,
      paid: payment?.paid ?? false,
      note
    });
  };

  return (
    <div className="modalBackdrop" onMouseDown={e => e.currentTarget === e.target && onClose()}>
      <form className="modal" onSubmit={submit}>
        <div className="modalHeader">
          <h2>{payment ? 'Edit Payment' : 'Add Payment'}</h2>
          <button type="button" className="close" onClick={onClose}><X size={19} /></button>
        </div>

        <label>Payment name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Example: School fee" autoFocus />

        <label>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value as Category)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>

        <label>Amount</label>
        <input type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" />

        <label>Due day</label>
        <input type="number" min="1" max="31" inputMode="numeric" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="Example: 10" />

        <label>Note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" rows={3} />

        <div className="modalActions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">Save Payment</button>
        </div>
      </form>
    </div>
  );
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}

export default App;