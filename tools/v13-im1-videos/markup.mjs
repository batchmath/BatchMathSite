import fs from 'node:fs';
const {videos}=JSON.parse(fs.readFileSync(new URL('./videos.json',import.meta.url)));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
// Keep the historical static-page builder aware of the five additions without changing other pages.
export function withInstructionalVideo(content,slug){
 const video=videos.find(v=>v.path.endsWith('/'+slug+'/index.html'));if(!video)return content;
 if(content.includes('data-video-id='))throw Error('Do not overwrite an existing video collection');
 const title=escape(video.title),id=video.id;
 const section=`<section class="video-section lecture-section im1-video-section" aria-labelledby="instructional-videos"><h2 id="instructional-videos">Instructional Videos</h2><div class="video-grid" data-bm-videos data-video-layout="large"><div class="video-item"><h3 class="video-title">${title}</h3><div class="video-embed" data-video-id="${id}" data-player-title="${title}"><div class="video-cover" data-bm-standard-cover><img class="video-thumb" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async"/><button class="video-play" type="button" aria-label="Play ${title}"></button></div></div></div></div></section>`;
 const index=content.indexOf('<section class="resource-section">');if(index<0)throw Error('Topic resources missing');
 return (content.slice(0,index)+section+content.slice(index)).replace('</head>','<link rel="stylesheet" href="/assets/instructional-videos.css"/><script defer src="/assets/instructional-videos.js"></script></head>');
}
