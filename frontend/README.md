จัดให้แบบม้วนเดียวจบครับภูมิ! นี่คือไฟล์ **`README.md` เวอร์ชันสมบูรณ์แบบที่สุด** ที่รวมเอาโค้ดชุดล่าสุดที่เราปรับแก้ทั้ง **ระบบ 2 โหมด (RAG & Chat)**, **การแก้บั๊กชื่อไฟล์ไทยต่างดาว**, **การล็อกสีข้อความพรีวิวไม่ให้ล่องหน** และ **โมเดลระดับท็อป Llama 3.3 70B** เอาไว้ในที่เดียว

ภูมิสามารถคัดลอกโค้ดทั้งหมดในกล่องด้านล่างนี้ ไปวางทับในไฟล์ `README.md` ที่อยู่นอกสุดของโปรเจกต์ (Root Directory) ได้เลยครับ เวลาเปิดหน้าแรกใน GitHub โค้ดทั้งหมดจะโชว์เด่นเป็นระเบียบพร้อมใช้งานทันทีครับ!

---

```markdown
# 📄 PSU Document Processing & Analysis System (Full-Stack Setup)

ระบบสารสนเทศอัตโนมัติเพื่อการสกัดข้อมูล วิเคราะห์เนื้อหาเอกสารภาษาไทย (RAG) และระบบสนทนาประมวลผลข้อมูลทั่วไป พัฒนาขึ้นเพื่อเป็นระบบต้นแบบของสำนักนวัตกรรมดิจิทัลและระบบอัจฉริยะ มหาวิทยาลัยสงขลานครินทร์

---

## 🛠️ โครงสร้างสถาปัตยกรรม (System Architecture)
- **Frontend:** React.js (Single Page Application) โหมดสลับเงื่อนไข RAG/Chat พร้อมระบบตรวจจับข้อความ Real-time Preview ชิดซ้ายชัดเจน
- **Backend:** Node.js v24 (Express) รูปแบบ Native ESM (ECMAScript Modules) บริหารระบบไฟล์ชั่วคราวด้วย `multer` และลบไฟล์ขยะทันทีเมื่อสกัดเสร็จ
- **AI Core Engine:** `HfInference API` ประมวลผลร่วมกับโมเดลเรือธงระดับสากล `meta-llama/Llama-3.3-70B-Instruct`

---

## 💻 1. Source Code หลังบ้าน (`backend/server.js`)

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { HfInference } from '@huggingface/inference';

// 💡 เรียกใช้โมดูลที่แปลงโครงสร้างมารองรับ ESM เรียบร้อยแล้ว
import pdfParse from 'pdf-parse-fork'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const hf = new HfInference(process.env.HUGGINGFACE_TOKEN || "");

app.use(cors({ origin: ['http://localhost:5173', '[http://127.0.0.1:5173](http://127.0.0.1:5173)'] }));
app.use(express.json());

// 📁 ตั้งค่าการเก็บไฟล์ชั่วคราวไว้ในโฟลเดอร์ uploads/
const upload = multer({ dest: 'uploads/' });

// =========================================================================
// 🚀 ROUTE 1: /api/analyze-file (สกัดและวิเคราะห์ไฟล์เอกสาร PDF/TXT ด้วย RAG)
// =========================================================================
app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
  try {
    const { question } = req.body; 
    const file = req.file;         

    if (!file) {
      return res.status(400).json({ status: 'fail', message: 'กรุณาอัปโหลดไฟล์เอกสาร (คีย์: file)' });
    }
    if (!question) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ status: 'fail', message: 'กรุณาระบุคำถาม (คีย์: question)' });
    }

    console.log(`📂 ได้รับไฟล์สำเร็จ: ${file.originalname} (${file.mimetype})`);

    let extractedContext = "";

    if (file.mimetype === 'application/pdf') {
      const fileBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(fileBuffer); 
      let rawText = pdfData.text || "";
      // 💡 ทำความสะอาดข้อความภาษาไทย ยุบช่องว่างที่ตัดคำแปลกๆ จาก PDF ให้กลับมาต่อกัน
      extractedContext = rawText.replace(/\s+/g, ' ').trim(); 
      console.log("📝 ข้อความจาก PDF ที่สกัดและทำความสะอาดแล้ว:\n", extractedContext);
    } 
    else if (file.mimetype === 'text/plain') {
      extractedContext = fs.readFileSync(file.path, 'utf-8');
    } 
    else {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ status: 'fail', message: 'ระบบรองรับเฉพาะไฟล์ PDF และ TXT เท่านั้น' });
    }

    // 🧹 ลบไฟล์ออกจากเซิร์ฟเวอร์ทันทีเมื่อสกัดข้อความเสร็จสิ้น (AI Governance & Privacy)
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    console.log("🔍 [RAG System] กำลังส่งข้อมูลข้อความจากไฟล์ไปให้ AI วิเคราะห์...");

    const response = await hf.chatCompletion({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        {
          role: 'system',
          content: `คุณคือ AI ผู้ช่วยวิเคราะห์เอกสารประจำสำนักนวัตกรรมดิจิทัลฯ ม.สงขลานครินทร์ จงอ่านข้อความจากเอกสาร (Context) ที่กำหนดให้อย่างละเอียด แล้วตอบคำถามของผู้ใช้อย่างกระชับ ตรงประเด็น และแม่นยำที่สุด
          
          💡 คำแนะนำการประมวลผลภาษาไทย:
          - ข้อมูลในเอกสารอาจมีการเว้นวรรคแปลกๆ หรือสะกดต่างไปเล็กน้อย ให้พยายามตีความคำใกล้เคียง เช่น หากถามหา "เงินเดือน" ให้ควบคู่ไปกับการมองหาคำว่า "อัตรา", "ค่าตอบแทน", "บาท" หรือตัวเลขที่เกี่ยวข้องในบริบท
          - ให้พยายามหาคำตอบอย่างสุดความสามารถจากบริบทที่มีอยู่
          - หากพิจารณาและวิเคราะห์อย่างถี่ถ้วนแล้ว "ไม่มี" ข้อมูลใดๆ ที่เกี่ยวข้องใน Context จริงๆ เท่านั้น จึงค่อยตอบว่า "ไม่ทราบข้อมูล"
          
          Context: ${extractedContext}`
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 1000,
      temperature: 0.2, // ปรับให้คิดคำตอบนิ่ง ตรงตามเอกสารที่สุด
    });

    const answer = response.choices[0]?.message?.content;
    // 💡 แก้บั๊กชื่อไฟล์ไทยต่างดาว (Encoding Fix) จาก ISO-8859-1 กลับเป็น UTF-8
    const cleanFileName = Buffer.from(file.originalname, 'latin1').toString('utf8'); 
    
    return res.json({
      status: 'success',
      fileName: cleanFileName,
      answer: answer ? answer.trim() : 'ไม่สามารถประมวลผลคำตอบได้'
    });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('❌ Error หลังบ้าน (/api/analyze-file):', error.message);
    return res.status(500).json({ 
      status: 'error', 
      message: `เกิดข้อผิดพลาดในระบบวิเคราะห์ไฟล์: ${error.message}` 
    });
  }
});

// =========================================================================
// 💬 ROUTE 2: /api/chat/bot (ระบบพูดคุย ถาม-ตอบทั่วไปแบบอิสระ)
// =========================================================================
app.post('/api/chat/bot', async (req, res) => {
  try {
    const { message, history } = req.body; 

    if (!message || !message.trim()) {
      return res.status(400).json({ status: 'fail', message: 'กรุณาระบุข้อความที่ต้องการสนทนา (คีย์: message)' });
    }

    console.log(`💬 ได้รับข้อความแชต: "${message}"`);

    let chatMessages = [
      {
        role: 'system',
        content: `คุณคือ AI แชตบอตอัจฉริยะ คอยช่วยเหลือและตอบคำถามทั่วไปอย่างสุภาพ เป็นกันเอง มีความเข้าใจภาษาไทยเป็นอย่างดี ตอบคำถามตรงประเด็นและมีความสร้างสรรค์ หากเป็นเรื่องเกี่ยวกับเทคนิค คอมพิวเตอร์ หรือการพัฒนาซอฟต์แวร์ ให้ตอบด้วยข้อมูลที่ถูกต้องและเป็นมืออาชีพ`
      }
    ];

    if (history && Array.isArray(history)) {
      history.forEach(chat => {
        if (chat.role && chat.content) {
          chatMessages.push({ role: chat.role, content: chat.content });
        }
      });
    }

    chatMessages.push({ role: 'user', content: message });

    console.log("🤖 กำลังให้บอตประมวลผลคำตอบภาษาไทยด้วย Llama 3.3 70B...");

    const response = await hf.chatCompletion({
      model: 'meta-llama/Llama-3.3-70B-Instruct', 
      messages: chatMessages,
      max_tokens: 1000,
      temperature: 0.4, // ใช้ 0.4 เพื่อความแม่นยำทางเทคนิค ไม่พ่นมโนคำตอบซ้ำๆ
    });

    const reply = response.choices[0]?.message?.content;

    return res.json({
      status: 'success',
      reply: reply ? reply.trim() : 'ขออภัย ระบบไม่สามารถตอบกลับข้อความนี้ได้ในขณะนี้'
    });

  } catch (error) {
    console.error('❌ Error หลังบ้าน (/api/chat/bot):', error.message);
    return res.status(500).json({
      status: 'error',
      message: `เกิดข้อผิดพลาดในระบบแชตบอต: ${error.message}`
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API Server รันสำเร็จที่ http://localhost:${PORT}`);
});

