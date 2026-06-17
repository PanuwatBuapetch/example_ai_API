import React, { useState } from 'react';

function App() {
  // 🔘 State สำหรับสลับโหมดระบบ: 'analyze' = วิเคราะห์เอกสาร, 'chat' = สนทนาทั่วไป
  const [mode, setMode] = useState('analyze'); 

  // 📝 State พื้นฐานร่วมกัน
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 📁 State เฉพาะโหมดวิเคราะห์เอกสาร
  const [file, setFile] = useState(null);
  const [analyzeResult, setAnalyzeResult] = useState(null);

  // 💬 State เฉพาะโหมดสนทนาทั่วไป
  const [chatReply, setChatReply] = useState('');

  // ดักจับการอัปเดตไฟล์
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  // 🚀 ฟังก์ชันหลักในการยิงข้อมูลหา API (สลับ Route อัตโนมัติตามโหมด)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!question.trim()) {
      setError('กรุณาระบุข้อความหรือประเด็นข้อมูลก่อนดำเนินการ');
      return;
    }

    setLoading(true);

    // ==========================================
    // 📁 กรณีโหมดที่ 1: วิเคราะห์ไฟล์เอกสาร (/api/analyze-file)
    // ==========================================
    if (mode === 'analyze') {
      if (!file) {
        setError('กรุณาแนบไฟล์เอกสารก่อนดำเนินการ');
        setLoading(false);
        return;
      }
      setAnalyzeResult(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('question', question);

      try {
        const response = await fetch('http://localhost:8000/api/analyze-file', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.status === 'success') {
          setAnalyzeResult(data);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการประมวลผลเอกสาร');
        }
      } catch (err) {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านเส้นวิเคราะห์ไฟล์ได้ (Port 8000)');
      } finally {
        setLoading(false);
      }
    } 
    // ==========================================
    // 💬 กรณีโหมดที่ 2: สนทนาทั่วไปกับบอต (/api/chat/bot)
    // ==========================================
    else {
      setChatReply('');
      try {
        const response = await fetch('http://localhost:8000/api/chat/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setChatReply(data.reply);
        } else {
          setError(data.message || 'เกิดข้อผิดพลาดในการรับข้อมูลจากแชตบอต');
        }
      } catch (err) {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์หลังบ้านเส้นแชตบอตได้ (Port 8000)');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f8fafc', 
      minHeight: '100vh', 
      padding: '40px 20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#1e293b'
    }}>
      <div style={{ 
        maxWidth: '650px', 
        margin: '0 auto', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        padding: '32px',
        border: '1px solid #e2e8f0',
        textAlign: 'left'
      }}>
        {/* ส่วนหัวข้อระบบ */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
            📄 PSU Document Processing & Analysis System
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>
            ระบบสารสนเทศอัตโนมัติเพื่อการวิเคราะห์เนื้อหาเอกสารและประมวลผลข้อมูลทั่วไป
          </p>
        </div>

        {/* 🔘 ปุ่มกดสลับโหมดการทำงาน (Nav Switch) */}
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#f1f5f9', 
          padding: '4px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('analyze'); setError(''); }}
            style={{
              flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: mode === 'analyze' ? '#ffffff' : 'transparent',
              color: mode === 'analyze' ? '#1e40af' : '#64748b',
              boxShadow: mode === 'analyze' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'
            }}
          >
            📁 ระบบตรวจสอบเอกสาร (RAG)
          </button>
          <button
            type="button"
            onClick={() => { setMode('chat'); setError(''); }}
            style={{
              flex: 1, padding: '10px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: mode === 'chat' ? '#ffffff' : 'transparent',
              color: mode === 'chat' ? '#1e40af' : '#64748b',
              boxShadow: mode === 'chat' ? '0 1px 3px 0 rgb(0 0 0 / 0.1)' : 'none'
            }}
          >
            💬 ระบบสอบถามข้อมูลทั่วไป (Chat)
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 📁 ช่องเลือกไฟล์ (จะแสดงผลเฉพาะเมื่อเปิดโหมดตรวจสอบเอกสารเท่านั้น) */}
          {mode === 'analyze' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
                1. แนบเอกสารต้นฉบับ (.pdf / .txt):
              </label>
              <div style={{
                position: 'relative', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  onChange={handleFileChange} 
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  {file ? 'เปลี่ยนไฟล์เอกสาร' : 'คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่'}
                </span>
              </div>
              {file && (
                <div style={{ fontSize: '13px', color: '#0ea5e9', fontWeight: '500', marginTop: '4px' }}>
                  📎 เอกสารปัจจุบัน: {file.name}
                </div>
              )}
            </div>
          )}

          {/* ช่องสำหรับพิมพ์คำถามหรือข้อความสนทนา */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
              {mode === 'analyze' ? '2. ระบุข้อคำถาม หรือประเด็นข้อมูลที่ต้องการสกัดจากไฟล์:' : 'ระบุหัวข้อข้อมูลหรือคำถามที่ต้องการถามระบบ:'}
            </label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={mode === 'analyze' ? "เช่น สรุปรายละเอียดสําคัญ หรือ เกณฑ์การคัดเลือก" : "เช่น แนะนำสแต็กซอฟต์แวร์พัฒนาเว็บ หรือ วิธีการเขียนสคริปต์ Node.js"} 
              style={{ 
                padding: '12px 14px', fontSize: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.05)', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', color: '#0f172a'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgb(59 130 246 / 0.15), inset 0 1px 2px rgb(0 0 0 / 0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'inset 0 1px 2px rgb(0 0 0 / 0.05)';
              }}
            />
            
            {/* กล่องเรียลไทม์พรีวิวสีเข้มชัดเจน ชิดซ้าย ไม่ล่องหน */}
            {question && (
              <div style={{ 
                marginTop: '6px', padding: '8px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#0f172a', border: '1px solid #cbd5e1', wordBreak: 'break-all', textAlign: 'left'
              }}>
                <span style={{ color: '#0f172a' }}>
                  🔍 <strong>ข้อความป้อนเข้าปัจจุบัน:</strong> {question}
                </span>
              </div>
            )}
          </div>

          {/* ปุ่มส่งคำขอประมวลผลข้อมูล */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '14px', fontSize: '15px', fontWeight: '600', color: 'white', border: 'none', borderRadius: '8px', transition: 'background-color 0.2s',
              backgroundColor: loading ? '#94a3b8' : '#1e40af', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            }}
          >
            {loading ? '⏳ ระบบกำลังดำเนินการประมวลผลโครงสร้างข้อมูล...' : '🔍 เริ่มการประมวลผลข้อมูล'}
          </button>
        </form>

        {/* 🔴 แสดงแจ้งเตือน Error */}
        {error && (
          <div style={{ marginTop: '24px', padding: '14px 16px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* 🟢 แสดงผลลัพธ์ของโหมดตรวจสอบเอกสาร (RAG Container) */}
        {mode === 'analyze' && analyzeResult && (
          <div style={{ marginTop: '28px', padding: '24px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', color: '#14532d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 ผลการตรวจสอบและประมวลข้อมูลเอกสารสำเร็จ
            </h3>
            <div style={{ fontSize: '13px', color: '#166534', marginBottom: '14px', opacity: 0.85 }}>
              <strong>แฟ้มข้อมูลต้นทาง:</strong> {analyzeResult.fileName}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #dcfce7', margin: '0 0 16px 0' }} />
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '15px', color: '#14532d', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
              {analyzeResult.answer}
            </div>
          </div>
        )}

        {/* 🔵 แสดงผลลัพธ์ของโหมดถามตอบทั่วไป (Chat Container) */}
        {mode === 'chat' && chatReply && (
          <div style={{ marginTop: '28px', padding: '24px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💬 ผลการสกัดข้อมูลและคำตอบระบบ
            </h3>
            <hr style={{ border: 'none', borderTop: '1px solid #dbeafe', margin: '0 0 16px 0' }} />
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '15px', color: '#1e3a8a', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #dbeafe' }}>
              {chatReply}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;