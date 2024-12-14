"use strict";
const express = require("express");
let app = express();
const cluster = require("cluster");
const os = require("os");
const compression = require("compression");
const numClusters = os.cpus().length;
if (cluster.isMaster) {
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  app.use(compression());
  app.use(express.static(__dirname + "/public"));
  app.set("view engine", "ejs");
  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}
const m3u8stream = require('m3u8stream');
const ytsr = require("ytsr");
const ytpl = require("ytpl");
const miniget = require("miniget");
const ejs = require("ejs");
const axios = require('axios');
const fs = require('fs');
const { https } = require('follow-redirects');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jp = require('jsonpath');
const path = require('path');
const bodyParser = require('body-parser');
const { URL } = require('url');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const http = require('http');
const ytdl = require('ytdl-core');
const { parseString } = require('xml2js');
const m3u8Parser = require('m3u8-parser');

const limit = process.env.LIMIT || 50;

const user_agent = process.env.USER_AGENT || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36";

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);
const MAX_API_WAIT_TIME = 3000; 
const MAX_TIME = 10000;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 24 * 60 * 60 * 1000 }
}));

app.get('/tsttsttst23', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('videoId')
      .order('id', { ascending: false })
      .limit(500); 
    if (error) {
      throw new Error(`データ取得エラー: ${error.message}`);
    }
    const randomIndex = Math.floor(Math.random() * data.length);
    const randomEntry = data[randomIndex];
    const videoId = randomEntry.videoId;
    res.redirect(`/w/${videoId}`);
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).send('履歴を取得できませんでした');
  }
});

//ログイン
// 読み込み時ちぇっく
app.use((req, res, next) => {
    if (req.cookies.massiropass !== 'ok' && !req.path.includes('login')) {
        req.session.redirectTo = req.path !== '/' ? req.path : null;
        return res.redirect('/login');
    } else {
        next();
    }
});
//ログイン済み？
app.get('/login/if', async (req, res) => {
    if (req.cookies.massiropass !== 'ok') {
        res.render('login', { error: 'ログインしていません。もう一度ログインして下さい' })
    } else {
        return res.redirect('/');
    }
});
// ログインページ
app.get('/login', (req, res) => {
    let referer = req.get('Referer') || 'No referer information';
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`URL: ${referer} から来た, IP: ${ip}`);
    res.render('login', { error: null });
});
// パスワード確認
app.post('/login', (req, res) => {
    const password = req.body.password;
    if (password === 'wakame') {
        res.cookie('massiropass', 'ok', { maxAge: 5 * 24 * 60 * 60 * 1000, httpOnly: true });
        
        const redirectTo = req.session.redirectTo || '/';
        delete req.session.redirectTo;
        return res.redirect(redirectTo);
    } else {
        if (password === 'ohana') {
            return res.redirect('https://ohuaxiehui.webnode.jp');
        } else {
            res.render('login', { error: 'パスワードが間違っています。もう一度お試しください。' });
        }
    }
});
//パスワードを忘れた場合
app.get('/login/forgot', (req, res) => {
  res.render(`login/forgot.ejs`);
});
//ログアウト
app.post('/logout', (req, res) => {
    res.cookie('pass', 'false', { maxAge: 1, httpOnly: true });
    return res.redirect('/login');
});

//tst
app.get('/tst/:id', (req, res) => {
  const id = req.params.id;
  res.render(`tst/${id}`, { id: id });
});

//曲をきく！
app.get("/famous",(req, res) => {
  res.render("../views/famous.ejs")
})

