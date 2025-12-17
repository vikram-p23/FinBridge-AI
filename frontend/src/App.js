import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Paperclip, Send, Download, User, Shield, CreditCard, CheckCircle, FileText, LifeBuoy, LogOut, Phone, MessageSquare, XCircle, Bot, Lock, Unlock, ArrowLeft, Briefcase, Plus, Minus, Check, Headset, Calendar, Mail, Smartphone, RefreshCw, Landmark, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  // --- STATE MANAGEMENT ---
  const [view, setView] = useState("login");
  const [user, setUser] = useState(null); 
  const [bankAccount, setBankAccount] = useState(null);
  
  // Forms
  const [formData, setFormData] = useState({ userId: "", password: "", firstName: "", lastName: "", dob: "", phone: "", email: "", fatherName: "", aadhar: "", pan: "", address: "", accNum: "" });
  // Removed 'score' from initial state since we don't ask for it
  const [ccFormData, setCcFormData] = useState({ name: "", age: "", employment: "Salaried", income: "", loans: "No" });
  const [paymentAmount, setPaymentAmount] = useState(""); 
  
  // UI State
  const [passStrength, setPassStrength] = useState({ label: "", color: "#e2e8f0", width: "0%" });
  const [ccResult, setCcResult] = useState(null);
  const [showCardVisual, setShowCardVisual] = useState(false);

  const [service, setService] = useState("Customer Engagement");
  const [messages, setMessages] = useState([]);
  const [liveMessages, setLiveMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loanCategory, setLoanCategory] = useState(null);
  const [editingField, setEditingField] = useState(null); 
  const [tempValue, setTempValue] = useState(0);
  const messagesEndRef = useRef(null);

  const servicesList = [ { name: "Customer Engagement", icon: <User size={18}/> }, { name: "KYC Verification", icon: <Shield size={18}/> }, { name: "Credit Evaluation", icon: <CreditCard size={18}/> }, { name: "Bank Loan Approval", icon: <CheckCircle size={18}/> }, { name: "Generated PDF", icon: <FileText size={18}/> }, { name: "Help & Support", icon: <LifeBuoy size={18}/> } ];

  // --- EFFECTS ---
  useEffect(() => {
    const savedId = localStorage.getItem("finbridge_uid");
    if (savedId) {
      axios.post('http://127.0.0.1:8000/get_user', { user_id: savedId, password: "" }).then(res => { 
          if(res.data.status==="success") { 
              setUser({...res.data.user_data, id: savedId}); 
              setView("dashboard"); 
          } 
      });
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, liveMessages, isTyping]); 

  // --- UTILS ---
  const checkStrength = (pass) => {
      let strength = 0;
      if (pass.length > 7) strength++;
      if (/[A-Z]/.test(pass)) strength++;
      if (/[0-9]/.test(pass)) strength++;
      if (/[^A-Za-z0-9]/.test(pass)) strength++;
      if (strength <= 1) setPassStrength({ label: "Weak", color: "#ef4444", width: "33%" });
      else if (strength === 2 || strength === 3) setPassStrength({ label: "Medium", color: "#eab308", width: "66%" });
      else setPassStrength({ label: "Strong", color: "#22c55e", width: "100%" });
  };

  const generatePassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
      setFormData({...formData, password: pass});
      checkStrength(pass);
  };

  // --- AUTH HANDLERS ---
  const handleLogin = async () => {
    try { const res = await axios.post('http://127.0.0.1:8000/login', { user_id: formData.userId, password: formData.password }); 
    if (res.data.status === "success") { 
        setUser({ ...res.data.user_data, id: formData.userId }); 
        localStorage.setItem("finbridge_uid", formData.userId); 
        setView("dashboard"); 
    } else { alert("Invalid Credentials"); } } catch (e) { alert("Backend error"); }
  };

  const handleRegister = async () => { 
      if (!formData.firstName || !formData.lastName) return alert("Enter Full Name");
      if (!/^\d{10}$/.test(formData.phone)) return alert("Phone must be exactly 10 digits");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return alert("Invalid Email format");
      
      try { 
          const res = await axios.post('http://127.0.0.1:8000/register', { 
              first_name: formData.firstName, 
              last_name: formData.lastName,
              password: formData.password,
              dob: formData.dob,
              phone: formData.phone,
              email: formData.email
          }); 
          alert(res.data.message); 
          setFormData({ ...formData, password: "", userId: "" }); 
          setView("login"); 
      } catch (e) { alert("Registration Failed"); } 
  };

  const handleLogout = () => { localStorage.clear(); setView("login"); setUser(null); setMessages([]); setService("Customer Engagement"); };

  // --- BANKING HANDLERS ---
  const createBankAccount = async () => {
      if(!formData.fatherName || !formData.address) return alert("Please fill all fields.");
      
      if (!/^\d{12}$/.test(formData.aadhar)) return alert("⚠️ Invalid Aadhar.\nMust be exactly 12 digits.\nExample: 458912563258");
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(formData.pan.toUpperCase())) return alert("⚠️ Invalid PAN.\nFormat: 5 Letters, 4 Numbers, 1 Letter.\nExample: SDFYT4565T");

      const res = await axios.post('http://127.0.0.1:8000/create_bank_account', {
          user_id: user.id,
          father_name: formData.fatherName,
          aadhar: formData.aadhar,
          pan: formData.pan.toUpperCase(),
          address: formData.address
      });
      if(res.data.status === "success") {
          alert(`Account Created! Your Account Number is: ${res.data.account_number}`);
          setView("banking-home");
      }
  };

  const loginBankAccount = async () => {
      const res = await axios.post('http://127.0.0.1:8000/login_bank', {
          account_number: formData.accNum,
          dob: formData.dob
      });
      if(res.data.status === "success") {
          setBankAccount(res.data.bank_data);
          setUser({...user, ...res.data.user_data}); 
          setView("banking-dashboard");
      } else { alert("Invalid Account or DOB mismatch"); }
  };

  const handlePayment = async () => {
      const amount = parseFloat(paymentAmount);
      if(!amount || amount <= 0) return alert("Enter valid amount");
      
      const res = await axios.post('http://127.0.0.1:8000/pay', {
          account_number: bankAccount.account_number,
          amount: amount
      });
      
      if(res.data.status === "success") {
          const upiLink = `upi://pay?pa=9916698774@kotak811&pn=Vikram%20P&am=${amount}&cu=INR`;
          window.location.href = upiLink; 
          alert(`Redirecting to GPay...\nPaying ₹${amount} to Vikram P`);
          setBankAccount({...bankAccount, balance: res.data.new_balance});
          setView("banking-dashboard");
          setPaymentAmount("");
      } else {
          alert(res.data.message);
      }
  };

  const handleDownloadStatement = () => {
      window.open(`http://127.0.0.1:8000/download_statement/${user.id}`, '_blank');
  };

  // --- CREDIT CARD LOGIC ---
  const handleCCSubmit = () => {
      const { age, income, employment, loans } = ccFormData;
      const reasons = [];
      let eligible = true;

      // Simulate Credit Score internal check (700-850)
      const simulatedScore = Math.floor(Math.random() * (850 - 700 + 1)) + 700;

      if (parseInt(age) < 21) { eligible = false; reasons.push("Age is below 21 years."); }
      if (parseInt(income) < 20000) { eligible = false; reasons.push("Monthly income is below ₹20,000."); }
      if (employment === "Student" && parseInt(income) < 15000) { eligible = false; reasons.push("Income insufficient for Student profile."); }
      if (loans === "Yes" && simulatedScore < 750) { eligible = false; reasons.push("Existing loans check failed."); }

      const limit = parseInt(income) * 3; 
      setCcResult({ eligible, reasons, limit, cards: eligible ? ["FinBridge Silver", "FinBridge Gold"] : [] });
      setShowCardVisual(false); 
      setView("cc-result");
  };

  // --- NAVIGATION ---
  const openLoanChat = () => {
      setMessages([{ role: 'bot', text: `Welcome back, ${user?.first_name || user?.name}. How can we assist you today?` }]);
      setService("Customer Engagement");
      setView("loan-chat");
  };

  const switchService = (newService, isAuto = false) => {
    setService(newService);
    if (newService === "Live Agent Support") { setView("live-chat"); setLiveMessages([{ role: 'bot', text: "👩‍💼 Agent Sarah joined." }]); return; }
    if (newService === "Generated PDF") { setTimeout(() => sendMessage("auto_trigger", newService), 500); return; }
    if (newService === "Bank Loan Approval") { setTimeout(() => sendMessage("CHECK_STATUS_TRIGGER", newService), 500); return; }
    
    let msg = ""; if(newService === "Customer Engagement") msg = "Select: Secured or Unsecured."; else if(newService === "KYC Verification") msg = "Enter 12-digit Aadhar."; else if(newService === "Credit Evaluation") msg = "Enter PAN (ABCDE1234F)."; else msg = "How can we help?";
    if(isAuto) setMessages(prev => [...prev, { role: 'bot', text: msg }]); else setMessages(prev => [...prev, { role: 'system', text: `Switched to ${newService}.` }, { role: 'bot', text: msg }]);
  };

  const sendMessage = async (textInput = input, forceService = service) => {
    if (!textInput.trim()) return;
    if (textInput !== "CHECK_STATUS_TRIGGER" && textInput !== "auto_trigger") setMessages(prev => [...prev, { role: 'user', text: textInput }]);
    setInput(""); setIsTyping(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/chat', { message: textInput, user_id: user.id, service_mode: forceService });
      setTimeout(() => {
        setIsTyping(false);
        if (res.data.system_msgs) res.data.system_msgs.forEach(sysMsg => setMessages(prev => [...prev, { role: 'system-agent', text: sysMsg }]));
        setMessages(prev => [...prev, { role: 'bot', text: res.data.response }]);
        if (res.data.updated_user) setUser({ ...res.data.updated_user, id: user.id });
        if (res.data.next_stage) setTimeout(() => switchService(res.data.next_stage, true), 1500);
        if(textInput.toLowerCase().includes("back")) setLoanCategory(null);
      }, 800);
    } catch (e) { setIsTyping(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append("file", file);
    data.append("user_id", user.id);
    setMessages(prev => [...prev, { role: 'user', text: `📎 Uploading ${file.name}...` }]);
    setIsTyping(true);
    try {
        const res = await axios.post('http://127.0.0.1:8000/upload', data);
        setTimeout(() => { setIsTyping(false); setMessages(prev => [...prev, { role: 'bot', text: res.data.message }]); if(res.data.next_stage) setTimeout(() => switchService(res.data.next_stage, true), 1500); }, 1000);
    } catch (e) { setIsTyping(false); }
  };

  const sendLiveMessage = async () => {
    if (!input.trim()) return; setLiveMessages(prev => [...prev, { role: 'user', text: input }]);
    const txt = input; setInput(""); setIsTyping(true);
    try { const res = await axios.post('http://127.0.0.1:8000/chat', { message: txt, user_id: user.id, service_mode: "Live Agent Support" }); setTimeout(() => { setIsTyping(false); setLiveMessages(prev => [...prev, { role: 'bot', text: res.data.response }]); }, 1000); } catch (e) { setIsTyping(false); }
  };

  const startEditing = (field) => { setEditingField(field); setTempValue(field === 'amount' ? user.current_offer.amount : user.current_offer.tenure); };
  const adjustValue = (delta) => {
      let step = delta; if (editingField === 'amount') { const isSmall = tempValue < 100000; step = delta > 0 ? (isSmall ? 5000 : 50000) : (isSmall ? -5000 : -50000); }
      let newValue = tempValue + step;
      if (editingField === 'amount') { if (newValue < 5000) newValue = 5000; if (newValue > user.max_limit) { alert(`Max Limit: ₹${user.max_limit.toLocaleString()}`); return; } }
      if (editingField === 'tenure') { if (newValue < 6) newValue = 6; if (newValue > 60) { alert("Max Tenure: 60 Months"); return; } }
      setTempValue(newValue);
  };
  const confirmEdit = () => { setEditingField(null); sendMessage(editingField === 'amount' ? `Amount ${tempValue}` : `Tenure ${tempValue}`); };

  const renderQuickActions = () => {
    if (service === "Customer Engagement") {
        if (!loanCategory) return (<div className="quick-actions"><button onClick={()=>{setLoanCategory("Secured"); sendMessage("Secured Loan")}}><Lock size={14}/> Secured</button><button onClick={()=>{setLoanCategory("Unsecured"); sendMessage("Unsecured Loan")}}><Unlock size={14}/> Unsecured</button></div>);
        else if (loanCategory === "Secured") return (<div className="quick-actions"><button style={{background:'#f3f4f6', color:'#6b7280'}} onClick={()=>{setLoanCategory(null); sendMessage("Back")}}><ArrowLeft size={14}/> Back</button>{["Car Loan", "Home Loan", "Gold Loan"].map(l => <button key={l} onClick={()=>sendMessage(l)}>{l}</button>)}</div>);
        else return (<div className="quick-actions"><button style={{background:'#f3f4f6', color:'#6b7280'}} onClick={()=>{setLoanCategory(null); sendMessage("Back")}}><ArrowLeft size={14}/> Back</button><button onClick={()=>sendMessage("Personal Loan")}>Personal Loan</button></div>);
    }
    if (service === "Bank Loan Approval" && user?.loan_status === "PIVOT_OFFER") { return (<div className="quick-actions"><button style={{background:'#22c55e', color:'white'}} onClick={()=>sendMessage("Yes")}>Yes, Proceed</button><button style={{background:'#ef4444', color:'white'}} onClick={()=>sendMessage("No")}>No, Thanks</button></div>); }
    if (service === "Bank Loan Approval" && user?.loan_status === "NEGOTIATING") {
        if (editingField) return (<div className="quick-actions editor"><span className="editor-label">Edit {editingField}:</span><button className="icon-btn" onClick={()=>adjustValue(-1)}><Minus size={16}/></button><span className="value-display">{editingField==='amount'?`₹${tempValue.toLocaleString()}`:`${tempValue} Months`}</span><button className="icon-btn" onClick={()=>adjustValue(1)}><Plus size={16}/></button><button className="confirm-btn" onClick={confirmEdit}><Check size={16}/></button><button className="cancel-btn" onClick={()=>setEditingField(null)}><XCircle size={16}/></button></div>);
        return (<div className="quick-actions"><button style={{background:'#22c55e', color:'white'}} onClick={()=>sendMessage("Yes, Perfect")}>Lock Deal</button><button onClick={()=>startEditing('amount')}>Edit Amount</button><button onClick={()=>startEditing('tenure')}>Edit Tenure</button></div>);
    }
    if (service === "Help & Support") return (<div className="quick-actions"><button onClick={()=>sendMessage("Call")}><Phone size={14}/> Call</button><button onClick={()=>switchService("Live Agent Support")}><MessageSquare size={14}/> Chat</button></div>);
    return null;
  };

  // --- VIEWS ---
  if (view === "login") return <div className="overlay"><div className="card"><h2>FinBridge Login</h2><input placeholder="ID" value={formData.userId} onChange={e=>setFormData({...formData,userId:e.target.value})}/><input type="password" placeholder="Password" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})}/><button className="btn-primary" onClick={handleLogin}>Login</button><div className="toggle-link" onClick={()=>setView("register")}>Create Account</div></div></div>;
  
  if (view === "register") return (
    <div className="overlay">
        <div className="card register-card glass-panel">
            <h2 className="card-title">Create Account</h2>
            <div className="form-row">
                <div className="input-group half"><User size={18}/><input placeholder="First Name" value={formData.firstName} onChange={e=>setFormData({...formData,firstName:e.target.value})}/></div>
                <div className="input-group half"><User size={18}/><input placeholder="Last Name" value={formData.lastName} onChange={e=>setFormData({...formData,lastName:e.target.value})}/></div>
            </div>
            <div className="input-group"><Calendar size={18}/><input type="date" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
            <div className="input-group"><Smartphone size={18}/><input placeholder="Phone (10 Digits)" maxLength="10" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})}/></div>
            <div className="input-group"><Mail size={18}/><input placeholder="Email (@gmail.com)" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})}/></div>
            <div className="pass-group">
                <div className="input-group pass-input"><Lock size={18}/><input type="password" placeholder="Create Password" value={formData.password} onChange={e=>{setFormData({...formData,password:e.target.value}); checkStrength(e.target.value);}}/></div>
                <button className="gen-btn" onClick={generatePassword} title="Generate Strong Password"><RefreshCw size={16}/></button>
            </div>
            <div className="strength-bar-bg"><div className="strength-bar-fill" style={{width:passStrength.width, background:passStrength.color}}></div></div>
            <div className="strength-text" style={{color: passStrength.color}}>{passStrength.label}</div>
            <button className="btn-primary register-btn" onClick={handleRegister}>Register</button>
            <div className="toggle-link" onClick={()=>setView("login")}>Back to Login</div>
        </div>
    </div>
  );

  if (view === "dashboard") return (
      <div className="overlay">
          <div className="dashboard-container">
              <div className="dash-header"><div>Welcome, {user?.first_name || user?.name}</div><button className="logout-btn-red" onClick={handleLogout}><LogOut size={16}/> Logout</button></div>
              <div className="dash-grid">
                  <div className="dash-card" onClick={()=>setView("banking-home")}>
                      <div className="icon-box"><Landmark size={32}/></div>
                      <h3>Banking</h3>
                      <p>View accounts & transactions</p>
                  </div>
                  <div className="dash-card" onClick={()=>{setView("cc-apply"); setShowCardVisual(false);}}>
                      <div className="icon-box"><CreditCard size={32}/></div>
                      <h3>Credit Cards</h3>
                      <p>Apply & Manage Cards</p>
                  </div>
                  <div className="dash-card active" onClick={openLoanChat}>
                      <div className="icon-box"><Briefcase size={32}/></div>
                      <h3>Loans</h3>
                      <p>Apply for new loans instantly</p>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- BANKING VIEWS ---
  if (view === "banking-home") return (
      <div className="overlay">
          <div className="card">
              <h2>Banking Services</h2>
              <button className="btn-primary" style={{marginBottom:'10px'}} onClick={()=>setView("banking-create")}>Open New Account</button>
              <button className="btn-primary" style={{backgroundColor:'#fff', color:'#000', border:'1px solid #000'}} onClick={()=>setView("banking-login")}>Login to Existing Account</button>
              <div className="toggle-link" onClick={()=>setView("dashboard")}>Back to Dashboard</div>
          </div>
      </div>
  );

  if (view === "banking-create") return (
      <div className="overlay">
          <div className="card">
              <h2>Open Account</h2>
              <div className="input-group"><User size={16}/><input placeholder="Full Name" value={user?.name} readOnly style={{opacity:0.7}}/></div>
              <div className="input-group"><User size={16}/><input placeholder="Father's Name" value={formData.fatherName} onChange={e=>setFormData({...formData,fatherName:e.target.value})}/></div>
              <div className="input-group"><Calendar size={16}/><input type="date" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
              <div className="input-group"><Shield size={16}/><input placeholder="Aadhar Number" value={formData.aadhar} onChange={e=>setFormData({...formData,aadhar:e.target.value})}/></div>
              <div className="input-group"><CreditCard size={16}/><input placeholder="PAN Number" value={formData.pan} onChange={e=>setFormData({...formData,pan:e.target.value})}/></div>
              <div className="input-group"><Landmark size={16}/><input placeholder="Address" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})}/></div>
              <button className="btn-primary" onClick={createBankAccount}>Create Account</button>
              <div className="toggle-link" onClick={()=>setView("banking-home")}>Cancel</div>
          </div>
      </div>
  );

  if (view === "banking-login") return (
      <div className="overlay">
          <div className="card">
              <h2>Bank Login</h2>
              <div className="input-group"><CreditCard size={16}/><input placeholder="Account Number" value={formData.accNum} onChange={e=>setFormData({...formData,accNum:e.target.value})}/></div>
              <div className="input-group"><Calendar size={16}/><input type="date" value={formData.dob} onChange={e=>setFormData({...formData,dob:e.target.value})}/></div>
              <button className="btn-primary" onClick={loginBankAccount}>Login</button>
              <div className="toggle-link" onClick={()=>setView("banking-home")}>Back</div>
          </div>
      </div>
  );

  if (view === "banking-dashboard") return (
      <div className="overlay">
          <div className="dashboard-container banking-dash">
              <div className="dash-header"><div>Banking Dashboard</div><button className="logout-btn-red" onClick={()=>setView("dashboard")}><LogOut size={16}/> Exit</button></div>
              <div className="bank-grid">
                  <div className="bank-card">
                      <h3>Account Summary</h3>
                      <div className="detail-row"><span>Name:</span> {user?.name}</div>
                      <div className="detail-row"><span>Acc No:</span> {bankAccount?.account_number}</div>
                      <div className="detail-row"><span>IFSC:</span> FINB0001234</div>
                      <div className="balance-box">₹ {bankAccount?.balance?.toLocaleString()}</div>
                      <button className="btn-primary" style={{marginTop:'15px', padding:'8px', fontSize:'0.9rem'}} onClick={handleDownloadStatement}><Download size={14}/> Download Statement</button>
                  </div>
                  <div className="bank-card">
                      <h3>Active Loans</h3>
                      {user?.loan_status === "APPROVED" ? (
                          <div className="loan-active">
                              <div>{user?.selected_loan}</div>
                              <div className="loan-amt">₹{user?.current_offer?.amount?.toLocaleString()}</div>
                              <div className="loan-status">Active</div>
                          </div>
                      ) : <div className="no-loan">No Active Loans</div>}
                  </div>
                  <div className="bank-card qr-card" onClick={() => setView("banking-pay")}>
                      <h3>Scan to Pay</h3>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=9916698774@kotak811&pn=Vikram%20P`} alt="QR Code" style={{cursor: 'pointer'}} />
                      <div className="qr-hint">Click QR to Pay via GPay</div>
                  </div>
              </div>
          </div>
      </div>
  );

  // --- PAYMENT VIEW ---
  if (view === "banking-pay") return (
      <div className="overlay">
          <div className="card">
              <h2>Quick Payment</h2>
              <div className="detail-row"><span>Paying To:</span> <strong>Vikram P</strong></div>
              <div className="detail-row"><span>UPI ID:</span> 9916698774@kotak811</div>
              <div className="input-group" style={{marginTop:'20px'}}>
                  <span style={{marginRight:'10px', fontSize:'1.2rem'}}>₹</span>
                  <input placeholder="Enter Amount" type="number" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} autoFocus />
              </div>
              <button className="btn-primary" onClick={handlePayment}>Pay Now (GPay)</button>
              <div className="toggle-link" onClick={()=>setView("banking-dashboard")}>Cancel</div>
          </div>
      </div>
  );

  // --- UPDATED: MODERN CREDIT CARD APPLICATION VIEW ---
  if (view === "cc-apply") return (
      <div className="overlay">
          <div className="cc-form-card glass-panel">
              <h2 className="card-title">Apply for Credit Card</h2>
              <p className="cc-subtitle">Fill in details to check instant eligibility</p>
              
              <div className="cc-form-grid">
                  <div className="cc-input-group"><User size={18}/><input placeholder="Full Name" value={ccFormData.name} onChange={e=>setCcFormData({...ccFormData,name:e.target.value})}/></div>
                  <div className="cc-input-group"><Calendar size={18}/><input placeholder="Age (Yrs)" type="number" value={ccFormData.age} onChange={e=>setCcFormData({...ccFormData,age:e.target.value})}/></div>
                  
                  <div className="cc-input-group">
                      <Briefcase size={18}/>
                      <select value={ccFormData.employment} onChange={e=>setCcFormData({...ccFormData,employment:e.target.value})}>
                          <option value="Salaried">Salaried</option>
                          <option value="Self-employed">Self-employed</option>
                          <option value="Student">Student</option>
                      </select>
                  </div>

                  <div className="cc-input-group"><span style={{fontSize:'1.2rem', fontWeight:'bold'}}>₹</span><input placeholder="Monthly Income" type="number" value={ccFormData.income} onChange={e=>setCcFormData({...ccFormData,income:e.target.value})}/></div>
                  
                  <div className="cc-input-group">
                      <Shield size={18}/>
                      <span className="cc-label">Existing Loans?</span>
                      <select value={ccFormData.loans} onChange={e=>setCcFormData({...ccFormData,loans:e.target.value})} style={{width:'auto', flexGrow:1}}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                      </select>
                  </div>
                  {/* SCORE INPUT REMOVED - INTERNAL SIMULATION USED */}
              </div>

              <button className="btn-primary register-btn" onClick={handleCCSubmit}>Check Now</button>
              <div className="toggle-link" onClick={()=>setView("dashboard")}>Cancel</div>
          </div>
      </div>
  );

  // --- UPDATED: MODERN CREDIT CARD RESULT VIEW ---
  if (view === "cc-result") return (
      <div className="overlay">
          <div className="card glass-panel" style={{textAlign:'center', maxWidth:'500px'}}>
              {ccResult?.eligible ? (
                  <AnimatePresence>
                    {!showCardVisual ? (
                        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <CheckCircle size={64} color="#22c55e" style={{marginBottom:'15px'}}/>
                            <h2 style={{color:'#22c55e', marginBottom:'10px'}}>Pre-Approved!</h2>
                            <p style={{color:'#64748b', marginBottom:'20px'}}>You are eligible for the following premium cards:</p>
                            <div style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'25px'}}>
                                {ccResult.cards.map(c => <div key={c} className="cc-badge">{c}</div>)}
                            </div>
                            <div className="balance-box" style={{fontSize:'1.8rem', background:'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color:'white'}}>
                                <small style={{fontSize:'0.9rem', opacity:0.8, display:'block'}}>Approved Limit</small>
                                ₹{ccResult.limit.toLocaleString()}
                            </div>
                            {/* --- BUTTONS --- */}
                            <button className="btn-secondary" style={{marginTop:'20px', width:'100%'}} onClick={()=>setShowCardVisual(true)}>View Your Card</button>
                            <button className="btn-primary" style={{marginTop:'10px', width:'100%'}} onClick={()=>setView("dashboard")}>Exit</button>
                        </motion.div>
                    ) : (
                        <motion.div initial={{rotateY:90}} animate={{rotateY:0}} transition={{duration:0.5}}>
                             <h3 style={{marginBottom:'20px'}}>Your FinBridge Signature Card</h3>
                             {/* --- VISUAL CREDIT CARD --- */}
                             <div className="visual-cc-container">
                                 <div className="visual-cc">
                                     <div className="cc-chip-row">
                                         <div className="cc-chip"></div>
                                         <Wifi color="white" size={24} style={{opacity:0.8}}/>
                                     </div>
                                     <div className="cc-number">•••• •••• •••• 4582</div>
                                     <div className="cc-info-row">
                                         <div className="cc-holder">
                                             <span>CARD HOLDER</span>
                                             <div>{ccFormData.name.toUpperCase() || "YOUR NAME"}</div>
                                         </div>
                                         <div className="cc-expiry">
                                             <span>EXPIRES</span>
                                             <div>12/28</div>
                                         </div>
                                     </div>
                                     <div className="cc-brand">FinBridge Signature</div>
                                 </div>
                             </div>
                             <button className="btn-secondary" style={{marginTop:'20px', width:'100%'}} onClick={()=>setShowCardVisual(false)}>Back to Offer</button>
                        </motion.div>
                    )}
                  </AnimatePresence>
              ) : (
                  <>
                      <XCircle size={64} color="#ef4444" style={{marginBottom:'20px'}}/>
                      <h2 style={{color:'#ef4444'}}>Application Declined</h2>
                      <div className="cc-reasons-box">
                          <strong>Reasons:</strong>
                          <ul>{ccResult.reasons.map((r,i) => <li key={i}>{r}</li>)}</ul>
                      </div>
                      <button className="btn-primary" style={{marginTop:'20px', background:'#000'}} onClick={()=>setView("cc-apply")}>Try Again</button>
                      <div className="toggle-link" onClick={()=>setView("dashboard")} style={{marginTop:'20px'}}>Exit to Dashboard</div>
                  </>
              )}
          </div>
      </div>
  );

  if (view === "live-chat") return <div className="overlay live-mode"><div className="live-chat-box glass-panel"><div className="live-header"><div style={{display:'flex', gap:'10px', alignItems:'center'}}><Headset size={24}/> Live Support</div><button className="end-btn" onClick={()=>{setView("loan-chat"); setService("Customer Engagement");}}>End Chat</button></div><div className="messages live">{liveMessages.map((m,i)=><div key={i} className={`msg-bubble ${m.role}`}>{m.text}</div>)}{isTyping&&<div className="msg-bubble bot">Typing...</div>}<div ref={messagesEndRef}/></div><div className="input-box live-input"><input value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter' && sendLiveMessage()} placeholder="Type message..." /><button className="send-btn black-btn" onClick={sendLiveMessage}><Send size={20}/></button></div></div></div>;

  return (
    <div className="overlay">
      <div className="chat-container glass-panel">
        <div className="sidebar">
          <div className="brand"><Briefcase size={28}/> FinBridge</div>
          <div className="user-card"><div>{user?.first_name || user?.name}</div><div>Score: {user?.credit_score || "---"}</div></div>
          <div className="menu">{servicesList.map(s => <button key={s.name} className={service===s.name?"active":""} onClick={()=>switchService(s.name)}>{s.icon} {s.name}</button>)}</div>
          <button className="logout-btn" onClick={()=>setView("dashboard")}><ArrowLeft size={16}/> Dashboard</button>
        </div>
        <div className="chat-area">
          <div className="chat-header black-header"><Bot size={20} style={{marginRight:'10px'}}/> {service}</div>
          <div className="messages">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className={`msg-row ${m.role}`}>
                  <div className={`msg-bubble ${m.role}`}>
                    {m.text.startsWith("DOWNLOAD_FILE:") ? <button className="download-btn" onClick={()=>window.open(`http://127.0.0.1:8000/download/${m.text.split(":")[1]}`, '_blank')}><Download size={16}/> Download Sanction Letter</button> : m.text.split('\n').map((l,j)=><div key={j}>{l}</div>)}
                  </div>
                </motion.div>
              ))}
              {isTyping && <div className="msg-row bot"><div className="msg-bubble bot typing"><span></span><span></span><span></span></div></div>}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          {renderQuickActions()}
          <div className="input-box">
             <label className="upload-icon" title="Upload PDF"><Paperclip size={20} /><input type="file" hidden accept="application/pdf" onChange={handleFileUpload} /></label>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage()} placeholder="Type here..." />
            <button className="send-btn black-btn" onClick={() => sendMessage()}><Send size={20}/></button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;