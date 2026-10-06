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
  Sun,
  CircleDollarSign,
  ArrowDownLeft,
  History,
  CalendarDays
} from 'lucide-react';
import type { Category, Credit, Payment } from './types';
import { defaultMonth, loadData, monthKey, saveData } from './storage';
import { cancelPaymentReminder, schedulePaymentReminder, setupNotifications } from './notifications';

const CATEGORIES: Category[] = ['Loans', 'Driver Payments', 'Credit Cards', 'Gold Loans', 'Maintenance', 'Insurance', 'Household', 'Other'];

const money = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const dateLabel = (value?: string) => value
  ? new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '';

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

function App() {
  const [data, setData] = useState(loadData);
  const [currentMonth, setCurrentMonth] = useState(monthKey());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingCreditId, setEditingCreditId] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  const month = data.months[currentMonth] ?? defaultMonth();

  useEffect(() => {
    if (!data.months[currentMonth]) {
      const next = { ...data, months: { ...data.months, [currentMonth]: defaultMonth() } };
      setData(next);
      saveData(next);
    }
  }, [currentMonth, data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.darkMode);
    setupNotifications();
  }, [data.darkMode]);

  const totals = useMemo(() => {
    const bills = month.payments.reduce((s, p) => s + p.amount, 0);
    const paid = month.payments.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
    const pending = bills - paid;
    const receivedCredits = month.credits.filter(c => c.received).reduce((s, c) => s + c.amount, 0);
    const pendingCredits = month.credits.filter(c => !c.received).reduce((s, c) => s + c.amount, 0);
    const receivedIncome = month.incomeReceived ? month.income : 0;
    const available = receivedIncome + receivedCredits - paid;
    const afterAllBills = receivedIncome + receivedCredits - bills;
    const progress = bills ? Math.round((paid / bills) * 100) : 0;
    return { bills, paid, pending, receivedCredits, pendingCredits, receivedIncome, available, afterAllBills, progress };
  }, [month]);

  const updateMonth = (patch: Partial<typeof month>) => {
    const next = { ...data, months: { ...data.months, [currentMonth]: { ...month, ...patch } } };
    setData(next);
    saveData(next);
  };

  const togglePaid = async (payment: Payment) => {
    const nextPaid = !payment.paid;
    const updated = {
      ...payment,
      paid: nextPaid,
      paidDate: nextPaid ? (payment.paidDate || todayKey()) : undefined
    };
    updateMonth({ payments: month.payments.map(p => p.id === payment.id ? updated : p) });
    const [year, m] = currentMonth.split('-').map(Number);
    if (updated.paid) await cancelPaymentReminder(updated, year, m);
    else await schedulePaymentReminder(updated, year, m);
  };

  const savePayment = async (payment: Payment) => {
    const exists = month.payments.some(p => p.id === payment.id);
    const payments = exists ? month.payments.map(p => p.id === payment.id ? payment : p) : [...month.payments, payment];
    updateMonth({ payments });
    const [year, m] = currentMonth.split('-').map(Number);
    if (payment.paid) await cancelPaymentReminder(payment, year, m);
    else await schedulePaymentReminder(payment, year, m);
    setPaymentModalOpen(false);
    setEditingPaymentId(null);
  };

  const deletePayment = async (payment: Payment) => {
    if (!confirm(`Delete "${payment.name}"?`)) return;
    updateMonth({ payments: month.payments.filter(p => p.id !== payment.id) });
    const [year, m] = currentMonth.split('-').map(Number);
    await cancelPaymentReminder(payment, year, m);
  };

  const saveCredit = (credit: Credit) => {
    const exists = month.credits.some(c => c.id === credit.id);
    const credits = exists ? month.credits.map(c => c.id === credit.id ? credit : c) : [...month.credits, credit];
    updateMonth({ credits });
    setCreditModalOpen(false);
    setEditingCreditId(null);
  };

  const deleteCredit = (credit: Credit) => {
    if (!confirm(`Delete credit "${credit.name}"?`)) return;
    updateMonth({ credits: month.credits.filter(c => c.id !== credit.id) });
  };

  const resetMonth = () => {
    if (!confirm('Reset this month to the default payments? This will also remove credits and income for this month.')) return;
    const next = { ...data, months: { ...data.months, [currentMonth]: defaultMonth() } };
    setData(next);
    saveData(next);
  };

  const enableNotifications = async () => {
    await setupNotifications();
    setNotificationMessage('Payment reminders are enabled when Android permission is granted.');
    setTimeout(() => setNotificationMessage(''), 3500);
  };

  const changeMonth = (offset: number) => {
    const d = new Date(currentMonth + '-01T00:00:00');
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(monthKey(d));
  };

  const grouped = CATEGORIES.map(category => ({
    category,
    payments: month.payments.filter(p => p.category === category)
  })).filter(g => g.payments.length);

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="eyebrow">PERSONAL FINANCE</div>
          <h1>My Finance</h1>
          <p>Track income, credits and every payment</p>
        </div>
        <button className="iconButton" onClick={() => { const next = { ...data, darkMode: !data.darkMode }; setData(next); saveData(next); }}>
          {data.darkMode ? <Sun size={21} /> : <Moon size={21} />}
        </button>
      </header>

      <section className="monthBar">
        <button className="iconButton small" onClick={() => changeMonth(-1)}><ChevronLeft size={19} /></button>
        <div className="monthName">{monthLabel(currentMonth)}</div>
        <button className="iconButton small" onClick={() => changeMonth(1)}><ChevronRight size={19} /></button>
      </section>

      <section className="hero">
        <div className="heroLabel">AVAILABLE BALANCE</div>
        <div className="heroAmount">{money(totals.available)}</div>
        <div className="summaryGrid">
          <Summary label="Income" value={money(totals.receivedIncome)} />
          <Summary label="Credits" value={money(totals.receivedCredits)} />
          <Summary label="Paid" value={money(totals.paid)} />
        </div>
        <div className="balanceHint">After all listed bills: <strong>{money(totals.afterAllBills)}</strong></div>
        <div className="progressHeader"><span>Payment progress</span><strong>{totals.progress}%</strong></div>
        <div className="progressTrack"><div className="progressFill" style={{ width: `${Math.min(100, totals.progress)}%` }} /></div>
      </section>

      <section className="card">
        <div className="sectionTitle">
          <div><h2>Monthly Income</h2><p>Add your salary or regular monthly income.</p></div>
          <Wallet size={22} />
        </div>
        <div className="incomeRow">
          <input type="number" min="0" inputMode="decimal" value={month.income || ''} placeholder="Enter monthly income"
            onChange={e => updateMonth({ income: Math.max(0, Number(e.target.value) || 0) })} />
          <label className="receiveCheck">
            <input type="checkbox" checked={month.incomeReceived} onChange={e => updateMonth({ incomeReceived: e.target.checked })} />
            <span>Income received this month</span>
          </label>
        </div>
      </section>

      <section className="card creditCard">
        <div className="sectionTitle">
          <div><h2>Credits / Money Received</h2><p>Track money credited to you apart from monthly income.</p></div>
          <CircleDollarSign size={22} />
        </div>
        <div className="creditSummary">
          <span>Received <strong>{money(totals.receivedCredits)}</strong></span>
          <span>Pending <strong>{money(totals.pendingCredits)}</strong></span>
        </div>
        {month.credits.length > 0 && (
          <div className="creditList">
            {month.credits.map(credit => (
              <article className={`credit ${credit.received ? 'received' : ''}`} key={credit.id}>
                <div className="creditIcon"><ArrowDownLeft size={17} /></div>
                <div className="paymentInfo">
                  <strong>{credit.name}</strong>
                  <div className="paymentMeta">
                    {credit.date && <span>{new Date(credit.date + 'T00:00:00').toLocaleDateString('en-IN')}</span>}
                    <span className={`status ${credit.received ? 'paid' : 'pending'}`}>{credit.received ? 'Received' : 'Pending'}</span>
                  </div>
                </div>
                <div className="paymentRight">
                  <strong className="creditAmount">+{money(credit.amount)}</strong>
                  <div className="actions">
                    <button onClick={() => { setEditingCreditId(credit.id); setCreditModalOpen(true); }} aria-label="Edit credit"><Pencil size={15} /></button>
                    <button onClick={() => deleteCredit(credit)} aria-label="Delete credit"><Trash2 size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <button className="addButton" onClick={() => { setEditingCreditId(null); setCreditModalOpen(true); }}><Plus size={19} /> Add Credit / Money Received</button>
      </section>

      {grouped.map(group => (
        <section className="categorySection" key={group.category}>
          <div className="categoryHeader"><h2>{group.category}</h2><span>{money(group.payments.reduce((s, p) => s + p.amount, 0))}</span></div>
          <div className="paymentList">
            {group.payments.map(payment => (
              <article className={`payment ${payment.paid ? 'paid' : ''}`} key={payment.id}>
                <button className={`check ${payment.paid ? 'checked' : ''}`} onClick={() => togglePaid(payment)}>{payment.paid && <Check size={15} />}</button>
                <div className="paymentInfo">
                  <strong>{payment.name}</strong>
                  <div className="paymentMeta">
                    <span>{payment.dueDay ? `Due ${payment.dueDay}${ordinal(payment.dueDay)}` : 'No due date'}</span>
                    <span className={`status ${payment.paid ? 'paid' : 'pending'}`}>{payment.paid ? 'Paid' : 'Pending'}</span>
                    {payment.paid && payment.paidDate && <span>Paid on {dateLabel(payment.paidDate)}</span>}
                  </div>
                </div>
                <div className="paymentRight"><strong>{money(payment.amount)}</strong><div className="actions"><button onClick={() => { setEditingPaymentId(payment.id); setPaymentModalOpen(true); }} aria-label="Edit"><Pencil size={15} /></button><button onClick={() => deletePayment(payment)} aria-label="Delete"><Trash2 size={15} /></button></div></div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <button className="addButton" onClick={() => { setEditingPaymentId(null); setPaymentModalOpen(true); }}><Plus size={19} /> Add Payment</button>

      <section className="card historyCard">
        <div className="sectionTitle">
          <div><h2>Payment History</h2><p>See what you paid and the actual date it was paid.</p></div>
          <History size={22} />
        </div>
        {month.payments.filter(p => p.paid).length === 0 ? (
          <div className="emptyHistory">No payments marked as paid yet.</div>
        ) : (
          <div className="historyList">
            {[...month.payments].filter(p => p.paid).sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || '')).map(payment => (
              <div className="historyRow" key={payment.id}>
                <div><strong>{payment.name}</strong><span>{payment.dueDay ? `Due ${payment.dueDay}${ordinal(payment.dueDay)}` : 'No due date'} · Paid {dateLabel(payment.paidDate)}</span></div>
                <strong>{money(payment.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="reminderButton" onClick={enableNotifications}><Bell size={18} /> Enable payment reminders</button>
      <button className="resetButton" onClick={resetMonth}>Reset this month</button>

      {notificationMessage && <div className="toast">{notificationMessage}</div>}

      {paymentModalOpen && <PaymentModal payment={editingPaymentId ? month.payments.find(p => p.id === editingPaymentId) ?? null : null} onClose={() => { setPaymentModalOpen(false); setEditingPaymentId(null); }} onSave={savePayment} />}
      {creditModalOpen && <CreditModal credit={editingCreditId ? month.credits.find(c => c.id === editingCreditId) ?? null : null} onClose={() => { setCreditModalOpen(false); setEditingCreditId(null); }} onSave={saveCredit} />}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="summaryItem"><span>{label}</span><strong>{value}</strong></div>;
}

function PaymentModal({ payment, onClose, onSave }: { payment: Payment | null; onClose: () => void; onSave: (payment: Payment) => void; }) {
  const [name, setName] = useState(payment?.name ?? '');
  const [category, setCategory] = useState<Category>(payment?.category ?? 'Other');
  const [amount, setAmount] = useState(String(payment?.amount ?? ''));
  const [dueDay, setDueDay] = useState(payment?.dueDay ? String(payment.dueDay) : '');
  const [note, setNote] = useState(payment?.note ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Math.max(0, Number(amount) || 0);
    const dayNumber = dueDay ? Number(dueDay) : null;
    if (!name.trim()) return alert('Please enter a payment name.');
    if (dayNumber !== null && (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31)) return alert('Due day must be between 1 and 31.');
    onSave({
      id: payment?.id ?? crypto.randomUUID(),
      name: name.trim(),
      category,
      amount: numericAmount,
      dueDay: dayNumber,
      paid: payment?.paid ?? false,
      paidDate: payment?.paid ? (payment.paidDate || todayKey()) : undefined,
      note
    });
  };

  return <div className="modalBackdrop" onMouseDown={e => e.currentTarget === e.target && onClose()}><form className="modal" onSubmit={submit}>
    <div className="modalHeader"><h2>{payment ? 'Edit Payment' : 'Add Payment'}</h2><button type="button" className="close" onClick={onClose}><X size={19} /></button></div>
    <label>Payment name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Example: School fee" autoFocus />
    <label>Category</label><select value={category} onChange={e => setCategory(e.target.value as Category)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
    <label>Amount</label><input type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" />
    <label>Due day</label><input type="number" min="1" max="31" inputMode="numeric" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="Example: 10" />
    {payment?.paid && <><label>Paid date</label><div className="dateField"><CalendarDays size={16} /><input type="date" value={payment.paidDate || todayKey()} readOnly /></div></>}
    <label>Note</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" rows={3} />
    <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary">Save Payment</button></div>
  </form></div>;
}

function CreditModal({ credit, onClose, onSave }: { credit: Credit | null; onClose: () => void; onSave: (credit: Credit) => void; }) {
  const [name, setName] = useState(credit?.name ?? '');
  const [amount, setAmount] = useState(String(credit?.amount ?? ''));
  const [received, setReceived] = useState(credit?.received ?? true);
  const [date, setDate] = useState(credit?.date ?? '');
  const [note, setNote] = useState(credit?.note ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter the credit source/name.');
    const numericAmount = Math.max(0, Number(amount) || 0);
    if (!numericAmount) return alert('Please enter a credit amount.');
    onSave({ id: credit?.id ?? crypto.randomUUID(), name: name.trim(), amount: numericAmount, received, date, note });
  };

  return <div className="modalBackdrop" onMouseDown={e => e.currentTarget === e.target && onClose()}><form className="modal" onSubmit={submit}>
    <div className="modalHeader"><h2>{credit ? 'Edit Credit' : 'Add Credit'}</h2><button type="button" className="close" onClick={onClose}><X size={19} /></button></div>
    <p className="modalHelp">Use this for money credited to you, such as a refund, transfer, rental income, bonus or other received amount.</p>
    <label>Credit name / source</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Example: Bonus / Refund / Transfer" autoFocus />
    <label>Amount</label><input type="number" min="0" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" />
    <label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} />
    <label className="receiveCheck modalCheck"><input type="checkbox" checked={received} onChange={e => setReceived(e.target.checked)} /><span>Amount received / credited</span></label>
    <label>Note</label><textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note" rows={3} />
    <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary">Save Credit</button></div>
  </form></div>;
}

function ordinal(n: number) {
  if (n >= 11 && n <= 13) return 'th';
  return n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
}

export default App;