//第3の目
const invidiousapis = [
  "https://inv.nadeko.net",
  "https://youtube.privacyplz.org",
  "https://invidious.nerdvpn.de",
  "https://inv.zzls.xyz/",
  "https://invidious.qwik.space",
  "https://invidious.privacyredirect.com",
  "https://invidious.materialio.us/",
  "https://invidious.jing.rocks",
  "https://iv.datura.network",
  "https://invidious.private.coffee",
  "https://invidious.materialio.us",
  "https://invidious.fdn.fr",
  "https://invidious.private.coffee",
  "https://invidious.fdn.fr",
  "https://youtube.mosesmang.com",
  "https://iv.datura.network",
  "https://invidious.projectsegfau.lt",
  "https://invidious.perennialte.ch",
  "https://invidious.einfachzocken.eu",
  "https://invidious.0011.lt",
  "https://yt.yoc.ovh",
  "https://rust.oskamp.nl",
  "https://invidious.nietzospannend.nl",
  "https://iv.melmac.space",
  "https://yt.artemislena.eu",
  "https://invidious.esmailelbob.xyz",
  "https://invidious.dhusch.de",
  "https://inv.odyssey346.dev",
  "https://pol1.iv.ggtyler.dev"
]; 
//高画質用
const highinvidiousapis = [
  "https://inv.nadeko.net",
  "https://youtube.privacyplz.org",
  "https://invidious.nerdvpn.de",
  "https://inv.zzls.xyz/",
  "https://yt.drgnz.club",
  "https://invidious.privacyredirect.com",
  "https://invidious.jing.rocks",
  "https://iv.datura.network",
  "https://invidious.private.coffee",
  "https://invidious.materialio.us",
  "https://invidious.fdn.fr",
  "https://vid.puffyan.us",
  "https://invidious.private.coffee",
  "https://youtube.privacyplz.org",
  "https://invidious.fdn.fr",
  "https://youtube.mosesmang.com",
  "https://invidious.nerdvpn.de",
  "https://iv.datura.network",
  "https://invidious.perennialte.ch"
];

app.get('/wakawakawakawaka', async (req, res) => {
  const videoId = req.params.id;
  try {
    const templateData = {
      stream_url: "jsjshshsj"
    };

    const { data, error } = await supabase
      .from('history')
      .insert([
        { 
          videoId: "zbWEZDA3xZc",
          channelId: "UCrV1Hf5r8P148idjoSfrGEQ", 
          channelName: "Sakuna Ch. 結城さくな", 
          videoTitle: "Henceforth / 結城さくな(Cover)" 
        }
      ]);
          
    res.json(templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//invidiousから引っ張ってくる
async function fetchVideoInfoParallel(videoId) {
  const startTime = Date.now();
  const instanceErrors = new Set();

  for (const instance of invidiousapis) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: MAX_API_WAIT_TIME });
      console.log(`使ってみたURL: ${instance}/api/v1/videos/${videoId}`);

      if (response.data && response.data.formatStreams) {
        return response.data; 
      } else {
        console.error(`formatStreamsが存在しない: ${instance}`);
      }
    } catch (error) {
      console.error(`エラーだよ: ${instance} - ${error.message}`);
      instanceErrors.add(instance);
    }

    if (Date.now() - startTime >= MAX_TIME) {
      throw new Error("接続がタイムアウトしました");
    }
  }

  throw new Error("動画を取得する方法が見つかりません");
}

//URLいじいじ
function streamurlchange(url) {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.delete('host');
    return urlObj.toString();
  } catch (error) {
    console.error('URLが無効です:', url);
    return url;
  }
}

//高画質用
async function highfetchVideoInfoParallel(videoId) {
  const startTime = Date.now();
  const instanceErrors = new Set();

  for (const instance of highinvidiousapis) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, { timeout: MAX_API_WAIT_TIME });
      console.log(`使ってみたURL: ${instance}/api/v1/videos/${videoId}`);

      if (response.data && response.data.formatStreams) {
        return response.data; 
      } else {
        console.error(`formatStreamsが存在しない: ${instance}`);
      }
    } catch (error) {
      console.error(`エラーだよ: ${instance} - ${error.message}`);
      instanceErrors.add(instance);
    }

    if (Date.now() - startTime >= MAX_TIME) {
      throw new Error("接続がタイムアウトしました");
    }
  }

  throw new Error("動画を取得する方法が見つかりません");
}

