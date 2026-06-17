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

// 🌟 API Route รับไฟล์และคำถามไปพร้อมกันด้วย Middleware ของ Multer
app.post('/api/analyze-file', upload.single('file'), async (req, res) => {
  try {
    const { question } = req.body; 
    const file = req.file;         

    if (!file) {
      return res.status(400).json({ status: 'fail', message: 'กรุณาอัปโหลดไฟล์เอกสาร (คีย์: file)' });
    }
    if (!question) {
      // ดักลบไฟล์ทิ้งทันทีหากฝั่งผู้ใช้ลืมส่งคำถามมา เพื่อไม่ให้เกิดไฟล์ขยะค้างในระบบ
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(400).json({ status: 'fail', message: 'กรุณาระบุคำถาม (คีย์: question)' });
    }

    console.log(`📂 ได้รับไฟล์สำเร็จ: ${file.originalname} (${file.mimetype})`);

    let extractedContext = "";

    // 📄 1. ขั้นตอนการวิเคราะห์ข้อมูล (Data Processing) แยกแยะรูปแบบไฟล์
    if (file.mimetype === 'application/pdf') {
      const fileBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(fileBuffer); 
      
      let rawText = pdfData.text || "";
      
      // 💡 ทำความสะอาดข้อความภาษาไทย ยุบช่องว่างที่ตัดคำแปลกๆ ให้กลับมาต่อกัน
      extractedContext = rawText.replace(/\s+/g, ' ').trim();
      
      // พิมพ์ออกมาดูโครงสร้างภาษาไทยที่หลังบ้านเห็น เพื่อช่วยตรวจสอบความถูกต้องใน Terminal
      console.log("📝 ข้อความที่สกัดเสร็จและทำความสะอาดแล้ว:\n", extractedContext);
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

    console.log("🔍 กำลังส่งข้อมูลข้อความจากไฟล์ไปให้ AI วิเคราะห์...");

    // 🧠 2. ประยุกต์ใช้ AI: ส่ง Context จากไฟล์ + คำถาม ไปให้ Llama 3.1 สรุปคำตอบ
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
      max_tokens: 250,
      temperature: 0.2, // 💡 ปรับเพิ่มขึ้นเล็กน้อยเพื่อให้ AI ยืดหยุ่นในการเชื่อมโยงภาษาไทย
    });

    const answer = response.choices[0]?.message?.content;

    return res.json({
      status: 'success',
      fileName: file.originalname,
      answer: answer ? answer.trim() : 'ไม่สามารถประมวลผลคำตอบได้'
    });

  } catch (error) {
    // กรณีระบบล่มกลางทาง ต้องเคลียร์ไฟล์ทิ้งเพื่อความปลอดภัย
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('❌ Error หลังบ้าน:', error.message);
    return res.status(500).json({ 
      status: 'error', 
      message: `เกิดข้อผิดพลาดในระบบวิเคราะห์ไฟล์: ${error.message}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 File Analyzer Backend รันสำเร็จที่ http://localhost:${PORT}`);
});