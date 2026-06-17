import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // 📁 1. ดักจับการเลือกไฟล์จากเครื่อง
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  // 🚀 2. ฟังก์ชันส่งข้อมูลไปที่ API Backend
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('กรุณาเลือกไฟล์เอกสารก่อนดำเนินการ');
      return;
    }
    if (!question.trim()) {
      setError('กรุณาระบุหัวข้อหรือประเด็นที่ต้องการตรวจสอบ');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

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
        setResult(data);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในระบบการประมวลผลข้อมูล');
      }
    } catch (err) {
      console.error('❌ Frontend Error:', err);
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ปลายทางได้ กรุณาตรวจสอบการรันระบบหลังบ้าน (Port 8000)');
    } finally {
      setLoading(false);
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
        textAlign: 'left' // บังคับโครงสร้างหลักให้ชิดซ้ายเพื่อความบาลานซ์
      }}>
        {/* ส่วนหัวข้อระบบ: เน้นภาษาทางการ */}
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
            📄 PSU Document Processing & Analysis System
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0' }}>
            ระบบสกัดข้อมูลและตรวจสอบเนื้อหาเอกสารอัตโนมัติ (รองรับโครงสร้างไฟล์ .pdf / .txt)
          </p>
        </div>
        
        <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* ช่องเลือกไฟล์ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
              1. แนบเอกสารต้นฉบับ:
            </label>
            <div style={{
              position: 'relative',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center', // บังคับให้ข้อความในกล่องลากวางอยู่ตรงกลางเพื่อความสวยงาม
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <input 
                type="file" 
                accept=".pdf,.txt" 
                onChange={handleFileChange} 
                style={{
                  position: 'absolute',
                  top: 0, left: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer'
                }}
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

          {/* ช่องพิมพ์คำถาม + กล่องพรีวิวเวอร์ชันแก้ไขทางกายภาพ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
              2. ระบุข้อคำถาม หรือประเด็นข้อมูลที่ต้องการสกัด:
            </label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น สรุปรายละเอียดสําคัญ, ตรวจสอบคุณสมบัติผู้สมัคร หรือ เกณฑ์การคัดเลือก" 
              style={{ 
                padding: '12px 14px', 
                fontSize: '15px', 
                border: '1px solid #cbd5e1', 
                borderRadius: '8px',
                outline: 'none',
                backgroundColor: '#ffffff',
                boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.05)',
                transition: 'all 0.2s',
                width: '100%',
                boxSizing: 'border-box',
                color: '#0f172a' // ล็อกสีข้อความใน input หลักเป็นสีเข้ม
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
            
            {/* 💡 กล่องเรียลไทม์พรีวิวฉบับแก้ไข: สีเข้มชัดเจน ชิดซ้าย ไม่ล่องหน */}
            {question && (
              <div style={{ 
                marginTop: '6px', 
                padding: '8px 12px', 
                backgroundColor: '#e2e8f0', // ใช้สีเทาเข้ม Slate เพื่อตัดกับตัวอักษร
                borderRadius: '6px', 
                fontSize: '13px', 
                color: '#0f172a',           // บังคับสไตล์ข้อความภายนอกให้เป็นสีดำเข้ม
                border: '1px solid #cbd5e1',
                wordBreak: 'break-all',
                textAlign: 'left'           // ดึงคำกลับมาชิดซ้ายตรงแนวกล่อง input
              }}>
                <span style={{ color: '#0f172a' }}>
                  🔍 <strong>ข้อความค้นหาปัจจุบัน:</strong> {question}
                </span>
              </div>
            )}
          </div>

          {/* ปุ่มกดส่ง */}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '14px', 
              fontSize: '15px', 
              fontWeight: '600',
              backgroundColor: loading ? '#94a3b8' : '#1e40af', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '⏳ ระบบกำลังประมวลผลและสกัดข้อมูลจากเอกสาร...' : '🔍 เริ่มการประมวลผลข้อมูล'}
          </button>
        </form>

        {/* 🔴 แสดงแจ้งเตือน Error */}
        {error && (
          <div style={{ 
            marginTop: '24px', 
            padding: '14px 16px', 
            backgroundColor: '#fef2f2', 
            color: '#991b1b', 
            borderRadius: '8px', 
            border: '1px solid #fca5a5',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 🟢 แสดงผลลัพธ์สำเร็จจากระบบ */}
        {result && (
          <div style={{ 
            marginTop: '28px', 
            padding: '24px', 
            backgroundColor: '#f0fdf4', 
            color: '#166534', 
            borderRadius: '10px', 
            border: '1px solid #bbf7d0' 
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', color: '#14532d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📊 ผลการวิเคราะห์และตรวจสอบสำเร็จ
            </h3>
            <div style={{ fontSize: '13px', color: '#166534', marginBottom: '14px', opacity: 0.85 }}>
              <strong>แฟ้มข้อมูลต้นทาง:</strong> {result.fileName}
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #dcfce7', margin: '0 0 16px 0' }} />
            <div style={{ 
              whiteSpace: 'pre-line', 
              lineHeight: '1.6', 
              fontSize: '15px', 
              color: '#14532d',
              backgroundColor: '#ffffff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #dcfce7'
            }}>
              {result.answer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;