//レギュラー
app.get('/w/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    const videoInfo = await highfetchVideoInfoParallel(videoId);
    const audioStreams = videoInfo.adaptiveFormats || [];
    
    let streamUrl = audioStreams
      .filter(stream => stream.container === 'mp4' && stream.resolution === '1080p')
      .map(stream => streamurlchange(stream.url))[0];

    if (!streamUrl) {
      streamUrl = audioStreams
        .filter(stream => stream.container === 'mp4' && stream.resolution === '720p')
        .map(stream => streamurlchange(stream.url))[0];
    }
    
    if (!streamUrl) {
      streamUrl = audioStreams
        .filter(stream => stream.container === 'mp4' && stream.resolution === '720p')
        .map(stream => streamurlchange(stream.url))[0];
    }
    
    let audioUrl = audioStreams
      .filter(stream => stream.container === 'm4a' && stream.audioQuality === 'AUDIO_QUALITY_MEDIUM')
      .map(stream => streamurlchange(stream.url))[0];
    
    if (!streamUrl) {
      const formatStreams = videoInfo.formatStreams || [];
      streamUrl = formatStreams.reverse().map(stream => stream.url)[0];
      audioUrl = null;
    }
    
    if (videoInfo.hlsUrl) {
         streamUrl = `/live/${videoId}`;
         audioUrl = null;
    }
    
    if (videoId === '50Ura_ZcSvY') {
    streamUrl = 'https://cdn.glitch.me/3128bf45-3a23-4695-81ba-3aba21b8585b/%E3%80%90MV%E3%80%91HELP!!%20%20-%20Kobo%20Kanaeru%20-%20Kobo%20Kanaeru%20Ch.%20hololive-ID%20(1080p%2C%20h264%2C%20youtube).mp4?v=1730184504508';
    audioUrl = null;}
    if (videoId === 'zbWEZDA3xZc') {
    streamUrl = 'https://cdn.glitch.me/5b8b419f-e61e-4533-9e15-5b2805b88d0e/Henceforth%20_%20%E7%B5%90%E5%9F%8E%E3%81%95%E3%81%8F%E3%81%AA(Cover)%20-%20Sakuna%20Ch.%20%E7%B5%90%E5%9F%8E%E3%81%95%E3%81%8F%E3%81%AA%20(1080p%2C%20h264%2C%20youtube).mp4?v=1731296837239';
    audioUrl = null;}
  

    const templateData = {
      stream_url: streamUrl,
      audioUrl: audioUrl,
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('highquo', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//エラー対策
const caninvidiousInstances = [
  "https://inv.riverside.rocks",
  "https://youtube.076.ne.jp",
  "https://invidious.weblibre.org","https://iv.datura.network",
  "https://invidious.reallyaweso.me",
  "https://inv.phene.dev","https://invidious.protokolla.fi",
  "https://invidious.perennialte.ch",
  "https://invidious.materialio.us","https://yewtu.be",
  "https://invidious.fdn.fr",
  "https://inv.tux.pizza",
  "https://vid.puffyan.us",
  "https://invidio.xamh.de",
  "https://invidious.sethforprivacy.com",
  "https://invidious.tiekoetter.com",
  "https://inv.bp.projectsegfau.lt",
  "https://invidious.rhyshl.live",
  "https://invidious.private.coffee",
  "https://invidious.ethibox.fr",
  "https://invidious.privacyredirect.com",
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.namazso.eu",
  "https://iv.nowhere.moe/"
];
//Get YTK
async function getytk(videoId) {
  for (const instance of caninvidiousInstances) {
    try {
      const response = await axios.get(`${instance}/api/v1/videos/${videoId}`);
      console.log(`使用したURL: ${instance}/api/v1/videos/${videoId}`);
      
      if (response.data && response.data.authorId) {
        return response.data;
      }
    } catch (error) {
      console.error(`エラー: ${error.message} - ${instance}`);
    }
  }
  throw new Error("見つかりませんでした");
}

//サーバー2
app.get('/canw/:id', async (req, res) => {
  const videoId = req.params.id;
  
  try {
    const videoInfo = await getytk(videoId);
    
    const formatStreams = videoInfo.formatStreams || [];
    const streamUrl = formatStreams.reverse().map(stream => stream.url)[0];
    
    const templateData = {
      stream_url: streamUrl,
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('deswatch', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//サーバー3
app.get('/embeder/:id', async (req, res) => {
  const videoId = req.params.id;
  
  try {
    const videoInfo = await fetchVideoInfoParallel(videoId);
    
    const templateData = {
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('embeder', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//高画質再生！！
app.get('/www/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    const videoInfo = await highfetchVideoInfoParallel(videoId);
    const audioStreams = videoInfo.adaptiveFormats || [];
    
    let streamUrl = audioStreams
      .filter(stream => stream.container === 'mp4' && stream.resolution === '1080p')
      .map(stream => streamurlchange(stream.url))[0];

    if (!streamUrl) {
      streamUrl = audioStreams
        .filter(stream => stream.container === 'mp4' && stream.resolution === '720p')
        .map(stream => streamurlchange(stream.url))[0];
    }

    const audioUrl = audioStreams
      .filter(stream => stream.container === 'm4a' && stream.audioQuality === 'AUDIO_QUALITY_MEDIUM')
      .map(stream => streamurlchange(stream.url))[0];

    const templateData = {
      stream_url: streamUrl,
      audioUrl: audioUrl,
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('highquo', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//音だけ再生
app.get('/ll/:id', async (req, res) => {
  const videoId = req.params.id;

  try {
    const videoInfo = await fetchVideoInfoParallel(videoId);
    
    const audioStreams = videoInfo.formatStreams || [];
    const streamUrl = audioStreams.map(audio => audio.url)[0];

    if (!streamUrl) {
          res.status(500).render('matte', { 
      videoId, 
      error: 'ストリームURLが見つかりません',
    });
    }
    if (!videoInfo.authorId) {
      return res.redirect(`/redirect?p=ll&id=${videoId}`);
    }

    const templateData = {
      audioUrl: streamUrl,
      videoId: videoId,
      videoTitle: videoInfo.title,
    };

    res.render('listen', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});

//埋め込み再生
app.get('/umekomi/:id', async (req, res) => {
  let videoId = req.params.id;
  let url = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const inforesponse = await axios.get(url);
    const html = inforesponse.data;

    const titleMatch = html.match(/"title":\{.*?"text":"(.*?)"/);
    const descriptionMatch = html.match(/"attributedDescriptionBodyText":\{.*?"content":"(.*?)","commandRuns/);
    const viewsMatch = html.match(/"views":\{.*?"simpleText":"(.*?)"/);
    const channelImageMatch = html.match(/"channelThumbnail":\{.*?"url":"(.*?)"/);
    const channelNameMatch = html.match(/"channel":\{.*?"simpleText":"(.*?)"/);
    const channnelIdMatch = html.match(/"browseEndpoint":\{.*?"browseId":"(.*?)"/);

    const videoTitle = titleMatch ? titleMatch[1] : 'タイトルを取得できませんでした';
    const videoDes = descriptionMatch ? descriptionMatch[1].replace(/\\n/g, '\n') : '概要を取得できませんでした';
    const videoViews = viewsMatch ? viewsMatch[1] : '再生回数を取得できませんでした';
    const channelImage = channelImageMatch ? channelImageMatch[1] : '取得できませんでした';
    const channelName = channelNameMatch ? channelNameMatch[1] : '取得できませんでした';
    const channelId = channnelIdMatch ? channnelIdMatch[1] : '取得できませんでした';
    
    const { data, error } = await supabase
      .from('history')
      .insert([
        { 
          videoId: videoId,
          channelId: channelId, 
          channelName: channelName, 
          videoTitle: videoTitle 
        }
      ]);

    res.render('umekomi.ejs', { videoId, videoTitle, videoDes, videoViews, channelImage, channelName, channelId});
  } catch (error) {
    console.error(error);
    res.status(500).render('matte', { videoId, error: '動画情報を取得できません', details: error.message });
  }
});

//LIVE
app.get("/live/:id", async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) return res.redirect("/");

    try {
        const videoInfo = await fetchVideoInfoParallel(videoId);

        const hlsUrl = videoInfo.hlsUrl;
        if (!hlsUrl) {
            return res.status(500).send("No live stream URL available.");
        }

        console.log("HLS URL:", hlsUrl);

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");

        const stream = miniget(hlsUrl);

        stream.pipe(res);

        stream.on('error', (err) => {
            console.error("Error while streaming HLS:", err);
            res.status(500).send(err.toString());
        });

    } catch (error) {
        console.error("Error fetching video info:", error);
        res.status(500).send(error.toString());
    }
});

app.get('/comment/:id', async (req, res) => {
  const videoId = req.params.id;
    try {
        const response = await axios.get(`https://wakamecomment.glitch.me/api/wakame/${videoId}`);
        const cm = response.data;

        res.render('comment', { cm });
   } catch (error) {
        res.status(500).render('error', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});


//ダウンロード
app.get('/pytdf/:id', async (req, res) => {
  const videoId = req.params.id;

  try {
    const videoInfo = await fetchVideoInfoParallel(videoId);
    const formatStreams = videoInfo.formatStreams || [];
    const streamUrl = formatStreams.reverse().map(stream => stream.url)[0];

        const response = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
        });

        res.setHeader('Content-Disposition', 'attachment; filename=video.mp4');
        res.setHeader('Content-Type', 'video/mp4');
        response.data.pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send('ダウンロードに失敗しました。');
    }
});


// ホーム
app.get("/", (req, res) => {
   res.sendFile(__dirname + "/views/index.html");
});

app.get('/st', (req, res) => {
    res.sendStatus(200);
});

// サーチ
app.get("/s", async (req, res) => {
    let query = req.query.q;
    let page = Number(req.query.p || 2);
    
    try {
        const result = await ytsr(query, { limit, pages: page });
        res.render("search.ejs", {
            res: result,
            query: query,
            page
        });
    } catch (error) {
        console.error(error);
        try {
            res.status(500).render("error.ejs", {
                title: "ytsr Error",
                content: error
            });
        } catch (error) {
            console.error(error);
        }
    }
});


//プレイリスト
app.get("/p/:id", async (req, res) => {
	if (!req.params.id) return res.redirect("/");
	let page = Number(req.query.p || 1);
	try {
		res.render("playlist.ejs", {
			playlist: await ytpl(req.params.id, { limit, pages: page }),
			page
		});
	} catch (error) {
		console.error(error);
		res.status(500).render("error.ejs", {
			title: "ytpl Error",
			content: error
		});
	}
});

// チャンネル
app.get("/c/:id", async (req, res) => {
	if (!req.params.id) return res.redirect("/");
	let page = Number(req.query.p || 1);
	try {
		res.render("channel.ejs", {
			channel: await ytpl(req.params.id, { limit, pages: page }),
			page
		});
	} catch (error) {
		console.error(error);
		res.status(500).render("error.ejs",{
			title: "ytpl Error",
			content: error
		});
	}
});

// サムネ読み込み
app.get("/vi*", (req, res) => {
	let stream = miniget(`https://i.ytimg.com/${req.url.split("?")[0]}`, {
		headers: {
			"user-agent": user_agent
		}
	});
	stream.on('error', err => {
		console.log(err);
		res.status(500).send(err.toString());
	});
	stream.pipe(res);
});

// チャンネル画像読み込み
app.get("/ytc/:id", (req, res) => {
    const channelId = req.params.id;
    const imageUrl = `https://yt3.ggpht.com/ytc/${channelId}=s900-c-k-c0xffffffff-no-rj-mo`;
    let stream = miniget(imageUrl, {
        headers: {
            "user-agent": user_agent
        }
    });
    stream.on('error', err => {
        console.log(err);
        res.status(500).send(err.toString());
    });
    stream.pipe(res);
});


//tool
app.get("/tool",(req, res) => {
  res.render("../tool/n/home.ejs")
})

app.get("/tool/n/comment/:id",(req, res) => {
  const id = req.params.id;
  res.render("../tool/n/comment.ejs", {id})
})

app.get('/tool/:id', (req, res) => {
  const id = req.params.id;
  res.render(`../tool/${id}.ejs`, { id: id });
});

//tst
app.get("/tst1234",(req, res) => {
  res.render("../tst.ejs")
})

//urlでYouTube動画を探す
app.get("/urls",(req, res) => {
  res.render("../views/url.ejs")
})

//blog
app.get("/blog",(req, res) => {
  res.render("../views/blog.ejs")
})
app.get('/blog/:id', (req, res) => {
  const id = req.params.id;
  res.render(`blog/${id}`, { id: id });
});

//ネタ
app.get("/neta",(req, res) => {
  res.render("../views/neta.ejs")
})
app.get('/neta/:id', (req, res) => {
  const id = req.params.id;
  res.render(`neta/${id}`, { id: id });
});

//お問い合わせ
app.get("/send",(req, res) => {
  res.render("../views/send.ejs")
})

//apps
app.get("/app",(req, res) => {
  res.render("../public/apps.ejs")
})

//キリ番
app.get("/kirikiri", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('history')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    if (error) {
      throw new Error(`データ取得エラー: ${error.message}`);
    }
    if (data.length === 0) {
      throw new Error('データが存在しません');
    }
    const latestId = data[0].id;
    res.render("../views/kiriban.ejs", { latestId });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).send('データを取得できませんでした');
  }
});


//game
app.get('/game/:id', (req, res) => {
  const id = req.params.id;
  res.render(`../game/${id}.ejs`, { id: id });
});

//proxy
app.get("/proxy/",(req, res) => {
  res.render("../read/proxy.ejs")
})

//設定
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

function parseCookies(request) {
    const list = {};
    const cookieHeader = request.headers.cookie;

    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            let parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }

    return list;
}

app.get('/setting', (req, res) => {
    const cookies = parseCookies(req);
    const wakames = cookies.wakames === 'true';
    const wakametubeumekomi = cookies.wakametubeumekomi === 'true';
    res.render('setting.ejs', { wakames, wakametubeumekomi });
});

app.post('/setting', (req, res) => {
    const wakames = req.body.wakames === 'on';
    const wakametubeumekomi = req.body.wakametubeumekomi === 'on';

    res.setHeader('Set-Cookie', [
        `wakames=${wakames}; HttpOnly; Max-Age=31536000`,
        `wakametubeumekomi=${wakametubeumekomi}; HttpOnly; Max-Age=31536000`
    ]);
    
    res.redirect('/setting');
});

//proxy
app.get('/proxy/:id', (req, res) => {
  const id = req.params.id;
  res.render(`../read/proxy/${id}.ejs`, { id: id });
});

//曲
app.get('/songs/rainbow', async (req, res) => {
  let videoId = "RMZNjFkJK7E";
  
  try {
    const videoInfo = await fetchVideoInfoParallel(videoId);
    const streamUrl = "https://cdn.glitch.me/e7208106-7973-47a2-8d4b-9fdc27b708a0/rainbow.mp4?v=1726103047477";
    
    const templateData = {
      stream_url: streamUrl,
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('infowatch', templateData);
  } catch (error) {
    console.error(error);
    res.status(500).render('matte', { videoId, error: '動画を取得できません', details: error.message });
  }
});

//html取得
app.get('/gethtml/:encodedUrl', async (req, res) => {
  const { encodedUrl } = req.params;
  
  const replacedUrl = decodeURIComponent(encodedUrl);
  
  const url = replacedUrl.replace(/\.wakame02\./g, '.');

  if (!url) {
    return res.status(400).send('URLが入力されていません');
  }
  
  try {
    const response = await axios.get(url);
    const html = response.data;
    res.setHeader('Content-Type', 'text/plain');
    res.send(html);
  } catch (error) {
    res.status(500).send('URLの取得に失敗しました');
  }
});

app.get('/getinv/:encodedUrl', async (req, res) => {

  const { encodedUrl } = req.params;
  const replacedUrl = decodeURIComponent(encodedUrl);
  const invurl = replacedUrl.replace(/\.wakame02\./g, '.');
  const videoId = "H08YWE4CIFQ";
  
  try {
    const videoInfo = await axios.get(`${invurl}/api/v1/videos/H08YWE4CIFQ`);
    
    const formatStreams = videoInfo.formatStreams || [];
    const streamUrl = formatStreams.reverse().map(stream => stream.url)[0];
    
    const templateData = {
      stream_url: streamUrl,
      videoId: videoId,
      channelId: videoInfo.authorId,
      channelName: videoInfo.author,
      channelImage: videoInfo.authorThumbnails?.[videoInfo.authorThumbnails.length - 1]?.url || '',
      videoTitle: videoInfo.title,
      videoDes: videoInfo.descriptionHtml,
      videoViews: videoInfo.viewCount,
      likeCount: videoInfo.likeCount
    };

    res.render('infowatch', templateData);
  } catch (error) {
        res.status(500).render('matte', { 
      videoId, 
      error: '動画を取得できません', 
      details: error.message 
    });
  }
});
//わかめproxy
app.get('/getpage/:encodedUrl', async (req, res) => {
  const { encodedUrl } = req.params;
  
  const replacedUrl = decodeURIComponent(encodedUrl);
  
  const url = replacedUrl.replace(/\.wakame02\./g, '.');

  if (!url) {
    return res.status(400).send('URLが入力されていません');
  }
  const baseUrl = new URL(url);
  try {
    const response = await axios.get(url);
    let html = response.data;
  html = html.replace(/<a\s+([\s\S]*?)href="([\s\S]*?)"([\s\S]*?)>([\s\S]*?)<\/a>/g, (match, beforeHref, url, afterHref, innerText) => {
  let absoluteUrl;

  try {
    if (url.startsWith('http') || url.startsWith('https')) {
      absoluteUrl = url;
    } else {
      absoluteUrl = new URL(url, baseUrl).href;
    }
  } catch (e) {
    console.error('Error parsing URL:', url, e);
    return match;
  }

  const replacedAbsoluteUrl = absoluteUrl.replace(/\./g, '.wakame02.');
  const encoded = encodeURIComponent(replacedAbsoluteUrl);

  return `<a ${beforeHref}href="/getpage/${encoded}"${afterHref}>${innerText}</a>`;
});
    res.send(html);
  } catch (error) {
    res.status(500).send('URLの取得に失敗しました');
  }
});

//強化版わかめproxy
app.get('/getwakame/:encodedUrl', async (req, res) => {
  const { encodedUrl } = req.params;
  if (!encodedUrl) {
    return res.status(400).send('URLが入力されていません');
  }

  const replacedUrl = decodeURIComponent(encodedUrl).replace(/\.wakame02\./g, '.');

  try {
    const response = await axios.get(replacedUrl);
    
    if (response.status !== 200) {
      return res.status(response.status).send('URLの取得に失敗しました');
    }

    let html = response.data;
    const baseUrl = new URL(replacedUrl);
    console.log(baseUrl)
//リンク
  html = html.replace(/<a\s+([\s\S]*?)href="([\s\S]*?)"([\s\S]*?)>([\s\S]*?)<\/a>/g, (match, beforeHref, url, afterHref, innerText) => {
  let absoluteUrl;

  try {
    if (url.startsWith('http') || url.startsWith('https')) {
      absoluteUrl = url;
    } else {
      absoluteUrl = new URL(url, baseUrl).href;
    }
  } catch (e) {
    console.error('Error parsing URL:', url, e);
    return match;
  }

  const replacedAbsoluteUrl = absoluteUrl.replace(/\./g, '.wakame02.');
  const encoded = encodeURIComponent(replacedAbsoluteUrl);

  return `<a ${beforeHref}href="/getwakame/${encoded}"${afterHref}>${innerText}</a>`;
});

//image
html = html.replace(/<img\s+([\s\S]*?src="([\s\S]*?)"[\s\S]*?)>/g, (match, fullTag, url) => {
  let absoluteUrl;
  if (url.startsWith('http') || url.startsWith('https')) {
    absoluteUrl = url;
  } else {
    absoluteUrl = new URL(url, baseUrl).href;
  }

  const encodedString = Buffer.from(absoluteUrl).toString('base64');
  const replacedAbsoluteUrl = encodedString.replace(/\./g, '.wakame02.');
  const encoded = encodeURIComponent(replacedAbsoluteUrl);

  return `<img ${fullTag.replace(url, `/getimage/${encoded}`)}>`;
});
//css
    const linkTags = html.match(/<link\s+[^>]*href="([^"]+)"[^>]*>/g);

    if (linkTags) {
      for (const match of linkTags) {
        const href = match.match(/href="([^"]+)"/)[1];
        let absoluteUrl;
        if (href.startsWith('http') || href.startsWith('https') || href.startsWith('//')) {
          absoluteUrl = href;
        } else {
            absoluteUrl = new URL(href, baseUrl).href;
        }

        try {
          const cssResponse = await axios.get(absoluteUrl);
          if (cssResponse.status === 200) {
            html = html.replace(match, `<style>${cssResponse.data}</style>`);
          }
        } catch (error) {
          console.error('CSSの取得に失敗しました:', error.message);
        }
      }
    }
    
    res.send(html);
  } catch (error) {
    console.error('Error fetching URL:', error.message);
    res.status(500).send('サーバーエラー：URLの取得に失敗しました');
  }
});

//画像取得
function decodeBase64Url(encodedUrl) {
    return Buffer.from(encodedUrl, 'base64').toString('ascii');
}
app.get('/getimage/:encodedUrl', (req, res) => {
  const encodedUrl = req.params.encodedUrl;
  const decodedUrl = decodeBase64Url(encodedUrl);
  const imageUrl = decodedUrl.replace(/\.wakame02\./g, '.');
    miniget(imageUrl)
        .on('error', (err) => {
            console.error('Error fetching image:', err);
            res.status(500).send('Error fetching image');
        })
        .pipe(res);
});

//わかめMusic
const scdl = require('soundcloud-downloader').default;

app.get('/wakams', (req, res) => {
    res.render('wakamusic', { tracks: [] , query: [] });
});

app.get('/wakamc', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).send('Search query is required');
    }

    try {
        const searchResults = await scdl.search({ query: query, resourceType: 'tracks' });

        const tracks = searchResults.collection.slice(0, 10).map(track => ({
            id: track.id,
            title: track.title,
            username: track.user.username,
            artwork_url: track.artwork_url ? track.artwork_url.replace('-large', '-t500x500') : 'https://via.placeholder.com/500'
        }));

        res.render('wakamusic', { tracks: tracks , query: query });
    } catch (error) {
        console.error('Error occurred while searching:', error);
        res.status(500).send('えらー。あらら');
    }
});

app.get('/okiniiri', (req, res) => {
    let favorites = [];

    const cookie = req.headers.cookie
        .split('; ')
        .find(row => row.startsWith('wakamemusicfavorites='));

    if (cookie) {
        try {
            favorites = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (error) {
            console.error('Error parsing cookie:', error);
        }
    }

    res.render('okiniiri', { tracks: favorites });
});

app.get('/wakamc/f', (req, res) => {
    let favorites = [];

    const cookie = req.headers.cookie
        .split('; ')
        .find(row => row.startsWith('wakamemusicfavorites='));

    if (cookie) {
        try {
            favorites = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (error) {
            console.error('Error parsing cookie:', error);
        }
    }

    res.render('wakamemusicf', { favorites: favorites });
});

//お気に入り
app.get('/wakameokini', (req, res) => {
    let favorites = [];

    const cookie = req.headers.cookie
        .split('; ')
        .find(row => row.startsWith('wakametubefavorites='));

    if (cookie) {
        try {
            favorites = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (error) {
            console.error('Error parsing cookie:', error);
        }
    }
    res.render('wakameokiniiri', { tracks: favorites });
});


//履歴
app.get('/wakamehistory', (req, res) => {
    let favorites = [];

    const cookie = req.headers.cookie
        .split('; ')
        .find(row => row.startsWith('wakametubehistory='));

    if (cookie) {
        try {
            favorites = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
        } catch (error) {
            console.error('Error parsing cookie:', error);
        }
    }
    res.render('wakamehistory', { tracks: favorites });
});

//サジェスト
app.get('/suggest', (req, res) => {
    const keyword = req.query.keyword;
    const options = {
        hostname: 'www.google.com',
        path: `/complete/search?client=youtube&hl=ja&ds=yt&q=${encodeURIComponent(keyword)}`,
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    };
    const request = http.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });
        response.on('end', () => {
            const jsonString = data.substring(data.indexOf('['), data.lastIndexOf(']') + 1);

            try {
                const suggestionsArray = JSON.parse(jsonString);
                const suggestions = suggestionsArray[1].map(i => i[0]);
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.json(suggestions);
            } catch (error) {
                console.error('JSON parse error:', error);
                res.status(500).send({ error: 'えらー。あらら' });
            }
        });
    });
    request.on('error', (error) => {
        console.error('Request error:', error);
        res.status(500).send({ error: 'えらー。あらら' });
    });
    request.end();
});


//再生数らんくいんぐ
app.get("/topvideos", async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 1000;

    const { data, error } = await supabase
      .from('history')              
      .select('videoId, videoTitle') 
      .order('id', { ascending: false })
      .limit(count);

    if (error) {
      throw new Error(`データ取得エラー: ${error.message}`);
    }

    const videoCount = data.reduce((acc, { videoId, videoTitle }) => {
      if (!acc[videoId]) {
        acc[videoId] = { count: 0, videoTitle };
      }
      acc[videoId].count += 1;
      return acc;
    }, {});

    const topVideos = Object.entries(videoCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 25);
    
    console.log(topVideos);

    res.render("../views/top-videos.ejs", { topVideos, count });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    res.status(500).send('データを取得できませんでした');
  }
});

//概要欄用リダイレクト
app.get('/watch', (req, res) => {
  const videoId = req.query.v;
  if (videoId) {
    res.redirect(`/w/${videoId}`);
  } else {
    res.redirect(`/`);
  }
});
app.get('/channel/:id', (req, res) => {
  const id = req.params.id;
    res.redirect(`/c/${id}`);
});
app.get('/channel/:id/join', (req, res) => {
  const id = req.params.id;
  res.redirect(`/c/${id}`);
});
app.get('/hashtag/:des', (req, res) => {
  const des = req.params.des;
  res.redirect(`/s?q=${des}`);
});

//リダイレクト
app.get('/redirect', (req, res) => {
  const subp = req.query.p;
  const id= req.query.id;
  if (id) {
    res.redirect(`/${subp}/${id}`);
  } else {
    res.redirect(`/${subp}`);
  }
});

//偽エラー画面
app.get("/block/cc3q",(req, res) => {
    let referer = req.get('Referer') || 'No referer information';
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  res.render('../views/tst/2.ejs', { ip: ip });
})


// エラー
app.use((req, res) => {
	res.status(404).render("error.ejs", {
		title: "404 Not found",
	});
});



process.on("unhandledRejection", console.error);