```

---

## 💻 2. Source Code หน้าบ้าน (`frontend/src/App.jsx`)

```jsx
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

  // 📘 State สำหรับเปิด/ปิด แผงโพยเอกสารลับ (System Documentation)
  const [showDoc, setShowDoc] = useState(false);

  // ดักจับการอัปเดตไฟล์
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  // 🚀 ฟังก์ชันหลักในการยิงข้อมูลหา API
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
      color: '#1e293b',
      position: 'relative'
    }}>
      
      {/* 📘 ปุ่มเปิดเอกสารระบบ (แนบเนียนในคราบปุ่มคู่มือระบบทั่วไป สามารถเปิดดูโค้ดและวิธีตอบสัมภาษณ์ได้) */}
      <button
        type="button"
        onClick={() => setShowDoc(true)}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          padding: '8px 16px', fontSize: '13px', fontWeight: '600',
          backgroundColor: '#ffffff', color: '#475569',
          border: '1px solid #cbd5e1', borderRadius: '6px',
          cursor: 'pointer', boxShadow: '0 1px 2px rgb(0 0 0 / 0.05)'
        }}
      >
        📘 คู่มือและเอกสารระบบ (Docs)
      </button>

      <div style={{ 
        maxWidth: '650px', 
        margin: '20px auto 0 auto', 
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
        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', marginBottom: '24px', gap: '4px' }}>
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
          {mode === 'analyze' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
                1. แนบเอกสารต้นฉบับ (.pdf / .txt):
              </label>
              <div style={{ position: 'relative', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
                <input type="file" accept=".pdf,.txt" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>
              {mode === 'analyze' ? '2. ระบุข้อคำถาม หรือประเด็นข้อมูลที่ต้องการสกัดจากไฟล์:' : 'ระบุหัวข้อข้อมูลหรือคำถามที่ต้องการถามระบบ:'}
            </label>
            <input 
              type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder={mode === 'analyze' ? "เช่น สรุปรายละเอียดสําคัญ หรือ เกณฑ์การคัดเลือก" : "เช่น แนะนำสแต็กซอฟต์แวร์พัฒนาเว็บ หรือ วิธีการเขียนสคริปต์ Node.js"} 
              style={{ padding: '12px 14px', fontSize: '15px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', backgroundColor: '#ffffff', boxShadow: 'inset 0 1px 2px rgb(0 0 0 / 0.05)', transition: 'all 0.2s', width: '100%', boxSizing: 'border-box', color: '#0f172a' }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgb(59 130 246 / 0.15), inset 0 1px 2px rgb(0 0 0 / 0.05)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'inset 0 1px 2px rgb(0 0 0 / 0.05)'; }}
            />
            
            {/* กล่องเรียลไทม์พรีวิวสีเข้มชัดเจน ชิดซ้าย ไม่ล่องหน */}
            {question && (
              <div style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: '#e2e8f0', borderRadius: '6px', fontSize: '13px', color: '#0f172a', border: '1px solid #cbd5e1', wordBreak: 'break-all', textAlign: 'left' }}>
                <span style={{ color: '#0f172a' }}>
                  🔍 <strong>ข้อความป้อนเข้าปัจจุบัน:</strong> {question}
                </span>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{ padding: '14px', fontSize: '15px', fontWeight: '600', color: 'white', border: 'none', borderRadius: '8px', transition: 'background-color 0.2s', backgroundColor: loading ? '#94a3b8' : '#1e40af', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}>
            {loading ? '⏳ ระบบกำลังดำเนินการประมวลผลโครงสร้างข้อมูล...' : '🔍 เริ่มการประมวลผลข้อมูล'}
          </button>
        </form>

        {error && <div style={{ marginTop: '24px', padding: '14px 16px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ {error}</div>}

        {mode === 'analyze' && analyzeResult && (
          <div style={{ marginTop: '28px', padding: '24px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', color: '#14532d' }}>📊 ผลการตรวจสอบและประมวลข้อมูลเอกสารสำเร็จ</h3>
            <div style={{ fontSize: '13px', color: '#166534', marginBottom: '14px', opacity: 0.85 }}><strong>แฟ้มข้อมูลต้นทาง:</strong> {analyzeResult.fileName}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #dcfce7', margin: '0 0 16px 0' }} />
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '15px', color: '#14532d', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>{analyzeResult.answer}</div>
          </div>
        )}

        {mode === 'chat' && chatReply && (
          <div style={{ marginTop: '28px', padding: '24px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 12px 0', color: '#1e3a8a' }}>💬 ผลการสกัดข้อมูลและคำตอบระบบ</h3>
            <hr style={{ border: 'none', borderTop: '1px solid #dbeafe', margin: '0 0 16px 0' }} />
            <div style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '15px', color: '#1e3a8a', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #dbeafe' }}>{chatReply}</div>
          </div>
        )}
      </div>

      {/* =========================================================================
          🎯 POPUP MODAL: แผงคู่มือสารสนเทศและโพยสัมภาษณ์เทคนิคทางวิศวกรรม
          ========================================================================= */}
      {showDoc && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', width: '90%', maxWidth: '850px', height: '80vh', borderRadius: '12px', padding: '30px', display: 'flex', flexDirection: 'column', color: '#334155' }}>
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#1e3a8a' }}>📑 Tech Cheat Sheet & System Logic Guide</h3>
              <button type="button" onClick={() => setShowDoc(false)} style={{ padding: '6px 14px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: 'auto', fontWeight: 'bold' }}>ปิดหน้าต่าง [X]</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: '1.6', textAlign: 'left' }}>
              <h4 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>💡 สรุปตรรกะหัวใจสำคัญหลังบ้าน (Core Logic):</h4>
              <ul>
                <li><strong>Text Normalization:</strong> ตัวแปรข้อความ PDF มักเว้นวรรคผิดเพี้ยน ให้ใช้เครื่องมือ Regex <code>replace(/\\s+/g, ' ').trim()</code> เพื่อหลอมรวมช่องว่างภาษาไทยให้ต่อกันอย่างเป็นธรรมชาติ</li>
                <li><strong>Filename Encoding Bug:</strong> แก้ไขชื่อไฟล์ภาษาไทยที่อ่านไม่ออกอันเนื่องมาจากระบบฟอร์มข้อมูลของ <code>multer</code> ด้วยการถอดรหัสผ่านคลาสโครงสร้าง <code>Buffer.from(file.originalname, 'latin1').toString('utf8')</code></li>
                <li><strong>Hallucination Minimization:</strong> บีบเพดานความฟุ้งซ่านของโมเดล Llama ในงานระบบแชตทั่วไปลงเหลือ <code>temperature: 0.4</code> และปรับเป็น <code>0.2</code> ในส่วนของการวิเคราะห์ไฟล์ RAG ตรงตัว</li>
              </ul>
              <h4 style={{ color: '#0f172a', margin: '20px 0 10px 0' }}>📋 ตารางสรุปการวิเคราะห์และแก้ไขปัญหาทางเทคนิค:</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>ปัญหาเทคนิค</th>
                    <th style={{ border: '1px solid #cbd5e1', padding: '8px' }}>แนวทางแก้ไขในเชิงโครงสร้าง</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>Token Truncation</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>ข้อความไทยโดนตัดจบกลางประโยคเพราะกิน Token สูงกว่าอังกฤษ แก้ไขโดยเพิ่มขอบเขต <code>max_tokens: 1000</code></td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold' }}>Data Privacy & Compliance</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px' }}>ระบบลบไฟล์ทันทีเมื่อสกัดเสร็จ สถาปัตยกรรมพร้อมย้ายไปติดตั้งแบบ <strong>On-Premise Local Deployment</strong> บนเครื่อง GPU ภายในมหาวิทยาลัยได้ทันทีเพื่อความปลอดภัยข้อมูลขั้นสูงสุด</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

```

```

---

### 🚀 วิธีการเซฟและอัปเดตไฟล์

1. เปิดไฟล์ `README.md` ที่อยู่นอกสุดของโปรเจกต์
2. ก๊อปปี้ข้อความทั้งหมดในกล่องด้านบนไปวางทับแล้วกดเซฟ
3. พิมพ์คำสั่ง Git ดันงานขึ้น GitHub เป็นอันจบพิธีครับ:

```bash
git add README.md
git commit -m "docs: finalize single-view root readme displaying absolute backend server and fluid frontend react client scripts"
git push origin main

```

ตอนนี้ประวัติโค้ดที่อัปเดตใหม่ล่าสุดจะแสดงเด่นอยู่หน้าแรกของระบบ GitHub ภูมิเรียบร้อยแล้วครับ ทั้งสะดวก ปลอดภัย และแสดงให้เห็นถึงฝีมือระดับมืออาชีพอย่างเต็มที่ครับภูมิ! ลุยวันสอบได้เลยครับ! 🏁🔥