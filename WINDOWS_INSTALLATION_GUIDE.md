# 🪟 מדריך התקנה ל-Windows - Google MCP Server v5.0

## 📋 מה שיש לך עכשיו

✅ Project ID: `legal-dd-agents`
✅ Gemini API Key: מוגדר
✅ OAuth Client ID: `1030681788138-hnfimvi1vmai07do47ethbhl9jmucva4.apps.googleusercontent.com`

---

## 🚀 שלבי ההתקנה

### שלב 1: העבר את הפרויקט למחשב Windows שלך

**א. צור תיקייה חדשה:**
```powershell
mkdir C:\Users\Raz\google-mcp-server
```

**ב. העתק את כל הקבצים מהפרויקט הזה אל התיקייה החדשה.**

הקבצים שצריך להעתיק:
- כל התיקייה `src/`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `.env` (שכבר מכיל את המפתחות שלך)
- `.gitignore`
- `README.md`

---

### שלב 2: הורד OAuth2 Credentials

**א. לך ל-Google Cloud Console:**
https://console.cloud.google.com/apis/credentials?project=legal-dd-agents

**ב. הורד את ה-Credentials:**
1. מצא את ה-OAuth 2.0 Client ID שכבר יצרת:
   `1030681788138-hnfimvi1vmai07do47ethbhl9jmucva4.apps.googleusercontent.com`
2. לחץ על אייקון ההורדה (⬇️) בצד ימין
3. שמור את הקובץ בתור `credentials.json`
4. העבר את הקובץ ל: `C:\Users\Raz\google-mcp-server\credentials.json`

**ג. אם אין credentials - צור חדש:**
1. לחץ **"Create Credentials"** > **"OAuth client ID"**
2. אם מבקש OAuth consent screen - מלא:
   - User type: **External**
   - App name: `Google MCP Server`
   - Support email: האימייל שלך
   - Add test user: האימייל שלך
3. חזור ל-**"Create OAuth client ID"**
4. Application type: **Desktop app**
5. Name: `Google MCP Desktop`
6. הורד את ה-JSON
7. שנה שם ל-`credentials.json`
8. שים ב-`C:\Users\Raz\google-mcp-server\credentials.json`

---

### שלב 3: וודא שכל ה-APIs מופעלים

לך ל-API Library ווודא שהשירותים הבאים **מופעלים** (Enabled):

**Core APIs:**
- ✅ Gmail API
- ✅ Google Drive API
- ✅ Google Calendar API
- ✅ Google Sheets API
- ✅ Google Tasks API

**AI APIs:**
- ✅ Vertex AI API (לImagen ו-Veo)
- ✅ Cloud Vision API
- ✅ Cloud Translation API

**Cloud APIs:**
- ✅ Cloud Storage API
- ✅ BigQuery API

**Other:**
- ✅ Apps Script API
- ✅ YouTube Data API v3

**איך לבדוק?**
```
https://console.cloud.google.com/apis/library?project=legal-dd-agents
```
חפש כל API ווודא שכתוב **"API enabled"** בירוק.

---

### שלב 4: התקן את הפרויקט

פתח **PowerShell** או **Command Prompt** בתור **Administrator**:

```powershell
# נווט לתיקייה
cd C:\Users\Raz\google-mcp-server

# התקן dependencies
npm install

# Build הפרויקט
npm run build
```

