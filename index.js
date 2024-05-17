const fs = require('fs')
const path = require('path')
const enc = require('./modules/enc')
const LibSQL = require('libsql')
const libSQL = new LibSQL('./cerez.sqlite')
const session = require('express-session');
const cache = require('@rednexie/cache.db')

const lodash = require('lodash'); 
const moment = require('moment'); 
const uuid = require('uuid'); 
const Joi = require('joi')

const port = process.env.PORT || 3199

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const express = require('express')
const ejs = require('ejs')
const app = express();


const encrypt = require('./modules/enc')

const sessionConfig = {
  secret: 'aApdoSkdz?)038j*23rjS?AD9a46546jd96svFGEASh2*3jasdj*',
  name: 'leblebi',
  resave: false,
  saveUninitialized: false,
  cookie : {
    sameSite: 'strict',
  }
};


app.set('trust proxy', true)
app.set('view engine', 'ejs')
app.set('views', './views')
app.set('x-powered-by', false)
app.set('etag', false)


app.use(session(sessionConfig))
app.use(cookieParser())
app.use(express.json())
app.use(express.static('static'))
app.use(bodyParser.urlencoded({ extended: true }));

libSQL.exec(`
    CREATE TABLE IF NOT EXISTS leblebi(
        id INTEGER PRIMARY KEY,
        kullanici_adi TEXT NOT NULL UNIQUE,
        parola TEXT,
        cerez TEXT,
        eposta TEXT,
        rol INTEGER DEFAULT 0
    )
`)

function generateUniqueId() {
  return uuid.v4();
}

function formatCurrentDate(date) {
  return moment(date).format('YYYY-MM-DD');
}

function shuffleArray(array) {
  return lodash.shuffle(array);
}

app.post('/login', (req, res) => {
  const { kullanici, parola } = req.body;

  const loginSchema = Joi.object({
      kullanici: Joi.string().required(),
      parola: Joi.string().required()
  });

  loginSchema.validateAsync(req.body)

 
  const requestId = generateUniqueId();

  if (kullanici === undefined || parola === undefined || !kullanici || !parola) {
      return res.status(400).json({ error: 'Kullanıcı adı ve parola gereklidir' });
  }


  db.get('SELECT * FROM leblebi WHERE kullanici_adi = ? AND parola = ?', [kullanici, parola], (err, row) => {
      if (err) {
          console.error('Internal error occurred', err); 
          return res.status(500).json({ durum: 'başarısız', mesaj: 'İç Sunucu Hatası' });
      }

      if (!row) {
          return res.status(401).json({ durum: 'başarısız', mesaj: 'Geçersiz kullanıcı adı veya parola' });
      }

      res.cookie('leblebi', row.cerez, { httpOnly: false })
      res.json({ durum: 'başarılı', mesaj: 'Başarıyla giriş yaptınız' })
  
    
});
})



app.post('/signup', async (req, res) => {
  const { kullanici, parola, eposta } = req.body;

  const signupSchema = Joi.object({
    kullanici: Joi.string().required(),
    parola: Joi.string().required(),
    eposta: Joi.string().email()
  })

  

  if (kullanici === null || parola === null || !kullanici || !parola) {
      console.warn('Eksik bilgiler'); 
      return res.status(400).json({ durum: 'başarısız', mesaj: 'Kullanıcı adı ve parola gereklidir' });
  }

  console.info('Kullanıcı oluşturma girişimi:', kullanici);

 


  const currentDate = formatCurrentDate(new Date());
  console.log(`Current date: ${currentDate}`);

  const cerez = encrypt(btoa(require('crypto').randomUUID()));
  let shuffledData = shuffleArray([kullanici, parola, eposta, cerez]);

  db.run('INSERT INTO leblebi (kullanici_adi, parola, eposta, cerez) VALUES (?, ?, ?, ?)', shuffledData, (err) => {
      if (err) {
          return res.status(500).json({ durum: 'başarısız', error: 'İç Sunucu Hatası' });
      }
      

      userAdd()
      return res.status(201).send({ durum: 'başarılı', mesaj: 'Başarıyla kullanıcı olusturuldu' });
  });
});


app.get('/logout', (req, res) => {
  res.removeHeader('cookie');
  res.redirect('/')
})

function userAdd(){
  online++
  cache.set('online', online)
}

function userRemove(){
  online--
  cache.set('online', online)
}

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.send('Error logging out.');
    } else {
      userRemove()
      res.redirect('/');
    }
  });
})

app.listen(port)