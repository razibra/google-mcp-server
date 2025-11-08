# 🚀 מדריך התקנה מהיר - Google MCP Server

## ✅ מה שכבר יש לך:
- ✅ מפתח Gemini API: `AIzaSyAi54sWKlVS7FID46SgTHALNyePA4S1eaU`
- ✅ קובץ `.env` נוצר בתיקיית הפרויקט

---

## 📝 מה עדיין צריך לעשות:

### 1. קבל את ה-Project ID מ-Google Cloud

1. לך ל-[Google Cloud Console](https://console.cloud.google.com)
2. בחר את הפרויקט שלך (או צור אחד חדש)
3. העתק את ה-**Project ID** (לא את השם!)
4. עדכן את הקובץ `.env` בשורה:
   ```
   GOOGLE_CLOUD_PROJECT=הדבק-כאן-את-ה-project-id
   ```

### 2. הורד OAuth2 Credentials

1. ב-Google Cloud Console, לך ל-**"APIs & Services"** > **"Credentials"**
2. לחץ **"Create Credentials"** > **"OAuth client ID"**
3. אם זה בקש, הגדר OAuth consent screen:
   - בחר **"External"**
   - מלא שם אפליקציה ואימייל שלך
   - הוסף את עצמך כ-**test user**
   - שמור
4. חזור ל-**"Create OAuth client ID"**
5. בחר **"Desktop app"**
6. תן שם (לדוגמה: "MCP Server")
7. **הורד את קובץ ה-JSON**
8. שנה שם הקובץ ל-`credentials.json`
9. שים אותו בתיקייה: `/home/user/google-mcp-server/credentials.json`

### 3. הפעל את כל ה-APIs הנדרשים

ב-Google Cloud Console, לך ל-**"APIs & Services"** > **"Library"** והפעל:

**שירותי Workspace:**
- ✅ Gmail API
- ✅ Google Drive API
- ✅ Google Calendar API
- ✅ Google Sheets API
- ✅ Google Tasks API

**שירותי AI:**
- ✅ Vertex AI API (לImagen ו-Veo)
- ✅ Cloud Vision API
- ✅ Cloud Translation API

**שירותי Cloud:**
- ✅ Cloud Storage API
- ✅ BigQuery API

**שירותים נוספים:**
- ✅ Apps Script API
- ✅ YouTube Data API v3

### 4. התקן את הפרויקט

```bash
cd /home/user/google-mcp-server
npm install
npm run build
```

### 5. הגדר את Claude Desktop

**מיקום קובץ הקונפיג:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**אם הקובץ לא קיים - צור אותו!**

**תוכן הקובץ (העתק מ-`claude_desktop_config.example.json` ועדכן):**

```json
{
  "mcpServers": {
    "google": {
      "command": "node",
      "args": ["/absolute/path/to/google-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_AI_API_KEY": "your-gemini-api-key-here",
        "GOOGLE_CLOUD_PROJECT": "your-project-id-here"
      }
    }
  }
}
```

**⚠️ חשוב:**
- החלף את הנתיב `/home/user/google-mcp-server` בנתיב האמיתי במחשב שלך
- החלף את `your-project-id-here` ב-Project ID האמיתי

### 6. הפעלה ראשונית

1. **סגור Claude Desktop לגמרי** (ודא שהתהליך נסגר)
2. **פתח Claude Desktop מחדש**
3. הדפדפן ייפתח אוטומטית ויבקש ממך:
   - להתחבר לחשבון Google שלך
   - לאשר הרשאות לאפליקציה
4. לאחר האישור, קובץ `tokens.json` ייווצר אוטומטית
5. **מעולה! אתה מוכן!** 🎉

---

## 🧪 בדיקה

פתח Claude Desktop ונסה:

```
"תשלח לעצמי אימייל עם הנושא 'בדיקה' והתוכן 'זה עובד!'"
```

או:

```
"תיצור לי תמונה של חתול על הירח"
```

---

## 📊 מה יש לך עכשיו?

✅ **13 שירותים**
✅ **61 כלים**
✅ מפתח API של Gemini (מוגדר)
✅ קובץ .env (מוכן)

**עוד צריך:**
- ⏳ Project ID מ-Google Cloud
- ⏳ קובץ credentials.json
- ⏳ הפעלת APIs ב-Google Cloud Console

---

## ❓ שאלות נפוצות

**ש: איפה אני מוצא את ה-Project ID?**
ת: ב-Google Cloud Console, בסרגל העליון, לחץ על שם הפרויקט - ה-ID מופיע שם.

**ש: האם אני צריך לשלם לGoogle?**
ת: לרוב השירותים יש free tier. רק שימוש מעבר לכמות החינמית עולה כסף.

**ש: מה עושים אם הדפדפן לא נפתח?**
ת: הרץ את השרת ידנית פעם אחת:
```bash
node /home/user/google-mcp-server/dist/index.js
```

**ש: איך אני יודע שזה עובד?**
ת: ב-Claude Desktop, תראה את כל הכלים זמינים בתפריט MCP.

---

**צריך עזרה? יש בעיה? שאל! 🚀**