**בדוק שה-build הצליח:**
```powershell
dir dist\
```
אמור להיות קובץ `index.js` בתיקיית `dist\`.

---

### שלב 5: עדכן את Claude Desktop Config

**א. מיקום הקובץ:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

או בנתיב מלא:
```
C:\Users\Raz\AppData\Roaming\Claude\claude_desktop_config.json
```

**ב. גבה את הקובץ הקיים:**
```powershell
copy "%APPDATA%\Claude\claude_desktop_config.json" "%APPDATA%\Claude\claude_desktop_config.json.backup"
```

**ג. החלף את הקובץ:**
1. פתח את `C:\Users\Raz\google-mcp-server\claude_desktop_config_UPDATED.json`
2. העתק את כל התוכן
3. פתח את `%APPDATA%\Claude\claude_desktop_config.json`
4. **החלף** את כל התוכן בתוכן החדש
5. שמור

**⚠️ חשוב:** הקובץ המעודכן שמר את **כל** ה-MCP servers שלך (nevo, notion, linkedin, וכו') ורק עדכן את "google" לגרסה החדשה!

---

### שלב 6: הפעלה ראשונה

**א. סגור Claude Desktop לגמרי:**
- סגור את החלון
- ודא שהתהליך נסגר ב-Task Manager (Ctrl+Shift+Esc)

**ב. פתח Claude Desktop מחדש**

**ג. אימות OAuth (פעם ראשונה):**
1. הדפדפן ייפתח אוטומטית
2. התחבר לחשבון Google שלך
3. אשר את ההרשאות
4. קובץ `tokens.json` ייווצר אוטומטית ב-`C:\Users\Raz\google-mcp-server\`

**ד. בדוק שזה עובד:**
```
"תשלח לעצמי אימייל עם הנושא 'בדיקה' והתוכן 'Google MCP Server עובד!'"
```

---

## 🎯 מה השתנה מהגרסה הישנה?

### השרת הישן (`C:\claude-google-mcp-final\`):
- 3 שירותים בלבד
- 8 כלים בסך הכל
- גרסה 1.0.0

### השרת החדש (`C:\Users\Raz\google-mcp-server\`):
- **13 שירותים!** 🎉
- **61 כלים!** 🚀
- גרסה 5.0.0

**שירותים חדשים שקיבלת:**
- 🧠 Gemini 2.5 AI (טקסט וראייה)
- 🎨 Imagen 3 (יצירת תמונות AI)
- 🎬 Veo 3 (יצירת וידאו AI)
- 👁️ Cloud Vision (ניתוח תמונות)
- 🌐 Translation (תרגום)
- 📊 BigQuery (מסדי נתונים ענקיים)
- ☁️ Cloud Storage (אחסון בענן)
- 🎥 YouTube Data API
- 🤖 Apps Script
- ✅ Google Tasks
- 📊 Google Sheets (משופר)
- Plus שיפורים ב-Gmail, Drive, Calendar

---

## 🔧 Troubleshooting

### בעיה: "Cannot find module"
**פתרון:**
```powershell
cd C:\Users\Raz\google-mcp-server
npm install
npm run build
```

### בעיה: "Failed to authenticate"
**פתרון:**
1. מחק את `C:\Users\Raz\google-mcp-server\tokens.json`
2. סגור ופתח Claude Desktop מחדש
3. עבור שוב את תהליך ה-OAuth

### בעיה: "API not enabled"
**פתרון:**
לך ל-https://console.cloud.google.com/apis/library?project=legal-dd-agents והפעל את ה-API החסר.

### בעיה: הדפדפן לא נפתח לאימות
**פתרון:**
הרץ את השרת ידנית פעם אחת:
```powershell
cd C:\Users\Raz\google-mcp-server
node dist\index.js
```

---

## 📊 מבנה הקבצים

```
C:\Users\Raz\google-mcp-server\
├── dist\
│   └── index.js              ← השרת הקומפילד
├── src\
│   ├── index.ts
│   ├── services\             ← כל 13 השירותים
│   ├── auth\
│   ├── types.ts
│   └── utils\
├── credentials.json          ← OAuth2 (תוריד מ-Console)
├── tokens.json               ← ייווצר אוטומטית
├── .env                      ← מפתח Gemini + Project ID
├── package.json
└── tsconfig.json
```

---

## ✅ Checklist סופי

לפני שמתחילים:
- [ ] העתקתי את הפרויקט ל-`C:\Users\Raz\google-mcp-server\`
- [ ] הורדתי `credentials.json` מ-Google Cloud Console
- [ ] שמתי את `credentials.json` בתיקיית הפרויקט
- [ ] וידאתי שכל 12 ה-APIs מופעלים ב-Console
- [ ] הרצתי `npm install` ו-`npm run build`
- [ ] גיבתי את הקובץ `claude_desktop_config.json` הישן
- [ ] עדכנתי את הקובץ עם הגרסה החדשה
- [ ] סגרתי Claude Desktop לגמרי
- [ ] פתחתי מחדש
- [ ] עברתי OAuth authentication
- [ ] בדקתי ששליחת אימייל עובדת

---

## 🚀 אחרי ההתקנה - מה אפשר לעשות?

### דוגמאות לשימוש:

**Gmail:**
```
"חפש לי את כל האימיילים מהשבוע האחרון עם הנושא 'חוזה'"
```

**AI יצירת תמונות:**
```
"צור לי תמונה של משרד עורכי דין עתידני עם נוף לים"
```

**BigQuery:**
```
"הרץ שאילתה ב-BigQuery למצוא את..."
```

**YouTube:**
```
"חפש לי וידאו על פרזנטציות משפטיות ותוסיף לרשימת ההשראה שלי"
```

**תרגום:**
```
"תרגם את החוזה הזה לאנגלית"
```

---

**מוכן לעבודה! 🎉**

יש בעיה? שאל אותי!
