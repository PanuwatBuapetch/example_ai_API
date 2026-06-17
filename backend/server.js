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

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// 📁 ตั้งค่าการเก็บไฟล์ชั่วคราวไว้ในโฟลเดอร์ uploads/
const upload = multer({ dest: 'uploads/' });

// =========================================================================
// 🚀 ROUTE 1: /api/analyze-file (สกัดและวิเคราะห์ไฟล์เอกสาร PDF/TXT)
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
      model: 'meta-llama/Llama-3.1-8B-Instruct',
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
    const { message, history } = req.body; // รับทั้งข้อความปัจจุบัน และประวัติการคุย (ถ้ารองรับฝั่งหน้าบ้าน)

    if (!message || !message.trim()) {
      return res.status(400).json({ status: 'fail', message: 'กรุณาระบุข้อความที่ต้องการสนทนา (คีย์: message)' });
    }

    console.log(`💬 ได้รับข้อความแชต: "${message}"`);

    // จัดเตรียมชุดข้อความส่งให้โมเดล Llama 3.1
    let chatMessages = [
      {
        role: 'system',
        content: `คุณคือ AI แชตบอตอัจฉริยะ คอยช่วยเหลือและตอบคำถามทั่วไปอย่างสุภาพ เป็นกันเอง มีความเข้าใจภาษาไทยเป็นอย่างดี ตอบคำถามตรงประเด็นและมีความสร้างสรรค์ หากเป็นเรื่องเกี่ยวกับเทคนิค คอมพิวเตอร์ หรือการพัฒนาซอฟต์แวร์ ให้ตอบด้วยข้อมูลที่ถูกต้องและเป็นมืออาชีพ`
      }
    ];

    // 💡 ถ้าหน้าบ้านส่งประวัติการคุย (Chat History) มาด้วย ให้ยัดลงไปในประวัติของโมเดลเพื่อให้มันคุยรู้เรื่องต่อเนื่อง
    if (history && Array.isArray(history)) {
      history.forEach(chat => {
        if (chat.role && chat.content) {
          chatMessages.push({ role: chat.role, content: chat.content });
        }
      });
    }

    // เพิ่มข้อความปัจจุบันของผู้ใช้เข้าไปในคิว
    chatMessages.push({ role: 'user', content: message });

    console.log("🤖 กำลังให้บอตประมวลผลคำตอบภาษาไทย...");

    const response = await hf.chatCompletion({
      // 💡 เปลี่ยนมาใช้ Llama 3.3 70B ตัวท็อปที่เข้าใจภาษาไทยและเนียนกว่าตัว 8B มากๆ
      model: 'meta-llama/Llama-3.3-70B-Instruct', 
      messages: chatMessages,
      max_tokens: 1000,
      // 💡 ลดอุณหภูมิลงจาก 0.7 เหลือ 0.4 เพื่อให้ AI ตอบความจริงเชิงเทคนิค ไม่มโนข้อความซ้ำๆ
      temperature: 0.4, 
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

// =========================================================================
// 🚀 สั่งรันเซิร์ฟเวอร์
// =========================================================================
app.listen(PORT, () => {
  console.log(`🚀 API Server รันสำเร็จที่ http://localhost:${PORT}`);
  console.log(`🔗 เส้นวิเคราะห์ไฟล์: http://localhost:${PORT}/api/analyze-file`);
  console.log(`🔗 เส้นแชตบอตอิสระ: http://localhost:${PORT}/api/chat/bot`);
});